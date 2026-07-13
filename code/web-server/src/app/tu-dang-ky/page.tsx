'use client';

import React, { useState, useEffect } from 'react';
import { Steps } from 'antd';
import { 
  AppstoreAddOutlined, 
  IdcardOutlined, 
  ScanOutlined, 
  PrinterOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';

// Import các màn hình con
import Step1_ServiceSelect from './components/Step1_ServiceSelect';
import Step2_CardReader from './components/Step2_CardReader';
import Step4_AdditionalInfo from './components/Step4_AdditionalInfo';
import Step5_SelectDepartment from './components/Step5_SelectDepartment';
import Step6_PrintTicket from './components/Step6_PrintTicket';
import dynamic from 'next/dynamic';

const Step3_FaceMatching = dynamic(() => import('./components/Step3_FaceMatching'), { ssr: false });

export default function TuDangKyPage() {
  // Trạng thái hiện tại của luồng đăng ký (0 -> 3)
  const [currentStep, setCurrentStep] = useState(0);
  
  // Lưu trữ dữ liệu chung của cả phiên đăng ký
  const [sessionData, setSessionData] = useState({
    serviceType: '', // 'BHYT' | 'DICH_VU'
    patientInfo: null, // Dữ liệu từ thẻ CCCD
    faceMatched: false, // Kết quả AI
    phoneNumber: '',
    occupation: '',
    bhytNumber: '',
    department: '', // Chuyên khoa đã chọn
  });

  // Reset toàn bộ phiên về mặc định
  const resetSession = () => {
    setCurrentStep(0);
    setSessionData({
      serviceType: '',
      patientInfo: null,
      faceMatched: false,
      phoneNumber: '',
      occupation: '',
      bhytNumber: '',
      department: '',
    });
  };

  // Cấu hình các bước hiển thị trên thanh Tiến độ
  const stepsConfig = [
    { title: 'Dịch vụ', icon: <AppstoreAddOutlined /> },
    { title: 'CCCD', icon: <IdcardOutlined /> },
    { title: 'Face AI', icon: <ScanOutlined /> },
    { title: 'Thông tin', icon: <IdcardOutlined /> },
    { title: 'Phòng khám', icon: <MedicineBoxOutlined /> },
    { title: 'In phiếu', icon: <PrinterOutlined /> },
  ];

  // Hàm chuyển bước (Next Step)
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  // Hàm lùi bước (Back Step) - Cần thiết nếu bị lỗi ở bước sau muốn quay lại
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // Render nội dung theo Step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1_ServiceSelect 
            onSelect={(type) => {
              setSessionData(prev => ({ ...prev, serviceType: type }));
              nextStep();
            }} 
          />
        );
      case 1:
        return (
          <Step2_CardReader 
            onSuccess={(data) => {
              setSessionData(prev => ({ ...prev, patientInfo: data }));
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <Step3_FaceMatching 
            patientInfo={sessionData.patientInfo}
            onSuccess={() => {
              setSessionData(prev => ({ ...prev, faceMatched: true }));
              nextStep();
            }}
            onFail={resetSession} // Nếu thất bại, reset hoặc cho phép làm lại
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <Step4_AdditionalInfo
            sessionData={sessionData}
            onSuccess={(data) => {
              setSessionData(prev => ({ ...prev, ...data }));
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <Step5_SelectDepartment
            onSelect={(dept) => {
              setSessionData(prev => ({ ...prev, department: dept }));
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <Step6_PrintTicket 
            sessionData={sessionData}
            onComplete={resetSession} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-12 w-full max-w-6xl mx-auto">
      
      {/* Thanh Tiến Độ 4 Bước */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100 relative z-10">
        <Steps 
          current={currentStep} 
          items={stepsConfig} 
          size="medium"
          className="font-medium text-lg"
        />
      </div>

      {/* Khu vực hiển thị Màn hình tương ứng */}
      <div className="flex-1 w-full flex flex-col relative z-10">
        {renderStepContent()}
      </div>

    </div>
  );
}
