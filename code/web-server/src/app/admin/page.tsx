'use client';

import React from 'react';
import { Typography, Card, Steps, Alert, Tabs } from 'antd';
import { ChromeOutlined, PrinterOutlined, DesktopOutlined, SoundOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-8 text-center">
        <Title level={2}>Hệ thống Quản trị Kiosk Lấy Số</Title>
        <Paragraph className="text-gray-500 text-lg">
          Tài liệu hướng dẫn triển khai toàn diện 3 phân hệ của hệ thống.
        </Paragraph>
      </div>

      <Card className="shadow-md border-blue-200">
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: <span className="font-semibold"><PrinterOutlined /> Luồng 1: Kiosk Lấy Số (Cảm ứng & In nhiệt)</span>,
              children: (
                <div className="mt-4">
                  <Alert 
                    title="Bắt buộc sử dụng trình duyệt Google Chrome hoặc Microsoft Edge trên máy tính đặt ở sảnh chờ." 
                    type="info" 
                    showIcon 
                    className="mb-6"
                  />
                  <Steps
                    orientation="vertical"
                    current={4}
                    items={[
                      {
                        title: <Text strong>Bước 1: Tạo Shortcut</Text>,
                        description: 'Ra ngoài màn hình Desktop, click chuột phải vào biểu tượng Google Chrome, chọn "Copy", sau đó "Paste" để tạo ra 1 bản sao. Đổi tên bản sao này thành "KIOSK LẤY SỐ".',
                        icon: <ChromeOutlined className="text-blue-500" />
                      },
                      {
                        title: <Text strong>Bước 2: Mở Properties</Text>,
                        description: 'Click chuột phải vào biểu tượng "KIOSK LẤY SỐ" vừa tạo, chọn "Properties".',
                      },
                      {
                        title: <Text strong>Bước 3: Thêm mã cấu hình</Text>,
                        description: (
                          <div>
                            Tại ô <strong>Target</strong>, di chuyển chuột xuống cuối dòng, thêm 1 dấu cách (space) và dán đoạn mã sau vào:
                            <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-sm border text-blue-800">
                              --kiosk --kiosk-printing "http://&lt;IP_MAY_CHU&gt;:3000/layso/1"
                            </div>
                            <Text type="secondary" className="text-xs mt-1 block">
                              (Lưu ý: Thay số 1 thành ID Khu vực thực tế (xem ở menu Quản lý Khu vực) và thay IP_MAY_CHU bằng địa chỉ IP tĩnh của Server)
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: <Text strong>Bước 4: Lưu và Hoàn tất</Text>,
                        description: (
                          <div>
                            Nhấn OK. Từ nay, chỉ cần click đúp vào biểu tượng này, trình duyệt sẽ mở full màn hình không có nút tắt. Khi người bệnh chạm "LẤY SỐ", máy in nhiệt (mặc định) sẽ tự in phiếu ngay lập tức!
                            <Alert 
                              className="mt-3" 
                              type="warning" 
                              showIcon 
                              title="Lưu ý cực kỳ quan trọng: Lần đầu tiên chạy Shortcut này, bạn PHẢI ĐÓNG HOÀN TOÀN TẤT CẢ CÁC CỬA SỔ CHROME ĐANG MỞ (Kể cả Chrome chạy ngầm). Nếu không, cờ lệnh in tự động sẽ không có tác dụng!" 
                            />
                          </div>
                        ),
                        icon: <PrinterOutlined className="text-green-500" />
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: '2',
              label: <span className="font-semibold"><DesktopOutlined /> Luồng 2: App Desktop (Bàn tiếp đón)</span>,
              children: (
                <div className="mt-4">
                  <Alert 
                    title="Cài đặt App Desktop siêu nhẹ cho các máy tính của Bác sĩ / Lễ tân ở các Bàn tiếp đón." 
                    type="success" 
                    showIcon 
                    className="mb-6"
                  />
                  <Steps
                    orientation="vertical"
                    current={3}
                    items={[
                      {
                        title: <Text strong>Bước 1: Khởi động App</Text>,
                        description: 'Mở ứng dụng "Bàn Tiếp Đón Kiosk" (đã được đóng gói) trên máy tính của nhân viên. Ứng dụng này nhỏ gọn và luôn nổi ở góc màn hình.',
                      },
                      {
                        title: <Text strong>Bước 2: Cấu hình kết nối lần đầu</Text>,
                        description: 'Nhập địa chỉ URL của máy chủ (Ví dụ: http://192.168.1.100:3000), ấn nút "Kết nối" và chọn Bàn mà nhân viên đang ngồi từ danh sách thả xuống.',
                      },
                      {
                        title: <Text strong>Bước 3: Sử dụng Phím tắt (Global Shortcut)</Text>,
                        description: (
                          <div>
                            Bác sĩ có thể dùng chuột click nút <strong className="text-blue-600">"GỌI TIẾP THEO"</strong> hoặc đơn giản là nhấn phím tắt toàn cục <strong className="bg-gray-200 px-1 rounded">Alt + 1</strong> trên bàn phím dù đang làm việc ở bất kỳ phần mềm nào (HIS, Word...).
                            <br/>Tín hiệu sẽ lập tức bắn sang Tivi và Loa sẽ tự động đọc.
                          </div>
                        ),
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: '3',
              label: <span className="font-semibold"><SoundOutlined /> Luồng 3: Tivi & Máy chủ Âm thanh</span>,
              children: (
                <div className="mt-4">
                  <Alert 
                    title="Hệ thống đọc số bằng trí tuệ nhân tạo (Text-To-Speech) miễn phí của trình duyệt." 
                    type="warning" 
                    showIcon 
                    className="mb-6"
                  />
                  <Steps
                    orientation="vertical"
                    current={3}
                    items={[
                      {
                        title: <Text strong>Bước 1: Thiết lập phần cứng</Text>,
                        description: 'Chuẩn bị 1 máy tính Mini PC (hoặc Laptop/TV Box có chạy trình duyệt Chrome/Edge). Cắm cáp xuất hình (HDMI) vào Tivi lớn và cắm cáp âm thanh (3.5mm) vào hệ thống Ampli/Loa của khu vực đó.',
                      },
                      {
                        title: <Text strong>Bước 2: Truy cập trang hiển thị Tivi</Text>,
                        description: (
                          <div>
                            Mở trình duyệt, truy cập đường dẫn: 
                            <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-sm border text-blue-800">
                              http://&lt;IP_MAY_CHU&gt;:3000/tv/1
                            </div>
                            <Text type="secondary" className="text-xs mt-1 block">
                              (Lưu ý: Thay số 1 thành ID Khu vực cần hiển thị trên chiếc Tivi này)
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: <Text strong>Bước 3: Kích hoạt Loa & Fullscreen (Bắt buộc)</Text>,
                        description: 'Khi vừa mở trang, màn hình sẽ có thông báo cảnh báo màu đỏ. Nhân viên bắt buộc phải dùng chuột bấm vào nút "Kích hoạt ngay" để trình duyệt cấp quyền tự động phát âm thanh. Cuối cùng nhấn phím F11 để Tivi hiển thị Toàn màn hình.',
                      },
                      {
                        title: <Text strong>Trạm Phát Âm Thanh Độc Lập (Tùy chọn)</Text>,
                        description: 'Nếu bệnh viện có 1 máy tính chỉ chuyên cắm âm ly (không cần hiển thị giao diện tivi nặng nề), hãy truy cập đường dẫn: http://<IP_MAY_CHU>:3000/audio/1. Đây là giao diện siêu nhẹ, chỉ chuyên nhận tín hiệu gọi số và đọc ra loa.',
                      }
                    ]}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
