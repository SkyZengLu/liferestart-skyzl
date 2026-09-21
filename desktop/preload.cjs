const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopApi', {
    appendLog: line => ipcRenderer.send('append-log', line),
    exportSave: (text, defaultName) =>
        ipcRenderer.invoke('save-export', { text, defaultName }),
    importSave: () => ipcRenderer.invoke('save-import'),
})
