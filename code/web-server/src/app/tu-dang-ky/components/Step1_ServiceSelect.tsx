'use client';

import React from 'react';
import { Button } from 'antd';
import { MedicineBoxOutlined, HeartOutlined } from '@ant-design/icons';

interface Props {
  onSelect: (type: 'BHYT' | 'DICH_VU') => void;
}

export default function Step1_ServiceSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full animation-fade-in py-12">
      <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
        Quý khách muốn đăng ký dịch vụ nào?
      </h2>
      <p className="text-xl text-gray-500 mb-16 text-center">
        Vui lòng chạm vào một trong các lựa chọn bên dưới để tiếp tục
      </p>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
        {/* Nút Khám BHYT */}
        <button 
          onClick={() => onSelect('BHYT')}
          className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-3xl p-10 shadow-xl shadow-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center border-4 border-transparent hover:border-blue-300"
        >
          <div className="bg-white/20 p-6 rounded-full mb-6">
            <HeartOutlined className="text-6xl text-white" />
          </div>
          <span className="text-4xl font-bold mb-2">Khám BHYT</span>
          <span className="text-blue-100 text-lg">Dành cho bệnh nhân có thẻ Bảo hiểm y tế</span>
        </button>

        {/* Nút Khám Dịch Vụ */}
        <button 
          onClick={() => onSelect('DICH_VU')}
          className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white rounded-3xl p-10 shadow-xl shadow-emerald-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center border-4 border-transparent hover:border-emerald-300"
        >
          <div className="bg-white/20 p-6 rounded-full mb-6">
            <MedicineBoxOutlined className="text-6xl text-white" />
          </div>
          <span className="text-4xl font-bold mb-2">Khám Dịch vụ</span>
          <span className="text-emerald-100 text-lg">Khám theo yêu cầu, không dùng thẻ BHYT</span>
        </button>
      </div>

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
