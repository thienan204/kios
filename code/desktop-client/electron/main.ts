import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import getmac from 'getmac';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 580,
    alwaysOnTop: true, // Always on top as requested
    autoHideMenuBar: true, // Ẩn thanh File/Edit/View
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Vị trí góc dưới cùng bên phải màn hình
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  mainWindow.setPosition(width - 320 - 20, height - 580 - 20);

  // Load UI
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Không đăng ký phím tắt hardcode ở đây nữa, sẽ nhận từ renderer qua IPC
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Đăng ký phím tắt toàn cục ẩn cho việc giả lập Test thẻ CCCD
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) {
      console.log('Simulating CCCD Card Read via Hardware shortcut...');
      mainWindow.webContents.send('card-data-received', {
        fullName: 'NGUYỄN VĂN A',
        cccdNumber: '030090123456',
        dob: '01/01/1990',
        gender: 'Nam',
        address: 'Hà Nội',
        // Mock 1 ảnh base64 rỗng để test giao diện
        photoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });
    }
  });
});

app.on('will-quit', () => {
  // Hủy đăng ký tất cả các phím tắt khi thoát
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Lắng nghe sự kiện cấu hình phím tắt từ renderer
// Lắng nghe sự kiện cấu hình phím tắt từ renderer
ipcMain.on('set-shortcuts', (event, shortcuts) => {
  // Chỉ gỡ các phím tắt của Bàn Tiếp Đón, KHÔNG gỡ phím tắt Test CCCD
  // Vì vậy ta đăng ký lại các phím tắt Bàn Tiếp Đón.
  // Gỡ theo danh sách để không ảnh hưởng Ctrl+Shift+C
  // Nhưng Electron globalShortcut.unregisterAll() sẽ gỡ tất cả.
  // Ta có thể gọi lại việc đăng ký Ctrl+Shift+C ở đây
  globalShortcut.unregisterAll();
  
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) {
      mainWindow.webContents.send('card-data-received', {
        fullName: 'NGUYỄN VĂN A',
        cccdNumber: '030090123456',
        dob: '01/01/1990',
        gender: 'Nam',
        address: 'Hà Nội',
        photoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });
    }
  });

  if (shortcuts.callNext) {
    globalShortcut.register(shortcuts.callNext, () => {
      if (mainWindow) mainWindow.webContents.send('trigger-call-next');
    });
  }
  
  if (shortcuts.recall) {
    globalShortcut.register(shortcuts.recall, () => {
      if (mainWindow) mainWindow.webContents.send('trigger-recall');
    });
  }
  
  if (shortcuts.skip) {
    globalShortcut.register(shortcuts.skip, () => {
      if (mainWindow) mainWindow.webContents.send('trigger-skip');
    });
  }
  
  if (shortcuts.pause) {
    globalShortcut.register(shortcuts.pause, () => {
      if (mainWindow) mainWindow.webContents.send('trigger-pause');
    });
  }
});

// Zero-touch Provisioning IPCs
ipcMain.handle('get-mac', () => {
  try {
    return getmac();
  } catch (error) {
    console.error('Cannot get MAC address:', error);
    return 'UNKNOWN_MAC';
  }
});

ipcMain.on('switch-mode', (event, mode, url) => {
  if (!mainWindow) return;

  if (mode === 'KIOSK' && url) {
    // Chuyển sang chế độ KIOSK TỰ ĐĂNG KÝ
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver'); // Chống người dùng tắt
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL(url);
  } else if (mode === 'DESK') {
    // Giữ nguyên cửa sổ hiện tại (320x580)
    mainWindow.setFullScreen(false);
    mainWindow.setSize(320, 580);
  }
});
