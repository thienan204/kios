import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter } from '@/lib/eventEmitter';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const areaId = parseInt(resolvedParams.id, 10);
    const { quantity, pinCode } = await req.json();

    if (isNaN(areaId) || !quantity || quantity < 1 || quantity > 200) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ (số lượng từ 1-200)' }, { status: 400 });
    }

    const area = await prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return NextResponse.json({ error: 'Khu vực không tồn tại' }, { status: 404 });
    }

    if (pinCode && pinCode !== area.kioskPin) {
      return NextResponse.json({ error: 'Mã PIN không chính xác!' }, { status: 403 });
    }

    if (area.isIssuePaused) {
      return NextResponse.json({ 
        success: false, 
        error: 'Khu vực này hiện đang tạm dừng cấp số.' 
      }, { status: 403 });
    }

    // Xác định ca hiện tại để tính số bắt đầu
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentHHmm = vnTime.toISOString().substring(11, 16);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let shiftStartTime = startOfDay;
    let isAfternoon = false;
    
    if (area.ticketResetType === 'PER_SHIFT' && currentHHmm >= area.afternoonStartTime) {
      const [h, m] = area.afternoonStartTime.split(':').map(Number);
      shiftStartTime = new Date();
      shiftStartTime.setHours(h, m, 0, 0);
      isAfternoon = true;
    }

    // Đếm số lượng vé đã cấp trong ca
    const ticketsIssuedInShift = await prisma.ticket.count({
      where: {
        areaId: Number(areaId),
        issuedAt: { gte: shiftStartTime }
      }
    });

    // Kiểm tra giới hạn cấp số
    if (area.hasIssueLimit) {
      const limit = (area.ticketResetType === 'PER_SHIFT' && isAfternoon) 
        ? area.issueLimitAfternoon 
        : area.issueLimitMorning;

      if (limit > 0) {
        if (ticketsIssuedInShift + quantity > limit) {
          const remaining = limit - ticketsIssuedInShift;
          return NextResponse.json({ 
            success: false, 
            error: `Vượt quá giới hạn! Chỉ còn lại ${remaining > 0 ? remaining : 0} số trong ca này.` 
          }, { status: 403 });
        }
      }
    }

    // Lấy số tiếp theo
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        areaId: Number(areaId),
        issuedAt: { gte: shiftStartTime },
      },
      orderBy: { ticketNumber: 'desc' },
    });

    let nextNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;
    
    // Đếm số người đang chờ hiện tại (để làm base waiting count)
    const currentWaitingCount = await prisma.ticket.count({
      where: {
        areaId: Number(areaId),
        status: 'WAITING',
        issuedAt: { gte: shiftStartTime }
      }
    });

    const newTickets: any[] = [];
    const generatedData = [];

    // Tạo hàng loạt vé
    for (let i = 0; i < quantity; i++) {
      const tNumber = nextNumber + i;
      newTickets.push({
        ticketNumber: tNumber,
        areaId: Number(areaId),
        status: 'WAITING',
        issuedAt: new Date(),
      });
      
      generatedData.push({
        number: tNumber,
        area: area.name,
        waiting: currentWaitingCount + i,
        time: new Date().toLocaleString('vi-VN'),
        printHospitalName: area.printHospitalName,
        printGreeting: area.printGreeting,
        printFooter: area.printFooter,
      });
    }

    // Bulk insert (Prisma `createMany` is faster)
    await prisma.ticket.createMany({
      data: newTickets,
    });

    // Bắn event cho vé cuối cùng để Tivi cập nhật UI (không cần bắn N lần làm lag UI)
    if (newTickets.length > 0) {
      eventEmitter.emit('call-ticket', {
        type: 'issue',
        areaId: Number(areaId),
        ticketNumber: newTickets[newTickets.length - 1].ticketNumber
      });
    }

    return NextResponse.json({
      success: true,
      tickets: generatedData
    });

  } catch (error) {
    console.error('Batch issue error:', error);
    return NextResponse.json({ error: 'Lỗi cấp số hàng loạt' }, { status: 500 });
  }
}
