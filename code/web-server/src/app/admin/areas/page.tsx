'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, TimePicker, message, Popconfirm, Typography, Tooltip, Tag, Radio, QRCode, Switch, Checkbox, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnlockOutlined, CheckCircleOutlined, FastForwardOutlined, PrinterOutlined, PauseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

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

  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [printArea, setPrintArea] = useState<any>(null);

  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [batchAreaId, setBatchAreaId] = useState<number | null>(null);
  const [batchQuantity, setBatchQuantity] = useState<number | null>(50);
  const [isBatching, setIsBatching] = useState(false);
  const [areaGroups, setAreaGroups] = useState<any[]>([]);

  const [form] = Form.useForm();

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/kios/api/areas');
      const data = await res.json();
      setAreas(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaGroups = async () => {
    try {
      const res = await fetch('/kios/api/area-groups');
      const data = await res.json();
      setAreaGroups(data);
    } catch (e) {
      console.error('Lỗi tải danh mục nhóm');
    }
  };

  useEffect(() => {
    fetchAreas();
    fetchAreaGroups();
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
      groupId: record.groupId,
      audioTemplate: record.audioTemplate,
      morningRange: [dayjs(record.startTime, 'HH:mm'), dayjs(record.endTime, 'HH:mm')],
      afternoonRange: [dayjs(record.afternoonStartTime, 'HH:mm'), dayjs(record.afternoonEndTime, 'HH:mm')],
      ticketResetType: record.ticketResetType || 'ALL_DAY',
      hasIssueLimit: record.hasIssueLimit || false,
      issueLimitMorning: record.issueLimitMorning || 0,
      issueLimitAfternoon: record.issueLimitAfternoon || 0,
      kioskPin: record.kioskPin || '123456',
      printHospitalName: record.printHospitalName ?? 'Bệnh viện Đa khoa Tỉnh',
      printGreeting: record.printGreeting ?? 'SỐ THỨ TỰ CỦA BẠN',
      printFooter: record.printFooter ?? 'Vui lòng ngồi chờ đến lượt gọi.',
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/kios/api/areas/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`/kios/api/areas/${areaId}/device-lock?type=${deviceType}`, { method: 'DELETE' });
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
      const res = await fetch(`/kios/api/areas/${jumpAreaId}/jump`, {
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

  const handleTogglePause = async (id: number, isPaused: boolean) => {
    try {
      const res = await fetch(`/kios/api/areas/${id}/pause-issue`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused })
      });
      if (res.ok) {
        message.success(isPaused ? 'Đã tạm dừng cấp số cho khu vực này' : 'Đã mở lại cấp số');
        fetchAreas();
      } else {
        message.error('Có lỗi xảy ra');
      }
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  const handleOpenBatch = (id: number) => {
    setBatchAreaId(id);
    setBatchQuantity(50);
    setIsBatchModalVisible(true);
  };

  const handleBatchSubmit = async () => {
    if (!batchAreaId || !batchQuantity || batchQuantity < 1) {
      message.error('Vui lòng nhập số lượng hợp lệ (từ 1 trở lên)');
      return;
    }
    setIsBatching(true);
    try {
      const res = await fetch(`/kios/api/areas/${batchAreaId}/batch-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: batchQuantity })
      });
      const data = await res.json();
      if (res.ok) {
        message.success(`Đã sinh ${batchQuantity} vé thành công!`);
        setIsBatchModalVisible(false);
        // Lưu data vào session và mở tab mới in
        sessionStorage.setItem('batch_tickets', JSON.stringify(data.tickets));
        window.open('/print-batch', '_blank');
      } else {
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setIsBatching(false);
    }
  };

  const onFinish = async (values: any) => {
    const payload = {
      name: values.name,
      groupId: values.groupId,
      audioTemplate: values.audioTemplate,
      startTime: values.morningRange[0].format('HH:mm'),
      endTime: values.morningRange[1].format('HH:mm'),
      afternoonStartTime: values.afternoonRange[0].format('HH:mm'),
      afternoonEndTime: values.afternoonRange[1].format('HH:mm'),
      ticketResetType: values.ticketResetType,
      hasIssueLimit: values.hasIssueLimit || false,
      issueLimitMorning: values.issueLimitMorning || 0,
      issueLimitAfternoon: values.issueLimitAfternoon || 0,
      kioskPin: values.kioskPin || '123456',
      printHospitalName: values.printHospitalName,
      printGreeting: values.printGreeting,
      printFooter: values.printFooter,
    };

    try {
      const url = editingId ? `/kios/api/areas/${editingId}` : '/kios/api/areas';
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
      title: 'Nhóm / Cơ sở', 
      key: 'group',
      filters: areaGroups.map(g => ({ text: g.name, value: g.id })),
      onFilter: (value: any, record: any) => record.groupId === value,
      render: (_: any, record: any) => record.group ? <Tag color="blue">{record.group.name}</Tag> : <span className="text-gray-400">---</span>
    },
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
    {
      title: 'Hạn mức',
      key: 'issueLimit',
      render: (_: any, record: any) => {
        if (!record.hasIssueLimit) return <Tag color="default">Vô hạn</Tag>;
        if (record.ticketResetType === 'PER_SHIFT') {
          return (
            <div className="flex flex-col gap-1 text-xs">
              <span>Sáng: <strong className="text-blue-600">{record.issueLimitMorning}</strong></span>
              <span>Chiều: <strong className="text-green-600">{record.issueLimitAfternoon}</strong></span>
            </div>
          );
        }
        return <span><strong className="text-indigo-600">{record.issueLimitMorning}</strong> số</span>;
      }
    },
    { title: 'Mẫu Đọc Loa', dataIndex: 'audioTemplate', key: 'audioTemplate' },
    {
      title: 'Các đường dẫn',
      key: 'path',
      render: (_: any, record: any) => {
        const kioskPath = `/layso/${record.id}`;
        const audioPath = `/audio/${record.id}`;
        const tvPath = `/tv/${record.id}`;
        const mobilePath = `/m/${record.uid}`;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-12">Kiosk:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin}${kioskPath}` : kioskPath }}
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
              <span className="text-xs font-semibold text-gray-500 w-12">Audio:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin}${audioPath}` : audioPath }}
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
              <span className="text-xs font-semibold text-gray-500 w-12">Tivi:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin}${tvPath}` : tvPath }}
                className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-700 font-mono text-xs"
              >
                {tvPath}
              </Typography.Text>
              <Button size="small" type="link" href={tvPath} target="_blank" className="p-0 text-purple-600">Mở</Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-12">Mobile:</span>
              <Typography.Text 
                copyable={{ text: typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin}${mobilePath}` : mobilePath }}
                className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-orange-700 font-mono text-xs"
              >
                {mobilePath}
              </Typography.Text>
              <Button size="small" type="link" href={mobilePath} target="_blank" className="p-0 text-orange-600">Mở</Button>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Cấp số',
      key: 'isIssuePaused',
      render: (_: any, record: any) => (
        <Switch 
          checked={!record.isIssuePaused} 
          checkedChildren="Mở" 
          unCheckedChildren="Tạm Dừng" 
          className={record.isIssuePaused ? "bg-red-500" : ""}
          onChange={(checked) => handleTogglePause(record.id, !checked)}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="Sinh & In hàng loạt">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={() => handleOpenBatch(record.id)} 
              className="text-green-600 border-green-200 hover:bg-green-50"
            />
          </Tooltip>
          <Tooltip title="In Mã QR cho Mobile">
            <Button 
              icon={<QRCode value="qr" size={14} bordered={false} />} 
              onClick={() => {
                setPrintArea(record);
                setIsPrintModalVisible(true);
              }} 
            />
          </Tooltip>
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
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            {/* Cột trái: Cấu hình chung */}
            <Col span={12}>
              <Form.Item name="groupId" label="Nhóm / Cơ sở (Để trống nếu không phân nhóm)">
                <Select
                  allowClear
                  placeholder="Chọn Nhóm / Cơ sở"
                  options={areaGroups.map(g => ({ value: g.id, label: g.name }))}
                />
              </Form.Item>
              <Form.Item name="name" label="Tên Khu vực" rules={[{ required: true }]}>
                <Input placeholder="Ví dụ: Khu Khám Bệnh" />
              </Form.Item>
              <div className="flex gap-4">
                <Form.Item name="morningRange" label="Khung giờ Sáng" rules={[{ required: true }]} className="flex-1">
                  <TimePicker.RangePicker format="HH:mm" className="w-full" />
                </Form.Item>
                <Form.Item name="afternoonRange" label="Khung giờ Chiều" rules={[{ required: true }]} className="flex-1">
                  <TimePicker.RangePicker format="HH:mm" className="w-full" />
                </Form.Item>
              </div>
              <Form.Item name="ticketResetType" label="Hình thức đếm số" initialValue="ALL_DAY">
                <Radio.Group>
                  <Radio value="ALL_DAY">Cả ngày (1 -&gt; n)</Radio>
                  <Radio value="PER_SHIFT">Chia ca (Sáng, Chiều riêng)</Radio>
                </Radio.Group>
              </Form.Item>

              <div className="bg-blue-50/50 p-4 rounded mb-4 border border-blue-100">
                <Form.Item name="kioskPin" label="Mã PIN Kiosk (Bảo vệ tính năng nhân viên)" rules={[{ required: true }]} initialValue="123456">
                  <Input.Password placeholder="Nhập mã PIN" />
                </Form.Item>

                <Form.Item name="hasIssueLimit" valuePropName="checked" className="mb-2 mt-4">
                  <Checkbox className="font-semibold text-blue-800">Giới hạn số lượng phiếu được cấp</Checkbox>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => 
                    prevValues.hasIssueLimit !== currentValues.hasIssueLimit || 
                    prevValues.ticketResetType !== currentValues.ticketResetType
                  }
                >
                  {({ getFieldValue }) => {
                    const hasLimit = getFieldValue('hasIssueLimit');
                    const resetType = getFieldValue('ticketResetType');
                    if (!hasLimit) return null;

                    if (resetType === 'ALL_DAY') {
                      return (
                        <Form.Item name="issueLimitMorning" label="Giới hạn số lượng (0 = Không giới hạn)" rules={[{ required: true }]} className="mb-0 mt-3">
                          <InputNumber min={0} className="w-full" placeholder="Ví dụ: 50 (Nhập 0 để vô hạn)" />
                        </Form.Item>
                      );
                    }

                    return (
                      <div className="flex gap-4 mt-3">
                        <Form.Item name="issueLimitMorning" label="Ca Sáng (0 = Vô hạn)" rules={[{ required: true }]} className="flex-1 mb-0">
                          <InputNumber min={0} className="w-full" placeholder="Ví dụ: 30" />
                        </Form.Item>
                        <Form.Item name="issueLimitAfternoon" label="Ca Chiều (0 = Vô hạn)" rules={[{ required: true }]} className="flex-1 mb-0">
                          <InputNumber min={0} className="w-full" placeholder="Ví dụ: 0" />
                        </Form.Item>
                      </div>
                    );
                  }}
                </Form.Item>
              </div>
            </Col>

            {/* Cột phải: Cấu hình hiển thị */}
            <Col span={12}>
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
                <Input.TextArea rows={2} placeholder="Ví dụ: Xin mời bệnh nhân số {ticket} đến {desk}" />
              </Form.Item>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-6">
                <h4 className="font-semibold mb-4 text-gray-700">Cấu hình in vé Kiosk</h4>
                <Form.Item name="printHospitalName" label="Tên Cơ sở / Bệnh viện" initialValue="Bệnh viện Đa khoa Tỉnh">
                  <Input placeholder="Ví dụ: Bệnh viện Đa khoa Tỉnh (Để trống sẽ không in)" />
                </Form.Item>
                <Form.Item name="printGreeting" label="Tiêu đề lời chào" initialValue="SỐ THỨ TỰ CỦA BẠN">
                  <Input placeholder="Ví dụ: SỐ THỨ TỰ CỦA BẠN (Để trống sẽ không in)" />
                </Form.Item>
                <Form.Item name="printFooter" label="Lời dặn dò cuối vé" initialValue="Vui lòng ngồi chờ đến lượt gọi." className="mb-0">
                  <Input.TextArea rows={2} placeholder="Ví dụ: Vui lòng ngồi chờ đến lượt gọi. (Để trống sẽ không in)" />
                </Form.Item>
              </div>
            </Col>
          </Row>

          <div className="flex justify-end border-t pt-4 mt-2">
            <Button onClick={() => setIsModalVisible(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu Cấu hình</Button>
          </div>
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

      <Modal
        title={
          <div className="flex items-center gap-2 text-green-700">
            <PrinterOutlined /> In Số Hàng Loạt
          </div>
        }
        open={isBatchModalVisible}
        onCancel={() => setIsBatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBatchModalVisible(false)}>Hủy</Button>,
          <Button key="submit" type="primary" className="bg-green-600" loading={isBatching} onClick={handleBatchSubmit}>Bắt đầu Tạo và In</Button>
        ]}
      >
        <div className="py-4 text-gray-600">
          <p className="mb-4">Hệ thống sẽ tạo số lượng lớn phiếu cho khu vực này và bật cửa sổ in để bạn in hàng loạt một lúc.</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Số lượng phiếu muốn in:</span>
            <InputNumber 
              min={1} 
              max={200}
              value={batchQuantity} 
              onChange={(val) => setBatchQuantity(val)} 
              placeholder="VD: 50" 
              className="w-32"
              size="large"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="In Mã QR Lấy Số Qua Điện Thoại"
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPrintModalVisible(false)}>Đóng</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In trang này
          </Button>
        ]}
        width={500}
      >
        {printArea && (
          <div className="flex flex-col items-center">
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center print:border-none print:p-0">
              <h2 className="text-2xl font-bold uppercase mb-2 text-blue-800">{printArea.name}</h2>
              <p className="text-gray-600 mb-6 font-medium">Quét mã QR bằng điện thoại để lấy số</p>
              <div className="flex justify-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <QRCode 
                  value={`${process.env.NEXT_PUBLIC_SERVER_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/m/${printArea.uid}`} 
                  size={250} 
                  color="#1e3a8a" // text-blue-900
                  errorLevel="H"
                />
              </div>
              <p className="mt-6 text-sm text-gray-500 max-w-xs mx-auto">
                Không cần cài đặt ứng dụng. Hỗ trợ quét bằng Camera, Zalo, hoặc các ứng dụng quét mã QR khác.
              </p>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                .ant-modal-content {
                  box-shadow: none !important;
                }
                .ant-modal-content * {
                  visibility: visible;
                }
                .ant-modal-close, .ant-modal-header, .ant-modal-footer, .print\\:hidden {
                  display: none !important;
                }
                .ant-modal {
                  top: 0;
                  margin: 0;
                  padding: 0;
                }
              }
            `}} />
          </div>
        )}
      </Modal>
    </div>
  );
}
