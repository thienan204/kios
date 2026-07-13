'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DesktopOutlined } from '@ant-design/icons';

export default function SelfRegDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/kios/api/admin/tu-dang-ky/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu thiết bị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'OFFLINE', allowBHYT: true, allowService: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      ipAddress: record.ipAddress,
      macAddress: record.macAddress,
      location: record.location,
      readerModel: record.readerModel,
      cameraModel: record.cameraModel,
      status: record.status,
      allowBHYT: record.allowBHYT,
      allowService: record.allowService
    });
    setIsModalVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      const url = '/kios/api/admin/tu-dang-ky/devices';
      const method = editingId ? 'PUT' : 'POST';
      const payload = editingId ? { ...values, id: editingId } : values;

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success('Lưu thành công');
        setIsModalVisible(false);
        fetchDevices();
      } else {
        const errData = await res.json();
        message.error(errData.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên Kiosk', dataIndex: 'name', key: 'name', render: (text: string) => <div className="font-semibold text-blue-600"><DesktopOutlined className="mr-2"/>{text}</div> },
    { title: 'Phần cứng', key: 'hardware', render: (_: any, record: any) => (<div><div className="text-xs">Đọc thẻ: {record.readerModel || 'Chưa rõ'}</div><div className="text-xs text-gray-500">Camera: {record.cameraModel || 'Chưa rõ'}</div></div>) },
    { title: 'Vị trí', dataIndex: 'location', key: 'location' },
    { 
      title: 'Dịch vụ cấp phép', 
      key: 'services', 
      render: (_: any, record: any) => (
        <div className="flex gap-1">
          {record.allowBHYT && <Tag color="blue">BHYT</Tag>}
          {record.allowService && <Tag color="purple">Viện phí</Tag>}
          {!record.allowBHYT && !record.allowService && <Tag color="default">Vô hiệu hóa</Tag>}
        </div>
      )
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ONLINE' ? 'green' : 'default'}>
          {status === 'ONLINE' ? 'Đang hoạt động' : 'Ngoại tuyến'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold m-0">Quản lý Kiosk Tự Đăng Ký Khám</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Kiosk
        </Button>
      </div>

      <Table 
        dataSource={devices} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        bordered
      />

      <Modal
        title={editingId ? 'Cấu hình Kiosk' : 'Thêm Kiosk Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Tên máy Kiosk" rules={[{ required: true }]}>
            <Input placeholder="VD: Kiosk Sảnh Khám Bệnh A" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="ipAddress" label="Địa chỉ IP (Tuỳ chọn)">
              <Input placeholder="192.168.1.x" />
            </Form.Item>
            <Form.Item name="macAddress" label="Địa chỉ MAC (Tuỳ chọn)">
              <Input placeholder="00:1B:44:11:3A:B7" />
            </Form.Item>
          </div>
          <Form.Item name="location" label="Vị trí đặt máy">
            <Input placeholder="VD: Tầng 1 - Khu A" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4 border p-4 rounded-md mb-4 bg-yellow-50 border-yellow-200">
            <Form.Item name="readerModel" label="Model Máy Quét/Đọc thẻ" className="mb-0">
              <Input placeholder="VD: Newland FM3080" />
            </Form.Item>
            <Form.Item name="cameraModel" label="Model Camera" className="mb-0">
              <Input placeholder="VD: Logitech HD 1080p" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4 border p-4 rounded-md mb-4 bg-gray-50">
            <Form.Item name="allowBHYT" label="Cho phép Đăng ký BHYT" valuePropName="checked" className="mb-0">
              <Switch />
            </Form.Item>
            <Form.Item name="allowService" label="Cho phép Đăng ký Viện phí" valuePropName="checked" className="mb-0">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="status" label="Trạng thái khởi tạo">
            <Select>
              <Select.Option value="ONLINE">Đang hoạt động (ONLINE)</Select.Option>
              <Select.Option value="OFFLINE">Ngoại tuyến (OFFLINE)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Button onClick={() => setIsModalVisible(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu cấu hình</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
