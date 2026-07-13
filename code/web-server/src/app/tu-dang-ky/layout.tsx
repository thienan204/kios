'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

export default function TuDangKyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          fontFamily: 'var(--font-geist-sans), sans-serif',
          colorPrimary: '#1677ff',
        },
      }}
    >
      {/* 
        Container Fullscreen:
        - Ẩn thanh cuộn
        - Giao diện trải dài toàn bộ màn hình 
      */}
      <div className="min-h-screen w-full bg-[#f0f4f8] overflow-hidden flex flex-col relative">
        
        {/* Background trang trí chìm */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none opacity-20">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200 rounded-full blur-[100px]"></div>
        </div>

        {/* Header với Logo */}
        <header className="w-full bg-white shadow-sm z-10 py-4 px-8 flex flex-col items-center justify-center border-b-[3px] border-blue-600">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo BV" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="text-center">
               <h1 className="text-2xl md:text-3xl font-bold text-blue-800 m-0 tracking-wide uppercase">
                 BỆNH VIỆN ĐA KHOA TỈNH LẠNG SƠN
               </h1>
               <p className="text-gray-500 m-0 font-medium text-sm md:text-base">HỆ THỐNG KIOSK TỰ ĐĂNG KÝ KHÁM BỆNH</p>
            </div>
          </div>
        </header>

        {/* Nội dung chính (Thay đổi theo từng bước) */}
        <main className="flex-1 w-full z-10 overflow-hidden flex flex-col relative">
          {children}
        </main>
      </div>
    </ConfigProvider>
  );
}
