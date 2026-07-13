import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onCallNext: (callback: () => void) => {
    ipcRenderer.on('trigger-call-next', callback);
  },
  onRecall: (callback: () => void) => {
    ipcRenderer.on('trigger-recall', callback);
  },
  onSkip: (callback: () => void) => {
    ipcRenderer.on('trigger-skip', callback);
  },
  onPause: (callback: () => void) => {
    ipcRenderer.on('trigger-pause', callback);
  },
  setShortcuts: (shortcuts: any) => {
    ipcRenderer.send('set-shortcuts', shortcuts);
  },
  removeCallNext: () => {
    ipcRenderer.removeAllListeners('trigger-call-next');
    ipcRenderer.removeAllListeners('trigger-recall');
    ipcRenderer.removeAllListeners('trigger-skip');
    ipcRenderer.removeAllListeners('trigger-pause');
  },
  // Kiosk & Zero-touch Provisioning APIs
  getMac: () => ipcRenderer.invoke('get-mac'),
  switchMode: (mode: 'DESK' | 'KIOSK', url?: string) => ipcRenderer.send('switch-mode', mode, url),
  onCardData: (callback: (data: any) => void) => {
    ipcRenderer.on('card-data-received', (_, data) => callback(data));
  }
});
