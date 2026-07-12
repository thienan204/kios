'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, DatePicker, message, Card, Modal, Input, Select, Space } from 'antd';
import { ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined, MobileOutlined, DesktopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const { Title } = Typography;

interface Ticket {
  id: number;
  ticketNumber: number;
  status: 'WAITING' | 'CALLING' | 'COMPLETED' | 'SKIPPED';
  issuedAt: string;
  calledAt: string | null;
  completedAt: string | null;
  area: { name: string };
  desk?: { name: string };
  phoneNumber?: string | null;
}

export default function TicketsMonitoringPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()]);
  
  // States cho bộ lọc
  const [searchStt, setSearchStt] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState<string | null>(null);
  const [filterDesk, setFilterDesk] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteDateRange, setDeleteDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTickets = async (dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
    setLoading(true);
    try {
      let url = '/kios/api/tickets';
      if (dateRange && dateRange[0] && dateRange[1]) {
        url += `?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`;
      } else {
        url += `?startDate=${dayjs().format('YYYY-MM-DD')}&endDate=${dayjs().format('YYYY-MM-DD')}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setTickets(data);
      } else {
        message.error(data.error || 'Lỗi tải dữ liệu');
      }
    } catch (err) {
      message.error('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(filterDateRange);
    
    // Auto refresh every 10 seconds for real-time monitoring
    const interval = setInterval(() => {
      fetchTickets(filterDateRange);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [filterDateRange]);

  const handleDeleteData = async () => {
    if (!deleteDateRange || !deleteDateRange[0] || !deleteDateRange[1]) {
      message.error('Vui lòng chọn khoảng thời gian cần xóa!');
      return;
    }

    setIsDeleting(true);
    try {
      const startDate = deleteDateRange[0].format('YYYY-MM-DD');
      const endDate = deleteDateRange[1].format('YYYY-MM-DD');

      const res = await fetch(`/kios/api/tickets?startDate=${startDate}&endDate=${endDate}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        message.success(`Đã xóa thành công ${data.count} vé lấy số!`);
        setIsDeleteModalVisible(false);
        setDeleteDateRange(null);
        fetchTickets(filterDateRange); // Làm mới lại bảng
      } else {
        message.error(data.error || 'Lỗi khi xóa dữ liệu');
      }
    } catch (error) {
      message.error('Không thể kết nối đến máy chủ');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Số TT',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      render: (num: number) => <span className="text-xl font-bold text-blue-600">{num}</span>,
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = status;
        if (status === 'WAITING') { color = 'warning'; text = 'Đang chờ'; }
        else if (status === 'CALLING') { color = 'error'; text = 'Đang gọi'; }
        else if (status === 'COMPLETED') { color = 'success'; text = 'Hoàn thành'; }
        else if (status === 'SKIPPED') { color = 'default'; text = 'Bỏ qua'; }
        
        return <Tag color={color} className="font-semibold px-3 py-1">{text}</Tag>;
      },
    },
    {
      title: 'Khu vực',
      key: 'area',
      render: (_: any, record: Ticket) => record.area?.name || '-',
    },
    {
      title: 'Bàn phục vụ',
      key: 'desk',
      render: (_: any, record: Ticket) => (
        record.desk ? (
          <span className="font-semibold text-purple-700">{record.desk.name}</span>
        ) : (
          <span className="text-gray-400 italic">Chưa phân bổ</span>
        )
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone: string | null) => phone ? <span className="font-medium text-gray-700">{phone}</span> : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Nguồn',
      key: 'source',
      render: (_: any, record: Ticket) => (
        record.phoneNumber ? (
          <Tag color="cyan" icon={<MobileOutlined />}>Mobile</Tag>
        ) : (
          <Tag color="blue" icon={<DesktopOutlined />}>Kiosk</Tag>
        )
      ),
    },
    {
      title: 'Giờ lấy số',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      render: (time: string) => time ? dayjs(time).format('HH:mm:ss') : '-',
    },
    {
      title: 'Giờ gọi',
      dataIndex: 'calledAt',
      key: 'calledAt',
      render: (time: string) => time ? dayjs(time).format('HH:mm:ss') : '-',
    },
    {
      title: 'Giờ hoàn thành',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (time: string) => time ? dayjs(time).format('HH:mm:ss') : '-',
    },
  ];

  // Tính toán dữ liệu lọc
  const filteredTickets = tickets.filter(t => {
    if (searchStt && !t.ticketNumber.toString().includes(searchStt)) return false;
    if (searchPhone && (!t.phoneNumber || !t.phoneNumber.includes(searchPhone))) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterArea && t.area?.name !== filterArea) return false;
    if (filterDesk) {
      if (filterDesk === 'UNASSIGNED') {
        if (t.desk) return false;
      } else {
        if (t.desk?.name !== filterDesk) return false;
      }
    }
    if (filterSource) {
      if (filterSource === 'mobile' && !t.phoneNumber) return false;
      if (filterSource === 'kiosk' && t.phoneNumber) return false;
    }
    return true;
  });

  const uniqueAreas = Array.from(new Set(tickets.map(t => t.area?.name).filter(Boolean)));
  const uniqueDesks = Array.from(new Set(tickets.map(t => t.desk?.name).filter(Boolean)));

  return (
    <Card className="m-6 shadow-sm border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="m-0">Giám sát Số thứ tự</Title>
        <div className="flex gap-4">
          <RangePicker 
            value={filterDateRange as any} 
            onChange={(dates) => setFilterDateRange(dates as any)} 
            allowClear={false}
            format="DD/MM/YYYY"
          />
          <Button 
            type="primary" 
            danger
            icon={<DeleteOutlined />} 
            onClick={() => setIsDeleteModalVisible(true)}
          >
            Xóa dữ liệu
          </Button>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => fetchTickets(filterDateRange)}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>
      
      {/* Bộ lọc UI */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-wrap gap-4 items-center">
        <span className="font-semibold text-gray-700">Bộ lọc:</span>
        <Input 
          placeholder="Tìm STT..." 
          value={searchStt} 
          onChange={(e) => setSearchStt(e.target.value)}
          style={{ width: 100 }}
          allowClear
        />
        <Input 
          placeholder="Tìm SĐT..." 
          value={searchPhone} 
          onChange={(e) => setSearchPhone(e.target.value)}
          style={{ width: 140 }}
          allowClear
        />
        <Select
          placeholder="Trạng thái"
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 140 }}
          allowClear
          options={[
            { label: 'Đang chờ', value: 'WAITING' },
            { label: 'Đang gọi', value: 'CALLING' },
            { label: 'Hoàn thành', value: 'COMPLETED' },
            { label: 'Bỏ qua', value: 'SKIPPED' },
          ]}
        />
        <Select
          placeholder="Khu vực"
          value={filterArea}
          onChange={setFilterArea}
          style={{ width: 200 }}
          allowClear
          options={uniqueAreas.map(a => ({ label: a, value: a }))}
        />
        <Select
          placeholder="Bàn phục vụ"
          value={filterDesk}
          onChange={setFilterDesk}
          style={{ width: 180 }}
          allowClear
          options={[
            { label: 'Chưa phân bổ', value: 'UNASSIGNED' },
            ...uniqueDesks.map(d => ({ label: d, value: d }))
          ]}
        />
        <Select
          placeholder="Nguồn lấy số"
          value={filterSource}
          onChange={setFilterSource}
          style={{ width: 150 }}
          allowClear
          options={[
            { label: 'Mobile', value: 'mobile' },
            { label: 'Kiosk', value: 'kiosk' },
          ]}
        />
        {(searchStt || searchPhone || filterStatus || filterArea || filterDesk || filterSource) && (
          <Button type="link" onClick={() => {
            setSearchStt('');
            setSearchPhone('');
            setFilterStatus(null);
            setFilterArea(null);
            setFilterDesk(null);
            setFilterSource(null);
          }}>
            Xóa lọc
          </Button>
        )}
      </div>
      
      <Table 
        dataSource={filteredTickets} 
        columns={columns} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        bordered
      />

      <Modal
        title={
          <span className="text-red-600 flex items-center gap-2">
            <ExclamationCircleOutlined /> Xóa Dữ Liệu Vé Lấy Số
          </span>
        }
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsDeleteModalVisible(false)} disabled={isDeleting}>
            Hủy bỏ
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger 
            loading={isDeleting} 
            onClick={handleDeleteData}
          >
            Xác nhận Xóa
          </Button>,
        ]}
      >
        <div className="py-4">
          <p className="mb-4 text-gray-700">
            Tính năng này giúp dọn dẹp cơ sở dữ liệu. Toàn bộ vé lấy số nằm trong khoảng thời gian được chọn sẽ bị <b>XÓA VĨNH VIỄN</b> và không thể khôi phục.
          </p>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-800">Chọn thời gian cần dọn dẹp:</label>
            <RangePicker 
              className="w-full"
              format="DD/MM/YYYY"
              value={deleteDateRange as any}
              onChange={(dates) => setDeleteDateRange(dates as any)}
            />
          </div>
          <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
            <b>Lưu ý:</b> Hãy cẩn thận khi chọn ngày hôm nay nếu hệ thống đang có bệnh nhân chờ khám!
          </div>
        </div>
      </Modal>
    </Card>
  );
}
