import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Kiểm tra xem đã có tài khoản nào chưa
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      return NextResponse.json({ 
        message: 'Hệ thống đã được khởi tạo tài khoản từ trước, không cần tạo lại.' 
      });
    }

    // Nếu chưa có, tạo tài khoản admin mặc định
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        role: 'SUPER_ADMIN',
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Tạo tài khoản admin thành công!',
      username: admin.username 
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Lỗi khởi tạo tài khoản' }, { status: 500 });
  }
}
