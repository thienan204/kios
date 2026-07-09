'use client';

import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography, Divider } from 'antd';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [bannerFileList, setBannerFileList] = useState<UploadFile[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');
  const [bannerUrl, setBannerUrl] = useState<string>('/banner.png');

  const customUpload = async (options: any, type: 'logo' | 'banner') => {
    const { file, onSuccess, onError } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        message.success(`Tải ${type} lên thành công!`);
        if (type === 'logo') setLogoUrl(data.url);
        if (type === 'banner') setBannerUrl(data.url);
        onSuccess('ok');
      } else {
        message.error(data.message || 'Lỗi tải ảnh');
        onError(new Error(data.message));
      }
    } catch (err) {
      message.error('Lỗi kết nối đến máy chủ');
      onError(err);
    }
  };

  const logoUploadProps: UploadProps = {
    customRequest: (options) => customUpload(options, 'logo'),
    listType: 'picture',
    maxCount: 1,
    fileList: logoFileList,
    onChange: ({ fileList }) => setLogoFileList(fileList),
    accept: 'image/png, image/jpeg',
  };

  const bannerUploadProps: UploadProps = {
    customRequest: (options) => customUpload(options, 'banner'),
    listType: 'picture',
    maxCount: 1,
    fileList: bannerFileList,
    onChange: ({ fileList }) => setBannerFileList(fileList),
    accept: 'image/png, image/jpeg',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Title level={2} className="mb-6">Cài đặt Giao diện Kiosk</Title>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LOGO UPLOAD */}
        <Card 
          title={<><PictureOutlined /> Logo Bệnh Viện</>} 
          className="shadow-sm"
        >
          <Text type="secondary" className="block mb-4">
            Ảnh logo hiển thị góc trái màn hình Kiosk. Định dạng PNG trong suốt là tốt nhất.
          </Text>
          
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded flex justify-center items-center min-h-[120px]">
            <img 
              src={`${logoUrl}?v=${Date.now()}`} // Force reload to show current image
              alt="Current Logo" 
              className="max-h-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = 'block';
              }}
            />
          </div>

          <Upload {...logoUploadProps}>
            <Button icon={<UploadOutlined />}>Tải Logo mới lên</Button>
          </Upload>
        </Card>

        {/* BANNER UPLOAD */}
        <Card 
          title={<><PictureOutlined /> Banner Thông Báo</>} 
          className="shadow-sm"
        >
          <Text type="secondary" className="block mb-4">
            Ảnh banner ngang hiển thị góc phải màn hình Kiosk.
          </Text>
          
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded flex justify-center items-center min-h-[120px]">
            <img 
              src={`${bannerUrl}?v=${Date.now()}`} // Force reload
              alt="Current Banner" 
              className="max-h-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = 'block';
              }}
            />
          </div>

          <Upload {...bannerUploadProps}>
            <Button icon={<UploadOutlined />}>Tải Banner mới lên</Button>
          </Upload>
        </Card>

      </div>
    </div>
  );
}
