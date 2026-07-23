import { useEffect, useRef } from 'react';
import { message } from 'antd';

interface UseBarcodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
}

export const useBarcodeScanner = ({ onScan, onError }: UseBarcodeScannerProps) => {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua các sự kiện khi đang ở trong thẻ input hoặc textarea để tránh xung đột
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // Nếu thời gian giữa 2 phím quá lâu (> 50ms), đây là người gõ tay chứ không phải máy quét
      // Ngoại trừ phím đầu tiên (lastKeyTimeRef.current === 0)
      if (lastKeyTimeRef.current !== 0 && currentTime - lastKeyTimeRef.current > 50) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        // Phím Enter kết thúc quá trình quét
        if (bufferRef.current.length > 0) {
          const scannedData = bufferRef.current;
          bufferRef.current = '';
          lastKeyTimeRef.current = 0;
          
          try {
            onScan(scannedData);
          } catch (err) {
            if (onError && err instanceof Error) {
              onError(err);
            } else {
              console.error('Lỗi khi xử lý mã QR:', err);
              message.error('Mã QR không hợp lệ hoặc lỗi xử lý.');
            }
          }
        }
        return;
      }

      // Chỉ gom các ký tự in được (loại bỏ Shift, Ctrl, Alt...)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, onError]);
};
