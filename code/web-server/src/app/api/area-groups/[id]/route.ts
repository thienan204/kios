import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Tên nhóm không được để trống' }, { status: 400 });
    }

    const updatedGroup = await prisma.areaGroup.update({
      where: { id: Number(id) },
      data: { name },
    });
    return NextResponse.json(updatedGroup);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tên nhóm đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi cập nhật nhóm' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if any areas use this group
    const areasUsingGroup = await prisma.area.count({
      where: { groupId: Number(id) }
    });

    if (areasUsingGroup > 0) {
      return NextResponse.json({ error: `Không thể xóa nhóm này vì đang có ${areasUsingGroup} khu vực sử dụng.` }, { status: 400 });
    }

    await prisma.areaGroup.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa nhóm' }, { status: 500 });
  }
}
