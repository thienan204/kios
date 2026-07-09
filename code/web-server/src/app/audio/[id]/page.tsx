'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Select, Input, message } from 'antd';
import { SoundOutlined, SettingOutlined, GlobalOutlined, DesktopOutlined, CloudServerOutlined } from '@ant-design/icons';

export default function AudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: areaId } = React.use(params);
  const [history, setHistory] = useState<{ number: number; desk: string }[]>([]);

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lastCalled, setLastCalled] = useState<string>('Chưa có lượt gọi');
  
  const [ttsEngine, setTtsEngine] = useState<'browser' | 'google' | 'fpt'>('browser');
  const [fptApiKey, setFptApiKey] = useState<string>('');
  const [fptVoice, setFptVoice] = useState<string>('banmai');
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(0.75);
  
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioPlayerRef.current = new Audio();
  }, []);

  useEffect(() => {
    // Load config from localStorage
    const savedEngine = localStorage.getItem('ttsEngine') as any;
    if (savedEngine) setTtsEngine(savedEngine);
    const savedApiKey = localStorage.getItem('fptApiKey');
    if (savedApiKey) setFptApiKey(savedApiKey);
    const savedFptVoice = localStorage.getItem('fptVoice');
    if (savedFptVoice) setFptVoice(savedFptVoice);
    const savedRate = localStorage.getItem('speechRate');
    if (savedRate) setSpeechRate(parseFloat(savedRate));
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const vnVoices = availableVoices.filter(v => v.lang.includes('vi'));
        const displayVoices = vnVoices.length > 0 ? vnVoices : availableVoices;
        setVoices(displayVoices);
        
        const savedURI = localStorage.getItem('selectedVoiceURI');
        if (savedURI && displayVoices.some(v => v.voiceURI === savedURI)) {
          setSelectedVoiceURI(savedURI);
        } else if (displayVoices.length > 0) {
          setSelectedVoiceURI(displayVoices[0].voiceURI);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  useEffect(() => {
    if (!areaId) {
      setErrorMsg('Vui lòng cung cấp ID khu vực trên đường dẫn (VD: /audio/1)');
      return;
    }

    const claimDevice = async () => {
      let deviceId = localStorage.getItem('audioDeviceId');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('audioDeviceId', deviceId);
      }

      try {
        const res = await fetch(`/api/areas/${areaId}/device-lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceType: 'audio', deviceId })
        });
        const data = await res.json();
        if (!data.success) {
          setIsLockedOut(true);
          setErrorMsg(data.message);
        }
      } catch (err) {
        setErrorMsg('Lỗi kiểm tra bản quyền thiết bị Audio.');
      }
    };

    claimDevice();
  }, [areaId]);

  useEffect(() => {
    if (!areaId || isLockedOut || !audioEnabled) return;

    const eventSource = new EventSource(`/api/events?areaId=${areaId}&type=audio`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return;
        if (data.type === 'call') {
          setLastCalled(`Đang phát: Số ${data.ticketNumber} - ${data.deskName}`);
          // Vô hiệu hóa eslint tạm thời cho next line vì queueAudio dependencies chưa wrap callback
          queueAudio(data.ticketNumber, data.deskName, data.audioTemplate);
          setHistory((prev) => [{ number: data.ticketNumber, desk: data.deskName }, ...prev].slice(0, 10));
        }
      } catch (err) {
        console.error('Lỗi parse SSE:', err);
      }
    };
    eventSource.onerror = () => {
      console.log('Mất kết nối SSE. Đang thử lại...');
    };

    return () => {
      eventSource.close();
    };
  }, [areaId, isLockedOut, audioEnabled]);

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
    
    // Sử dụng current state cho an toàn
    const currentEngine = localStorage.getItem('ttsEngine') || 'browser';
    
    if (currentEngine === 'browser') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const allVoices = window.speechSynthesis.getVoices();
        const selectedVoiceURI = localStorage.getItem('selectedVoiceURI');
        let selectedVoice = allVoices.find(v => v.voiceURI === selectedVoiceURI);
        
        if (!selectedVoice) {
          selectedVoice = allVoices.find(v => v.lang === 'vi-VN' || v.lang.includes('vi'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          utterance.lang = 'vi-VN';
        }
        utterance.rate = parseFloat(localStorage.getItem('speechRate') || '0.75');
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          isPlayingRef.current = false;
          setTimeout(processQueue, 500);
        };
        utterance.onerror = () => {
          isPlayingRef.current = false;
          processQueue();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        isPlayingRef.current = false;
        processQueue();
      }
    } 
    else if (currentEngine === 'google') {
      try {
        const url = `/api/tts/google?text=${encodeURIComponent(textToSpeak)}`;
        const audio = audioPlayerRef.current;
        if (audio) {
          audio.src = url;
          audio.playbackRate = parseFloat(localStorage.getItem('speechRate') || '0.75');
          audio.onended = () => {
            isPlayingRef.current = false;
            setTimeout(processQueue, 500);
          };
          audio.onerror = () => {
            message.error('Không thể kết nối đến Google TTS. Vui lòng kiểm tra mạng.');
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
      const currentKey = localStorage.getItem('fptApiKey');
      const currentVoice = localStorage.getItem('fptVoice') || 'banmai';
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
                  audio.playbackRate = parseFloat(localStorage.getItem('speechRate') || '0.75');
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

  const handleTestAudio = () => {
    audioQueueRef.current.push('Đây là âm thanh thử nghiệm từ hệ thống.');
    processQueue();
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
          <p>Hãy yêu cầu Quản trị viên vào trang <b>Quản lý Khu vực (Dashboard)</b> và bấm nút <b>"Mở khóa thiết bị Âm thanh"</b> cho khu vực này để được cấp quyền lại.</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return <div className="p-10 text-red-500 text-xl font-bold">{errorMsg}</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-blue-50 text-gray-800 font-sans p-8 overflow-y-auto">
      <h1 className="text-4xl font-black text-blue-900 mb-2 text-center uppercase mt-10">Trạm Phát Âm Thanh</h1>
      <p className="text-gray-500 mb-8">Dành riêng cho máy tính kết nối với Âm ly / Loa</p>

      {!audioEnabled ? (
        <div className="flex flex-col items-center bg-white p-10 rounded-2xl shadow-xl max-w-xl text-center">
          <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <SoundOutlined className="text-5xl" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Trình duyệt đang chặn âm thanh</h2>
          <p className="text-gray-600 mb-8">
            Bạn cần cấp quyền phát âm thanh tự động cho trang web này. Hãy nhấn nút bên dưới để bắt đầu nhận tín hiệu âm thanh từ các Bàn tiếp đón.
          </p>
          <Button 
            onClick={handleEnableAudio} 
            type="primary" 
            size="large" 
            className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            KÍCH HOẠT ÂM THANH & BẮT ĐẦU
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center bg-green-50 p-8 rounded-2xl shadow-lg border-2 border-green-200 max-w-xl text-center w-full mb-10">
          <div className="w-20 h-20 bg-green-200 text-green-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <SoundOutlined className="text-4xl" />
          </div>
          <h2 className="text-2xl font-black text-green-800 mb-2">Đang Lắng Nghe...</h2>
          <p className="text-green-600 font-medium mb-6">Trạm phát thanh đang hoạt động tốt.</p>
          
          <div className="w-full bg-white p-4 rounded-xl border border-green-100 mb-6">
            <p className="text-sm text-gray-400 font-semibold mb-1 uppercase tracking-wider">Trạng thái gần nhất</p>
            <p className="text-lg font-bold text-gray-700">{lastCalled}</p>
          </div>

          <div className="w-full bg-white p-4 rounded-xl border border-gray-200 text-left">
            <p className="text-sm text-gray-500 font-semibold mb-3 flex items-center">
              <SettingOutlined className="mr-2" /> Nguồn Âm Thanh (Audio Engine)
            </p>
            <Select 
              className="w-full mb-4"
              value={ttsEngine}
              onChange={(val) => {
                setTtsEngine(val);
                localStorage.setItem('ttsEngine', val);
              }}
              options={[
                { label: <span><DesktopOutlined className="mr-2"/> Trình duyệt (Mặc định)</span>, value: 'browser' },
                { label: <span><GlobalOutlined className="mr-2"/> Google (Miễn phí)</span>, value: 'google' },
                { label: <span><CloudServerOutlined className="mr-2"/> FPT AI (Cần API Key)</span>, value: 'fpt' },
              ]}
            />
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 mb-4 min-h-[120px]">
              {ttsEngine === 'browser' && (
                <>
                  <p className="font-semibold mb-2">Giọng đọc của Windows/Trình duyệt:</p>
                  <Select 
                    className="w-full"
                    value={selectedVoiceURI}
                    onChange={(val) => {
                      setSelectedVoiceURI(val);
                      localStorage.setItem('selectedVoiceURI', val);
                    }}
                    options={voices.map(v => ({ 
                      label: `${v.name} ${v.lang.includes('vi') ? '(Tiếng Việt)' : ''}`, 
                      value: v.voiceURI 
                    }))}
                  />
                  <p className="text-xs text-gray-400 mt-2">Dùng giọng có sẵn trên máy. Cần cài ngôn ngữ Tiếng Việt trong Windows Settings.</p>
                </>
              )}
              
              {ttsEngine === 'google' && (
                <div className="pt-2">
                  <p className="text-green-600 font-semibold mb-1 flex items-center">
                    <GlobalOutlined className="mr-2" /> Đã kết nối Google Translate TTS
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Giọng đọc nữ mượt mà, tự nhiên và hoàn toàn miễn phí. Yêu cầu máy tính có kết nối mạng Internet.</p>
                </div>
              )}
              
              {ttsEngine === 'fpt' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">FPT API Key:</label>
                    <Input.Password 
                      placeholder="Nhập API Key của FPT AI..." 
                      value={fptApiKey}
                      onChange={(e) => {
                        setFptApiKey(e.target.value);
                        localStorage.setItem('fptApiKey', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Chọn Giọng đọc FPT:</label>
                    <Select 
                      className="w-full"
                      value={fptVoice}
                      onChange={(val) => {
                        setFptVoice(val);
                        localStorage.setItem('fptVoice', val);
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
                  <p className="text-xs text-gray-500">Tạo tài khoản miễn phí tại fpt.ai để lấy API Key.</p>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 font-semibold mb-2 flex items-center">
              <SettingOutlined className="mr-2" /> Tốc độ đọc
            </p>
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
                  localStorage.setItem('speechRate', val.toString());
                }}
                className="w-full mx-4 cursor-pointer"
              />
              <span className="text-xs text-gray-400 font-medium w-12 text-right">Nhanh</span>
            </div>
            
            <Button onClick={handleTestAudio} className="w-full mt-2" type="dashed">Phát thử âm thanh hiện tại</Button>
          </div>
        </div>
      )}
    </div>
  );
}
