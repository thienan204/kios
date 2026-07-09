import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const areaId = parseInt(id, 10);
    const body = await req.json();
    const { deviceType, deviceId } = body;

    if (!['kiosk', 'audio', 'tv'].includes(deviceType) || !deviceId) {
      return NextResponse.json({ success: false, message: 'Tham số không hợp lệ' }, { status: 400 });
    }

    const fieldName = `${deviceType}DeviceId` as 'kioskDeviceId' | 'audioDeviceId' | 'tvDeviceId';

    // 1. Dùng transaction để lấy lock an toàn (tránh race condition)
    const result = await prisma.$transaction(async (tx) => {
      const area = await tx.area.findUnique({
        where: { id: areaId },
        select: { id: true, [fieldName]: true }
      });

      if (!area) {
        throw new Error('Khu vực không tồn tại');
      }

      const currentDeviceId = area[fieldName];

      // Nếu chưa có ai khóa HOẶC chính thiết bị này đang giữ khóa
      if (!currentDeviceId || currentDeviceId === deviceId) {
        await tx.area.update({
          where: { id: areaId },
          data: { [fieldName]: deviceId }
        });
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Truy cập bị từ chối! Máy ${deviceType.toUpperCase()} của khu vực này đang được mở ở một thiết bị khác.` 
        };
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Device Lock Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const areaId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const deviceType = searchParams.get('type');

    if (!deviceType || !['kiosk', 'audio', 'tv', 'all'].includes(deviceType)) {
      return NextResponse.json({ success: false, message: 'Loại thiết bị không hợp lệ' }, { status: 400 });
    }

    let dataToUpdate: any = {};
    if (deviceType === 'all') {
      dataToUpdate = { kioskDeviceId: null, audioDeviceId: null, tvDeviceId: null };
    } else {
      dataToUpdate[`${deviceType}DeviceId`] = null;
    }

    await prisma.area.update({
      where: { id: areaId },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, message: 'Đã mở khóa thiết bị thành công' });
  } catch (error: any) {
    console.error('Unlock Device Error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi hệ thống' }, { status: 500 });
  }
}
