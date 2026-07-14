const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Bỏ qua cảnh báo SSL và cấp quyền tự động phát âm thanh (Auto-play)
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let tray = null;
let configWindow = null;
let audioWindow = null;

const CONFIG_PATH = path.join(app.getPath('userData'), 'audio-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Lỗi đọc config:', err);
  }
  return { serverUrl: '', areaId: '' };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function createConfigWindow() {
  if (configWindow) {
    configWindow.show();
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 450,
    height: 550,
    resizable: false,
    autoHideMenuBar: true,
    title: 'Cài đặt Trạm Phát Âm Thanh',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  configWindow.loadFile('index.html');

  configWindow.on('closed', () => {
    configWindow = null;
  });
}

function startAudioService(config) {
  if (audioWindow) {
    audioWindow.destroy();
  }

  // Tạo cửa sổ phát âm thanh tàng hình
  audioWindow = new BrowserWindow({
    show: false, // CHẠY NGẦM KHÔNG HIỂN THỊ
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false // Không giảm hiệu năng khi ẩn
    }
  });

  const url = `${config.serverUrl}/kios/audio/${config.areaId}`;
  audioWindow.loadURL(url);

  // Xử lý khi trang web bị lỗi (load lại)
  audioWindow.webContents.on('did-fail-load', () => {
    console.log('Load failed, retrying in 5 seconds...');
    setTimeout(() => {
      if (audioWindow) audioWindow.loadURL(url);
    }, 5000);
  });
}

function createTray() {
  if (tray) return;

  // Sử dụng icon mặc định của electron nếu chưa có icon riêng
  tray = new Tray(path.join(__dirname, 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Trạm Phát Âm Thanh Kiosk', enabled: false },
    { type: 'separator' },
    { 
      label: 'Mở xem giao diện web', 
      click: () => {
        if (audioWindow) {
          audioWindow.show();
        } else {
          const config = loadConfig();
          if (config.serverUrl && config.areaId) {
            startAudioService(config);
            setTimeout(() => { if (audioWindow) audioWindow.show(); }, 1000);
          }
        }
      } 
    },
    { 
      label: 'Cài đặt (Đổi URL/Khu vực)', 
      click: () => {
        createConfigWindow();
      } 
    },
    { 
      label: 'Tải lại luồng âm thanh', 
      click: () => {
        if (audioWindow) audioWindow.reload();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Thoát', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Trạm Phát Âm Thanh Kiosk đang chạy ngầm');
  tray.setContextMenu(contextMenu);
}

// Xử lý IPC
ipcMain.handle('get-config', () => loadConfig());

ipcMain.on('save-config', (event, config) => {
  saveConfig(config);
  if (configWindow) {
    configWindow.close();
  }
  startAudioService(config);
  
  // Hiển thị thông báo ở Tray
  if (tray) {
    tray.displayBalloon({
      title: 'Đã lưu cấu hình',
      content: 'Trạm âm thanh đang chạy ngầm ở góc màn hình!',
      iconType: 'info'
    });
  }
});

// Ngăn không cho app tắt hoàn toàn khi đóng hết cửa sổ
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.whenReady().then(() => {
  // Tạo 1 ảnh icon 1x1 trong suốt tạm thời
  const iconPath = path.join(__dirname, 'icon.png');
  if (!fs.existsSync(iconPath)) {
    const emptyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(iconPath, emptyPng);
  }

  createTray();

  const config = loadConfig();
  if (!config.serverUrl || !config.areaId) {
    createConfigWindow();
  } else {
    startAudioService(config);
  }
});
