import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter, activeAudioClients } from '@/lib/eventEmitter';

export async function POST(req: Request) {
  try {
    const { deskId } = await req.json();

    if (!deskId) {
      return NextResponse.json({ error: 'Thiếu thông tin Bàn tiếp đón (deskId)' }, { status: 400 });
    }

    const desk = await prisma.desk.findUnique({
      where: { id: Number(deskId) },
    });

    if (!desk || desk.status === 'PAUSED') {
      return NextResponse.json({ error: 'Bàn tiếp đón không tồn tại hoặc đang tạm dừng' }, { status: 400 });
    }

    const audioCount = activeAudioClients.get(desk.areaId) || 0;
    if (audioCount === 0) {
      return NextResponse.json({ error: 'Cảnh báo: Chưa mở Trạm phát âm thanh. Vui lòng bật trang Audio để tiếp tục!' }, { status: 400 });
    }


    // Lấy thời điểm bắt đầu ngày hôm nay
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Chuyển tất cả các vé ĐANG GỌI của Bàn này thành ĐÃ HOÀN THÀNH
    // (Vì bác sĩ bấm gọi người tiếp theo, nghĩa là người cũ đã xong)
    await prisma.ticket.updateMany({
      where: {
        deskId: Number(deskId),
        status: 'CALLING',
        issuedAt: {
          gte: startOfDay,
        },
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // Tìm vé cũ nhất đang chờ của Khu vực mà Bàn này trực thuộc
    const nextTicket = await prisma.ticket.findFirst({
      where: {
        areaId: desk.areaId,
        status: 'WAITING',
        issuedAt: {
          gte: startOfDay,
        },
      },
      orderBy: {
        ticketNumber: 'asc',
      },
    });

    if (!nextTicket) {
      return NextResponse.json({ 
        message: 'Hiện không có bệnh nhân nào đang chờ',
        empty: true
      });
    }

    // Cập nhật trạng thái vé thành CALLING và gán vào bàn này
    const calledTicket = await prisma.ticket.update({
      where: { id: nextTicket.id },
      data: {
        status: 'CALLING',
        deskId: Number(deskId),
        calledAt: new Date(),
      },
      include: {
        area: true, // Để lấy Audio Template
        desk: true, // Để lấy tên Bàn hiển thị trên Tivi
      }
    });

    // Bắn event (Server-Sent Events) để Màn hình Tivi và Máy chủ Âm thanh nhận tín hiệu
    eventEmitter.emit('call-ticket', {
      type: 'call',
      areaId: calledTicket.areaId,
      ticketNumber: calledTicket.ticketNumber,
      deskName: calledTicket.desk.name,
      audioTemplate: calledTicket.area.audioTemplate
    });

    return NextResponse.json({
      success: true,
      ticket: calledTicket,
      audioTemplate: calledTicket.area.audioTemplate
    });

  } catch (error) {
    console.error('Call ticket error:', error);
    return NextResponse.json({ error: 'Lỗi gọi số' }, { status: 500 });
  }
}
