'use client';

import React from 'react';
import { Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
// Import các Icon tùy chỉnh (dùng text hoặc Icon của Ant Design)
import {
  MedicineBoxOutlined,
  EyeOutlined,
  SkinOutlined,
  SmileOutlined
} from '@ant-design/icons';

interface Props {
  onSelect: (department: string) => void;
  onBack: () => void;
}

export default function Step5_SelectDepartment({ onSelect, onBack }: Props) {
  const departments = [
    { name: 'Khám Nội chung', icon: <MedicineBoxOutlined />, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600' },
    { name: 'Khám Ngoại', icon: <MedicineBoxOutlined />, color: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-600 hover:text-white hover:border-teal-600' },
    { name: 'Khám Sản - Phụ Khoa', icon: <MedicineBoxOutlined />, color: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-600 hover:text-white hover:border-pink-600' },
    { name: 'Khám Nhi', icon: <SmileOutlined />, color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white hover:border-orange-600' },
    { name: 'Khám Mắt', icon: <EyeOutlined />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' },
    { name: 'Khám Tai Mũi Họng', icon: <MedicineBoxOutlined />, color: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-600 hover:text-white hover:border-cyan-600' },
    { name: 'Khám Răng Hàm Mặt', icon: <SmileOutlined />, color: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600' },
    { name: 'Khám Da Liễu', icon: <SkinOutlined />, color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full animation-fade-in py-8 relative">
      <Button 
        type="text" 
        icon={<LeftOutlined />} 
        className="absolute top-0 left-0 text-gray-500 hover:text-blue-600 text-lg"
        onClick={onBack}
      >
        Quay lại xác thực khuôn mặt
      </Button>

      <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 text-center mt-8">
        Chọn Phòng Khám
      </h2>
      <p className="text-xl text-gray-500 mb-10 text-center max-w-2xl">
        Quý khách vui lòng chọn <span className="font-bold text-blue-600">Chuyên khoa</span> mà mình muốn đăng ký khám bệnh.
      </p>

      {/* Lưới các phòng khám */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4">
        {departments.map((dept, index) => (
          <button
            key={index}
            onClick={() => onSelect(dept.name)}
            className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-2 cursor-pointer group ${dept.color}`}
          >
            <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">
              {dept.icon}
            </div>
            <span className="text-xl font-bold text-center leading-tight">
              {dept.name}
            </span>
          </button>
        ))}
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
