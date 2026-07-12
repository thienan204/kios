'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { message, QRCode, Modal, InputNumber, Button, Input } from 'antd';
import { PrinterOutlined, LockOutlined } from '@ant-design/icons';

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

  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState(10);
  const [pinCode, setPinCode] = useState('');
  const [isBatching, setIsBatching] = useState(false);

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
        const res = await fetch(`/kios/api/areas/${areaId}`);
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
        // Fallback for crypto.randomUUID() in non-secure contexts (HTTP)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          deviceId = crypto.randomUUID();
        } else {
          deviceId = 'kiosk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        }
        localStorage.setItem('kioskDeviceId', deviceId);
      }

      try {
        const res = await fetch(`/kios/api/areas/${areaId}/device-lock`, {
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
      const res = await fetch(`/kios/api/tickets/last?areaId=${areaId}`);
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
      const res = await fetch('/kios/api/tickets/issue', {
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

  const handleBatchPrint = async () => {
    if (!areaId || batchQuantity < 1) return;
    if (!pinCode) {
      message.error('Vui lòng nhập mã PIN nhân viên!');
      return;
    }
    
    setIsBatching(true);
    try {
      const res = await fetch(`/kios/api/areas/${areaId}/batch-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: batchQuantity, pinCode })
      });
      const data = await res.json();
      if (res.ok) {
        setIsBatchModalVisible(false);
        sessionStorage.setItem('batch_tickets', JSON.stringify(data.tickets));
        window.open('/print-batch', '_blank');
      } else {
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setIsBatching(false);
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
    <>
      {/* KHU VỰC HIỂN THỊ TRÊN MÀN HÌNH (Sẽ ẩn khi in) */}
      <div className="h-screen w-full flex flex-col items-center justify-center bg-blue-50 overflow-hidden print:hidden p-8">
        
        {/* KHU VỰC LOGO & BANNER */}
        <div className="w-full max-w-7xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <img 
            src={`/kios/logo.png${imageVersion}`}
            alt="Logo Bệnh viện" 
            className="h-24 md:h-32 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img 
            src={`/kios/banner.png${imageVersion}`}
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
              value={`${(process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin).replace(/\/kios\/?$/, '')}/kios/m/${areaUid}`} 
              size={120} 
              color="#1e3a8a" 
              bordered={false} 
            />
          )}
        </div>
        
        {/* Vùng bấm ẩn dành cho nhân viên (Góc dưới bên trái) */}
        <div 
          className="absolute bottom-0 left-0 w-20 h-20 opacity-0 cursor-pointer z-50"
          onClick={() => {
            setPinCode('');
            setIsBatchModalVisible(true);
          }}
          title="Chỉ dành cho nhân viên"
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-700">
            <LockOutlined /> Nhập Mã PIN Nhân Viên
          </div>
        }
        open={isBatchModalVisible}
        onCancel={() => setIsBatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBatchModalVisible(false)}>Hủy</Button>,
          <Button key="submit" type="primary" loading={isBatching} onClick={handleBatchPrint}>Tạo & In</Button>
        ]}
      >
        <div className="py-4">
          <p className="mb-4 text-red-500 font-semibold">Tính năng này đã bị khóa để tránh bệnh nhân bấm nhầm. Vui lòng nhập mã PIN nhân viên (Mặc định: 123456).</p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Mã PIN:</span>
              <Input.Password 
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Nhập mã PIN"
                className="w-48"
                size="large"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-semibold">Số lượng phiếu muốn in:</span>
              <InputNumber 
                min={1} 
                max={200}
                value={batchQuantity} 
                onChange={(val) => setBatchQuantity(val || 10)} 
                className="w-48"
                size="large"
              />
            </div>
          </div>
        </div>
      </Modal>

      </div>

      {/* KHU VỰC CHUẨN BỊ IN (Chỉ hiện khi in) */}
      {ticketData && (
        <div id="print-area" ref={printRef} className="hidden print:block w-full max-w-[80mm] mx-auto text-center font-sans text-black bg-white px-1 py-2">
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
    </>
  );
}
