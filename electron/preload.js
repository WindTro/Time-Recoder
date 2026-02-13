
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  setMode: (mode) => ipcRenderer.send('set-mode', mode),
  expandSidebar: () => ipcRenderer.send('expand-sidebar'),
  collapseSidebar: () => ipcRenderer.send('collapse-sidebar'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
});
