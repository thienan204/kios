import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Chỉ lấy 1 bản ghi cấu hình đầu tiên (vì HIS config thường là global)
    let config = await prisma.selfRegHISConfig.findFirst();
    
    if (!config) {
      // Nếu chưa có, tạo mặc định một cái rỗng
      config = await prisma.selfRegHISConfig.create({
        data: {
          endpointUrl: '',
          httpMethod: 'POST',
          headers: '{"Content-Type": "application/json"}',
          fieldMapping: '{}',
          formLayout: '[]'
        }
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching HIS config:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy cấu hình HIS' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpointUrl, httpMethod, headers, fieldMapping, formLayout } = body;
    
    // Tìm config hiện tại
    const config = await prisma.selfRegHISConfig.findFirst();
    
    if (config) {
      const updatedConfig = await prisma.selfRegHISConfig.update({
        where: { id: config.id },
        data: { endpointUrl, httpMethod, headers, fieldMapping, formLayout }
      });
      return NextResponse.json(updatedConfig);
    } else {
      const newConfig = await prisma.selfRegHISConfig.create({
        data: { endpointUrl, httpMethod, headers, fieldMapping, formLayout }
      });
      return NextResponse.json(newConfig);
    }
  } catch (error) {
    console.error('Error saving HIS config:', error);
    return NextResponse.json({ error: 'Lỗi khi lưu cấu hình HIS' }, { status: 500 });
  }
}
