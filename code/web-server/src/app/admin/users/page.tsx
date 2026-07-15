'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import UserModal from './components/UserModal';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/kios/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        message.error('Lỗi khi tải danh sách tài khoản');
      }
    } catch (error) {
      console.error(error);
      message.error('Đã xảy ra lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa tài khoản này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await fetch(`/kios/api/admin/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            message.success('Đã xóa tài khoản');
            fetchUsers();
          } else {
            message.error('Lỗi khi xóa tài khoản');
          }
        } catch (error) {
          message.error('Đã xảy ra lỗi hệ thống');
        }
      },
    });
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchUsers();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Tên tài khoản',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'default';
        if (role === 'SUPER_ADMIN') color = 'magenta';
        else if (role === 'ADMIN') color = 'blue';
        else if (role === 'STAFF') color = 'green';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold m-0">Quản lý Tài khoản (Users)</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Tạo tài khoản
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <UserModal
        visible={isModalVisible}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
        initialData={editingUser}
      />
    </div>
  );
}
