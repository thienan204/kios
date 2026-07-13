'use client';

import React, { useState, useEffect } from 'react';
import { Button, Spin } from 'antd';
import { LoadingOutlined, LeftOutlined } from '@ant-design/icons';

interface Props {
  onSuccess: (data: any) => void;
  onBack: () => void;
}

export default function Step2_CardReader({ onSuccess, onBack }: Props) {
  const [isSimulating, setIsSimulating] = useState(false);

  // Lắng nghe sự kiện cắm thẻ từ phần cứng (thông qua Electron IPC)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onCardData) {
      (window as any).electronAPI.onCardData((data: any) => {
        setIsSimulating(true);
        // Delay 1 chút để tạo cảm giác máy đang xử lý (UX)
        setTimeout(() => {
          onSuccess(data);
        }, 800);
      });
    }
  }, [onSuccess]);

  // Hàm giả lập (Dành cho Dev Test)
  const handleSimulateRead = () => {
    setIsSimulating(true);
    // Giả lập thời gian đọc thẻ mất 2 giây
    setTimeout(() => {
      onSuccess({
        fullName: 'NGUYỄN VĂN A',
        cccdNumber: '030090123456',
        dob: '01/01/1990',
        gender: 'Nam',
        address: 'Hà Nội',
        // Mock 1 ảnh base64 rỗng để test giao diện
        photoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' 
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animation-fade-in py-12 relative">
      {/* Nút Quay Lại */}
      <Button 
        type="text" 
        icon={<LeftOutlined />} 
        className="absolute top-0 left-0 text-gray-500 hover:text-blue-600 text-lg"
        onClick={onBack}
        disabled={isSimulating}
      >
        Quay lại chọn dịch vụ
      </Button>

      {isSimulating ? (
        <div className="flex flex-col items-center justify-center space-y-8">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 80, color: '#1677ff' }} spin />} />
          <h2 className="text-3xl font-bold text-blue-600">Đang đọc dữ liệu thẻ...</h2>
          <p className="text-xl text-gray-500">Vui lòng giữ nguyên thẻ trong khe đọc</p>
        </div>
      ) : (
        <>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
            Thông tin Khách hàng
          </h2>
          <p className="text-xl text-gray-500 mb-12 text-center max-w-2xl">
            Quý khách vui lòng đưa <b>Thẻ Căn Cước Công Dân (CCCD)</b> gắn chip vào khe đọc thẻ phát sáng phía dưới màn hình.
          </p>

          {/* Vùng Animation Đút Thẻ */}
          <div className="relative w-80 h-80 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300 mb-12 animate-pulse">
            <div className="absolute top-1/4 w-40 h-24 bg-blue-500 rounded-lg shadow-lg border-2 border-white transform rotate-12 flex items-center justify-center">
               <span className="text-white font-bold text-sm">CCCD GẮN CHIP</span>
               <div className="absolute top-2 right-2 w-6 h-4 bg-yellow-400 rounded-sm"></div>
            </div>
            <div className="absolute bottom-1/4 w-48 h-8 bg-gray-800 rounded-t-xl overflow-hidden">
               <div className="w-full h-2 bg-green-500 animate-bounce"></div>
            </div>
          </div>

          {/* Nút Giả lập cho DEV */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <p className="text-yellow-700 font-semibold mb-2">[Dành cho DEV Test]</p>
            <Button type="primary" danger size="large" onClick={handleSimulateRead}>
              Giả lập sự kiện: Đã đưa thẻ CCCD vào
            </Button>
          </div>
        </>
      )}

      <style jsx>{`
        .animation-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
