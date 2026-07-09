import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'banner'

    if (!file) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy file' }, { status: 400 });
    }

    if (type !== 'logo' && type !== 'banner') {
      return NextResponse.json({ success: false, message: 'Loại file không hợp lệ' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Lưu vào thư mục public của web-server
    const publicDir = path.join(process.cwd(), 'public');
    
    // Đảm bảo thư mục tồn tại
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }

    // Luôn lưu với tên logo.png hoặc banner.png để ghi đè file cũ
    const fileName = `${type}.png`;
    const filePath = path.join(publicDir, fileName);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      message: 'Tải ảnh lên thành công!',
      url: `/${fileName}?v=${Date.now()}` 
    });
  } catch (error: any) {
    console.error('Lỗi upload file:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi xử lý file' }, { status: 500 });
  }
}
