/**
 * Template: Tích hợp Hệ thống thông tin Bệnh viện (HIS Adapter)
 * 
 * Đây là module trung gian (Bridge) để kết nối Kiosk với phần mềm quản lý của bệnh viện.
 * Khi Kiosk quét được một mã vạch (Patient ID, Barcode, QR...), nó sẽ truyền đoạn mã đó vào đây.
 * Việc của bạn là viết code gọi sang API của HIS để lấy thông tin chi tiết.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PatientInfo {
  name: string;
  phone?: string;
  service?: string;
  amount?: string;
  room?: string;
  [key: string]: any; // Dành cho các trường mở rộng
}

export interface HISLookupResult {
  success: boolean;
  data?: PatientInfo;
  error?: string;
}

/**
 * Hàm tra cứu thông tin bệnh nhân từ HIS thông qua mã QR/Mã vạch
 * @param qrData Chuỗi ký tự thô đọc được từ máy quét
 * @returns HISLookupResult
 */
export async function lookupPatientByQR(qrData: string): Promise<HISLookupResult> {
  try {
    // 1. LẤY CẤU HÌNH TỪ GIAO DIỆN QUẢN TRỊ (GUI) DÀNH CHO KIOSK QR
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'QR_KIOSK_HIS_CONFIG' }
    });

    let config: any = null;
    if (setting && setting.value) {
      try { config = JSON.parse(setting.value); } catch(e) {}
    }

    if (config && config.endpointUrl) {
      console.log(`[HIS Adapter] Đang gọi API HIS (từ GUI Kiosk QR): ${config.endpointUrl}`);
      
      let headers: any = { 'Content-Type': 'application/json' };
      if (config.headers) {
        try { headers = { ...headers, ...JSON.parse(config.headers) }; } catch (e) {}
      }

      // Gọi API thực tế (Giả định truyền QR qua query param)
      try {
        const url = `${config.endpointUrl}?barcode=${encodeURIComponent(qrData)}`;
        const response = await fetch(url, {
          method: config.httpMethod || 'GET',
          headers
        });

        if (response.ok) {
          const hisData = await response.json();
          // Cố gắng tự động lấy tên nếu API trả về (Cần tùy biến theo Bệnh viện)
          return {
            success: true,
            data: {
              name: hisData.HoTen || hisData.FullName || hisData.name || 'Bệnh nhân từ HIS',
              phone: hisData.SoDienThoai || hisData.Phone || '',
              service: hisData.TenDichVu || 'Khám theo chỉ định',
              raw_his_data: hisData
            }
          };
        } else {
          console.error('[HIS Adapter] HIS API trả về lỗi:', response.status);
          // Nếu gọi API thực tế thất bại, tiếp tục chạy xuống dùng Mock Data để không gián đoạn lúc Test
        }
      } catch (fetchError) {
        console.error('[HIS Adapter] Không thể kết nối tới HIS URL:', fetchError);
        // Tiep tuc dung Mock Data
      }
    }

    // =========================================================================
    // 2. DỮ LIỆU GIẢ LẬP (MOCK DATA) LÀM FALLBACK KHI CHƯA CẤU HÌNH XONG API
    // =========================================================================
    console.log(`[HIS Adapter] Đang tra cứu mã: ${qrData}`);
    
    // Giả lập thời gian chờ (latency) của mạng
    await new Promise(resolve => setTimeout(resolve, 800));

    // Thử parse JSON (Dành cho trường hợp test bằng Nút Test màu hồng trên Kiosk)
    try {
      const parsed = JSON.parse(qrData);
      return {
        success: true,
        data: {
          name: parsed.name || parsed.patientName || parsed.customerName || 'Bệnh nhân Test',
          phone: parsed.phone || parsed.phoneNumber || '',
          service: parsed.service || 'Khám tổng quát',
          amount: parsed.amount || '0đ'
        }
      };
    } catch (e) {
      // Nếu không phải JSON, giả lập việc tìm thấy bệnh nhân từ chuỗi định danh thô
      if (qrData.length > 0) {
        return {
          success: true,
          data: {
            name: 'Nguyễn Văn ' + qrData.substring(0, 3).toUpperCase(),
            phone: '09xxxx' + qrData.substring(0, 4),
            service: 'Dịch vụ Mẫu (Giả lập)',
            patientId: qrData 
          }
        };
      }
    }

    return {
      success: false,
      error: 'Mã QR trống hoặc không hợp lệ'
    };

  } catch (error: any) {
    console.error('[HIS Adapter] Lỗi kết nối:', error);
    return {
      success: false,
      error: 'Lỗi kết nối đến hệ thống HIS: ' + error.message
    };
  }
}
