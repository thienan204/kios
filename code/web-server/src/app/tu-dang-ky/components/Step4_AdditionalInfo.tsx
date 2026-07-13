'use client';

import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, Radio, Spin } from 'antd';
import { LeftOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

interface Props {
  sessionData: any;
  onSuccess: (data: { phoneNumber: string; occupation: string; bhytNumber: string }) => void;
  onBack: () => void;
}

export default function Step4_AdditionalInfo({ sessionData, onSuccess, onBack }: Props) {
  const [form] = Form.useForm();
  const [layout, setLayout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tự động mock nếu trước đó là DEV Test
  const isMockData = sessionData.patientInfo?.cccdNumber === '030090123456';

  useEffect(() => {
    fetch('/kios/api/admin/tu-dang-ky/his-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.formLayout && data.formLayout !== '[]') {
          setLayout(JSON.parse(data.formLayout));
        } else {
          // Default layout
          setLayout([
            { i: 'phoneNumber', x: 0, y: 0, w: 12, h: 2 },
            { i: 'occupation', x: 0, y: 2, w: 12, h: 4 },
            { i: 'bhytNumber', x: 0, y: 6, w: 12, h: 2 },
          ]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const handleFinish = (values: any) => {
    onSuccess({
      phoneNumber: values.phoneNumber || '',
      occupation: values.occupation || '',
      bhytNumber: values.bhytNumber || ''
    });
  };

  const renderField = (item: any) => {
    const fieldId = item.i;
    const label = item.label;

    switch (fieldId) {
      case 'phoneNumber':
        return (
          <Form.Item
            name="phoneNumber"
            label={<span className="text-xl font-bold text-gray-700">{label || 'Số điện thoại liên hệ'}</span>}
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
            className="mb-0 w-full"
          >
            <Input placeholder="Nhập số điện thoại..." className="text-2xl py-4 px-6 rounded-2xl" type="tel" />
          </Form.Item>
        );
      case 'occupation':
        return (
          <Form.Item
            name="occupation"
            label={<span className="text-xl font-bold text-gray-700">{label || 'Nghề nghiệp'}</span>}
            rules={[{ required: true, message: 'Vui lòng chọn nghề nghiệp!' }]}
            className="mb-0 w-full"
          >
            <Radio.Group className="w-full grid grid-cols-2 lg:grid-cols-3 gap-3" optionType="button" buttonStyle="solid">
              <Radio.Button value="Nông dân" className="text-center h-14 flex items-center justify-center text-lg rounded-xl">Nông dân</Radio.Button>
              <Radio.Button value="Công nhân" className="text-center h-14 flex items-center justify-center text-lg rounded-xl">Công nhân</Radio.Button>
              <Radio.Button value="Cán bộ/Viên chức" className="text-center h-14 flex items-center justify-center text-lg rounded-xl">Cán bộ/VC</Radio.Button>
              <Radio.Button value="Hưu trí" className="text-center h-14 flex items-center justify-center text-lg rounded-xl">Hưu trí</Radio.Button>
              <Radio.Button value="Học sinh/Sinh viên" className="text-center h-14 flex items-center justify-center text-lg rounded-xl">Học sinh/SV</Radio.Button>
              <Radio.Button value="Tự do/Khác" className="text-center h-14 flex items-center justify-center text-lg rounded-xl">Tự do/Khác</Radio.Button>
            </Radio.Group>
          </Form.Item>
        );
      case 'bhytNumber':
        if (sessionData.serviceType !== 'BHYT') return null;
        return (
          <Form.Item
            name="bhytNumber"
            label={<span className="text-xl font-bold text-blue-700">{label || 'Mã thẻ BHYT (Vì bạn chọn Khám BHYT)'}</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mã số BHYT!' }]}
            className="mb-0 w-full"
          >
            <Input placeholder="VD: DN401..." className="text-2xl py-4 px-6 rounded-2xl border-blue-300 bg-blue-50" autoCapitalize="characters" />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animation-fade-in py-8 relative w-full">
      <Button 
        type="text" 
        icon={<LeftOutlined />} 
        className="absolute top-0 left-0 text-gray-500 hover:text-blue-600 text-lg"
        onClick={onBack}
      >
        Quay lại
      </Button>

      <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 text-center mt-8">
        Thông tin bổ sung
      </h2>
      <p className="text-xl text-gray-500 mb-10 text-center max-w-2xl">
        Vui lòng bổ sung một số thông tin bắt buộc để hoàn tất thủ tục đăng ký.
      </p>

      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl w-full max-w-4xl border border-gray-100">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            size="large"
            onFinish={handleFinish}
            initialValues={isMockData ? {
              phoneNumber: '0987654321',
              occupation: 'Nông dân',
              bhytNumber: sessionData.serviceType === 'BHYT' ? 'DN4010112345678' : ''
            } : {}}
          >
            {/* Dynamic CSS Grid based on Admin Layout */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(12, 1fr)', 
                gap: '16px',
                // Sắp xếp các item tự động từ trên xuống dưới
                gridAutoFlow: 'row dense'
              }}
            >
              {/* Sắp xếp layout theo y rồi x để render HTML đúng thứ tự */}
              {layout.sort((a,b) => a.y !== b.y ? a.y - b.y : a.x - b.x).map(item => {
                const element = renderField(item);
                if (!element) return null;
                
                return (
                  <div 
                    key={item.i} 
                    style={{ 
                      gridColumn: `span ${item.w}`,
                      // Không dùng gridRow cứng để form co giãn tự nhiên theo nội dung
                    }}
                  >
                    {element}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100">
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                icon={<CheckCircleOutlined />}
                className="w-full h-16 text-2xl rounded-2xl bg-green-600 hover:bg-green-500 shadow-lg shadow-green-200"
              >
                Xác nhận & Tiếp tục
              </Button>
            </div>
          </Form>
        )}
      </div>

      <style jsx>{`
        .animation-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.ant-radio-button-wrapper) {
          border-radius: 12px !important;
          border-inline-start-width: 1px !important;
        }
        :global(.ant-radio-button-wrapper::before) {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
