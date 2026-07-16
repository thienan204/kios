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

  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    // Giả lập thời gian máy in đang chạy (2 giây)
    const printTimer = setTimeout(() => {
      setStatus('done');
      // Gọi lệnh in thật
      setTimeout(() => {
        window.print();
      }, 500);
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

      {/* KHU VỰC CHUẨN BỊ IN (Chỉ hiện khi in) */}
      {status === 'done' && (
        <div id="print-area" className="hidden print:block w-full max-w-[80mm] mx-auto text-center font-sans text-black bg-white px-1 pt-0 pb-2">
          {!logoFailed && (
            <div className="flex justify-center mb-1">
              <img 
                src={`/kios/logo.png`} 
                alt="Logo" 
                className="h-10 w-auto object-contain grayscale" 
                onError={(e) => { 
                  (e.target as HTMLImageElement).style.display = 'none'; 
                  setLogoFailed(true);
                }}
              />
            </div>
          )}
          {logoFailed && (
            <p className="text-xs font-semibold mb-1">Bệnh viện Đa khoa Tỉnh Lạng Sơn</p>
          )}
          <h2 className="text-lg font-bold uppercase mb-2">ĐĂNG KÝ KHÁM BỆNH</h2>
          <hr className="border-black border-dashed mb-2" />
          
          <p className="text-sm">SỐ THỨ TỰ CỦA BẠN</p>
          <div className="text-[180px] leading-[0.8] font-black -mt-2 -mb-4">105</div>
          
          <hr className="border-black border-dashed mb-2 mt-4" />
          <div className="text-left text-sm mt-2 mb-2 space-y-1">
            <p><span className="font-semibold">Bệnh nhân:</span> {sessionData.patientInfo?.fullName || 'NGUYỄN VĂN A'}</p>
            {sessionData.serviceType === 'BHYT' && (
              <p><span className="font-semibold">Mã BHYT:</span> {sessionData.bhytNumber}</p>
            )}
            <p><span className="font-semibold">Chuyên khoa:</span> {sessionData.department}</p>
          </div>
          <hr className="border-black border-dashed my-2" />

          <p className="text-xs mb-1">Thời gian: {new Date().toLocaleString('vi-VN')}</p>
          <p className="text-[10px] mt-4 italic">Vui lòng di chuyển đến phòng khám và chờ gọi tên.</p>
        </div>
      )}

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
        @media print {
          @page { margin: 0; size: 80mm auto; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: block !important;
            height: auto !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
