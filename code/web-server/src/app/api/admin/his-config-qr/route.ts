import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CONFIG_KEY = 'QR_KIOSK_HIS_CONFIG';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: CONFIG_KEY }
    });
    
    if (setting) {
      return NextResponse.json(JSON.parse(setting.value));
    }
    
    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải cấu hình' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    await prisma.systemSetting.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(data) },
      create: { key: CONFIG_KEY, value: JSON.stringify(data) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lưu cấu hình' }, { status: 500 });
  }
}
