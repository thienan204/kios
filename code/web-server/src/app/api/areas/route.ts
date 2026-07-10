import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(areas);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải danh sách khu vực' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newArea = await prisma.area.create({
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
        ticketResetType: body.ticketResetType || 'ALL_DAY',
      },
    });
    return NextResponse.json(newArea);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi thêm mới khu vực' }, { status: 500 });
  }
}
