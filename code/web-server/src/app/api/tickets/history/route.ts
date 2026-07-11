import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get('areaId');

    if (!areaId) {
      return NextResponse.json({ error: 'Thiếu areaId' }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Lấy Current Call (Số đang gọi hiện tại)
    const currentCallTicket = await prisma.ticket.findFirst({
      where: {
        areaId: Number(areaId),
        status: 'CALLING',
        issuedAt: {
          gte: startOfDay,
        },
      },
      include: {
        desk: true
      },
      orderBy: {
        calledAt: 'desc',
      }
    });

    // 2. Lấy danh sách 20 vé mới nhất (Chỉ lấy Đang chờ và Đang gọi)
    const recentTickets = await prisma.ticket.findMany({
      where: {
        areaId: Number(areaId),
        status: {
          in: ['WAITING', 'CALLING']
        },
        issuedAt: {
          gte: startOfDay,
        },
      },
      include: {
        desk: true
      },
      orderBy: {
        ticketNumber: 'desc',
      },
      take: 20,
    });

    const ticketList = recentTickets.map(t => ({
      number: t.ticketNumber,
      desk: t.desk?.name || '--',
      status: t.status
    }));

    return NextResponse.json({
      success: true,
      currentCall: currentCallTicket ? {
        number: currentCallTicket.ticketNumber,
        desk: currentCallTicket.desk?.name || '--'
      } : null,
      ticketList: ticketList
    });

  } catch (error) {
    console.error('Lỗi tải danh sách:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách' }, { status: 500 });
  }
}
