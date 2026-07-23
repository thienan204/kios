'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { message, QRCode } from 'antd';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ScanOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';

export default function KioskQRPage() {
  const params = useParams();
  const areaId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [areaName, setAreaName] = useState<string>('Hệ thống lấy số tự động');
  const [areaUid, setAreaUid] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState('');
  const [mounted, setMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // Lưu lại hàm onScan để gọi thủ công khi test
  const onScanRef = useRef<((data: string) => void) | null>(null);

  useEffect(() => {
    setImageVersion(`?v=${Date.now()}`);
    setMounted(true);
  }, []);
  
  const [ticketData, setTicketData] = useState<{
    number: number;
    area: string;
    waiting: number;
    time: string;
    customerName?: string;
    extraInfo?: any;
    printHospitalName?: string;
    printGreeting?: string;
    printFooter?: string;
  } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!areaId) {
      setErrorMsg('Vui lòng truy cập đúng đường dẫn Khu vực (VD: /layso-qr/1)');
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
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          deviceId = crypto.randomUUID();
        } else {
          deviceId = 'kiosk-qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
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
        }
      } catch (err) {
        setErrorMsg('Lỗi kiểm tra bản quyền thiết bị Kiosk.');
      }
    };

    claimDevice();
  }, [areaId]);

  // Hook xử lý khi máy quét QR quét thành công
  useBarcodeScanner({
    onScan: async (scannedData) => {
      if (loading || isLockedOut || errorMsg === 'HẾT GIỜ TIẾP ĐÓN') return;
      
      let phone = '';
      let name = '';
      let extraInfo: any = null;
  
      try {
        const parsed = JSON.parse(scannedData);
        phone = parsed.phone || parsed.phoneNumber || '';
        name = parsed.name || parsed.patientName || parsed.customerName || '';
        extraInfo = parsed;
      } catch (e) {
        // Nếu không phải JSON, giả định nó là chuỗi định danh (SĐT hoặc PatientID)
        phone = scannedData;
      }
  
      setLoading(true);
      setErrorMsg(null);
      setTicketData(null);
  
      try {
        const res = await fetch('/kios/api/tickets/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            areaId, 
            phoneNumber: phone,
            customerName: name
          }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          setTicketData({
            number: data.ticketNumber,
            area: data.areaName,
            waiting: data.waitingCount,
            time: new Date(data.issuedAt).toLocaleString('vi-VN'),
            customerName: name,
            extraInfo: extraInfo,
            printHospitalName: data.printHospitalName,
            printGreeting: data.printGreeting,
            printFooter: data.printFooter,
          });
          
          message.success(`Đã quét mã và lấy số thành công!`);
          
          setTimeout(() => {
            try {
              window.print();
            } catch (e) {
              console.log('Không thể gọi lệnh in trên thiết bị này');
            }
            
            const resetDelay = process.env.NEXT_PUBLIC_KIOSK_RESET_DELAY 
              ? parseInt(process.env.NEXT_PUBLIC_KIOSK_RESET_DELAY) 
              : 5000; // Để lâu hơn chút để ngta đọc tên
              
            setTimeout(() => setTicketData(null), resetDelay);
          }, 500);
  
        } else {
          if (data.outOfHours) {
            setErrorMsg('HẾT GIỜ TIẾP ĐÓN');
          } else {
            message.error(data.error || 'Lỗi cấp số từ máy chủ');
          }
        }
      } catch (err) {
        message.error('LỖI KẾT NỐI MÁY CHỦ: Không thể gọi API.');
      } finally {
        setLoading(false);
      }
    }
  });

  // Gán hàm onScan vào ref để test
  useEffect(() => {
    onScanRef.current = async (scannedData: string) => {
      // Gọi lại logic parse ở trên để test
      if (loading || isLockedOut || errorMsg === 'HẾT GIỜ TIẾP ĐÓN') return;
      
      let phone = '';
      let name = '';
      let extraInfo: any = null;
  
      try {
        const parsed = JSON.parse(scannedData);
        phone = parsed.phone || parsed.phoneNumber || '';
        name = parsed.name || parsed.patientName || parsed.customerName || '';
        extraInfo = parsed;
      } catch (e) {
        phone = scannedData;
      }
  
      setLoading(true);
      setErrorMsg(null);
      setTicketData(null);
  
      try {
        const res = await fetch('/kios/api/tickets/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ areaId, phoneNumber: phone, customerName: name }),
        });
        const data = await res.json();
        if (res.ok) {
          setTicketData({
            number: data.ticketNumber,
            area: data.areaName,
            waiting: data.waitingCount,
            time: new Date(data.issuedAt).toLocaleString('vi-VN'),
            customerName: name,
            extraInfo: extraInfo,
            printHospitalName: data.printHospitalName,
            printGreeting: data.printGreeting,
            printFooter: data.printFooter,
          });
          message.success(`Đã quét mã và lấy số thành công!`);
          setTimeout(() => {
            try { window.print(); } catch (e) {}
            setTimeout(() => setTicketData(null), 5000);
          }, 500);
        } else {
          message.error(data.error || 'Lỗi cấp số từ máy chủ');
        }
      } catch (err) {
        message.error('LỖI KẾT NỐI MÁY CHỦ');
      } finally {
        setLoading(false);
      }
    };
  }, [loading, isLockedOut, errorMsg, areaId]);

  if (isLockedOut) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 p-8">
        <h1 className="text-red-500 text-6xl font-black text-center mb-6 uppercase">Truy Cập Bị Từ Chối</h1>
        <p className="text-white text-2xl font-semibold text-center max-w-3xl leading-relaxed">
          {errorMsg}
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ant-message {
          top: auto !important;
          bottom: 50px !important;
        }
        @media print {
          @page { margin: 0; size: 80mm auto; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
          }
          #print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
      
      {/* KHU VỰC HIỂN THỊ TRÊN MÀN HÌNH (Sẽ ẩn khi in) */}
      <div className="h-screen overflow-hidden relative w-full flex flex-col items-center justify-start bg-indigo-50 print:hidden p-4 md:p-8">
        
        {/* LOGO & BANNER */}
        <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 px-4 mb-4 md:mb-8">
          <img 
            src={`/kios/logo.png${imageVersion}`}
            alt="Logo Bệnh viện" 
            className="h-16 md:h-24 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              setLogoFailed(true);
            }}
          />
          <img 
            src={`/kios/banner.png${imageVersion}`}
            alt="Banner Bệnh viện" 
            className="h-16 md:h-24 w-auto object-contain flex-1 max-w-full md:max-w-[60%]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-indigo-900 mb-4 text-center uppercase tracking-tight">
          {areaName}
        </h1>

        <div className="flex-1 w-full flex flex-col items-center justify-center relative">
          {ticketData ? (
            <div className="text-center animate-pulse bg-white p-12 rounded-3xl shadow-2xl border-4 border-indigo-500 max-w-3xl w-full">
              <h2 className="text-3xl text-green-600 font-bold mb-2">Đã quét mã thành công!</h2>
              {ticketData.customerName && (
                <p className="text-2xl text-gray-700 font-semibold mb-6">Xin chào: <span className="text-indigo-800">{ticketData.customerName}</span></p>
              )}
              <div className="text-9xl font-black text-indigo-800 my-4">{ticketData.number}</div>
              <p className="text-xl text-gray-500 mt-4">Vui lòng lấy phiếu bên dưới và chờ đến lượt.</p>
            </div>
          ) : errorMsg === 'HẾT GIỜ TIẾP ĐÓN' ? (
            <div className="w-full max-w-3xl h-48 md:h-72 bg-gray-400 text-white text-5xl md:text-7xl font-black rounded-3xl shadow-inner opacity-80 flex items-center justify-center">
              HẾT GIỜ TIẾP ĐÓN
            </div>
          ) : (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center bg-white p-12 rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] border-2 border-indigo-100">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                  <h2 className="text-4xl font-bold text-indigo-600">ĐANG XỬ LÝ...</h2>
                </div>
              ) : (
                <>
                  <ScanOutlined className="text-[120px] text-indigo-600 mb-8 animate-bounce" />
                  <h2 className="text-4xl md:text-5xl font-black text-gray-800 text-center uppercase leading-tight">
                    VUI LÒNG ĐƯA MÃ QR VÀO<br/>MÁY QUÉT ĐỂ LẤY SỐ
                  </h2>
                  <p className="text-xl text-gray-500 mt-6 text-center">
                    Áp dụng cho phiếu chỉ định, hóa đơn hoặc mã QR trên điện thoại.
                  </p>
                  
                  {/* Nút Test giả lập - Chỉ hiển thị trong môi trường Dev */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 flex flex-col gap-4 items-center bg-pink-50 p-6 rounded-2xl border border-pink-200">
                      <p className="text-pink-700 font-bold text-sm uppercase mb-2">🧪 Khu Vực Test Cho Developer</p>
                      
                      <div className="flex flex-col items-center w-full bg-white p-4 rounded-xl border border-pink-100 shadow-sm">
                        <label className="mb-3 text-sm text-pink-600 font-semibold underline">
                          Tải ảnh chứa mã QR lên để Test:
                        </label>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                if (context) {
                                  context.drawImage(img, 0, 0, img.width, img.height);
                                  const imageData = context.getImageData(0, 0, img.width, img.height);
                                  const code = jsQR(imageData.data, imageData.width, imageData.height);
                                  if (code) {
                                    message.success('Đã đọc được mã QR từ ảnh!');
                                    onScanRef.current?.(code.data);
                                  } else {
                                    message.error('Không tìm thấy mã QR nào trong ảnh.');
                                  }
                                }
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>

                      <span className="text-xs text-pink-400 font-semibold">- HOẶC -</span>

                      <button 
                        onClick={() => {
                          const testData = JSON.stringify({
                            name: "Nguyễn Văn Test",
                            phone: "0999999999",
                            service: "Thử máu",
                            amount: "150.000đ"
                          });
                          onScanRef.current?.(testData);
                        }}
                        className="px-6 py-2 bg-pink-100 text-pink-700 font-bold rounded-full border border-pink-300 hover:bg-pink-200"
                      >
                        Tự động chèn Data mẫu không cần ảnh
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KHU VỰC IN PHIẾU (Chỉ hiện khi in) */}
      {ticketData && (
        <div id="print-area" ref={printRef} className="hidden print:block w-full max-w-[80mm] mx-auto text-center font-sans text-black bg-white px-1 py-2">
          {!logoFailed && (
            <div className="flex justify-center mb-1">
              <img 
                src={`/kios/logo.png${imageVersion}`} 
                alt="Logo" 
                className="h-10 w-auto object-contain grayscale" 
                onError={(e) => { 
                  (e.target as HTMLImageElement).style.display = 'none'; 
                  setLogoFailed(true);
                }}
              />
            </div>
          )}
          {ticketData.printHospitalName && logoFailed && (
            <p className="text-xs font-semibold mb-1">{ticketData.printHospitalName}</p>
          )}
          <h2 className="text-lg font-bold uppercase mb-2">{ticketData.area}</h2>
          <hr className="border-black border-dashed mb-2" />
          
          {ticketData.printGreeting && (
            <p className="text-sm">{ticketData.printGreeting}</p>
          )}
          
          <div className="text-[100px] leading-none font-black my-1">{ticketData.number}</div>
          
          <hr className="border-black border-dashed my-2" />
          {ticketData.customerName && (
            <p className="text-sm font-bold uppercase mb-1">{ticketData.customerName}</p>
          )}
          
          {/* In các thông tin thêm nếu có (từ QR JSON) */}
          {ticketData.extraInfo && (
            <div className="text-xs mb-2 text-left bg-gray-100 p-1">
              {ticketData.extraInfo.service && <p>DV: {ticketData.extraInfo.service}</p>}
              {ticketData.extraInfo.amount && <p>Thu: {ticketData.extraInfo.amount}</p>}
              {ticketData.extraInfo.room && <p>Phòng: {ticketData.extraInfo.room}</p>}
            </div>
          )}
          
          <p className="text-xs mb-1">Thời gian: {ticketData.time}</p>
          <p className="text-xs font-bold">Số người chờ phía trước: {ticketData.waiting}</p>
          
          {ticketData.printFooter && (
            <p className="text-[10px] mt-4 italic">{ticketData.printFooter}</p>
          )}
        </div>
      )}
    </>
  );
}
