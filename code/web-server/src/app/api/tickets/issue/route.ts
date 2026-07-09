import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const { areaId } = await req.json();

    if (!areaId) {
      return NextResponse.json({ error: 'Thiếu thông tin khu vực' }, { status: 400 });
    }

    const area = await prisma.area.findUnique({
      where: { id: Number(areaId) },
    });

    if (!area) {
      return NextResponse.json({ error: 'Khu vực không tồn tại' }, { status: 404 });
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

    // Tìm số lớn nhất hôm nay
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

    const nextNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // Đếm số người đang chờ
    const waitingCount = await prisma.ticket.count({
      where: {
        areaId: Number(areaId),
        status: 'WAITING',
        issuedAt: {
          gte: startOfDay,
        }
      }
    });

    // Tạo phiếu mới
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber,
        areaId: Number(areaId),
        status: 'WAITING',
      },
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
