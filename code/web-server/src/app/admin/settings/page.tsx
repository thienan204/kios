'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Card, Typography, Divider, Select } from 'antd';
import { UploadOutlined, PictureOutlined, PhoneOutlined, SaveOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [bannerFileList, setBannerFileList] = useState<UploadFile[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');
  const [bannerUrl, setBannerUrl] = useState<string>('/banner.png');
  const [imageTimestamp, setImageTimestamp] = useState<string>('');

  useEffect(() => {
    setImageTimestamp(`?v=${Date.now()}`);
  }, []);

  const [validPrefixes, setValidPrefixes] = useState<string[]>([]);
  const [savingPrefixes, setSavingPrefixes] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.validPhonePrefixes) {
          try {
            const arr = JSON.parse(data.validPhonePrefixes);
            setValidPrefixes(Array.isArray(arr) ? arr.map((v: string) => v.trim()).filter(Boolean) : []);
          } catch (e) {
            console.error('Error parsing validPhonePrefixes', e);
          }
        }
      })
      .catch(err => console.error('Error fetching settings', err));
  }, []);

  const handleSavePrefixes = async () => {
    setSavingPrefixes(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validPhonePrefixes: JSON.stringify(validPrefixes) })
      });
      if (res.ok) {
        message.success('Đã lưu cấu hình đầu số!');
      } else {
        message.error('Lỗi khi lưu cấu hình');
      }
    } catch (err) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setSavingPrefixes(false);
    }
  };

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
        if (type === 'logo') {
          setLogoUrl(data.url);
          setImageTimestamp(`?v=${Date.now()}`);
        }
        if (type === 'banner') {
          setBannerUrl(data.url);
          setImageTimestamp(`?v=${Date.now()}`);
        }
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
              src={`${logoUrl}${imageTimestamp}`} // Force reload to show current image
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
              src={`${bannerUrl}${imageTimestamp}`} // Force reload
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

      <Divider />

      <Title level={4} className="mb-4">Cấu hình Hệ Thống</Title>
      
      <Card 
        title={<><PhoneOutlined /> Đầu Số Điện Thoại Hợp Lệ</>} 
        className="shadow-sm max-w-2xl"
      >
        <Text type="secondary" className="block mb-4">
          Danh sách các đầu số nhà mạng cho phép người bệnh nhập khi đăng ký khám tại Kiosk di động. (Ví dụ: 098, 036, 091...)
        </Text>
        
        <Select
          mode="tags"
          style={{ width: '100%', marginBottom: '16px' }}
          placeholder="Nhập và ấn Enter để thêm đầu số mới"
          value={validPrefixes}
          onChange={(vals) => setValidPrefixes(vals.map((v: string) => v.trim()).filter(Boolean))}
          tokenSeparators={[',']}
        />

        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSavePrefixes}
          loading={savingPrefixes}
        >
          Lưu Đầu Số
        </Button>
      </Card>

    </div>
  );
}
