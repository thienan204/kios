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
  }
});
