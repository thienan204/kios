'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { message, Input, Button } from 'antd';
import { DownloadOutlined, SyncOutlined, AudioOutlined } from '@ant-design/icons';
import { toPng } from 'html-to-image';

export default function MobileKioskPage() {
  const params = useParams();
  const uid = params.uid as string;
  const [areaId, setAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string>('Hệ thống lấy số');
  const [imageVersion, setImageVersion] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const initialPhoneNumberRef = useRef('');
  const validPrefixesRef = useRef<string[]>([]);
  
  const [ticketData, setTicketData] = useState<{
    number: number;
    area: string;
    waiting: number;
    time: string;
    printHospitalName?: string;
    printGreeting?: string;
    printFooter?: string;
    isExisting?: boolean;
  } | null>(null);

  const captureRef = useRef<HTMLDivElement>(null);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setImageVersion(`?v=${Date.now()}`);

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'vi-VN';
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = '';
          let isFinal = false;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              isFinal = true;
            }
          }

          const digits = transcript.replace(/[^0-9]/g, '');
          if (digits || initialPhoneNumberRef.current) {
            let combined = initialPhoneNumberRef.current + digits;
            if (combined.length >= 3) {
              const prefix = combined.substring(0, 3);
              const isValid = validPrefixesRef.current.length === 0 || validPrefixesRef.current.includes(prefix);
              if (!isValid) {
                message.destroy();
                message.warning('Đầu số mạng không hợp lệ (vd: 098, 036...)');
                combined = combined.substring(0, 3);
              }
            }
            setPhoneNumber(combined.slice(0, 10));
          }

          if (isFinal) {
            setIsListening(false);
            if (digits) {
              message.success('Đã nhận diện xong!');
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Lỗi nhận diện giọng nói:', event.error);
          if (event.error === 'not-allowed') {
             message.error('Vui lòng cấp quyền sử dụng Micro.');
          } else {
             message.error('Lỗi nhận diện giọng nói. Vui lòng thử lại.');
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    
    try {
      initialPhoneNumberRef.current = phoneNumber;
      recognitionRef.current?.start();
      setIsListening(true);
      message.info('Đang lắng nghe... Vui lòng đọc tiếp số điện thoại.');
    } catch (e) {
      console.error('Lỗi bắt đầu nhận diện:', e);
    }
  };

  useEffect(() => {
    if (!uid) {
      setErrorMsg('Đường dẫn không hợp lệ');
      return;
    }

    const fetchAreaDetails = async () => {
      try {
        const res = await fetch(`/kios/api/areas/public/${uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) setAreaName(data.name);
          if (data.id) setAreaId(data.id);
          if (data.validPhonePrefixes) {
            validPrefixesRef.current = data.validPhonePrefixes;
          }
        } else {
          setErrorMsg('Khu vực không tồn tại');
        }
      } catch (err) {
        console.error('Không thể lấy thông tin khu vực', err);
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng Wi-Fi.');
      }
    };

    fetchAreaDetails();
  }, [uid]);

  const handleGetTicket = async () => {
    if (!areaId) {
      message.error('Chưa tải được thông tin khu vực');
      return;
    }
    if (phoneNumber.trim().length < 10) {
      message.error('Vui lòng nhập đủ 10 số điện thoại');
      return;
    }
    
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/kios/api/tickets/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaId, phoneNumber: phoneNumber.trim() }),
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
          isExisting: data.isExisting,
        });
        
        if (data.isExisting) {
          message.info('Bạn đã có số thứ tự rồi!');
        } else {
          message.success('Lấy số thành công!');
        }
      } else {
        if (data.outOfHours) {
          setErrorMsg('HẾT GIỜ TIẾP ĐÓN');
        } else {
          setErrorMsg(data.error || 'Lỗi cấp số từ máy chủ');
        }
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng Wifi/3G.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    
    try {
      const dataUrl = await toPng(captureRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `PhieuLaySo_${ticketData?.number}_${areaName.replace(/\s+/g, '')}.png`;
      link.href = dataUrl;
      link.click();
      message.success('Đã tải ảnh vé về máy thành công!');
    } catch (error) {
      console.error('Lỗi tạo ảnh:', error);
      message.error('Lỗi khi tải ảnh phiếu. Vui lòng tự chụp màn hình lại!');
    }
  };

  if (errorMsg && !errorMsg.includes('HẾT GIỜ')) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-red-50 p-6">
        <h1 className="text-red-600 text-3xl font-black text-center mb-4">CÓ LỖI XẢY RA</h1>
        <p className="text-red-500 text-lg font-semibold text-center">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-red-600 text-white font-bold rounded-lg text-lg hover:bg-red-700 w-full">TẢI LẠI TRANG</button>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center p-4">
        <SyncOutlined spin className="text-4xl text-blue-500 mb-4" />
        <p className="text-blue-800 font-semibold text-lg">Đang kết nối máy chủ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center p-4 select-none">
      {/* KHU VỰC LOGO */}
      <div className="w-full max-w-sm mb-6 flex flex-col items-center gap-4 pt-4">
        <img 
          src={`/logo.png${imageVersion}`}
          alt="Logo Bệnh viện" 
          className="h-16 w-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <h1 className="text-2xl font-extrabold text-blue-900 text-center uppercase tracking-tight leading-tight">
          {areaName}
        </h1>
      </div>

      {!ticketData && errorMsg !== 'HẾT GIỜ TIẾP ĐÓN' ? (
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
          <p className="text-gray-600 text-center mb-6 font-medium">
            Để chống quá tải hệ thống, vui lòng nhập Số Điện Thoại của bạn để lấy số thứ tự.
          </p>
          
          <div className="w-full mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Số điện thoại của bạn:</label>
            <Input 
              type="tel"
              size="large"
              maxLength={10}
              placeholder="Ví dụ: 0912345678"
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length >= 3) {
                  const prefix = val.substring(0, 3);
                  const isValid = validPrefixesRef.current.length === 0 || validPrefixesRef.current.includes(prefix);
                  if (!isValid) {
                    message.destroy();
                    message.warning('Đầu số mạng không hợp lệ (vd: 098, 036...)');
                    setPhoneNumber(val.substring(0, 3));
                    return;
                  }
                }
                setPhoneNumber(val);
              }}
              autoComplete="off"
              allowClear
              className="text-xl font-bold h-14 rounded-xl [&>input]:text-center"
              suffix={
                speechSupported && (
                  <Button 
                    type="text"
                    shape="circle" 
                    icon={<AudioOutlined className={isListening ? 'animate-pulse text-red-500 text-xl' : 'text-blue-600 text-xl'} />} 
                    onClick={handleListen}
                    className={`flex items-center justify-center ml-1 ${isListening ? 'bg-red-50' : 'hover:bg-blue-50'}`}
                  />
                )
              }
            />
          </div>

          {(() => {
            const isReady = phoneNumber.length === 10 && !loading;
            return (
              <button 
                disabled={!isReady}
                onClick={handleGetTicket}
                className={`w-full h-16 flex items-center justify-center text-xl font-bold rounded-xl shadow-md border-none transition-all duration-300 active:scale-95 ${
                  isReady ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}
              >
                {loading ? <SyncOutlined spin className="mr-2" /> : null}
                XÁC NHẬN LẤY SỐ
              </button>
            );
          })()}
          <p className="text-xs text-gray-400 text-center mt-4">
            Mỗi số điện thoại chỉ nhận được 1 lượt xếp hàng trong một buổi khám.
          </p>
        </div>
      ) : ticketData ? (
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* CẢNH BÁO BẮT BUỘC LƯU ẢNH */}
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-4 rounded-r shadow-sm text-sm font-medium">
            <span className="font-bold text-red-600">BẮT BUỘC:</span> Vui lòng bấm Tải ảnh phiếu xuống máy để đối chiếu nhân viên y tế khi được gọi. Tránh trường hợp mất mạng không xem lại được số.
          </div>

          {/* VÉ LẤY SỐ (Sẽ bị capture) */}
          <div ref={captureRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header Ticket */}
            <div className="bg-blue-800 p-4 text-center">
              <h2 className="text-white text-lg font-bold uppercase">{ticketData.area}</h2>
              {ticketData.printHospitalName && (
                <p className="text-blue-200 text-sm">{ticketData.printHospitalName}</p>
              )}
            </div>

            {/* Body Ticket */}
            <div className="p-6 text-center bg-white flex flex-col items-center">
              {ticketData.isExisting && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase">
                  Vé Đã Cấp Trước Đó
                </span>
              )}
              {ticketData.printGreeting && (
                <p className="text-gray-500 font-semibold mb-2">{ticketData.printGreeting}</p>
              )}
              <div className="text-8xl font-black text-blue-900 my-4 leading-none">{ticketData.number}</div>
              
              <div className="w-full border-t border-dashed border-gray-300 my-4"></div>
              
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-500 font-medium">Thời gian cấp:</span>
                  <span className="font-bold text-gray-800">{ticketData.time}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <span className="text-blue-800 font-medium">Số người chờ phía trước:</span>
                  <span className="font-black text-xl text-blue-700">{ticketData.waiting} người</span>
                </div>
              </div>

              {ticketData.printFooter && (
                <p className="text-xs text-gray-400 mt-6 italic">{ticketData.printFooter}</p>
              )}
            </div>
          </div>

          {/* CÁC NÚT HÀNH ĐỘNG CỦA MOBILE */}
          <div className="flex flex-col gap-3 mt-2">
            <Button 
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownloadImage}
              className="h-14 font-bold rounded-xl text-lg bg-green-600 hover:bg-green-500 shadow-lg border-none"
            >
              TẢI ẢNH PHIẾU XUỐNG MÁY
            </Button>
            
            <Button 
              size="large"
              icon={<SyncOutlined spin={loading} />}
              onClick={handleGetTicket}
              className="h-12 font-semibold rounded-xl text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100"
            >
              Cập nhật số người chờ
            </Button>

            <Button 
              type="text"
              onClick={() => {
                setTicketData(null);
                setPhoneNumber('');
              }}
              className="mt-2 text-gray-500 hover:text-gray-700 underline font-medium"
            >
              Lấy số khác / Lấy cho người thân
            </Button>
          </div>
        </div>
      ) : errorMsg === 'HẾT GIỜ TIẾP ĐÓN' ? (
        <div className="w-full max-w-sm bg-gray-400 p-8 rounded-3xl shadow-inner text-center">
          <h2 className="text-white text-3xl font-black uppercase">HẾT GIỜ TIẾP ĐÓN</h2>
        </div>
      ) : null}
    </div>
  );
}
