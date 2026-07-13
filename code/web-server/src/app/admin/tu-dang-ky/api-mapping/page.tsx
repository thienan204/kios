'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, message, Space, Divider, Typography, Tabs } from 'antd';
import { SaveOutlined, ApiOutlined, MinusCircleOutlined, PlusOutlined, LayoutOutlined } from '@ant-design/icons';
import FormBuilderTab from './FormBuilderTab';

const { Title, Text } = Typography;

export default function HISMappingPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formLayout, setFormLayout] = useState<string>('[]');
  const [mappedFields, setMappedFields] = useState<string[]>([]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/kios/api/admin/tu-dang-ky/his-config');
      if (res.ok) {
        const data = await res.json();
        
        // Parse mapping JSON string back to array for Dynamic Form
        let parsedMapping: any[] = [];
        let keys: string[] = [];
        try {
          if (data.fieldMapping && data.fieldMapping !== '{}') {
            const mapObj = JSON.parse(data.fieldMapping);
            keys = Object.keys(mapObj);
            parsedMapping = keys.map(key => ({
              kioskField: key,
              hisField: mapObj[key]
            }));
          }
        } catch (e) {}

        setMappedFields(keys);
        if (data.formLayout) {
          setFormLayout(data.formLayout);
        }

        form.setFieldsValue({
          endpointUrl: data.endpointUrl,
          httpMethod: data.httpMethod,
          headers: data.headers,
          mappings: parsedMapping.length > 0 ? parsedMapping : [{ kioskField: '', hisField: '' }]
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
      // Chuyển array mapping thành JSON object để lưu DB
      const mappingObj: Record<string, string> = {};
      if (values.mappings) {
        values.mappings.forEach((item: any) => {
          if (item && item.kioskField && item.hisField) {
            mappingObj[item.kioskField] = item.hisField;
          }
        });
      }

      const payload = {
        endpointUrl: values.endpointUrl,
        httpMethod: values.httpMethod,
        headers: values.headers,
        fieldMapping: JSON.stringify(mappingObj),
        formLayout: formLayout
      };

      const res = await fetch('/kios/api/admin/tu-dang-ky/his-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success('Đã lưu cấu hình API Mapping thành công!');
      } else {
        message.error('Lỗi khi lưu cấu hình');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAPI = () => {
    message.info('Tính năng Bắn API Thử nghiệm đang được xây dựng...');
    // Sẽ thêm logic gọi API thực tế qua Proxy sau
  };

  const handleSaveFormLayout = async (newLayoutStr: string) => {
    try {
      setFormLayout(newLayoutStr);
      const values = form.getFieldsValue();
      const mappingObj: Record<string, string> = {};
      if (values.mappings) {
        values.mappings.forEach((item: any) => {
          if (item && item.kioskField && item.hisField) {
            mappingObj[item.kioskField] = item.hisField;
          }
        });
      }
      
      const payload = {
        endpointUrl: values.endpointUrl,
        httpMethod: values.httpMethod,
        headers: values.headers,
        fieldMapping: JSON.stringify(mappingObj),
        formLayout: newLayoutStr
      };

      const res = await fetch('/kios/api/admin/tu-dang-ky/his-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success('Đã lưu cấu hình Giao diện thành công!');
        return true;
      }
      message.error('Lỗi khi lưu giao diện');
      return false;
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
      return false;
    }
  };

  const renderAPIMapping = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="m-0"><ApiOutlined className="mr-2" />Cấu hình HIS API Mapping</Title>
          <Text type="secondary">Cấu hình kết nối và map (khớp) dữ liệu giữa Kiosk với phần mềm HIS</Text>
        </div>
        <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
          Lưu Cấu Hình
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
        <Card title="1. Thông tin Endpoint" className="mb-6 shadow-sm border-gray-200">
          <Form.Item 
            name="endpointUrl" 
            label="URL API Đăng ký khám của HIS" 
            rules={[{ required: true, message: 'Vui lòng nhập URL!' }]}
            extra="Ví dụ: http://192.168.1.10:8080/api/v1/dang-ky-kham"
          >
            <Input size="large" placeholder="Nhập đường dẫn API..." />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-6">
            <Form.Item name="httpMethod" label="HTTP Method" rules={[{ required: true }]}>
              <Select size="large">
                <Select.Option value="POST">POST (Tạo mới đăng ký)</Select.Option>
                <Select.Option value="PUT">PUT (Cập nhật)</Select.Option>
                <Select.Option value="GET">GET</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="headers" label="HTTP Headers (JSON)" extra='Ví dụ: {"Authorization": "Bearer token123"}'>
              <Input.TextArea rows={2} placeholder='{"Content-Type": "application/json"}' />
            </Form.Item>
          </div>
        </Card>

        <Card 
          title="2. Mapping Trường Dữ Liệu (Field Mapping)" 
          className="mb-6 shadow-sm border-gray-200"
          extra={<Button onClick={handleTestAPI}>Test API ngay</Button>}
        >
          <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100 text-blue-800">
            <strong>Hướng dẫn:</strong> Cột bên trái là các biến nội bộ của Kiosk. Cột bên phải là Tên Tham Số (Key) mà API của HIS yêu cầu. 
            Hệ thống sẽ tự động chuyển đổi dữ liệu trước khi bắn sang HIS.
          </div>

          <div className="flex font-semibold mb-2 px-2">
            <div className="flex-1">Biến của Kiosk (Kiosk Field)</div>
            <div className="flex-1">Trường của HIS (HIS Field Name)</div>
            <div className="w-10"></div>
          </div>
          
          <Form.List name="mappings">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" className="w-full">
                    <Form.Item
                      {...restField}
                      name={[name, 'kioskField']}
                      rules={[{ required: true, message: 'Chọn biến Kiosk' }]}
                      className="m-0"
                      style={{ width: '380px' }}
                    >
                      <Select placeholder="Chọn biến của Kiosk..." allowClear>
                        <Select.Option value="patientName">patientName (Họ và tên)</Select.Option>
                        <Select.Option value="dob">dob (Ngày sinh)</Select.Option>
                        <Select.Option value="gender">gender (Giới tính)</Select.Option>
                        <Select.Option value="cccdNumber">cccdNumber (Số CCCD)</Select.Option>
                        <Select.Option value="bhytNumber">bhytNumber (Số BHYT)</Select.Option>
                        <Select.Option value="address">address (Địa chỉ)</Select.Option>
                        <Select.Option value="serviceCode">serviceCode (Mã dịch vụ/Phòng)</Select.Option>
                        <Select.Option value="photoBase64">photoBase64 (Ảnh chụp chân dung)</Select.Option>
                      </Select>
                    </Form.Item>
                    
                    <span className="mx-2">➔</span>

                    <Form.Item
                      {...restField}
                      name={[name, 'hisField']}
                      rules={[{ required: true, message: 'Nhập tên trường của HIS' }]}
                      className="m-0"
                      style={{ width: '380px' }}
                    >
                      <Input placeholder="Nhập tên biến của HIS (VD: HoTen, MaBHYT...)" />
                    </Form.Item>

                    <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 hover:text-red-700 ml-2" />
                  </Space>
                ))}
                <Form.Item className="mt-4">
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm dòng Mapping
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: <span className="text-lg"><ApiOutlined /> Cấu hình API Mapping</span>,
            children: renderAPIMapping(),
          },
          {
            key: '2',
            label: <span className="text-lg"><LayoutOutlined /> Thiết kế Form Kiosk</span>,
            children: (
              <FormBuilderTab 
                initialLayout={formLayout} 
                mappedFields={mappedFields}
                onSave={handleSaveFormLayout} 
              />
            ),
          },
        ]}
      />
    </div>
  );
}
