import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.areaGroup.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { areas: true } }
      }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải danh sách nhóm' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Tên nhóm không được để trống' }, { status: 400 });
    }

    const newGroup = await prisma.areaGroup.create({
      data: { name },
    });
    return NextResponse.json(newGroup);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tên nhóm đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi thêm mới nhóm' }, { status: 500 });
  }
}
