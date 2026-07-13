'use client';

import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { CheckCircleFilled, LoadingOutlined, PrinterOutlined } from '@ant-design/icons';

interface Props {
  sessionData: any;
  onComplete: () => void;
}

export default function Step6_PrintTicket({ sessionData, onComplete }: Props) {
  const [status, setStatus] = useState<'printing' | 'done'>('printing');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Giả lập thời gian máy in đang chạy (2 giây)
    const printTimer = setTimeout(() => {
      setStatus('done');
    }, 2000);

    return () => clearTimeout(printTimer);
  }, []);

  useEffect(() => {
    // Đếm ngược 5 giây
    if (status === 'done' && countdown > 0) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [status, countdown]);

  useEffect(() => {
    // Tự động chuyển trang khi đếm ngược về 0
    if (countdown === 0) {
      onComplete();
    }
  }, [countdown, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full animation-fade-in py-12">
      
      <div className="bg-white p-12 rounded-[2rem] shadow-2xl w-full max-w-2xl text-center relative overflow-hidden border border-gray-100">
        
        {/* Background trang trí */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 to-emerald-500"></div>

        {status === 'printing' ? (
          <div className="flex flex-col items-center py-8">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 64, color: '#1677ff' }} spin />} className="mb-8" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Đang xử lý & In phiếu...</h2>
            <p className="text-xl text-gray-500">Quý khách vui lòng chờ trong giây lát</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 animation-zoom-in">
            <CheckCircleFilled className="text-8xl text-emerald-500 mb-6 shadow-emerald-200 drop-shadow-xl" />
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Đăng ký thành công!</h2>
            
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 w-full max-w-md my-6 text-left">
              <div className="text-center mb-4">
                <p className="text-gray-500 mb-1 text-lg">Số thứ tự của quý khách là:</p>
                <p className="text-7xl font-black text-blue-600 tracking-tighter m-0">105</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <p className="text-lg text-gray-700 m-0 flex justify-between">
                  <span className="font-semibold">Bệnh nhân:</span> 
                  <span className="text-blue-800 font-bold">{sessionData.patientInfo?.fullName || 'NGUYỄN VĂN A'}</span>
                </p>
                <p className="text-lg text-gray-700 m-0 flex justify-between">
                  <span className="font-semibold">SĐT:</span> 
                  <span>{sessionData.phoneNumber || 'Không có'}</span>
                </p>
                {sessionData.serviceType === 'BHYT' && (
                  <p className="text-lg text-gray-700 m-0 flex justify-between">
                    <span className="font-semibold">Mã BHYT:</span> 
                    <span>{sessionData.bhytNumber || 'Không có'}</span>
                  </p>
                )}
                <p className="text-lg text-gray-700 m-0 flex justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="font-semibold">Dịch vụ:</span> 
                  <span>{sessionData.serviceType === 'BHYT' ? 'Khám BHYT' : 'Khám Dịch vụ'}</span>
                </p>
                <p className="text-lg text-gray-700 m-0 flex justify-between">
                  <span className="font-semibold">Chuyên khoa:</span> 
                  <span className="text-emerald-700 font-bold">{sessionData.department || 'Chưa chọn'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center text-xl text-blue-600 bg-blue-50 px-6 py-3 rounded-full font-medium">
              <PrinterOutlined className="mr-3 text-2xl animate-bounce" />
              Vui lòng lấy phiếu ở khe bên dưới máy
            </div>
            
            <p className="mt-8 text-gray-400 font-medium">
              Màn hình sẽ tự động quay lại sau <span className="text-blue-500 font-bold">{countdown}</span> giây
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .animation-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animation-zoom-in {
          animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
