import { NextRequest } from 'next/server';
import { eventEmitter } from '@/lib/eventEmitter';

// Đây là API Server-Sent Events (SSE) để kết nối liên tục 1 chiều từ Server -> Client (Tivi)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const areaId = searchParams.get('areaId');

  if (!areaId) {
    return new Response('Missing areaId', { status: 400 });
  }

  // Khởi tạo luồng stream
  const stream = new ReadableStream({
    start(controller) {
      // Hàm nhận sự kiện từ bộ phát sóng
      const listener = (data: any) => {
        // Chỉ gửi sự kiện nếu đúng areaId mà Tivi này đang trực
        if (data.areaId === Number(areaId)) {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        }
      };

      // Đăng ký lắng nghe sự kiện 'call-ticket'
      eventEmitter.on('call-ticket', listener);

      // Gửi một tín hiệu ping ngay lập tức để mở luồng
      controller.enqueue(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);

      // Xử lý khi ngắt kết nối (Tắt trình duyệt)
      req.signal.addEventListener('abort', () => {
        eventEmitter.off('call-ticket', listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
