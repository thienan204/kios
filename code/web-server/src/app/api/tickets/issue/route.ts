import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter } from '@/lib/eventEmitter';

function isTimeInRanges(
  currentTime: string,
  mStart: string,
  mEnd: string,
  aStart: string,
  aEnd: string
) {
  const isMorning = currentTime >= mStart && currentTime <= mEnd;
  const isAfternoon = currentTime >= aStart && currentTime <= aEnd;
  return isMorning || isAfternoon;
}

export async function POST(req: Request) {
  try {
    const { areaId, phoneNumber } = await req.json();

    if (!areaId) {
      return NextResponse.json({ error: 'Thiếu thông tin khu vực' }, { status: 400 });
    }

    const area = await prisma.area.findUnique({
      where: { id: Number(areaId) },
    });

    if (!area) {
      return NextResponse.json({ error: 'Khu vực không tồn tại' }, { status: 404 });
    }

    if (area.isIssuePaused) {
      return NextResponse.json({ 
        success: false, 
        error: 'Khu vực này hiện đang tạm dừng cấp số để xử lý. Vui lòng quay lại sau ít phút!' 
      }, { status: 403 });
    }

    // Lấy giờ hiện tại "HH:mm"
    const now = new Date();
    // Chuyển sang giờ Việt Nam (UTC+7) cho chính xác nếu server ở múi giờ khác
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentHHmm = vnTime.toISOString().substring(11, 16);

    // Kiểm tra giờ làm việc
    if (!isTimeInRanges(currentHHmm, area.startTime, area.endTime, area.afternoonStartTime, area.afternoonEndTime)) {
      return NextResponse.json({ 
        error: 'Hết giờ tiếp đón',
        outOfHours: true 
      }, { status: 403 });
    }

    // Lấy thời điểm bắt đầu ngày hôm nay (00:00:00) theo UTC (hoặc local tuỳ hệ thống)
    // Để an toàn, chúng ta tính Start of Day theo múi giờ local của Server
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let shiftStartTime = startOfDay;
    let isAfternoon = false;
    
    // Nếu cấu hình reset đếm số theo từng ca và hiện tại đang là ca chiều
    if (area.ticketResetType === 'PER_SHIFT' && currentHHmm >= area.afternoonStartTime) {
      const [h, m] = area.afternoonStartTime.split(':').map(Number);
      shiftStartTime = new Date();
      shiftStartTime.setHours(h, m, 0, 0);
      isAfternoon = true;
    }

    // Kiểm tra giới hạn cấp số
    if (area.hasIssueLimit) {
      const limit = (area.ticketResetType === 'PER_SHIFT' && isAfternoon) 
        ? area.issueLimitAfternoon 
        : area.issueLimitMorning;

      if (limit > 0) {
        // Đếm số lượng vé đã cấp trong ca hiện tại
        const ticketsIssuedInShift = await prisma.ticket.count({
          where: {
            areaId: Number(areaId),
            issuedAt: {
              gte: shiftStartTime,
            }
          }
        });

        if (ticketsIssuedInShift >= limit) {
          return NextResponse.json({ 
            success: false, 
            error: `Khu vực này đã đạt giới hạn tiếp nhận bệnh nhân (${limit} số). Vui lòng quay lại vào ca làm việc sau!` 
          }, { status: 403 });
        }
      }
    }

    // Kiểm tra xem SĐT này đã có số Đang chờ trong ca này chưa
    if (phoneNumber) {
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          areaId: Number(areaId),
          phoneNumber: phoneNumber,
          status: 'WAITING',
          issuedAt: {
            gte: shiftStartTime,
          }
        }
      });

      if (existingTicket) {
        // Nếu đã có vé chờ, tính số người đang chờ trước người này
        const waitingCount = await prisma.ticket.count({
          where: {
            areaId: Number(areaId),
            status: 'WAITING',
            ticketNumber: { lt: existingTicket.ticketNumber },
            issuedAt: { gte: shiftStartTime }
          }
        });

        return NextResponse.json({
          success: true,
          ticketNumber: existingTicket.ticketNumber,
          waitingCount: waitingCount,
          areaName: area.name,
          issuedAt: existingTicket.issuedAt,
          printHospitalName: area.printHospitalName,
          printGreeting: area.printGreeting,
          printFooter: area.printFooter,
          isExisting: true // báo cho frontend biết đây là vé cũ
        });
      }
    }

    // Tìm số lớn nhất trong ca hiện tại
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        areaId: Number(areaId),
        issuedAt: {
          gte: shiftStartTime,
        },
      },
      orderBy: {
        ticketNumber: 'desc',
      },
    });

    const nextNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // Tạo phiếu mới
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber,
        areaId: Number(areaId),
        status: 'WAITING',
        phoneNumber: phoneNumber || null,
      },
    });

    // Bắn event để thông báo cho màn hình Tivi cập nhật hàng đợi
    eventEmitter.emit('call-ticket', {
      type: 'issue',
      areaId: Number(areaId),
      ticketNumber: newTicket.ticketNumber
    });

    // Đếm số người đang chờ trước người này (các vé lấy trước đó trong cùng ca)
    const waitingCount = await prisma.ticket.count({
      where: {
        areaId: Number(areaId),
        status: 'WAITING',
        ticketNumber: { lt: nextNumber },
        issuedAt: { gte: shiftStartTime }
      }
    });

    return NextResponse.json({
      success: true,
      ticketNumber: newTicket.ticketNumber,
      waitingCount: waitingCount, // Số người chờ TỚI TRƯỚC người này
      areaName: area.name,
      issuedAt: newTicket.issuedAt,
      printHospitalName: area.printHospitalName,
      printGreeting: area.printGreeting,
      printFooter: area.printFooter,
    });

  } catch (error) {
    console.error('Issue ticket error:', error);
    return NextResponse.json({ error: 'Lỗi cấp số' }, { status: 500 });
  }
}
