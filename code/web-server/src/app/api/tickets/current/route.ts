import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deskId = searchParams.get('deskId');

    if (!deskId) {
      return NextResponse.json({ error: 'Thiếu deskId' }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const currentTicket = await prisma.ticket.findFirst({
      where: {
        deskId: Number(deskId),
        status: 'CALLING',
        issuedAt: {
          gte: startOfDay,
        },
      },
      orderBy: {
        calledAt: 'desc',
      },
    });

    if (currentTicket) {
      return NextResponse.json({ ticket: currentTicket });
    } else {
      return NextResponse.json({ ticket: null });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải phiếu hiện tại' }, { status: 500 });
  }
}
