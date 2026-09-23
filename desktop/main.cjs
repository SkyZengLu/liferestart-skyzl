const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

function logDirectory() {
    const base =
        process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath)
    const preferred = path.join(base, 'skyzl', 'liferestart')
    try {
        fs.mkdirSync(preferred, { recursive: true })
        return preferred
    } catch {
        const fallback = path.join(
            app.getPath('userData'),
            'skyzl',
            'liferestart',
        )
        fs.mkdirSync(fallback, { recursive: true })
        return fallback
    }
}

function appendLog(line) {
    const file = path.join(logDirectory(), 'liferestart.log')
    fs.appendFileSync(file, `${line}\n`, 'utf8')
}

ipcMain.on('append-log', (_event, line) => {
    try {
        appendLog(String(line ?? ''))
    } catch {}
})

ipcMain.handle('save-export', async (_event, payload) => {
    const result = await dialog.showSaveDialog({
        title: '导出重开存档',
        defaultPath: payload.defaultName || 'remake-save.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return false
    fs.writeFileSync(result.filePath, payload.text, 'utf8')
    return true
})

ipcMain.handle('save-import', async () => {
    const result = await dialog.showOpenDialog({
        title: '导入重开存档',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return fs.readFileSync(result.filePaths[0], 'utf8')
})

function createWindow() {
    const win = new BrowserWindow({
        width: 430,
        height: 860,
        minWidth: 360,
        minHeight: 640,
        autoHideMenuBar: true,
        backgroundColor: '#fef7ff',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })
    win.loadFile(
        path.join(__dirname, '..', 'apps', 'web', 'dist', 'index.html'),
    )
    appendLog(`[desktop] window created ${new Date().toISOString()}`)
}

app.whenReady().then(() => {
    appendLog(`[desktop] app ready ${new Date().toISOString()}`)
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
