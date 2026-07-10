import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const resolvedParams = await params;
    const area = await prisma.area.findUnique({
      where: { uid: resolvedParams.uid },
    });

    if (!area) {
      return NextResponse.json(
        { error: 'Khu vực không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json(area);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khu vực theo uid:', error);
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
