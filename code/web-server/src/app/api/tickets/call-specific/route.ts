import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter, activeAudioClients } from '@/lib/eventEmitter';

export async function POST(req: Request) {
  try {
    const { deskId, ticketNumber } = await req.json();

    if (!deskId || !ticketNumber) {
      return NextResponse.json({ error: 'Thiếu thông tin bàn hoặc số thứ tự' }, { status: 400 });
    }

    const desk = await prisma.desk.findUnique({
      where: { id: Number(deskId) },
      include: { area: true }
    });

    if (!desk || desk.status === 'PAUSED') {
      return NextResponse.json({ error: 'Bàn tiếp đón không tồn tại hoặc đang tạm dừng' }, { status: 400 });
    }

    const audioCount = activeAudioClients.get(desk.areaId) || 0;
    if (audioCount === 0) {
      return NextResponse.json({ error: 'Cảnh báo: Chưa mở Trạm phát âm thanh. Vui lòng bật trang Audio để tiếp tục!' }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const num = Number(ticketNumber);

    // 1. Cập nhật các vé cũ đang GỌI ở bàn này thành HOÀN THÀNH
    await prisma.ticket.updateMany({
      where: { deskId: Number(deskId), status: 'CALLING', issuedAt: { gte: startOfDay } },
      data: { status: 'COMPLETED' },
    });

    // 2. Chuyển các vé ĐANG CHỜ có số NHỎ HƠN số được gọi thành BỎ QUA
    await prisma.ticket.updateMany({
      where: { areaId: desk.areaId, status: 'WAITING', ticketNumber: { lt: num }, issuedAt: { gte: startOfDay } },
      data: { status: 'SKIPPED' },
    });

    // 3. Tìm xem số ticketNumber có tồn tại không
    let targetTicket = await prisma.ticket.findFirst({
      where: { areaId: desk.areaId, ticketNumber: num, issuedAt: { gte: startOfDay } },
      include: { area: true, desk: true }
    });

    if (targetTicket) {
      // Cập nhật nó
      targetTicket = await prisma.ticket.update({
        where: { id: targetTicket.id },
        data: { status: 'CALLING', deskId: desk.id, calledAt: new Date() },
        include: { area: true, desk: true }
      });
    } else {
      // Tạo mới nếu không tồn tại
      targetTicket = await prisma.ticket.create({
        data: {
          ticketNumber: num,
          areaId: desk.areaId,
          deskId: desk.id,
          status: 'CALLING',
          calledAt: new Date()
        },
        include: { area: true, desk: true }
      });
    }

    // Phát âm thanh
    eventEmitter.emit('call-ticket', {
      type: 'call',
      areaId: targetTicket.areaId,
      ticketNumber: targetTicket.ticketNumber,
      deskName: targetTicket.desk?.name || desk.name,
      audioTemplate: targetTicket.area?.audioTemplate || desk.area.audioTemplate
    });

    return NextResponse.json({
      success: true,
      ticket: targetTicket
    });
  } catch (error) {
    console.error('Call specific ticket error:', error);
    return NextResponse.json({ error: 'Lỗi gọi số chỉ định' }, { status: 500 });
  }
}
