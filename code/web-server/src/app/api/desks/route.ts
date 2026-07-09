import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const desks = await prisma.desk.findMany({
      orderBy: { id: 'asc' },
      include: { area: true }, // Include area details
    });
    return NextResponse.json(desks);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải danh sách bàn tiếp đón' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newDesk = await prisma.desk.create({
      data: {
        name: body.name,
        areaId: Number(body.areaId),
        status: body.status || 'ACTIVE',
      },
    });
    return NextResponse.json(newDesk);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi thêm mới bàn tiếp đón' }, { status: 500 });
  }
}
