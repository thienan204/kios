import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventEmitter } from '@/lib/eventEmitter';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const area = await prisma.area.findUnique({ where: { id } });
    if (!area) return NextResponse.json({ error: 'Không tìm thấy khu vực' }, { status: 404 });

    return NextResponse.json({ isIssuePaused: area.isIssuePaused });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy trạng thái' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isPaused } = await req.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID khu vực không hợp lệ' }, { status: 400 });
    }

    const updatedArea = await prisma.area.update({
      where: { id },
      data: { isIssuePaused: isPaused },
    });

    // Bắn event để màn hình Kiosk tự động cập nhật nút bấm nếu cần
    eventEmitter.emit('issue-pause-toggled', { areaId: id, isPaused });

    return NextResponse.json({
      success: true,
      area: updatedArea,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái cấp số:', error);
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái' }, { status: 500 });
  }
}
