'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { message, QRCode } from 'antd';

export default function KioskPage() {
  const params = useParams();
  const areaId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lastIssuedNumber, setLastIssuedNumber] = useState<number | null>(null);
  const [areaName, setAreaName] = useState<string>('Hệ thống lấy số tự động');
  const [areaUid, setAreaUid] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setImageVersion(`?v=${Date.now()}`);
    setMounted(true);
  }, []);
  
  // State cho vé in
  const [ticketData, setTicketData] = useState<{
    number: number;
    area: string;
    waiting: number;
    time: string;
    printHospitalName?: string;
    printGreeting?: string;
    printFooter?: string;
  } | null>(null);

  // Tham chiếu đến vùng cần in
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!areaId) {
      setErrorMsg('Vui lòng truy cập đúng đường dẫn Khu vực (VD: /layso/1)');
      return;
    }

    const fetchAreaDetails = async () => {
      try {
        const res = await fetch(`/api/areas/${areaId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) setAreaName(data.name);
          if (data.uid) setAreaUid(data.uid);
        }
      } catch (err) {
        console.error('Không thể lấy thông tin khu vực', err);
      }
    };

    const claimDevice = async () => {
      let deviceId = localStorage.getItem('kioskDeviceId');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('kioskDeviceId', deviceId);
      }

      try {
        const res = await fetch(`/api/areas/${areaId}/device-lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceType: 'kiosk', deviceId })
        });
        const data = await res.json();
        if (!data.success) {
          setIsLockedOut(true);
          setErrorMsg(data.message);
        } else {
          fetchAreaDetails();
          fetchLastNumber();
        }
      } catch (err) {
        setErrorMsg('Lỗi kiểm tra bản quyền thiết bị Kiosk.');
      }
    };

    claimDevice();
  }, [areaId]);

  const fetchLastNumber = async () => {
    try {
      const res = await fetch(`/api/tickets/last?areaId=${areaId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ticketNumber) {
          setLastIssuedNumber(data.ticketNumber);
        }
      }
    } catch (e) {
      console.error('Không thể lấy số gần nhất');
    }
  };

  const handleGetTicket = async () => {
    if (!areaId) return;
    setLoading(true);
    setErrorMsg(null);
    setTicketData(null);

    try {
      const res = await fetch('/api/tickets/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaId }),
      });

      const data = await res.json();

      if (res.ok) {
        setTicketData({
          number: data.ticketNumber,
          area: data.areaName,
          waiting: data.waitingCount,
          time: new Date(data.issuedAt).toLocaleString('vi-VN'),
          printHospitalName: data.printHospitalName,
          printGreeting: data.printGreeting,
          printFooter: data.printFooter,
        });
        
        setLastIssuedNumber(data.ticketNumber);
        
        message.success('Đã lấy số thành công!');
        
        // Đợi DOM cập nhật và trình duyệt kịp vẽ (paint) giao diện mới rồi mới gọi hàm in
        // Nếu gọi quá sớm, màn hình sẽ bị "đứng im" chưa kịp hiện số đã nhảy sang lệnh in
        setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            console.log('Không thể gọi lệnh in trên thiết bị này');
          }
          
          // Lấy thời gian chờ reset từ cấu hình (Mặc định 3000ms = 3 giây)
          const resetDelay = process.env.NEXT_PUBLIC_KIOSK_RESET_DELAY 
            ? parseInt(process.env.NEXT_PUBLIC_KIOSK_RESET_DELAY) 
            : 3000;
            
          setTimeout(() => setTicketData(null), resetDelay);
        }, 500);

      } else {
        if (data.outOfHours) {
          setErrorMsg('HẾT GIỜ TIẾP ĐÓN');
        } else {
          setErrorMsg(data.error || 'Lỗi cấp số từ máy chủ');
        }
      }
    } catch (err) {
      setErrorMsg('LỖI KẾT NỐI MÁY CHỦ: Không thể gọi API. Vui lòng kiểm tra lại mạng LAN hoặc tường lửa.');
    } finally {
      setLoading(false);
    }
  };

  if (isLockedOut) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 p-8">
        <h1 className="text-red-500 text-6xl font-black text-center mb-6 uppercase">Truy Cập Bị Từ Chối</h1>
        <p className="text-white text-2xl font-semibold text-center max-w-3xl leading-relaxed">
          {errorMsg}
        </p>
        <div className="mt-8 p-6 bg-gray-800 rounded-xl text-gray-400 text-center max-w-2xl border border-gray-700">
          <p className="mb-2 text-lg">💡 Nếu đây là thiết bị mới hoặc bạn vừa cài lại máy:</p>
          <p>Hãy yêu cầu Quản trị viên vào trang <b>Quản lý Khu vực (Dashboard)</b> và bấm nút <b>"Mở khóa thiết bị Kiosk"</b> cho khu vực này để được cấp quyền lại.</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !errorMsg.includes('HẾT GIỜ')) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 p-8">
        <h1 className="text-red-600 text-5xl font-black text-center mb-6">CÓ LỖI XẢY RA</h1>
        <p className="text-red-500 text-2xl font-bold text-center">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-8 py-4 bg-red-600 text-white font-bold rounded-xl text-xl hover:bg-red-700">TẢI LẠI TRANG</button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-blue-50 overflow-hidden">
      {/* KHU VỰC HIỂN THỊ TRÊN MÀN HÌNH (Sẽ ẩn khi in) */}
      <div className="flex flex-col items-center justify-center print:hidden w-full h-full p-8">
        
        {/* KHU VỰC LOGO & BANNER */}
        <div className="w-full max-w-7xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <img 
            src={`/logo.png${imageVersion}`}
            alt="Logo Bệnh viện" 
            className="h-24 md:h-32 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img 
            src={`/banner.png${imageVersion}`}
            alt="Banner Bệnh viện" 
            className="h-24 md:h-32 w-auto object-contain flex-1 max-w-full md:max-w-[70%]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 mb-12 text-center uppercase tracking-tight">
          {areaName}
        </h1>

        {ticketData ? (
          <div className="text-center animate-pulse">
            <h2 className="text-3xl text-green-600 font-bold mb-4">Vui lòng lấy phiếu bên dưới!</h2>
            <div className="text-9xl font-black text-blue-800">{ticketData.number}</div>
          </div>
        ) : errorMsg === 'HẾT GIỜ TIẾP ĐÓN' ? (
          <button 
            disabled 
            className="w-3/4 max-w-2xl aspect-video bg-gray-400 text-white text-5xl md:text-7xl font-black rounded-3xl shadow-inner cursor-not-allowed opacity-80"
          >
            HẾT GIỜ TIẾP ĐÓN
          </button>
        ) : (
          <button 
            onClick={handleGetTicket} 
            disabled={loading}
            className={`w-3/4 max-w-2xl aspect-video bg-blue-600 hover:bg-blue-500 active:bg-blue-800 text-white text-6xl md:text-8xl font-black rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.5)] transition-all transform hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'BẤM LẤY SỐ'}
          </button>
        )}

        {/* Hiển thị số vừa lấy */}
        {!ticketData && errorMsg !== 'HẾT GIỜ TIẾP ĐÓN' && lastIssuedNumber !== null && (
          <div className="mt-12 text-center fade-in">
            <p className="text-xl text-gray-500 font-semibold mb-2">SỐ VỪA ĐƯỢC CẤP</p>
            <div className="text-5xl font-black text-gray-700 bg-white px-8 py-3 rounded-full shadow-sm border border-gray-200">
              {lastIssuedNumber}
            </div>
          </div>
        )}

        {/* Mã QR Lấy Số Qua Điện Thoại - Góc dưới bên phải */}
        <div className="absolute bottom-6 right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center">
          <p className="text-sm font-bold text-blue-900 mb-2 uppercase text-center w-32 leading-tight">
            Quét mã để<br/>lấy số trên điện thoại
          </p>
          {mounted && areaUid && (
            <QRCode 
              value={`${process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin}/m/${areaUid}`} 
              size={120} 
              color="#1e3a8a" 
              bordered={false} 
            />
          )}
        </div>
      </div>

      {/* KHU VỰC CHUẨN BỊ IN (Bình thường ẩn, chỉ hiện trên giấy in K80) */}
      {/* 
        Giấy K80 có chiều rộng 80mm (~3inch).
        Để in đẹp, ta thiết kế 1 div có width cố định và dùng CSS @media print để ẩn các thành phần khác.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
        }
      `}} />

      {ticketData && (
        <div id="print-area" ref={printRef} className="hidden print:block w-full text-center font-sans text-black bg-white px-2 py-4">
          <h2 className="text-lg font-bold uppercase mb-1">{ticketData.area}</h2>
          {ticketData.printHospitalName && (
            <p className="text-xs mb-2">{ticketData.printHospitalName}</p>
          )}
          <hr className="border-black border-dashed mb-2" />
          
          {ticketData.printGreeting && (
            <p className="text-sm">{ticketData.printGreeting}</p>
          )}
          <div className="text-6xl font-black my-2">{ticketData.number}</div>
          
          <hr className="border-black border-dashed my-2" />
          <p className="text-xs mb-1">Thời gian: {ticketData.time}</p>
          <p className="text-xs font-bold">Số người đang chờ: {ticketData.waiting}</p>
          
          {ticketData.printFooter && (
            <p className="text-[10px] mt-4 italic">{ticketData.printFooter}</p>
          )}
        </div>
      )}
    </div>
  );
}
