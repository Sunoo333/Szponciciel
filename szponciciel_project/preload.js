const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('loadConfig'),
  setAccent: (hex) => ipcRenderer.invoke('setAccent', hex),
  listFolders: () => ipcRenderer.invoke('listFolders'),
  listFiles: (folder) => ipcRenderer.invoke('listFiles', folder),
  importFiles: (folder, paths) => ipcRenderer.invoke('importFiles', folder, paths),
  createFolder: (name) => ipcRenderer.invoke('createFolder', name),
  finishFirstRun: (chosen) => ipcRenderer.invoke('finishFirstRun', chosen)
});