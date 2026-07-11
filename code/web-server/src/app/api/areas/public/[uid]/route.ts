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

    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'validPhonePrefixes' }
    }).catch(() => null);

    const validPhonePrefixes = setting ? JSON.parse(setting.value) : null;

    return NextResponse.json({
      ...area,
      validPhonePrefixes
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khu vực theo uid:', error);
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
