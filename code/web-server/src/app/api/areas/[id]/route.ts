import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const area = await prisma.area.findUnique({
      where: { id: Number(id) }
    });
    if (!area) {
      return NextResponse.json({ error: 'Khu vực không tồn tại' }, { status: 404 });
    }
    return NextResponse.json(area);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải thông tin khu vực' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedArea = await prisma.area.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        startTime: body.startTime,
        endTime: body.endTime,
        afternoonStartTime: body.afternoonStartTime,
        afternoonEndTime: body.afternoonEndTime,
        audioTemplate: body.audioTemplate,
        printHospitalName: body.printHospitalName,
        printGreeting: body.printGreeting,
        printFooter: body.printFooter,
        ticketResetType: body.ticketResetType,
      },
    });
    return NextResponse.json(updatedArea);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật khu vực' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Check if there are any desks associated
    const desks = await prisma.desk.count({ where: { areaId: Number(id) } });
    if (desks > 0) {
      return NextResponse.json({ error: 'Không thể xóa vì còn Bàn tiếp đón thuộc khu vực này' }, { status: 400 });
    }

    await prisma.area.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa khu vực' }, { status: 500 });
  }
}
