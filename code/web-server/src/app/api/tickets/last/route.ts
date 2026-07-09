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

    const lastTicket = await prisma.ticket.findFirst({
      where: {
        areaId: Number(areaId),
        issuedAt: {
          gte: startOfDay,
        },
      },
      orderBy: {
        ticketNumber: 'desc',
      },
    });

    if (lastTicket) {
      return NextResponse.json({ ticketNumber: lastTicket.ticketNumber });
    } else {
      return NextResponse.json({ ticketNumber: null });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải phiếu gần nhất' }, { status: 500 });
  }
}
