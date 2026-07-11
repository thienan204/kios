import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get('areaId');

    if (!areaId) {
      return NextResponse.json({ error: 'Thiếu thông tin khu vực' }, { status: 400 });
    }

    const area = await prisma.area.findUnique({
      where: { id: Number(areaId) },
    });

    if (!area) {
      return NextResponse.json({ error: 'Khu vực không tồn tại' }, { status: 404 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let shiftStartTime = startOfDay;

    // Tính thời gian bắt đầu ca (nếu reset theo ca và đang là ca chiều)
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentHHmm = vnTime.toISOString().substring(11, 16);

    if (area.ticketResetType === 'PER_SHIFT' && currentHHmm >= area.afternoonStartTime) {
      const [h, m] = area.afternoonStartTime.split(':').map(Number);
      shiftStartTime = new Date();
      shiftStartTime.setHours(h, m, 0, 0);
    }

    const waitingTickets = await prisma.ticket.findMany({
      where: {
        areaId: Number(areaId),
        status: 'WAITING',
        issuedAt: {
          gte: shiftStartTime,
        },
      },
      select: {
        ticketNumber: true,
      },
      orderBy: {
        ticketNumber: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      waitingTickets: waitingTickets.map(t => t.ticketNumber),
    });
  } catch (error) {
    console.error('Lỗi khi lấy hàng đợi:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
