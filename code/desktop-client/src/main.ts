import './style.css';

// Khai báo kiểu cho electronAPI
declare global {
  interface Window {
    electronAPI: {
      onCallNext: (callback: () => void) => void;
      onRecall: (callback: () => void) => void;
      onSkip: (callback: () => void) => void;
      onPause: (callback: () => void) => void;
      removeCallNext: () => void;
    };
  }
}

let currentDeskId: string | null = localStorage.getItem('kiosk_desk_id');
let serverUrl: string = import.meta.env.VITE_SERVER_URL || localStorage.getItem('kiosk_server_url') || 'http://localhost:3000';

const appDiv = document.querySelector<HTMLDivElement>('#app')!;

function getShortcuts() {
  return {
    callNext: localStorage.getItem('kiosk_shortcut_callNext') || 'Alt+1',
    recall: localStorage.getItem('kiosk_shortcut_recall') || 'Alt+2',
    skip: localStorage.getItem('kiosk_shortcut_skip') || 'Alt+3',
    pause: localStorage.getItem('kiosk_shortcut_pause') || 'Alt+4',
  };
}

async function fetchDesksList(url: string) {
  try {
    const res = await fetch(`${url}/api/desks`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

function renderConfig() {
  appDiv.innerHTML = `
    <div class="p-6 h-full flex flex-col justify-center bg-gray-100">
      <h2 class="text-xl font-bold text-center text-blue-800 mb-6">CẤU HÌNH BÀN TIẾP ĐÓN</h2>
      
      <label class="block text-sm font-semibold mb-1">URL Máy chủ (Kèm port):</label>
      <div class="flex gap-2 mb-4">
        <input id="serverUrlInput" type="text" value="${serverUrl}" class="flex-1 p-2 border rounded bg-gray-200 text-gray-500 cursor-not-allowed focus:outline-none" readonly title="Cấu hình hệ thống mặc định (Không thể sửa)" />
        <button id="loadDesksBtn" class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-semibold px-3 rounded border border-blue-300 transition-colors cursor-pointer">Tải lại</button>
      </div>
      
      <label class="block text-sm font-semibold mb-1">Chọn Bàn tiếp đón:</label>
      <select id="deskIdSelect" class="w-full p-2 border rounded mb-2 focus:outline-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed" disabled>
        <option value="">-- Vui lòng ấn Kết nối máy chủ --</option>
      </select>
      
      <label class="block text-sm font-semibold mb-1 mt-2 text-gray-700">Cấu hình Phím tắt:</label>
      <div class="grid grid-cols-2 gap-2 mb-6 text-sm">
        <div>
          <span class="text-xs text-gray-500">Gọi tiếp theo</span>
          <input id="scCallNext" type="text" class="w-full p-1 border rounded" value="${getShortcuts().callNext}" />
        </div>
        <div>
          <span class="text-xs text-gray-500">Gọi lại số</span>
          <input id="scRecall" type="text" class="w-full p-1 border rounded" value="${getShortcuts().recall}" />
        </div>
        <div>
          <span class="text-xs text-gray-500">Bỏ qua luôn</span>
          <input id="scSkip" type="text" class="w-full p-1 border rounded" value="${getShortcuts().skip}" />
        </div>
        <div>
          <span class="text-xs text-gray-500">Kết thúc phiên</span>
          <input id="scPause" type="text" class="w-full p-1 border rounded" value="${getShortcuts().pause}" />
        </div>
      </div>
      
      <button id="saveConfigBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>LƯU CẤU HÌNH</button>
      
      <p id="configMsg" class="text-center text-sm mt-2 h-4"></p>
    </div>
  `;

  const loadDesksBtn = document.getElementById('loadDesksBtn');
  const deskIdSelect = document.getElementById('deskIdSelect') as HTMLSelectElement;
  const saveConfigBtn = document.getElementById('saveConfigBtn') as HTMLButtonElement;
  const serverUrlInput = document.getElementById('serverUrlInput') as HTMLInputElement;
  const configMsg = document.getElementById('configMsg')!;

  loadDesksBtn?.addEventListener('click', async () => {
    configMsg.textContent = 'Đang tải danh sách bàn...';
    configMsg.className = 'text-center text-sm text-blue-500 mt-2 h-4';
    
    const url = serverUrlInput.value.replace(/\/$/, "");
    const desks = await fetchDesksList(url);
    
    if (desks && Array.isArray(desks)) {
      deskIdSelect.innerHTML = desks.map((d: any) => 
        `<option value="${d.id}">${d.name} (${d.area?.name || 'Khu vực không rõ'})</option>`
      ).join('');
      
      deskIdSelect.disabled = false;
      saveConfigBtn.disabled = false;
      configMsg.textContent = 'Kết nối thành công!';
      configMsg.className = 'text-center text-sm text-green-600 mt-2 h-4';
      
      if (currentDeskId) deskIdSelect.value = currentDeskId;
    } else {
      configMsg.textContent = 'Lỗi kết nối máy chủ hoặc API';
      configMsg.className = 'text-center text-sm text-red-500 mt-2 h-4';
      deskIdSelect.innerHTML = '<option value="">-- Vui lòng ấn Kết nối máy chủ --</option>';
      deskIdSelect.disabled = true;
      saveConfigBtn.disabled = true;
    }
  });

  saveConfigBtn?.addEventListener('click', () => {
    const sUrl = serverUrlInput.value.replace(/\/$/, "");
    const dId = deskIdSelect.value;
    const dName = deskIdSelect.options[deskIdSelect.selectedIndex].text;
    
    if (sUrl && dId) {
      localStorage.setItem('kiosk_server_url', sUrl);
      localStorage.setItem('kiosk_desk_id', dId);
      localStorage.setItem('kiosk_desk_name', dName);
      
      localStorage.setItem('kiosk_shortcut_callNext', (document.getElementById('scCallNext') as HTMLInputElement).value);
      localStorage.setItem('kiosk_shortcut_recall', (document.getElementById('scRecall') as HTMLInputElement).value);
      localStorage.setItem('kiosk_shortcut_skip', (document.getElementById('scSkip') as HTMLInputElement).value);
      localStorage.setItem('kiosk_shortcut_pause', (document.getElementById('scPause') as HTMLInputElement).value);

      currentDeskId = dId;
      serverUrl = sUrl;
      renderApp();
    }
  });

  // Tự động load lần đầu
  setTimeout(() => loadDesksBtn?.click(), 100);
}

function renderApp() {
  const sc = getShortcuts();
  
  // Áp dụng phím tắt vào Electron main process
  if (window.electronAPI && (window.electronAPI as any).setShortcuts) {
    (window.electronAPI as any).setShortcuts(sc);
  }

  appDiv.innerHTML = `
    <div class="h-full flex flex-col bg-slate-50 border-4 border-slate-300 rounded-xl overflow-hidden shadow-2xl relative">
      <div class="bg-blue-800 text-white p-3 flex justify-between items-center shadow-md z-10 relative">
        <span class="font-bold text-sm truncate pr-2 flex-1 text-left" title="${localStorage.getItem('kiosk_desk_name') || `BÀN SỐ ${currentDeskId}`}">
          ${localStorage.getItem('kiosk_desk_name') || `BÀN SỐ ${currentDeskId}`}
        </span>
        <div class="flex gap-2">
          <button id="toggleSpecificBtn" class="text-xs bg-blue-600 border border-blue-500 text-white px-2 py-1 rounded hover:bg-blue-500 transition-colors" title="Gọi số chỉ định thủ công">+ Số</button>
          <button id="configBtn" class="text-xs bg-white text-blue-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors">Đổi</button>
        </div>
      </div>
      
      <div id="specificCallContainer" class="hidden flex gap-2 w-full p-2 items-center bg-blue-50 border-b border-blue-200 shadow-inner z-0">
        <input type="number" id="specificNumberInput" placeholder="Số..." class="w-16 p-1.5 rounded border border-blue-300 text-center font-bold text-blue-900 focus:outline-blue-500 text-sm" min="1" />
        <button id="callSpecificBtn" class="flex-1 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 active:from-blue-700 active:to-blue-800 text-white font-bold py-1.5 rounded shadow-sm active:translate-y-0.5 transition-all text-xs">
          GỌI SỐ NÀY
        </button>
      </div>
      
      <div class="flex-1 flex flex-col items-center justify-center p-4 relative">
        <p class="text-gray-500 text-xs font-medium tracking-wide uppercase mb-1">Đang gọi số</p>
        <div id="currentNumber" class="text-6xl font-black text-blue-900 drop-shadow-sm mb-4 transition-all duration-300 transform">
          ---
        </div>
        
        <button id="callBtn" class="w-full relative overflow-hidden group bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 active:from-blue-800 active:to-blue-900 text-white font-black text-lg py-4 rounded-xl shadow-[0_6px_0_rgb(30,58,138)] active:shadow-[0_0px_0_rgb(30,58,138)] active:translate-y-1.5 transition-all">
          <span class="relative z-10">GỌI TIẾP THEO</span>
          <span class="block text-[10px] font-normal opacity-75 mt-0.5 relative z-10">(${sc.callNext})</span>
        </button>
        
        <div class="flex gap-2 w-full mt-3">
          <button id="recallBtn" class="flex-1 bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 active:from-orange-600 active:to-orange-700 text-white font-bold py-2 rounded-lg shadow-[0_4px_0_rgb(194,65,12)] active:shadow-[0_0px_0_rgb(194,65,12)] active:translate-y-1 transition-all text-xs">
            GỌI LẠI SỐ
            <span class="block text-[9px] font-normal opacity-80">(${sc.recall})</span>
          </button>
          
          <button id="skipBtn" class="flex-1 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 active:from-red-700 active:to-red-800 text-white font-bold py-2 rounded-lg shadow-[0_4px_0_rgb(153,27,27)] active:shadow-[0_0px_0_rgb(153,27,27)] active:translate-y-1 transition-all text-xs">
            BỎ QUA LUÔN
            <span class="block text-[9px] font-normal opacity-80">(${sc.skip})</span>
          </button>
        </div>


        <button id="pauseBtn" class="w-full mt-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 font-bold py-2 rounded-lg border border-gray-400 shadow-sm active:translate-y-1 transition-all text-xs">
          KẾT THÚC / DỪNG TIẾP ĐÓN (${sc.pause})
        </button>
        
        <p id="statusMsg" class="mt-2 text-xs font-semibold text-center h-4 text-red-500"></p>
      </div>
    </div>
  `;

  document.getElementById('configBtn')?.addEventListener('click', () => {
    renderConfig();
  });

  const callBtn = document.getElementById('callBtn') as HTMLButtonElement;
  callBtn?.addEventListener('click', callNextTicket);

  const recallBtn = document.getElementById('recallBtn') as HTMLButtonElement;
  recallBtn?.addEventListener('click', recallTicket);

  const skipBtn = document.getElementById('skipBtn') as HTMLButtonElement;
  skipBtn?.addEventListener('click', skipTicket);

  const toggleSpecificBtn = document.getElementById('toggleSpecificBtn') as HTMLButtonElement;
  const specificCallContainer = document.getElementById('specificCallContainer') as HTMLDivElement;
  const specificNumberInput = document.getElementById('specificNumberInput') as HTMLInputElement;

  toggleSpecificBtn?.addEventListener('click', () => {
    specificCallContainer.classList.toggle('hidden');
    if (!specificCallContainer.classList.contains('hidden')) {
      specificNumberInput.focus();
    }
  });

  const callSpecificBtn = document.getElementById('callSpecificBtn') as HTMLButtonElement;
  callSpecificBtn?.addEventListener('click', callSpecificTicket);

  const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
  pauseBtn?.addEventListener('click', pauseTicket);

  // Lấy số đang gọi hiện tại
  fetchCurrentTicket();
}

async function fetchCurrentTicket() {
  const currentNumberEl = document.getElementById('currentNumber');
  if (!currentNumberEl) return;
  
  try {
    const res = await fetch(`${serverUrl}/api/tickets/current?deskId=${currentDeskId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ticket) {
        currentNumberEl.textContent = data.ticket.ticketNumber;
      }
    }
  } catch (err) {
    console.error('Không thể lấy số hiện tại', err);
  }
}

let isCalling = false;

async function recallTicket() {
  if (isCalling) return;
  isCalling = true;
  const statusMsg = document.getElementById('statusMsg')!;
  statusMsg.textContent = 'Đang phát lại âm thanh...';
  statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-blue-500";
  
  try {
    const res = await fetch(`${serverUrl}/api/tickets/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: currentDeskId }),
    });
    const data = await res.json();
    if (res.ok && !data.empty) {
      statusMsg.textContent = 'Đã phát lại âm thanh!';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-green-600";
    } else {
      statusMsg.textContent = data.message || data.error;
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-orange-500";
    }
  } catch (err) {
    statusMsg.textContent = 'Lỗi kết nối máy chủ';
    statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
  } finally {
    isCalling = false;
    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  }
}

async function skipTicket() {
  if (isCalling) return;
  isCalling = true;
  const statusMsg = document.getElementById('statusMsg')!;
  const currentNumberEl = document.getElementById('currentNumber')!;
  
  statusMsg.textContent = 'Đang bỏ qua...';
  statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-blue-500";
  
  try {
    const res = await fetch(`${serverUrl}/api/tickets/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: currentDeskId }),
    });
    const data = await res.json();
    if (res.ok && !data.empty) {
      statusMsg.textContent = 'Đã bỏ qua bệnh nhân!';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-600";
      currentNumberEl.textContent = '---'; // Reset UI
    } else {
      statusMsg.textContent = data.message || data.error;
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-orange-500";
    }
  } catch (err) {
    statusMsg.textContent = 'Lỗi kết nối máy chủ';
    statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
  } finally {
    isCalling = false;
    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  }
}

async function callSpecificTicket() {
  if (isCalling) return;
  const input = document.getElementById('specificNumberInput') as HTMLInputElement;
  const num = input?.value;
  if (!num) return;

  isCalling = true;
  
  const statusMsg = document.getElementById('statusMsg')!;
  const currentNumberEl = document.getElementById('currentNumber')!;
  
  statusMsg.textContent = 'Đang gọi số chỉ định...';
  statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-blue-500";
  
  try {
    const res = await fetch(`${serverUrl}/api/tickets/call-specific`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: currentDeskId, ticketNumber: num }),
    });

    const data = await res.json();
    
    if (res.ok) {
      currentNumberEl.textContent = data.ticket.ticketNumber;
      currentNumberEl.classList.add('scale-125', 'text-indigo-600');
      setTimeout(() => {
        currentNumberEl.classList.remove('scale-125', 'text-indigo-600');
      }, 300);
      
      statusMsg.textContent = `Đã gọi số ${data.ticket.ticketNumber} thành công!`;
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-green-600";
      input.value = ''; // clear input
      
      // Ẩn lại sau khi gọi thành công
      const specificCallContainer = document.getElementById('specificCallContainer');
      if (specificCallContainer) {
        specificCallContainer.classList.add('hidden');
      }
    } else {
      statusMsg.textContent = data.error || 'Lỗi hệ thống';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
    }
  } catch (err) {
    statusMsg.textContent = 'Lỗi kết nối máy chủ';
    statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
  } finally {
    isCalling = false;
    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  }
}

async function pauseTicket() {
  if (isCalling) return;
  isCalling = true;
  const statusMsg = document.getElementById('statusMsg')!;
  const currentNumberEl = document.getElementById('currentNumber')!;
  
  statusMsg.textContent = 'Đang kết thúc phiên...';
  statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-blue-500";
  
  try {
    const res = await fetch(`${serverUrl}/api/tickets/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: currentDeskId }),
    });
    
    if (res.ok) {
      statusMsg.textContent = 'Đã kết thúc phiên (Lưu trạng thái Hoàn thành)!';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-green-600";
      currentNumberEl.textContent = '---'; // Reset UI
    } else {
      const data = await res.json();
      statusMsg.textContent = data.message || data.error || 'Lỗi hệ thống';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-orange-500";
    }
  } catch (err) {
    statusMsg.textContent = 'Lỗi kết nối máy chủ';
    statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
  } finally {
    isCalling = false;
    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  }
}

async function callNextTicket() {
  if (isCalling) return;
  isCalling = true;
  
  const callBtn = document.getElementById('callBtn') as HTMLButtonElement;
  const statusMsg = document.getElementById('statusMsg')!;
  const currentNumberEl = document.getElementById('currentNumber')!;
  
  if (callBtn) {
    callBtn.style.opacity = '0.7';
    callBtn.style.pointerEvents = 'none';
  }
  statusMsg.textContent = 'Đang kết nối...';
  statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-blue-500";
  
  try {
    const res = await fetch(`${serverUrl}/api/tickets/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: currentDeskId }),
    });

    const data = await res.json();
    
    if (res.ok) {
      if (data.empty) {
        statusMsg.textContent = 'Đã hết bệnh nhân đang chờ!';
        statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-orange-500";
      } else {
        // Cập nhật số
        currentNumberEl.textContent = data.ticket.ticketNumber;
        // Hiệu ứng scale
        currentNumberEl.classList.add('scale-125', 'text-green-600');
        setTimeout(() => {
          currentNumberEl.classList.remove('scale-125', 'text-green-600');
        }, 300);
        
        statusMsg.textContent = 'Đã gọi số thành công';
        statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-green-600";
      }
    } else {
      statusMsg.textContent = data.error || 'Lỗi hệ thống';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
    }
  } catch (err) {
    statusMsg.textContent = 'Lỗi kết nối máy chủ';
    statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
  } finally {
    isCalling = false;
    if (callBtn) {
      callBtn.style.opacity = '1';
      callBtn.style.pointerEvents = 'auto';
    }
    // Tự xóa thông báo sau 3s
    setTimeout(() => {
      if (statusMsg.textContent !== 'Đã hết bệnh nhân đang chờ!') {
        statusMsg.textContent = '';
      }
    }, 3000);
  }
}

// Khởi tạo
if (!currentDeskId) {
  renderConfig();
} else {
  renderApp();
}

// Lắng nghe sự kiện từ phím tắt toàn cục (Electron IPC)
if (window.electronAPI) {
  window.electronAPI.onCallNext(() => {
    if (currentDeskId) callNextTicket();
  });
  window.electronAPI.onRecall?.(() => {
    if (currentDeskId) recallTicket();
  });
  window.electronAPI.onSkip?.(() => {
    if (currentDeskId) skipTicket();
  });
  window.electronAPI.onPause?.(() => {
    if (currentDeskId) pauseTicket();
  });
}
