'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Progress, message } from 'antd';
import { CameraOutlined, CheckCircleFilled, CloseCircleFilled, ScanOutlined } from '@ant-design/icons';
import * as faceapi from '@vladmandic/face-api';

interface Props {
  patientInfo: any; // Contains patientInfo.photoBase64
  onSuccess: () => void;
  onFail: () => void;
  onBack: () => void;
}

export default function Step3_FaceMatching({ patientInfo, onSuccess, onFail, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'scanning' | 'success' | 'fail'>('idle');
  const [progress, setProgress] = useState(0);

  // 1. Tải Model AI khi vào màn hình
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/kios/models';
        // Chỉ tải 3 model cần thiết cho việc nhận diện 1:1
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Lỗi khi tải Model AI:', error);
        message.error('Không thể tải dữ liệu AI!');
      }
    };
    loadModels();
  }, []);

  // 2. Khởi động Camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080 }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Lỗi bật camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // 3. Hàm Chạy Trí Tuệ Nhân Tạo (Thật)
  const handleStartRealScan = async () => {
    if (!isModelLoaded || !videoRef.current || !imgRef.current) {
      message.warning('Hệ thống AI chưa sẵn sàng hoặc thiếu dữ liệu ảnh.');
      return;
    }

    setMatchStatus('scanning');
    setProgress(20); // Bắt đầu phân tích

    try {
      // BƯỚC A: Trích xuất khuôn mặt từ ảnh CCCD (Chỉ làm 1 lần)
      setProgress(40);
      let cccdDetection;
      
      // FIX: Nếu là data giả lập từ nút [DEV Test] ở Bước 2, bỏ qua check ảnh CCCD
      if (patientInfo?.cccdNumber === '030090123456') {
        // Lấy tạm khuôn mặt từ video làm khuôn mặt CCCD để test luôn
        cccdDetection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      } else {
        cccdDetection = await faceapi.detectSingleFace(imgRef.current).withFaceLandmarks().withFaceDescriptor();
      }
      
      if (!cccdDetection) {
        alert('AI không tìm thấy khuôn mặt nào trong ảnh thẻ CCCD!');
        setMatchStatus('fail');
        return;
      }
      setProgress(60);

      // BƯỚC B: Trích xuất khuôn mặt từ luồng Video Trực tiếp
      const liveDetection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      
      if (!liveDetection) {
        alert('AI không tìm thấy khuôn mặt của bạn trên Camera. Vui lòng nhìn thẳng!');
        setMatchStatus('idle'); // Trở lại trạng thái chờ để quét lại
        return;
      }
      setProgress(80);

      // BƯỚC C: So sánh 2 khuôn mặt
      const distance = faceapi.euclideanDistance(cccdDetection.descriptor, liveDetection.descriptor);
      console.log('Độ lệch khuôn mặt (Distance):', distance);

      setProgress(100);
      
      // Distance càng nhỏ càng giống nhau. Tiêu chuẩn khắt khe thường là < 0.5
      // Mức 0.55 là mức an toàn cho môi trường ánh sáng phức tạp
      if (distance < 0.55) {
        setMatchStatus('success');
        setTimeout(() => onSuccess(), 1500);
      } else {
        setMatchStatus('fail');
      }

    } catch (error) {
      console.error('Lỗi xử lý AI:', error);
      setMatchStatus('fail');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animation-fade-in py-8 w-full max-w-5xl mx-auto">
      
      {matchStatus === 'fail' ? (
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl w-full max-w-2xl border-t-8 border-red-500">
          <CloseCircleFilled className="text-8xl text-red-500 mb-6" />
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Xác thực thất bại</h2>
          <p className="text-2xl text-red-600 mb-8 font-medium">
            Khuôn mặt không khớp với thẻ CCCD.
          </p>
          <div className="bg-gray-100 p-6 rounded-xl mb-8">
            <h3 className="text-2xl font-bold text-gray-800">Thông báo</h3>
            <p className="text-xl text-gray-600 mt-2">Quý khách vui lòng ra quầy tiếp đón để được hỗ trợ.</p>
          </div>
          <Button type="primary" size="large" className="w-full h-16 text-xl rounded-xl" onClick={onFail}>
            Đăng ký mới
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-2 text-center">
            Xác thực Khuôn mặt
          </h2>
          <p className="text-xl text-gray-500 mb-8 text-center">
            Vui lòng tháo khẩu trang, kính râm và nhìn thẳng vào Camera
          </p>

          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Cột trái: Ảnh CCCD */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center border border-gray-200">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Ảnh Thẻ CCCD</h3>
              <div className="w-48 h-64 bg-gray-200 rounded-xl overflow-hidden mb-4 border-4 border-gray-300">
                {patientInfo?.photoBase64 ? (
                  <img 
                    ref={imgRef}
                    src={patientInfo.photoBase64} 
                    alt="CCCD" 
                    className="w-full h-full object-cover" 
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Không có ảnh</div>
                )}
              </div>
              <div className="text-center w-full bg-blue-50 py-3 rounded-lg">
                <p className="font-bold text-lg text-blue-800 m-0">{patientInfo?.fullName || 'CHƯA RÕ TÊN'}</p>
              </div>
            </div>

            {/* Cột phải: Camera */}
            <div className="flex-[2] bg-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center border border-gray-200 relative overflow-hidden">
              <div className="w-full flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700 flex items-center m-0"><CameraOutlined className="mr-2"/> Camera Trực Tiếp</h3>
                {!isModelLoaded && <span className="text-orange-500 font-medium animate-pulse">Đang nạp dữ liệu AI...</span>}
              </div>
              
              <div className="w-full aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden relative shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className={`w-full h-full object-cover ${matchStatus === 'scanning' ? 'opacity-80 blur-sm' : ''}`}
                />
                
                {/* Khung hướng dẫn quét mặt */}
                <div className="absolute inset-0 border-4 border-blue-400 border-dashed rounded-[30%] m-12 opacity-50 pointer-events-none"></div>

                {/* Overlay Scanning */}
                {matchStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-blue-900/40 flex flex-col items-center justify-center backdrop-blur-md">
                    <Progress type="circle" percent={progress} strokeColor="#4af626" />
                    <span className="text-white font-bold text-2xl mt-6 animate-pulse">AI Đang phân tích...</span>
                  </div>
                )}

                {/* Overlay Success */}
                {matchStatus === 'success' && (
                  <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center backdrop-blur-md">
                    <CheckCircleFilled className="text-white text-8xl mb-4" />
                    <span className="text-white font-bold text-4xl">Xác thực thành công!</span>
                  </div>
                )}
              </div>
              
              {/* Nút Bắt đầu quét thật */}
              {matchStatus === 'idle' && (
                <>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<ScanOutlined />}
                    className="mt-6 w-full h-14 text-xl rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500"
                    onClick={handleStartRealScan}
                    disabled={!isModelLoaded || !stream}
                  >
                    Bắt đầu Quét khuôn mặt
                  </Button>
                  
                  {/* Nút Giả lập cho DEV */}
                  <Button 
                    type="dashed" 
                    size="large" 
                    className="mt-4 w-full h-12 text-lg rounded-xl border-yellow-400 text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                    onClick={() => {
                      setMatchStatus('success');
                      setTimeout(() => onSuccess(), 1500);
                    }}
                  >
                    [DEV Test] Bỏ qua quét & Xác thực thành công
                  </Button>
                </>
              )}
            </div>
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
