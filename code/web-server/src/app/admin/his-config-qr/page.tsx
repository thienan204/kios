'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, message, Typography } from 'antd';
import { SaveOutlined, ApiOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function KioskQRHISConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/kios/api/admin/his-config-qr');
      if (res.ok) {
        const data = await res.json();
        form.setFieldsValue({
          endpointUrl: data.endpointUrl,
          httpMethod: data.httpMethod || 'GET',
          headers: data.headers,
        });
      }
    } catch (error) {
      message.error('Không thể tải cấu hình HIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        endpointUrl: values.endpointUrl,
        httpMethod: values.httpMethod,
        headers: values.headers,
      };

      const res = await fetch('/kios/api/admin/his-config-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success('Đã lưu cấu hình Kiosk QR HIS thành công!');
      } else {
        message.error('Lỗi khi lưu cấu hình');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="m-0"><ApiOutlined className="mr-2" />Cấu hình API Kiosk QR</Title>
          <Text type="secondary">Cấu hình kết nối tra cứu bệnh nhân thông qua mã QR/Mã vạch</Text>
        </div>
        <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
          Lưu Cấu Hình
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading} initialValues={{ httpMethod: 'GET' }}>
        <Card title="Thông tin Endpoint Tra cứu Bệnh nhân" className="mb-6 shadow-sm border-gray-200">
          <Form.Item 
            name="endpointUrl" 
            label="URL API Tra cứu HIS (Không bao gồm tham số barcode)" 
            rules={[{ required: true, message: 'Vui lòng nhập URL!' }]}
            extra="Ví dụ: http://192.168.1.10:8080/api/v1/tra-cuu. Hệ thống sẽ tự động ghép thêm ?barcode=... vào cuối link khi tra cứu."
          >
            <Input size="large" placeholder="Nhập đường dẫn API..." />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-6">
            <Form.Item name="httpMethod" label="HTTP Method" rules={[{ required: true }]}>
              <Select size="large">
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="POST">POST</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="headers" label="HTTP Headers (Định dạng JSON)" extra='Ví dụ: {"Authorization": "Bearer token123"}'>
              <Input.TextArea rows={4} placeholder='{"Content-Type": "application/json"}' />
            </Form.Item>
          </div>
        </Card>
      </Form>
    </div>
  );
}
