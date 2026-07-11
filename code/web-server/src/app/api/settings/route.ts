import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // @ts-ignore
    const settings = await prisma.systemSetting.findMany();
    const config = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Lỗi lấy cấu hình hệ thống:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Lưu từng key/value vào DB
    for (const key of Object.keys(data)) {
      // @ts-ignore
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(data[key]) },
        create: { key, value: String(data[key]) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi lưu cấu hình hệ thống:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
