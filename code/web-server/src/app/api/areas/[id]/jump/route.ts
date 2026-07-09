import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { nextNumber } = await req.json();

    if (!nextNumber || isNaN(Number(nextNumber))) {
      return NextResponse.json({ error: 'Số tiếp theo không hợp lệ' }, { status: 400 });
    }

    const areaId = Number(id);
    
    const dummyNumber = Number(nextNumber) - 1;
    
    if (dummyNumber > 0) {
      await prisma.ticket.create({
        data: {
          ticketNumber: dummyNumber,
          areaId: areaId,
          status: 'SKIPPED',
          issuedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true, message: `Đã cấu hình Kiosk sẽ cấp từ số ${nextNumber}` });

  } catch (error) {
    console.error('Jump ticket error:', error);
    return NextResponse.json({ error: 'Lỗi khi cấu hình nhảy số' }, { status: 500 });
  }
}
