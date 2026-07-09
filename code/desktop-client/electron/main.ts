import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';

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

app.whenReady().then(createWindow);

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
ipcMain.on('set-shortcuts', (event, shortcuts) => {
  globalShortcut.unregisterAll();

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
