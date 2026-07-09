import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter, activeAudioClients } from '@/lib/eventEmitter';

export async function POST(req: Request) {
  try {
    const { deskId } = await req.json();

    if (!deskId) {
      return NextResponse.json({ error: 'Thiếu thông tin Bàn tiếp đón' }, { status: 400 });
    }

    // Lấy thời điểm bắt đầu ngày hôm nay
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Tìm vé ĐANG GỌI hiện tại của Bàn này
    const currentTicket = await prisma.ticket.findFirst({
      where: {
        deskId: Number(deskId),
        status: 'CALLING',
        issuedAt: {
          gte: startOfDay,
        },
      },
      include: {
        area: true,
        desk: true,
      },
      orderBy: {
        calledAt: 'desc',
      }
    });

    if (!currentTicket) {
      return NextResponse.json({ 
        message: 'Hiện không có bệnh nhân nào đang được gọi ở bàn này',
        empty: true
      });
    }

    const audioCount = activeAudioClients.get(currentTicket.areaId) || 0;
    if (audioCount === 0) {
      return NextResponse.json({ error: 'Cảnh báo: Chưa mở Trạm phát âm thanh. Vui lòng bật trang Audio để phát lại!' }, { status: 400 });
    }


    // Bắn lại event SSE xuống Tivi để đọc loa lại
    eventEmitter.emit('call-ticket', {
      type: 'call',
      areaId: currentTicket.areaId,
      ticketNumber: currentTicket.ticketNumber,
      deskName: currentTicket.desk?.name,
      audioTemplate: currentTicket.area.audioTemplate
    });

    return NextResponse.json({
      success: true,
      message: 'Đã phát lại âm thanh',
      ticket: currentTicket
    });

  } catch (error) {
    console.error('Recall ticket error:', error);
    return NextResponse.json({ error: 'Lỗi phát lại âm thanh' }, { status: 500 });
  }
}
