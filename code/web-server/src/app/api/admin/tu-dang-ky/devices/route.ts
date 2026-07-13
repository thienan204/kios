import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const devices = await prisma.selfRegDevice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách thiết bị' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ipAddress, macAddress, location, status, allowBHYT, allowService, readerModel, cameraModel } = body;
    
    const newDevice = await prisma.selfRegDevice.create({
      data: {
        name,
        ipAddress,
        macAddress,
        location,
        readerModel,
        cameraModel,
        status: status || 'OFFLINE',
        allowBHYT: allowBHYT ?? true,
        allowService: allowService ?? true
      }
    });
    return NextResponse.json(newDevice);
  } catch (error: any) {
    console.error('Error creating device:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Địa chỉ MAC này đã được đăng ký cho Kiosk khác!' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Lỗi khi tạo thiết bị' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, ipAddress, macAddress, location, status, allowBHYT, allowService, readerModel, cameraModel } = body;
    
    const updatedDevice = await prisma.selfRegDevice.update({
      where: { id: Number(id) },
      data: {
        name,
        ipAddress,
        macAddress,
        location,
        readerModel,
        cameraModel,
        status,
        allowBHYT,
        allowService
      }
    });
    return NextResponse.json(updatedDevice);
  } catch (error: any) {
    console.error('Error updating device:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Địa chỉ MAC này đã được đăng ký cho Kiosk khác!' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Lỗi khi cập nhật thiết bị' }, { status: 500 });
  }
}
