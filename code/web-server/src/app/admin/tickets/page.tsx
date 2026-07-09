'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, DatePicker, message, Card, Modal } from 'antd';
import { ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const { Title } = Typography;

interface Ticket {
  id: number;
  ticketNumber: number;
  status: 'WAITING' | 'CALLING' | 'COMPLETED' | 'SKIPPED';
  issuedAt: string;
  calledAt: string | null;
  area: { name: string };
  desk?: { name: string };
}

export default function TicketsMonitoringPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());
  
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteDateRange, setDeleteDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTickets = async (date: dayjs.Dayjs | null) => {
    setLoading(true);
    try {
      let url = '/api/tickets';
      if (date) {
        url += `?date=${date.format('YYYY-MM-DD')}`;
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
    fetchTickets(selectedDate);
    
    // Auto refresh every 10 seconds for real-time monitoring
    const interval = setInterval(() => {
      fetchTickets(selectedDate);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleDeleteData = async () => {
    if (!deleteDateRange || !deleteDateRange[0] || !deleteDateRange[1]) {
      message.error('Vui lòng chọn khoảng thời gian cần xóa!');
      return;
    }

    setIsDeleting(true);
    try {
      const startDate = deleteDateRange[0].format('YYYY-MM-DD');
      const endDate = deleteDateRange[1].format('YYYY-MM-DD');

      const res = await fetch(`/api/tickets?startDate=${startDate}&endDate=${endDate}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        message.success(`Đã xóa thành công ${data.count} vé lấy số!`);
        setIsDeleteModalVisible(false);
        setDeleteDateRange(null);
        fetchTickets(selectedDate); // Làm mới lại bảng
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
  ];

  return (
    <Card className="m-6 shadow-sm border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="m-0">Giám sát Số thứ tự</Title>
        <div className="flex gap-4">
          <DatePicker 
            value={selectedDate} 
            onChange={(date) => setSelectedDate(date)} 
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
            onClick={() => fetchTickets(selectedDate)}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>
      
      <Table 
        dataSource={tickets} 
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
