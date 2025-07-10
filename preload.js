// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    readNotes: () => ipcRenderer.invoke('read-notes'),
    writeNotes: (notes) => ipcRenderer.invoke('write-notes', notes),
    setWindowSize: (width, height) => ipcRenderer.invoke('set-window-size', width, height),
    setWindowPosition: (x, y) => ipcRenderer.invoke('setWindowPosition', x, y),
    getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
    focusWindow: () => ipcRenderer.invoke('focus-window')
});