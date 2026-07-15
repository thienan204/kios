import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';

interface UserModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function UserModal({ visible, onCancel, onSuccess, initialData }: UserModalProps) {
  const [form] = Form.useForm();
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue({
          username: initialData.username,
          role: initialData.role,
          isActive: initialData.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ role: 'STAFF', isActive: true });
      }
    }
  }, [visible, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const url = isEditing ? `/kios/api/admin/users/${initialData.id}` : '/kios/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(isEditing ? 'Cập nhật thành công' : 'Tạo mới thành công');
        onSuccess();
      } else {
        const data = await res.json();
        message.error(data.error || 'Đã có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      title={isEditing ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={isEditing ? 'Lưu' : 'Tạo'}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="username"
          label="Tên tài khoản"
          rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản' }]}
        >
          <Input disabled={isEditing} />
        </Form.Item>

        <Form.Item
          name="password"
          label={isEditing ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu'}
          rules={[{ required: !isEditing, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="role"
          label="Quyền hạn"
          rules={[{ required: true, message: 'Vui lòng chọn quyền' }]}
        >
          <Select>
            <Select.Option value="STAFF">STAFF (Nhân viên)</Select.Option>
            <Select.Option value="ADMIN">ADMIN (Quản trị viên khu vực)</Select.Option>
            <Select.Option value="SUPER_ADMIN">SUPER_ADMIN (Quản trị tối cao)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
