'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Typography, Alert, message, Space } from 'antd';
import { CameraOutlined, VideoCameraAddOutlined, PictureOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function CameraTestPage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Lấy danh sách Camera
  const getCameras = async () => {
    try {
      // Yêu cầu quyền truy cập trước để lấy được tên thật của thiết bị (label)
      await navigator.mediaDevices.getUserMedia({ video: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách camera:', error);
      message.error('Không thể truy cập Camera. Vui lòng kiểm tra quyền trên trình duyệt!');
    }
  };

  useEffect(() => {
    getCameras();
    return () => stopCamera(); // Cleanup khi rời trang
  }, []);

  // 2. Bật Camera theo thiết bị đã chọn
  useEffect(() => {
    if (selectedDeviceId) {
      startCamera(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const startCamera = async (deviceId: string) => {
    stopCamera(); // Tắt stream cũ nếu có
    setSnapshot(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Lỗi khi bật camera:', error);
      message.error('Lỗi kết nối đến Camera này!');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // 3. Chụp ảnh
  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg');
        setSnapshot(imageUrl);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Title level={3} className="m-0"><CameraOutlined className="mr-2" />Công cụ Test Camera</Title>
        <Text type="secondary">Kiểm tra khả năng nhận diện Webcam (đặc biệt là Logitech HD) và test chụp ảnh chân dung</Text>
      </div>

      <Alert
        title="Hướng dẫn Test Camera"
        description={
          <ul className="ml-4 mt-2 list-disc">
            <li>Trình duyệt sẽ hỏi quyền truy cập Camera, hãy bấm <b>Cho phép (Allow)</b>.</li>
            <li>Nếu cắm nhiều Camera, hãy thử chọn lần lượt từng cái trong danh sách bên dưới.</li>
            <li>Bấm <b>Chụp ảnh</b> để kiểm tra xem ảnh cắt ra có rõ nét để làm Face Matching không.</li>
          </ul>
        }
        type="info"
        showIcon
        className="mb-6"
      />

      <Card title={<><VideoCameraAddOutlined className="mr-2"/>Khung hình Trực tiếp (Live View)</>} className="shadow-sm mb-6">
        <div className="mb-4 flex items-center gap-4">
          <Text strong>Chọn Camera:</Text>
          <Select 
            style={{ width: 300 }} 
            value={selectedDeviceId} 
            onChange={setSelectedDeviceId}
            placeholder="Đang quét thiết bị..."
          >
            {devices.map((device, index) => (
              <Select.Option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PictureOutlined />} onClick={takeSnapshot} disabled={!stream}>
            Chụp Ảnh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Màn hình Video */}
          <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center min-h-[300px]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-auto max-h-[400px] object-cover"
            />
            {!stream && <Text type="secondary" className="absolute">Không có tín hiệu Video</Text>}
          </div>

          {/* Màn hình Ảnh chụp */}
          <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center min-h-[300px] relative">
            <canvas ref={canvasRef} className="hidden" />
            {snapshot ? (
              <img src={snapshot} alt="Snapshot" className="w-full h-auto max-h-[400px] object-contain" />
            ) : (
              <Text type="secondary">Ảnh chụp sẽ hiện ở đây</Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
