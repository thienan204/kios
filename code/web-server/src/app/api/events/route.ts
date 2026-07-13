import { NextRequest } from 'next/server';
import { eventEmitter, activeAudioClients } from '@/lib/eventEmitter';

export const dynamic = 'force-dynamic';

// Đây là API Server-Sent Events (SSE) để kết nối liên tục 1 chiều từ Server -> Client (Tivi / Audio)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const areaId = searchParams.get('areaId');
  const type = searchParams.get('type');

  if (!areaId) {
    return new Response('Missing areaId', { status: 400 });
  }

  const areaIdNum = Number(areaId);

  // Khởi tạo luồng stream
  const stream = new ReadableStream({
    start(controller) {
      if (type === 'audio') {
        const count = activeAudioClients.get(areaIdNum) || 0;
        activeAudioClients.set(areaIdNum, count + 1);
      }

      // Hàm nhận sự kiện từ bộ phát sóng
      const listener = (data: any) => {
        // Chỉ gửi sự kiện nếu đúng areaId mà Tivi/Audio này đang trực
        if (data.areaId === areaIdNum) {
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

        if (type === 'audio') {
          const count = activeAudioClients.get(areaIdNum) || 0;
          activeAudioClients.set(areaIdNum, Math.max(0, count - 1));
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
