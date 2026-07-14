'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Alert, Space, Divider, Select, Tag } from 'antd';
import { UsbOutlined, ScanOutlined, ClearOutlined, CopyOutlined, ApiOutlined, DisconnectOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function HardwareTestPage() {
  // --- STATE CHO CHẾ ĐỘ BÀN PHÍM ---
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

  // --- STATE CHO CHẾ ĐỘ CỔNG COM (WEB SERIAL API) ---
  const [serialOutput, setSerialOutput] = useState('');
  const [serialPort, setSerialPort] = useState<any>(null);
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [reader, setReader] = useState<any>(null);

  const connectSerial = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('Trình duyệt không hỗ trợ Web Serial API. Vui lòng dùng Google Chrome/Edge trên máy tính.');
        return;
      }
      
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: baudRate });
      setSerialPort(port);
      
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const newReader = textDecoder.readable.getReader();
      setReader(newReader);

      alert('Đã kết nối thành công vào thiết bị COM!');

      while (true) {
        const { value, done } = await newReader.read();
        if (done) {
          newReader.releaseLock();
          break;
        }
        if (value) {
          setSerialOutput(prev => prev + value);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotFoundError') { // Bỏ qua lỗi người dùng cố tình ấn Cancel
        alert('Lỗi kết nối COM: ' + err.message);
      }
      setSerialPort(null);
    }
  };

  const disconnectSerial = async () => {
    try {
      if (reader) {
        await reader.cancel();
        setReader(null);
      }
      if (serialPort) {
        await serialPort.close();
        setSerialPort(null);
      }
    } catch (err) {
      console.error(err);
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
            <li><strong>Chế độ giả lập bàn phím:</strong> Click vào ô đen ở Cách 1, rồi quét thẻ xem có ra chữ không.</li>
            <li><strong>Chế độ Cổng COM ảo:</strong> Bấm "Kết nối cổng COM" ở Cách 2, chọn thiết bị trong danh sách sổ xuống của Chrome, rồi quét thẻ.</li>
          </ol>
        }
        type="info"
        showIcon
        className="mb-6"
      />

      {/* --- CÁCH 1: GIẢ LẬP BÀN PHÍM --- */}
      <Card title={<><ScanOutlined className="mr-2"/>CÁCH 1: Test đầu đọc giả lập bàn phím (HID Keyboard)</>} className="shadow-sm mb-8 border-blue-200">
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
        <Card title="Phân tích sơ bộ Cách 1" className="mt-4 border-blue-200 bg-blue-50 mb-8">
          <Paragraph>
            <strong>Độ dài chuỗi:</strong> {rawOutput.length} ký tự
          </Paragraph>
          <Paragraph>
            <strong>Nhận xét tự động:</strong> 
            {rawOutput.includes('|') 
              ? ' Tuyệt vời! Thiết bị đang hoạt động ở chế độ giả lập bàn phím và quét được mã QR CCCD.' 
              : ' Nếu dữ liệu loằng ngoằng, toàn ký tự lạ, có thể thiết bị đang trả về luồng Byte/Hex từ chip NFC hoặc dữ liệu nhị phân.'}
          </Paragraph>
        </Card>
      )}

      {/* --- CÁCH 2: CỔNG COM --- */}
      <Card title={<><ApiOutlined className="mr-2"/>CÁCH 2: Test đầu đọc Cổng COM ảo (Virtual COM / Serial Port)</>} className="shadow-sm border-orange-200">
        <div className="flex gap-4 items-center mb-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div>
            <Text strong className="block mb-1">Tốc độ Baud Rate:</Text>
            <Select value={baudRate} onChange={setBaudRate} className="w-32" disabled={!!serialPort}>
              <Select.Option value={9600}>9600</Select.Option>
              <Select.Option value={19200}>19200</Select.Option>
              <Select.Option value={38400}>38400</Select.Option>
              <Select.Option value={115200}>115200</Select.Option>
            </Select>
          </div>
          <div className="pt-6">
            {!serialPort ? (
              <Button type="primary" style={{backgroundColor: '#e65100'}} icon={<ApiOutlined />} onClick={connectSerial}>
                Kết Nối Cổng COM
              </Button>
            ) : (
              <Button danger icon={<DisconnectOutlined />} onClick={disconnectSerial}>
                Ngắt Kết Nối
              </Button>
            )}
          </div>
          {serialPort && (
            <div className="pt-6">
              <Tag color="green" className="text-sm py-1 px-3">Đang kết nối cổng COM...</Tag>
            </div>
          )}
        </div>

        <Input.TextArea
          value={serialOutput}
          rows={8}
          className="font-mono text-lg p-4"
          style={{ backgroundColor: '#1e1e1e', color: '#ffeb3b' }}
          placeholder="Dữ liệu truyền qua cổng COM sẽ hiển thị ở đây (sau khi bạn bấm Kết Nối)..."
          readOnly
        />
        
        <div className="flex justify-between items-center mt-4">
          <Text type="secondary">
            Lưu ý: Chỉ hỗ trợ trên Google Chrome, Edge.
          </Text>
          <Space>
            <Button icon={<ClearOutlined />} onClick={() => setSerialOutput('')}>Xóa kết quả</Button>
            <Button type="primary" style={{backgroundColor: '#e65100'}} icon={<CopyOutlined />} onClick={() => {
              navigator.clipboard.writeText(serialOutput);
              alert('Đã copy dữ liệu Cổng COM, bạn gửi qua cho tôi nhé!');
            }}>Copy Dữ Liệu</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
