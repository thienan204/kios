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
const LAN_URL: string = import.meta.env.VITE_LAN_URL || 'http://192.168.3.98:3002/kios';
const WAN_URL: string = import.meta.env.VITE_WAN_URL || 'https://htqlbenhvien.bvdklangson.com.vn:201/kios';
let serverUrl: string = localStorage.getItem('kiosk_server_url') || LAN_URL;

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
      
      <label id="secretUnlockLabel" class="block text-sm font-semibold mb-1 select-none cursor-default">Mạng kết nối (URL Máy chủ):</label>
      <div class="flex gap-2 mb-4">
        <input id="serverUrlInput" type="text" value="${serverUrl}" placeholder="Nhập địa chỉ..." class="flex-1 p-2 border rounded bg-white text-gray-800 focus:outline-blue-500" />
        <button id="loadDesksBtn" class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-semibold px-3 rounded border border-blue-300 transition-colors cursor-pointer">Tải lại</button>
      </div>
      
      <label class="block text-sm font-semibold mb-1">Chọn Khu vực:</label>
      <select id="areaIdSelect" class="w-full p-2 border rounded mb-4 focus:outline-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed" disabled>
        <option value="">-- Vui lòng ấn Kết nối máy chủ --</option>
      </select>

      <label class="block text-sm font-semibold mb-1">Chọn Bàn tiếp đón:</label>
      <select id="deskIdSelect" class="w-full p-2 border rounded mb-2 focus:outline-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed" disabled>
        <option value="">-- Vui lòng chọn Khu vực trước --</option>
      </select>
      
      <label class="block text-sm font-semibold mb-1 mt-2 text-gray-700">Cấu hình Phím tắt:</label>
      <div class="grid grid-cols-2 gap-2 mb-6 text-sm">
        <div>
          <span class="text-xs text-gray-500">Gọi tiếp theo</span>
          <input id="scCallNext" type="text" class="w-full p-1 border rounded shortcut-input" placeholder="Nhấn phím..." readonly value="${getShortcuts().callNext}" />
        </div>
        <div>
          <span class="text-xs text-gray-500">Gọi lại số</span>
          <input id="scRecall" type="text" class="w-full p-1 border rounded shortcut-input" placeholder="Nhấn phím..." readonly value="${getShortcuts().recall}" />
        </div>
        <div>
          <span class="text-xs text-gray-500">Bỏ qua luôn</span>
          <input id="scSkip" type="text" class="w-full p-1 border rounded shortcut-input" placeholder="Nhấn phím..." readonly value="${getShortcuts().skip}" />
        </div>
        <div>
          <span class="text-xs text-gray-500">Kết thúc phiên</span>
          <input id="scPause" type="text" class="w-full p-1 border rounded shortcut-input" placeholder="Nhấn phím..." readonly value="${getShortcuts().pause}" />
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

  const areaIdSelect = document.getElementById('areaIdSelect') as HTMLSelectElement;
  let allDesks: any[] = [];

  // Xử lý sự kiện nhấn phím cho các ô cấu hình phím tắt
  const shortcutInputs = document.querySelectorAll<HTMLInputElement>('.shortcut-input');
  shortcutInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      e.preventDefault();
      
      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Command');
      
      // Bỏ qua nếu chỉ nhấn phím modifier
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        input.value = keys.join('+') + '+...';
        return;
      }
      
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      if (keyName.length === 1) keyName = keyName.toUpperCase();
      
      keys.push(keyName);
      input.value = keys.join('+');
    });

    // Cho phép dùng phím Backspace/Delete để xóa phím tắt
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        input.value = '';
      }
    });
  });

  function renderDesksForArea(areaId: string | number) {
    const filteredDesks = allDesks.filter(d => String(d.area?.id || d.areaId) === String(areaId));
    deskIdSelect.innerHTML = '<option value="">-- Chọn Bàn --</option>' + 
      filteredDesks.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    
    deskIdSelect.disabled = false;
    
    if (currentDeskId && filteredDesks.find(d => String(d.id) === String(currentDeskId))) {
      deskIdSelect.value = currentDeskId;
      saveConfigBtn.disabled = false;
    } else {
      deskIdSelect.value = "";
      saveConfigBtn.disabled = true;
    }
  }

  loadDesksBtn?.addEventListener('click', async () => {
    if (!loadDesksBtn || !serverUrlInput) return;
    
    configMsg.textContent = 'Đang kết nối...';
    configMsg.className = 'text-center text-sm text-blue-500 mt-2 h-4';
    
    // Khóa tạm nút trong lúc tải
    (loadDesksBtn as HTMLButtonElement).disabled = true;
    (serverUrlInput as HTMLInputElement).disabled = true;
    
    const url = serverUrlInput.value.replace(/\/$/, "");
    const desks = await fetchDesksList(url);
    
    if (desks && Array.isArray(desks)) {
      allDesks = desks;
      
      const areasMap = new Map();
      desks.forEach(d => {
        if (d.area) areasMap.set(String(d.area.id), d.area.name);
      });
      
      areaIdSelect.innerHTML = '<option value="">-- Chọn Khu vực --</option>' + 
        Array.from(areasMap.entries()).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
      
      areaIdSelect.disabled = false;
      
      const savedAreaId = localStorage.getItem('kiosk_area_id');
      if (savedAreaId && areasMap.has(savedAreaId)) {
        areaIdSelect.value = savedAreaId;
        renderDesksForArea(savedAreaId);
      } else {
        deskIdSelect.innerHTML = '<option value="">-- Vui lòng chọn Khu vực --</option>';
        deskIdSelect.disabled = true;
        saveConfigBtn.disabled = true;
      }

      configMsg.textContent = 'Kết nối thành công!';
      configMsg.className = 'text-center text-sm font-bold text-green-600 mt-2 h-4';
      
      // Giữ trạng thái mờ (disabled) khi thành công
      serverUrlInput.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
      serverUrlInput.classList.remove('bg-white', 'text-gray-800');
      loadDesksBtn.classList.add('opacity-50', 'cursor-not-allowed');
      
    } else {
      configMsg.textContent = 'Lỗi kết nối máy chủ hoặc API';
      configMsg.className = 'text-center text-sm text-red-500 mt-2 h-4';
      areaIdSelect.innerHTML = '<option value="">-- Vui lòng ấn Tải lại --</option>';
      areaIdSelect.disabled = true;
      deskIdSelect.innerHTML = '<option value="">-- Vui lòng ấn Tải lại --</option>';
      deskIdSelect.disabled = true;
      saveConfigBtn.disabled = true;
      
      // Mở khóa lại để nhập lại nếu lỗi
      (loadDesksBtn as HTMLButtonElement).disabled = false;
      (serverUrlInput as HTMLInputElement).disabled = false;
    }
  });

  areaIdSelect?.addEventListener('change', () => {
    const aid = areaIdSelect.value;
    if (aid) {
      localStorage.setItem('kiosk_area_id', aid);
      renderDesksForArea(aid);
    } else {
      deskIdSelect.innerHTML = '<option value="">-- Vui lòng chọn Khu vực --</option>';
      deskIdSelect.disabled = true;
      saveConfigBtn.disabled = true;
    }
  });

  deskIdSelect?.addEventListener('change', () => {
    if (deskIdSelect.value) {
      saveConfigBtn.disabled = false;
    } else {
      saveConfigBtn.disabled = true;
    }
  });

  let clickCount = 0;
  let clickTimer: any = null;
  
  document.getElementById('secretUnlockLabel')?.addEventListener('click', () => {
    clickCount++;
    if (clickCount >= 3) {
      serverUrlInput.disabled = false;
      serverUrlInput.classList.remove('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
      serverUrlInput.classList.add('bg-white', 'text-gray-800');
      
      if (loadDesksBtn) {
        (loadDesksBtn as HTMLButtonElement).disabled = false;
        loadDesksBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      
      configMsg.textContent = '🔓 Đã mở khóa cấu hình mạng!';
      configMsg.className = 'text-center text-sm font-bold text-orange-600 mt-2 h-4';
      clickCount = 0;
    }
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
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
          <button id="pauseIssueBtn" class="text-[10px] bg-slate-600 border border-slate-500 text-white px-2 py-1 rounded hover:bg-slate-500 transition-colors hidden" title="Tạm dừng cấp số cho toàn khu vực">Đang tải...</button>
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

  const pauseIssueBtn = document.getElementById('pauseIssueBtn') as HTMLButtonElement;
  pauseIssueBtn?.addEventListener('click', togglePauseIssue);

  // Lấy trạng thái Tạm dừng cấp số của khu vực
  fetchAreaStatus();

  // Lấy số đang gọi hiện tại
  fetchCurrentTicket();
}

let isIssuePaused = false;
let currentAreaId = localStorage.getItem('kiosk_area_id');

async function fetchAreaStatus() {
  if (!currentAreaId) return;
  const btn = document.getElementById('pauseIssueBtn');
  if (!btn) return;

  try {
    const res = await fetch(`${serverUrl}/api/areas/${currentAreaId}/pause-issue`);
    if (res.ok) {
      const data = await res.json();
      isIssuePaused = data.isIssuePaused || false;
      updatePauseIssueBtnUI();
      btn.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Không thể lấy trạng thái khu vực', err);
  }
}

function updatePauseIssueBtnUI() {
  const btn = document.getElementById('pauseIssueBtn');
  if (!btn) return;
  if (isIssuePaused) {
    btn.textContent = '⏸ Đang DỪNG cấp số';
    btn.className = 'text-[10px] bg-red-600 font-bold border border-red-500 text-white px-2 py-1 rounded hover:bg-red-500 transition-colors animate-pulse';
  } else {
    btn.textContent = 'Tạm dừng cấp số';
    btn.className = 'text-[10px] bg-slate-600 border border-slate-500 text-white px-2 py-1 rounded hover:bg-slate-500 transition-colors';
  }
}

async function togglePauseIssue() {
  if (!currentAreaId) return;
  const statusMsg = document.getElementById('statusMsg')!;
  const btn = document.getElementById('pauseIssueBtn') as HTMLButtonElement;
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`${serverUrl}/api/areas/${currentAreaId}/pause-issue`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaused: !isIssuePaused }),
    });

    if (res.ok) {
      isIssuePaused = !isIssuePaused;
      updatePauseIssueBtnUI();
      statusMsg.textContent = isIssuePaused ? 'Đã tạm dừng cấp số cho khu vực này!' : 'Đã mở lại cấp số!';
      statusMsg.className = `mt-4 text-sm font-semibold text-center h-5 ${isIssuePaused ? 'text-orange-600' : 'text-green-600'}`;
    } else {
      statusMsg.textContent = 'Lỗi cập nhật trạng thái';
      statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
    }
  } catch (err) {
    statusMsg.textContent = 'Lỗi kết nối máy chủ';
    statusMsg.className = "mt-4 text-sm font-semibold text-center h-5 text-red-500";
  } finally {
    if (btn) btn.disabled = false;
    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  }
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

async function bootloader() {
  if (!serverUrl || serverUrl === '') {
    showWizardWithMac();
    return;
  }

  // Nếu đã có URL, tiến hành kiểm tra MAC
  appDiv.innerHTML = `<div class="p-6 h-full flex flex-col items-center justify-center bg-gray-100">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <h2 class="text-xl font-bold text-blue-800">Đang khởi tạo hệ thống...</h2>
    <p class="text-gray-500 mt-2">Vui lòng chờ giây lát</p>
  </div>`;

  try {
    let mac = 'UNKNOWN';
    if (window.electronAPI && (window.electronAPI as any).getMac) {
      mac = await (window.electronAPI as any).getMac();
    }

    const res = await fetch(`${serverUrl}/api/devices/check-mac?mac=${mac}`);
    if (res.ok) {
      const data = await res.json();
      if (data.type === 'SELF_REG_KIOSK') {
        if (window.electronAPI && (window.electronAPI as any).switchMode) {
          (window.electronAPI as any).switchMode('KIOSK', `${serverUrl}/tu-dang-ky`);
        }
        return; // Dừng tại đây, cửa sổ sẽ bung Fullscreen và tải trang Web
      }
    }
  } catch (err) {
    console.warn('Lỗi kiểm tra MAC, sẽ tiếp tục load giao diện Bàn Tiếp Đón:', err);
  }

  // Fallback hoặc là DESK
  if (window.electronAPI && (window.electronAPI as any).switchMode) {
    (window.electronAPI as any).switchMode('DESK');
  }

  if (!currentDeskId) {
    renderConfig();
  } else {
    renderApp();
  }
}

function renderSetupWizard(macAddress: string = 'Đang tải...') {
  appDiv.innerHTML = `
    <div class="p-6 h-full flex flex-col justify-center bg-blue-50">
      <div class="bg-white p-6 rounded-2xl shadow-xl">
        <h2 class="text-2xl font-bold text-center text-blue-800 mb-2">THIẾT LẬP HỆ THỐNG</h2>
        <p class="text-center text-gray-500 mb-4 text-sm">Vui lòng cấu hình URL Máy chủ (Server) để phần mềm nhận diện thiết bị.</p>
        
        <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6 text-center">
          <p class="text-xs text-blue-600 mb-1 font-semibold uppercase tracking-wider">Địa chỉ MAC của máy này</p>
          <p class="text-lg font-mono font-bold text-blue-900 select-all">${macAddress}</p>
          <p class="text-[10px] text-gray-500 mt-1">Copy mã này dán vào Admin Web để đăng ký Kiosk</p>
        </div>

        <label class="block text-sm font-semibold mb-2">Địa chỉ Máy chủ (Web Server URL):</label>
        <input id="setupServerUrl" type="text" value="${serverUrl || LAN_URL}" class="w-full p-3 border-2 border-blue-200 rounded-xl mb-6 focus:outline-blue-500 focus:border-blue-500" />
        
        <button id="setupSaveBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">KẾT NỐI & KHỞI ĐỘNG</button>
      </div>
    </div>
  `;

  document.getElementById('setupSaveBtn')?.addEventListener('click', () => {
    const val = (document.getElementById('setupServerUrl') as HTMLInputElement).value.trim();
    if (val) {
      localStorage.setItem('kiosk_server_url', val.replace(/\/$/, ""));
      serverUrl = val.replace(/\/$/, "");
      bootloader();
    }
  });
}

// Hàm khởi tạo lấy MAC hiển thị lên Wizard nếu cần
async function showWizardWithMac() {
  let mac = 'UNKNOWN';
  if (window.electronAPI && (window.electronAPI as any).getMac) {
    mac = await (window.electronAPI as any).getMac();
  }
  renderSetupWizard(mac);
}

// Lắng nghe phím tắt Ctrl+Shift+S để mở Setup Wizard bất cứ lúc nào
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    showWizardWithMac();
  }
});

// Khởi tạo
bootloader();

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
