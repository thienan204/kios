'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, message, Alert, Modal, Input } from 'antd';
import { SaveOutlined, EditOutlined } from '@ant-design/icons';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface FormBuilderTabProps {
  initialLayout: string;
  mappedFields: string[]; // Các field đang có trong mapping
  onSave: (layoutStr: string) => Promise<boolean>;
}

export default function FormBuilderTab({ initialLayout, mappedFields, onSave }: FormBuilderTabProps) {
  const [layout, setLayout] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');

  // Danh sách các Field khả dụng để kéo thả
  const availableFields = [
    { id: 'phoneNumber', label: 'Số điện thoại' },
    { id: 'occupation', label: 'Nghề nghiệp' },
    { id: 'bhytNumber', label: 'Mã BHYT' },
    // Có thể thêm các field khác tương lai
  ];

  useEffect(() => {
    try {
      if (initialLayout && initialLayout !== '[]') {
        const parsed = JSON.parse(initialLayout);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayout(parsed);
          return;
        }
      }
    } catch (e) {}

    // Layout mặc định ban đầu nếu chưa có
    const defaultLayout = [
      { i: 'phoneNumber', x: 0, y: 0, w: 12, h: 2, label: 'Số điện thoại liên hệ' },
      { i: 'occupation', x: 0, y: 2, w: 12, h: 4, label: 'Nghề nghiệp' },
      { i: 'bhytNumber', x: 0, y: 6, w: 12, h: 2, label: 'Mã thẻ BHYT (Vì bạn chọn Khám BHYT)' },
    ];
    // Chỉ giữ lại những field có trong availableFields
    setLayout(defaultLayout.filter(l => availableFields.some(f => f.id === l.i)));
  }, [initialLayout]);

  const handleLayoutChange = (newLayout: any) => {
    // Preserve custom labels because react-grid-layout's newLayout drops custom properties
    const preservedLayout = newLayout.map((l: any) => {
      const oldItem = layout.find(item => item.i === l.i);
      return { ...l, label: oldItem?.label || availableFields.find(f => f.id === l.i)?.label || l.i };
    });
    setLayout(preservedLayout);
  };

  const openEditModal = (item: any) => {
    setEditingFieldId(item.i);
    setEditingLabel(item.label || availableFields.find(f => f.id === item.i)?.label || item.i);
    setEditModalVisible(true);
  };

  const saveEditLabel = () => {
    setLayout(prev => prev.map(l => l.i === editingFieldId ? { ...l, label: editingLabel } : l));
    setEditModalVisible(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Chuẩn hóa layout để loại bỏ các prop không cần thiết của react-grid-layout
    const cleanLayout = layout.map(l => ({
      i: l.i, x: l.x, y: l.y, w: l.w, h: l.h, label: l.label
    }));
    
    await onSave(JSON.stringify(cleanLayout));
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <Alert 
        title="Hướng dẫn sử dụng Form Builder" 
        description="Bên dưới là khung giao diện mô phỏng Bước Nhập Thông Tin trên Kiosk. Bạn có thể bấm vào góc phải dưới của mỗi khối để KÉO GIÃN kích thước (Resize), hoặc nhấn giữ để DI CHUYỂN (Drag) vị trí. Chỉ những khối nào xuất hiện trong khung lưới này mới hiển thị trên Kiosk."
        type="info" 
        showIcon 
      />

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold m-0 text-gray-800">Khung thiết kế Giao diện Kiosk</h3>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Lưu Giao Diện
          </Button>
        </div>

        <div className="bg-gray-100 p-8 rounded-2xl border-4 border-dashed border-gray-300 min-h-[500px]">
          {/* @ts-ignore - Bỏ qua lỗi type mismatch của react-grid-layout đối với thuộc tính cols */}
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={30}
            width={800} // Cố định giả lập chiều rộng Kiosk
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
          >
            {layout.map((item) => {
              const fieldDef = availableFields.find(f => f.id === item.i);
              return (
                <div key={item.i} className="bg-blue-50 border-2 border-blue-400 rounded-lg shadow-md flex items-center justify-center relative cursor-move hover:bg-blue-100 transition-colors">
                  <div className="text-center">
                    <span className="font-bold text-blue-800 text-lg block">{item.label || fieldDef?.label || item.i}</span>
                    <span className="text-blue-500 text-sm">({item.i})</span>
                  </div>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    className="absolute top-1 right-1 text-blue-500 hover:text-blue-700 hover:bg-blue-200"
                    onMouseDown={(e) => { e.stopPropagation(); openEditModal(item); }}
                  />
                  {/* Resize handle giả lập để dễ nhìn */}
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-blue-500 cursor-se-resize"></div>
                </div>
              );
            })}
          </GridLayout>
        </div>
      </div>
      <Modal
        title="Sửa Tên Hiển Thị (Label)"
        open={editModalVisible}
        onOk={saveEditLabel}
        onCancel={() => setEditModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <p className="mb-2">Nhập tên nhãn bạn muốn hiển thị trên màn hình Kiosk:</p>
        <Input 
          value={editingLabel} 
          onChange={(e) => setEditingLabel(e.target.value)} 
          size="large"
          onPressEnter={saveEditLabel}
        />
      </Modal>
    </div>
  );
}
