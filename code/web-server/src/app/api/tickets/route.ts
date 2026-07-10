import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    let endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    if (startDateParam && endDateParam) {
      const parsedStart = new Date(startDateParam);
      const parsedEnd = new Date(endDateParam);
      if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
        startOfDay = new Date(parsedStart);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(parsedEnd);
        endOfDay.setHours(23, 59, 59, 999);
      }
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        issuedAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: {
        issuedAt: 'desc', // Mới nhất lên đầu
      },
      include: {
        area: true,
        desk: true,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Lỗi tải danh sách phiếu:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách phiếu' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: 'Vui lòng cung cấp startDate và endDate' }, { status: 400 });
    }

    const start = new Date(startDateParam);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDateParam);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Ngày không hợp lệ' }, { status: 400 });
    }

    const result = await prisma.ticket.deleteMany({
      where: {
        issuedAt: {
          gte: start,
          lte: end,
        }
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Lỗi xóa phiếu:', error);
    return NextResponse.json({ error: 'Lỗi xóa phiếu lấy số' }, { status: 500 });
  }
}
