import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedDesk = await prisma.desk.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        areaId: Number(body.areaId),
        status: body.status,
      },
    });
    return NextResponse.json(updatedDesk);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật bàn tiếp đón' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    await prisma.desk.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa bàn tiếp đón' }, { status: 500 });
  }
}
