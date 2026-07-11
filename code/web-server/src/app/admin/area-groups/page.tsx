'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function AreaGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/area-groups');
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/area-groups/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        message.success('Đã xóa nhóm thành công');
        fetchGroups();
      } else {
        const data = await res.json();
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const onFinish = async (values: any) => {
    try {
      const url = editingId ? `/api/area-groups/${editingId}` : '/api/area-groups';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(editingId ? 'Đã cập nhật thành công' : 'Đã thêm mới thành công');
        setIsModalVisible(false);
        fetchGroups();
      } else {
        const data = await res.json();
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên Nhóm / Cơ sở', dataIndex: 'name', key: 'name' },
    { 
      title: 'Số khu vực', 
      key: 'areasCount', 
      render: (_: any, record: any) => record._count?.areas || 0 
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhóm này?"
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
        <h2 className="text-xl font-semibold m-0">Danh mục Nhóm / Cơ sở</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Nhóm
        </Button>
      </div>

      <Table 
        dataSource={groups} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        bordered
      />

      <Modal
        title={editingId ? 'Sửa Nhóm / Cơ sở' : 'Thêm Nhóm / Cơ sở'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item 
            name="name" 
            label="Tên Nhóm / Cơ sở" 
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
          >
            <Input placeholder="Ví dụ: Bệnh viện Đa khoa tỉnh, Cơ sở 1..." />
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
