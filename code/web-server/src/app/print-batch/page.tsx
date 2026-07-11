'use client';

import React, { useEffect, useState } from 'react';

export default function PrintBatchPage() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    // Read tickets from session storage
    const data = sessionStorage.getItem('batch_tickets');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setTickets(parsed);
        // Clear it so it doesn't stay forever
        sessionStorage.removeItem('batch_tickets');
        
        // Wait for render then print
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (e) {
        console.error('Invalid ticket data');
      }
    } else {
      document.body.innerHTML = '<h1 style="text-align: center; margin-top: 50px;">Không có dữ liệu in</h1>';
    }
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8 print:py-0 print:bg-white">
      <div className="print:hidden mb-4 bg-white p-4 rounded shadow">
        <p className="font-bold text-lg">Đang chuẩn bị in {tickets.length} phiếu...</p>
        <p className="text-sm text-gray-500">Hộp thoại in sẽ tự động hiện lên. Hoặc bạn có thể bấm Ctrl+P.</p>
        <button 
          onClick={() => window.print()} 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          In Lại
        </button>
      </div>

      <div className="w-[80mm] print:w-full flex flex-col items-center">
        {tickets.map((t, i) => (
          <div 
            key={i} 
            className="w-full text-center font-sans text-black bg-white px-2 py-4 mb-4 border border-gray-300 print:border-none print:mb-0"
            style={{ pageBreakAfter: 'always' }}
          >
            <h2 className="text-lg font-bold uppercase mb-1">{t.area}</h2>
            {t.printHospitalName && (
              <p className="text-xs mb-2">{t.printHospitalName}</p>
            )}
            <hr className="border-black border-dashed mb-2" />
            
            {t.printGreeting && (
              <p className="text-sm">{t.printGreeting}</p>
            )}
            <div className="text-6xl font-black my-2">{t.number}</div>
            
            <hr className="border-black border-dashed my-2" />
            <p className="text-xs mb-1">Thời gian: {t.time}</p>
            <p className="text-xs font-bold">Số người đang chờ: {t.waiting}</p>
            
            {t.printFooter && (
              <p className="text-[10px] mt-4 italic">{t.printFooter}</p>
            )}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body {
            background: white !important;
          }
        }
      `}} />
    </div>
  );
}
