import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { password, role, isActive } = await req.json();

    const dataToUpdate: any = {};
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    if (role) dataToUpdate.role = role;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: parseInt(resolvedParams.id) },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật tài khoản' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.user.delete({
      where: { id: parseInt(resolvedParams.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Lỗi xóa tài khoản' }, { status: 500 });
  }
}
