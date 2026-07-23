import { NextResponse } from 'next/server';
import { lookupPatientByQR } from '@/services/hisAdapter';

export async function POST(req: Request) {
  try {
    const { qrData } = await req.json();

    if (!qrData) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu mã vạch/QR' }, { status: 400 });
    }

    // Gọi HIS Adapter để tra cứu thông tin bệnh nhân
    const result = await lookupPatientByQR(qrData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Lỗi tra cứu thông tin HIS'
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('Lỗi tại HIS Lookup API:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống khi tra cứu HIS' },
      { status: 500 }
    );
  }
}
