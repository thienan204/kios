import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mac = searchParams.get('mac');

    if (!mac) {
      return NextResponse.json({ error: 'Missing MAC address' }, { status: 400 });
    }

    // Kiểm tra xem MAC này có nằm trong danh sách Kiosk Tự Đăng Ký không
    const kioskDevice = await prisma.selfRegDevice.findUnique({
      where: { macAddress: mac }
    });

    if (kioskDevice && kioskDevice.status === 'ONLINE') {
      return NextResponse.json({
        type: 'SELF_REG_KIOSK',
        deviceInfo: kioskDevice
      });
    }

    // Mặc định nếu không có trong bảng SelfRegDevice, thì nó là máy Bàn Tiếp Đón (Reception Desk)
    // vì hiện tại Bàn tiếp đón chưa quản lý theo MAC chặt chẽ (lưu local storage)
    return NextResponse.json({
      type: 'DESK'
    });

  } catch (error) {
    console.error('Error checking MAC:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
