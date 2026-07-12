'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function DesksPage() {
  const [desks, setDesks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchDesks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/kios/api/desks');
      const data = await res.json();
      setDesks(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu bàn');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await fetch('/kios/api/areas');
      const data = await res.json();
      setAreas(data);
    } catch (error) {
      console.error('Error fetching areas');
    }
  };

  useEffect(() => {
    fetchDesks();
    fetchAreas();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE' });
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      areaId: record.areaId,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/kios/api/desks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Xóa thành công');
        fetchDesks();
      } else {
        const data = await res.json();
        message.error(data.error || 'Xóa thất bại');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    }
  };

  const onFinish = async (values: any) => {
    try {
      const url = editingId ? `/kios/api/desks/${editingId}` : '/kios/api/desks';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(editingId ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setIsModalVisible(false);
        fetchDesks();
      } else {
        message.error('Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên Bàn/Quầy', dataIndex: 'name', key: 'name' },
    { 
      title: 'Thuộc Khu vực', 
      key: 'area', 
      render: (_: any, record: any) => record.area?.name || 'Không xác định'
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bàn này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold m-0">Quản lý Bàn tiếp đón</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Bàn
        </Button>
      </div>

      <Table 
        dataSource={desks} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        bordered
      />

      <Modal
        title={editingId ? 'Sửa Bàn' : 'Thêm Bàn'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Tên Bàn (VD: Bàn số 1)" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên bàn..." />
          </Form.Item>
          
          <Form.Item name="areaId" label="Khu vực trực thuộc" rules={[{ required: true, message: 'Vui lòng chọn khu vực!' }]}>
            <Select placeholder="Chọn khu vực">
              {areas.map((area: any) => (
                <Select.Option key={area.id} value={area.id}>{area.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Trạng thái">
            <Select>
              <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
              <Select.Option value="PAUSED">Tạm dừng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Button onClick={() => setIsModalVisible(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
