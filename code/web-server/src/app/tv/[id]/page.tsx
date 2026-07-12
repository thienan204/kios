'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Typography, Alert, Button, Modal, Select, Input, message } from 'antd';
import { SoundOutlined, NotificationOutlined, SettingOutlined, GlobalOutlined, DesktopOutlined, CloudServerOutlined } from '@ant-design/icons';

export default function TVPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: areaId } = React.use(params);

  const [currentCall, setCurrentCall] = useState<{ number: number; desk: string } | null>(null);
  const [ticketList, setTicketList] = useState<{ number: number; desk: string; status: string }[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tvMutedConfig, setTvMutedConfig] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [ttsEngine, setTtsEngine] = useState<'browser' | 'google' | 'fpt'>('browser');
  const [fptApiKey, setFptApiKey] = useState<string>('');
  const [fptVoice, setFptVoice] = useState<string>('banmai');
  const [speechRate, setSpeechRate] = useState<number>(0.75);
  const [historyLimit, setHistoryLimit] = useState<number>(5);
  
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioPlayerRef.current = new Audio();
  }, []);

  useEffect(() => {
    // Load config from localStorage
    const savedEngine = localStorage.getItem('tvTtsEngine') as any;
    if (savedEngine) setTtsEngine(savedEngine);
    const savedApiKey = localStorage.getItem('tvFptApiKey');
    if (savedApiKey) setFptApiKey(savedApiKey);
    const savedFptVoice = localStorage.getItem('tvFptVoice');
    if (savedFptVoice) setFptVoice(savedFptVoice);
    const savedRate = localStorage.getItem('tvSpeechRate');
    if (savedRate) setSpeechRate(parseFloat(savedRate));
    const savedLimit = localStorage.getItem('tvHistoryLimit');
    if (savedLimit) setHistoryLimit(parseInt(savedLimit, 10));
    
    const savedMuted = localStorage.getItem('tvMutedConfig');
    if (savedMuted === 'false') {
      setTvMutedConfig(false);
    } else {
      setTvMutedConfig(true);
    }
  }, []);

  const fetchData = async (preserveCurrentCall = false) => {
    try {
      const res = await fetch(`/kios/api/tickets/history?areaId=${areaId}`);
      const data = await res.json();
      if (data.success) {
        if (!preserveCurrentCall) setCurrentCall(data.currentCall);
        if (data.ticketList) setTicketList(data.ticketList);
      }
    } catch (err) {
      console.error('Lỗi fetch danh sách:', err);
    }
  };

  useEffect(() => {
    if (!areaId) {
      setErrorMsg('Vui lòng cung cấp ID khu vực trên đường dẫn (VD: /tv/1)');
      return;
    }

    // Lấy dữ liệu ngay khi load
    fetchData();

    const eventSource = new EventSource(`/kios/api/events?areaId=${areaId}${!tvMutedConfig ? '&type=audio' : ''}`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return;
        
        if (data.type === 'call' || data.type === 'issue') {
          if (data.type === 'call') {
            // Cập nhật ngay lập tức số ĐANG GỌI to ở giữa màn hình
            setCurrentCall({ number: data.ticketNumber, desk: data.deskName });
            fetchData(true); // Cập nhật ngầm danh sách bên trái
            
            if (!tvMutedConfig) {
              queueAudio(data.ticketNumber, data.deskName, data.audioTemplate);
            }
          } else {
            fetchData(false);
          }
        }
      } catch (err) {
        console.error('Lỗi parse SSE:', err);
      }
    };
    eventSource.onerror = () => console.log('Mất kết nối SSE. Đang thử lại...');
    
    return () => {
      eventSource.close();
    };
  }, [areaId, tvMutedConfig]);

  const queueAudio = (ticketNumber: number, deskName: string, template: string) => {
    let textToSpeak = template || 'Mời số {ticket} đến {desk}';
    textToSpeak = textToSpeak.replace(/{ticket}/g, ticketNumber.toString());
    textToSpeak = textToSpeak.replace(/{desk}/g, deskName);
    audioQueueRef.current.push(textToSpeak);
    processQueue();
  };

  const processQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const textToSpeak = audioQueueRef.current.shift()!;
    
    const currentEngine = localStorage.getItem('tvTtsEngine') || 'browser';
    const rate = parseFloat(localStorage.getItem('tvSpeechRate') || '0.75');
    
    if (currentEngine === 'browser') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang === 'vi-VN' || v.lang.includes('vi'));
        
        if (viVoice) {
          utterance.voice = viVoice;
        } else {
          utterance.lang = 'vi-VN';
        }
        utterance.rate = rate;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          isPlayingRef.current = false;
          setTimeout(processQueue, 500);
        };
        utterance.onerror = () => {
          isPlayingRef.current = false;
          processQueue();
        };
        setTimeout(() => window.speechSynthesis.speak(utterance), 300);
      } else {
        isPlayingRef.current = false;
        processQueue();
      }
    } 
    else if (currentEngine === 'google') {
      try {
        const url = `/kios/api/tts/google?text=${encodeURIComponent(textToSpeak)}`;
        const audio = audioPlayerRef.current;
        if (audio) {
          audio.src = url;
          audio.playbackRate = rate;
          audio.onended = () => {
            isPlayingRef.current = false;
            setTimeout(processQueue, 500);
          };
          audio.onerror = () => {
            message.error('Không thể kết nối đến Google TTS.');
            isPlayingRef.current = false;
            processQueue();
          };
          await audio.play();
        } else {
          isPlayingRef.current = false;
          processQueue();
        }
      } catch (err: any) {
        message.error(`Lỗi Google TTS: ${err.message}`);
        isPlayingRef.current = false;
        processQueue();
      }
    } 
    else if (currentEngine === 'fpt') {
      const currentKey = localStorage.getItem('tvFptApiKey');
      const currentVoice = localStorage.getItem('tvFptVoice') || 'banmai';
      if (!currentKey) {
        isPlayingRef.current = false;
        processQueue();
        return;
      }
      try {
        const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
          method: 'POST',
          headers: {
            'api-key': currentKey,
            'voice': currentVoice
          },
          body: textToSpeak
        });
        const data = await res.json();
        if (data.async) {
          const checkFptUrl = async (url: string, retries = 5) => {
            if (retries <= 0) {
              isPlayingRef.current = false;
              processQueue();
              return;
            }
            try {
              const check = await fetch(url);
              if (check.ok) {
                const audio = audioPlayerRef.current;
                if (audio) {
                  audio.src = url;
                  audio.playbackRate = rate;
                  audio.onended = () => {
                    isPlayingRef.current = false;
                    setTimeout(processQueue, 500);
                  };
                  audio.onerror = () => {
                    message.error('Lỗi khi phát âm thanh FPT AI.');
                    isPlayingRef.current = false;
                    processQueue();
                  };
                  await audio.play();
                } else {
                  isPlayingRef.current = false;
                  processQueue();
                }
              } else {
                setTimeout(() => checkFptUrl(url, retries - 1), 1000);
              }
            } catch (err: any) {
              setTimeout(() => checkFptUrl(url, retries - 1), 1000);
            }
          };
          checkFptUrl(data.async);
        } else {
          message.error('Lỗi cấu hình FPT AI. API Key có thể không hợp lệ.');
          isPlayingRef.current = false;
          processQueue();
        }
      } catch (e: any) {
        message.error(`Lỗi kết nối FPT AI: ${e.message}`);
        isPlayingRef.current = false;
        processQueue();
      }
    }
  };

  const handleEnableAudio = () => {
    if (window.speechSynthesis) {
      const initUtterance = new SpeechSynthesisUtterance('');
      initUtterance.volume = 0;
      window.speechSynthesis.speak(initUtterance);
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = 0;
      audioPlayerRef.current.play().then(() => {
        audioPlayerRef.current!.volume = 1;
      }).catch(e => console.log('Chưa thể unlock audio', e));
    }
    setAudioEnabled(true);
  };

  if (errorMsg) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white text-xl">{errorMsg}</div>;
  }

  return (
    <div className="h-screen w-full flex bg-gray-900 overflow-hidden text-white font-sans relative">
      
      {/* Phía bên trái: Danh sách hàng đợi và lịch sử */}
      <div className="w-1/3 bg-gray-800 p-8 flex flex-col relative border-r border-gray-700">
        <h3 className="text-3xl font-bold text-gray-400 mb-8 uppercase tracking-widest border-b border-gray-600 pb-4">
          Danh sách Số thứ tự
        </h3>
        
        <div className="flex-1 flex flex-col gap-4">
          {/* Header 4 cột */}
          <div className="grid grid-cols-[10%_35%_30%_25%] text-gray-400 font-bold text-lg px-4 pb-2 border-b border-gray-600 uppercase tracking-wider">
            <div className="text-center">STT</div>
            <div className="text-center">Chờ đăng ký</div>
            <div className="text-center">Bàn</div>
            <div className="text-center">Trạng thái</div>
          </div>

          {/* Danh sách */}
          {ticketList.length > 0 ? ticketList.slice(0, historyLimit).map((item, index) => (
            <div key={index} className={`grid grid-cols-[10%_35%_30%_25%] items-center py-4 px-2 rounded-xl border opacity-80 shadow-sm transition-colors duration-300 ${
              item.status === 'CALLING' 
                ? 'border-red-500 bg-gray-600 animate-pulse shadow-red-500/20' 
                : 'border-gray-600 bg-gray-700'
            }`}>
              <div className="text-2xl font-bold text-gray-400 text-center">{index + 1}</div>
              <div className="text-5xl font-black text-white text-center drop-shadow-md">{item.number}</div>
              <div className="text-2xl font-bold text-gray-300 text-center">{item.desk}</div>
              <div className={`text-lg font-bold text-center ${
                item.status === 'WAITING' ? 'text-yellow-500' : 
                item.status === 'CALLING' ? 'text-red-400' : 'text-green-400'
              }`}>
                {item.status === 'WAITING' ? 'Đang chờ' : 
                 item.status === 'CALLING' ? 'Đang gọi' : 'Đã gọi'}
              </div>
            </div>
          )) : (
            <div className="text-gray-500 text-xl italic text-center mt-10">Trống</div>
          )}
        </div>
      </div>

      {/* Phía bên phải: Hiển thị số ĐANG GỌI */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {!audioEnabled && !tvMutedConfig && (
          <div className="absolute top-10 w-full flex justify-center z-50">
            <Alert 
              title="Trạng thái Âm thanh" 
              description="Bạn đã cấu hình Bật loa cho Tivi này. Vui lòng bấm kích hoạt để trình duyệt cho phép tự động phát âm thanh."
              type="info" 
              showIcon 
              action={
                <Button onClick={handleEnableAudio} type="primary" danger icon={<SoundOutlined />}>
                  Kích hoạt Loa
                </Button>
              }
            />
          </div>
        )}

        {currentCall ? (
          <div className="text-center animate-pulse">
            <h2 className="text-5xl text-gray-400 font-semibold mb-6 tracking-wider uppercase">Đang gọi</h2>
            <div className="text-[15rem] font-black text-green-400 leading-none drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
              {currentCall.number}
            </div>
            <div className="text-7xl font-bold text-yellow-400 mt-6 bg-gray-800 px-10 py-4 rounded-3xl inline-block border-4 border-yellow-500">
              {currentCall.desk}
            </div>
          </div>
        ) : (
          <div className="text-center opacity-30">
            <NotificationOutlined className="text-9xl mb-8" />
            <h2 className="text-4xl font-bold">Chưa có lượt gọi nào</h2>
          </div>
        )}
      </div>
      
      {/* Modal Cài đặt */}
      <Modal
        title={<span className="text-gray-800"><SettingOutlined /> Cài đặt Âm thanh Tivi</span>}
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsSettingsOpen(false)}>
            Đóng
          </Button>
        ]}
      >
        <div className="py-4">
          <p className="text-sm text-gray-500 font-semibold mb-2">Chế độ Âm thanh Tivi</p>
          <Select 
            className="w-full mb-6"
            value={tvMutedConfig ? 'muted' : 'unmuted'}
            onChange={(val) => {
              const isMuted = val === 'muted';
              setTvMutedConfig(isMuted);
              localStorage.setItem('tvMutedConfig', isMuted ? 'true' : 'false');
            }}
            options={[
              { label: 'Tắt âm thanh (Chỉ hiển thị hình ảnh)', value: 'muted' },
              { label: 'Bật âm thanh (Đọc số khi gọi)', value: 'unmuted' },
            ]}
          />

          <p className="text-sm text-gray-500 font-semibold mb-2">Nguồn Âm Thanh (Audio Engine)</p>
          <Select 
            className="w-full mb-4"
            value={ttsEngine}
            onChange={(val) => {
              setTtsEngine(val);
              localStorage.setItem('tvTtsEngine', val);
            }}
            options={[
              { label: <span><DesktopOutlined className="mr-2"/> Trình duyệt (Mặc định)</span>, value: 'browser' },
              { label: <span><GlobalOutlined className="mr-2"/> Google (Miễn phí)</span>, value: 'google' },
              { label: <span><CloudServerOutlined className="mr-2"/> FPT AI (Cần API Key)</span>, value: 'fpt' },
            ]}
          />
          
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 mb-4 min-h-[100px]">
            {ttsEngine === 'browser' && <p>Sử dụng giọng mặc định của Tivi/Máy tính.</p>}
            {ttsEngine === 'google' && <p className="text-green-600 font-semibold">Đang sử dụng Google Translate TTS miễn phí.</p>}
            {ttsEngine === 'fpt' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">FPT API Key:</label>
                  <Input.Password 
                    placeholder="Nhập API Key..." 
                    value={fptApiKey}
                    onChange={(e) => {
                      setFptApiKey(e.target.value);
                      localStorage.setItem('tvFptApiKey', e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Chọn Giọng FPT:</label>
                  <Select 
                    className="w-full"
                    value={fptVoice}
                    onChange={(val) => {
                      setFptVoice(val);
                      localStorage.setItem('tvFptVoice', val);
                    }}
                    options={[
                      { label: 'Ban Mai (Nữ miền Bắc)', value: 'banmai' },
                      { label: 'Thu Minh (Nữ miền Bắc)', value: 'thuminh' },
                      { label: 'Lê Minh (Nam miền Bắc)', value: 'leminh' },
                      { label: 'Gia Huy (Nam miền Trung)', value: 'giahuy' },
                      { label: 'Lan Nhi (Nữ miền Nam)', value: 'lannhi' },
                      { label: 'Minh Hoàng (Nam miền Nam)', value: 'minhhoang' },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 font-semibold mb-2">Tốc độ phát audio ({speechRate.toFixed(2)}x)</p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 font-medium w-12">Chậm</span>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.05" 
              value={speechRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSpeechRate(val);
                localStorage.setItem('tvSpeechRate', val.toString());
              }}
              className="w-full mx-4 cursor-pointer"
            />
            <span className="text-xs text-gray-400 font-medium w-12 text-right">Nhanh</span>
          </div>

          <p className="text-sm text-gray-500 font-semibold mb-2 mt-4">Số lượng lịch sử hiển thị</p>
          <Input 
            type="number" 
            min={1} 
            max={20} 
            value={historyLimit} 
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) {
                setHistoryLimit(val);
                localStorage.setItem('tvHistoryLimit', val.toString());
              }
            }}
            className="w-full mb-4"
          />
        </div>
      </Modal>

      {/* Nút cài đặt chung cho toàn trang Tivi */}
      <div className="absolute bottom-6 right-6 z-50 opacity-30 hover:opacity-100 transition-opacity duration-300">
        <Button 
          type="text" 
          icon={<SettingOutlined className="text-4xl text-gray-400 hover:text-white" />} 
          onClick={() => setIsSettingsOpen(true)}
        />
      </div>

    </div>
  );
}
