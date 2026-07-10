import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { deskId } = await req.json();

    if (!deskId) {
      return NextResponse.json({ error: 'Thiếu thông tin Bàn tiếp đón' }, { status: 400 });
    }

    // Lấy thời điểm bắt đầu ngày hôm nay
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Chuyển tất cả các vé ĐANG GỌI của Bàn này thành BỎ QUA (SKIPPED)
    const result = await prisma.ticket.updateMany({
      where: {
        deskId: Number(deskId),
        status: 'CALLING',
        issuedAt: {
          gte: startOfDay,
        },
      },
      data: {
        status: 'SKIPPED',
        completedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ 
        message: 'Hiện không có bệnh nhân nào đang được gọi để bỏ qua',
        empty: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu Bỏ qua bệnh nhân',
    });

  } catch (error) {
    console.error('Skip ticket error:', error);
    return NextResponse.json({ error: 'Lỗi bỏ qua số' }, { status: 500 });
  }
}
