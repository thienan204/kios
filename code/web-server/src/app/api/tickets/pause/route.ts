import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter } from '@/lib/eventEmitter';

export async function POST(req: Request) {
  try {
    const { deskId } = await req.json();

    if (!deskId) {
      return NextResponse.json({ error: 'Thiếu thông tin bàn' }, { status: 400 });
    }

    // Tìm số đang gọi hiện tại của bàn này
    const currentTicket = await prisma.ticket.findFirst({
      where: {
        deskId: Number(deskId),
        status: 'CALLING',
      },
      orderBy: {
        calledAt: 'desc',
      },
    });

    if (currentTicket) {
      // Chuyển trạng thái sang COMPLETED
      await prisma.ticket.update({
        where: { id: currentTicket.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      
      // Phát sự kiện để màn hình Tivi (nếu có) cập nhật lại danh sách đang phục vụ
      eventEmitter.emit('ticket_called', {
        areaId: currentTicket.areaId
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Pause ticket error:', error);
    return NextResponse.json({ error: 'Lỗi kết thúc phiên' }, { status: 500 });
  }
}
