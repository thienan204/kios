'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, TimePicker, message, Popconfirm, Typography, Tooltip, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnlockOutlined, CheckCircleOutlined, FastForwardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [isJumpModalVisible, setIsJumpModalVisible] = useState(false);
  const [jumpAreaId, setJumpAreaId] = useState<number | null>(null);
  const [jumpNextNumber, setJumpNextNumber] = useState<number | null>(null);
  const [isJumping, setIsJumping] = useState(false);

  const [form] = Form.useForm();

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/areas');
      const data = await res.json();
      setAreas(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
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
      audioTemplate: record.audioTemplate,
      morningRange: [dayjs(record.startTime, 'HH:mm'), dayjs(record.endTime, 'HH:mm')],
      afternoonRange: [dayjs(record.afternoonStartTime, 'HH:mm'), dayjs(record.afternoonEndTime, 'HH:mm')],
      printHospitalName: record.printHospitalName ?? 'Bệnh viện Đa khoa Tỉnh',
      printGreeting: record.printGreeting ?? 'SỐ THỨ TỰ CỦA BẠN',
      printFooter: record.printFooter ?? 'Vui lòng ngồi chờ đến lượt gọi.',
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        message.success('Xóa thành công');
        fetchAreas();
      } else {
        message.error(data.error || 'Xóa thất bại');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    }
  };

  const handleUnlock = async (areaId: number, deviceType: 'kiosk' | 'audio' | 'tv') => {
    setUnlocking(true);
    try {
      const res = await fetch(`/api/areas/${areaId}/device-lock?type=${deviceType}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        message.success(`Đã mở khóa thiết bị ${deviceType.toUpperCase()} thành công`);
        fetchAreas(); // Refresh if we add device status to table in future
      } else {
        message.error(data.message || 'Mở khóa thất bại');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    } finally {
      setUnlocking(false);
    }
  };

  const handleOpenJump = (id: number) => {
    setJumpAreaId(id);
    setJumpNextNumber(null);
    setIsJumpModalVisible(true);
  };

  const handleJumpSubmit = async () => {
    if (!jumpAreaId || !jumpNextNumber) {
      message.error('Vui lòng nhập số');
      return;
    }
    setIsJumping(true);
    try {
      const res = await fetch(`/api/areas/${jumpAreaId}/jump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextNumber: jumpNextNumber })
      });
      const data = await res.json();
      if (res.ok) {
        message.success(data.message);
        setIsJumpModalVisible(false);
      } else {
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setIsJumping(false);
    }
  };

  const onFinish = async (values: any) => {
    const payload = {
      name: values.name,
      audioTemplate: values.audioTemplate,
      startTime: values.morningRange[0].format('HH:mm'),
      endTime: values.morningRange[1].format('HH:mm'),
      afternoonStartTime: values.afternoonRange[0].format('HH:mm'),
      afternoonEndTime: values.afternoonRange[1].format('HH:mm'),
      printHospitalName: values.printHospitalName,
      printGreeting: values.printGreeting,
      printFooter: values.printFooter,
    };

    try {
      const url = editingId ? `/api/areas/${editingId}` : '/api/areas';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success(editingId ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setIsModalVisible(false);
        fetchAreas();
      } else {
        message.error('Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên Khu vực', dataIndex: 'name', key: 'name' },
    { 
      title: 'Giờ Sáng', 
      key: 'morning', 
      render: (_: any, record: any) => `${record.startTime} - ${record.endTime}` 
    },
    { 
      title: 'Giờ Chiều', 
      key: 'afternoon', 
      render: (_: any, record: any) => `${record.afternoonStartTime} - ${record.afternoonEndTime}` 
    },
    { title: 'Mẫu Đọc Loa', dataIndex: 'audioTemplate', key: 'audioTemplate' },
    {
      title: 'Các đường dẫn',
      key: 'path',
      render: (_: any, record: any) => {
        const kioskPath = `/layso/${record.id}`;
        const audioPath = `/audio/${record.id}`;
        const tvPath = `/tv/${record.id}`;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-10">Kiosk:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${window.location.origin}${kioskPath}` : kioskPath }}
                className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-mono text-xs"
              >
                {kioskPath}
              </Typography.Text>
              <Button size="small" type="link" href={kioskPath} target="_blank" className="p-0">Mở</Button>
              {record.kioskDeviceId ? (
                <Tooltip title="Đang bị khóa bởi 1 máy. Bấm để Mở khóa cho máy mới">
                  <Button size="small" type="primary" danger icon={<UnlockOutlined />} onClick={() => handleUnlock(record.id, 'kiosk')} loading={unlocking} />
                </Tooltip>
              ) : (
                <Tooltip title="Chưa có máy nào kết nối. Sẵn sàng nhận máy mới">
                  <Tag icon={<CheckCircleOutlined />} color="success" className="m-0 ml-1">Trống</Tag>
                </Tooltip>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-10">Audio:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${window.location.origin}${audioPath}` : audioPath }}
                className="bg-green-50 px-2 py-0.5 rounded border border-green-200 text-green-700 font-mono text-xs"
              >
                {audioPath}
              </Typography.Text>
              <Button size="small" type="link" href={audioPath} target="_blank" className="p-0 text-green-600">Mở</Button>
              {record.audioDeviceId ? (
                <Tooltip title="Đang bị khóa bởi 1 máy. Bấm để Mở khóa cho máy mới">
                  <Button size="small" type="primary" danger icon={<UnlockOutlined />} onClick={() => handleUnlock(record.id, 'audio')} loading={unlocking} />
                </Tooltip>
              ) : (
                <Tooltip title="Chưa có máy nào kết nối. Sẵn sàng nhận máy mới">
                  <Tag icon={<CheckCircleOutlined />} color="success" className="m-0 ml-1">Trống</Tag>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-10">Tivi:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${window.location.origin}${tvPath}` : tvPath }}
                className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-700 font-mono text-xs"
              >
                {tvPath}
              </Typography.Text>
              <Button size="small" type="link" href={tvPath} target="_blank" className="p-0 text-purple-600">Mở</Button>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="Nhảy số Kiosk">
            <Button icon={<FastForwardOutlined />} onClick={() => handleOpenJump(record.id)} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" />
          </Tooltip>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa khu vực này?"
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
        <h2 className="text-xl font-semibold m-0">Quản lý Khu vực</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Khu vực
        </Button>
      </div>

      <Table 
        dataSource={areas} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        bordered
      />

      <Modal
        title={editingId ? 'Sửa Khu vực' : 'Thêm Khu vực'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Tên Khu vực" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Khu Khám Bệnh" />
          </Form.Item>
          <Form.Item name="morningRange" label="Khung giờ Sáng" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item name="afternoonRange" label="Khung giờ Chiều" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item 
            name="audioTemplate" 
            label="Mẫu câu đọc loa" 
            rules={[{ required: true }]}
            extra={
              <div className="text-xs text-gray-500 mt-1">
                Các biến có thể dùng: <strong className="text-blue-600">{"{ticket}"}</strong> (Số thứ tự), <strong className="text-blue-600">{"{desk}"}</strong> (Tên bàn). <br/>
                Ví dụ: <em>Xin mời bệnh nhân số {"{ticket}"} đến {"{desk}"}</em>
              </div>
            }
          >
            <Input placeholder="Ví dụ: Xin mời bệnh nhân số {ticket} đến {desk}" />
          </Form.Item>
          
          <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
            <h4 className="font-semibold mb-2">Cấu hình in vé Kiosk</h4>
            <Form.Item name="printHospitalName" label="Tên Cơ sở / Bệnh viện" initialValue="Bệnh viện Đa khoa Tỉnh">
              <Input placeholder="Ví dụ: Bệnh viện Đa khoa Tỉnh (Để trống sẽ không in)" />
            </Form.Item>
            <Form.Item name="printGreeting" label="Tiêu đề lời chào" initialValue="SỐ THỨ TỰ CỦA BẠN">
              <Input placeholder="Ví dụ: SỐ THỨ TỰ CỦA BẠN (Để trống sẽ không in)" />
            </Form.Item>
            <Form.Item name="printFooter" label="Lời dặn dò cuối vé" initialValue="Vui lòng ngồi chờ đến lượt gọi.">
              <Input placeholder="Ví dụ: Vui lòng ngồi chờ đến lượt gọi. (Để trống sẽ không in)" />
            </Form.Item>
          </div>

          <Form.Item className="mb-0 flex justify-end">
            <Button onClick={() => setIsModalVisible(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-indigo-700">
            <FastForwardOutlined /> Cấu hình Nhảy số Kiosk
          </div>
        }
        open={isJumpModalVisible}
        onCancel={() => setIsJumpModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsJumpModalVisible(false)}>Hủy</Button>,
          <Button key="submit" type="primary" className="bg-indigo-600" loading={isJumping} onClick={handleJumpSubmit}>Xác nhận Nhảy số</Button>
        ]}
      >
        <div className="py-4 text-gray-600">
          <p className="mb-4">Nếu Kiosk đang in số bị lệch hoặc bạn muốn bỏ qua các số đầu, bạn có thể thiết lập số tiếp theo Kiosk sẽ in ra tại đây.</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Số tiếp theo sẽ in:</span>
            <InputNumber 
              min={1} 
              value={jumpNextNumber} 
              onChange={(val) => setJumpNextNumber(val)} 
              placeholder="VD: 50" 
              className="w-32"
              size="large"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
