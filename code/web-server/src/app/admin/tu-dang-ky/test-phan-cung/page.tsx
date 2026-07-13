'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Alert, Space } from 'antd';
import { UsbOutlined, ScanOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function HardwareTestPage() {
  const [rawOutput, setRawOutput] = useState('');
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const inputRef = useRef<any>(null);

  // Auto-focus the input so it's ready to receive scanner data
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawOutput(e.target.value);
    setLastScanTime(new Date());
  };

  const handleClear = () => {
    setRawOutput('');
    setLastScanTime(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Title level={3} className="m-0"><UsbOutlined className="mr-2" />Công cụ Test Đầu Đọc CCCD</Title>
        <Text type="secondary">Trang này giúp kiểm tra xem thiết bị Newland thực sự trả về cái gì khi đút thẻ vào</Text>
      </div>

      <Alert
        title="Hướng dẫn Test Thiết bị"
        description={
          <ol className="ml-4 mt-2 list-decimal">
            <li>Đảm bảo đã cắm thiết bị Newland vào cổng USB của máy tính (hoặc Kiosk) đang mở trang web này.</li>
            <li>Click chuột vào ô màu đen bên dưới để con trỏ (dấu nháy) nhấp nháy trong ô đó.</li>
            <li>Đưa thẻ CCCD vào thiết bị Newland.</li>
            <li>Chờ xem thiết bị có "tự động gõ" chữ gì vào ô đen không. Sau đó bấm <b>Copy Dữ Liệu</b> và gửi cho team dev.</li>
          </ol>
        }
        type="info"
        showIcon
        className="mb-6"
      />

      <Card title={<><ScanOutlined className="mr-2"/>Khu vực nhận dữ liệu (Raw Data)</>} className="shadow-sm">
        <Input.TextArea
          ref={inputRef}
          value={rawOutput}
          onChange={handleInputChange}
          rows={8}
          className="font-mono text-lg p-4"
          style={{ backgroundColor: '#1e1e1e', color: '#4af626' }}
          placeholder="[Click vào đây] Sau đó đưa thẻ CCCD vào thiết bị để quét..."
        />
        
        <div className="flex justify-between items-center mt-4">
          <Text type="secondary">
            {lastScanTime ? `Dữ liệu nhận lúc: ${lastScanTime.toLocaleTimeString()}` : 'Đang chờ quét thẻ...'}
          </Text>
          <Space>
            <Button icon={<ClearOutlined />} onClick={handleClear}>Xóa kết quả</Button>
            <Button type="primary" icon={<CopyOutlined />} onClick={() => {
              navigator.clipboard.writeText(rawOutput);
              alert('Đã copy dữ liệu, bạn dán gửi qua cho tôi xem nhé!');
            }}>Copy Dữ Liệu</Button>
          </Space>
        </div>
      </Card>

      {rawOutput && (
        <Card title="Phân tích sơ bộ từ Kiosk" className="mt-6 border-blue-200 bg-blue-50">
          <Paragraph>
            <strong>Độ dài chuỗi:</strong> {rawOutput.length} ký tự
          </Paragraph>
          <Paragraph>
            <strong>Nhận xét tự động:</strong> 
            {rawOutput.includes('|') 
              ? ' Có vẻ thiết bị đang quét mã QR trên thẻ CCCD. Mã QR này chứa text được phân cách bằng dấu gạch đứng (|). LƯU Ý: Dữ liệu này KHÔNG chứa ảnh chân dung.' 
              : ' Nếu dữ liệu loằng ngoằng, toàn ký tự lạ (như ), có thể thiết bị đang trả về luồng Byte/Hex từ chip NFC hoặc dữ liệu nhị phân của hình ảnh.'}
          </Paragraph>
        </Card>
      )}
    </div>
  );
}
