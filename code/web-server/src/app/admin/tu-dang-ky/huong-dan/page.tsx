'use client';

import React from 'react';
import { Typography, Tabs, Card, Timeline, Alert } from 'antd';
import { 
  SettingOutlined, 
  DesktopOutlined, 
  SafetyOutlined, 
  ApiOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function HuongDanPage() {
  const items = [
    {
      key: '1',
      label: 'Tổng quan Hệ thống',
      icon: <DesktopOutlined />,
      children: (
        <div className="space-y-6">
          <Alert
            title="Zero-touch Provisioning (Tự động nhận diện thiết bị)"
            description="Hệ thống Kiosk Tự Đăng Ký được thiết kế với cơ chế cắm-là-chạy. Phần mềm Desktop Client dùng chung cho cả Bàn Tiếp Đón và Máy Kiosk. Nó sẽ tự quét địa chỉ MAC của máy để quyết định hiển thị giao diện nào."
            type="info"
            showIcon
          />
          
          <Card title="Luồng hoạt động 4 Bước của Bệnh nhân">
            <Timeline
              items={[
                {
                  color: 'blue',
                  content: <b>Bước 1: Chọn Dịch vụ</b>,
                },
                {
                  color: 'green',
                  content: (
                    <>
                      <b>Bước 2: Đọc thẻ CCCD</b>
                      <br/>
                      <Text type="secondary">Bệnh nhân đưa thẻ vào khe đọc. Máy tự động trích xuất thông tin chữ và ảnh chân dung.</Text>
                    </>
                  ),
                },
                {
                  color: 'red',
                  content: (
                    <>
                      <b>Bước 3: Xác thực khuôn mặt (Face API)</b>
                      <br/>
                      <Text type="secondary">Camera chụp ảnh bệnh nhân và AI đối chiếu với ảnh CCCD (Chạy offline, không cần internet).</Text>
                    </>
                  ),
                },
                {
                  color: 'gray',
                  content: <b>Bước 4: In phiếu và hoàn tất</b>,
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Cài đặt Desktop Client',
      icon: <SettingOutlined />,
      children: (
        <div className="space-y-6">
          <Typography>
            <Title level={4}>Các bước thiết lập cho IT Bệnh viện</Title>
            <Paragraph>
              Để biến một máy tính thường thành máy Kiosk, IT cần thực hiện:
            </Paragraph>
            <ul>
              <li><b>Bước 1:</b> Lấy địa chỉ MAC của máy ngoài sảnh (VD: 00:1A:2B:3C:4D:5E).</li>
              <li><b>Bước 2:</b> Vào menu <i>Quản lý Thiết bị</i> trên Web Admin, thêm mới thiết bị và nhập MAC này vào.</li>
              <li><b>Bước 3:</b> Cài đặt file chạy của Desktop Client lên máy ngoài sảnh. Bật phần mềm lên.</li>
              <li><b>Bước 4:</b> (Nếu là máy mới) Màn hình Setup Wizard màu xanh sẽ hiện ra. Nhập URL của máy chủ Web (VD: http://192.168.1.100:3000) và bấm Kết nối.</li>
              <li><b>Bước 5:</b> Phần mềm sẽ tự báo lên Server, tự động bung toàn màn hình (Fullscreen) và khóa luôn thanh Taskbar.</li>
            </ul>
            <Alert
              title="Mẹo nhỏ"
              description="Bạn có thể ấn tổ hợp phím Ctrl + Shift + S bất cứ lúc nào trên máy Kiosk để mở lại màn hình Setup Wizard."
              type="success"
              showIcon
            />
          </Typography>
        </div>
      ),
    },
    {
      key: '3',
      label: 'Kiểm tra Phần cứng',
      icon: <SafetyOutlined />,
      children: (
        <div className="space-y-4">
          <Typography>
            <Title level={4}>Công cụ chuẩn đoán (Diagnostics)</Title>
            <Paragraph>
              Chúng tôi cung cấp sẵn 2 công cụ để IT kiểm tra tình trạng kết nối phần cứng ngay trên Web Admin mà không cần phải mang máy ra sảnh.
            </Paragraph>
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Test Đầu đọc thẻ CCCD" size="small">
              Dùng để kiểm tra cổng COM/USB có nhận tín hiệu thẻ Newland hay không. Nó sẽ hiển thị dữ liệu thô (Raw Hex Data) khi cắm thẻ vào.
            </Card>
            <Card title="Test Camera" size="small">
              Dùng để kiểm tra độ phân giải, độ sáng và khả năng lấy nét của Webcam gắn ngoài trước khi chạy tính năng Face Matching.
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Kết nối HIS (API Mapping)',
      icon: <ApiOutlined />,
      children: (
        <Typography>
          <Title level={4}>Cấu hình Mapping Dữ liệu</Title>
          <Paragraph>
            Vì phần mềm độc lập hoàn toàn với hệ thống lấy số cũ, bạn cần định nghĩa lại cách Kiosk gửi dữ liệu đăng ký sang phần mềm HIS của bệnh viện.
          </Paragraph>
          <Paragraph>
            Vào menu <b>Cấu hình API HIS</b>, bạn có thể thiết lập:
          </Paragraph>
          <ul>
            <li><b>API Endpoint:</b> Đường dẫn nhận data của HIS.</li>
            <li><b>API Method:</b> POST / PUT.</li>
            <li><b>Data Mapping:</b> Gắn các trường dữ liệu tĩnh (như <i>Tên, Tuổi, Mã BHYT</i>) vào đúng định dạng JSON mà HIS yêu cầu.</li>
          </ul>
        </Typography>
      ),
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Sổ tay Hướng dẫn Kiosk Tự Đăng Ký</Title>
        <Text type="secondary">
          Tài liệu dành cho Quản trị viên (Admin) và Nhân viên IT triển khai hệ thống ngoài sảnh.
        </Text>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </div>
  );
}
