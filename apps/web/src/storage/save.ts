import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { logLine } from './logger'

const SaveKeys = ['profile', 'unique', 'version', 'theme'] as const
type SaveKey = (typeof SaveKeys)[number]
type SavePayload = Partial<Record<SaveKey, string | null>>

interface RemakeSaveFile {
    format: 'remake-save'
    version: 1
    exportedAt: string
    data: SavePayload
}

function readData(): SavePayload {
    return Object.fromEntries(
        SaveKeys.map(key => [key, localStorage.getItem(key)]),
    ) as SavePayload
}

function parseSave(raw: string): SavePayload {
    const parsed = JSON.parse(raw) as
        | RemakeSaveFile
        | SavePayload
        | Record<string, unknown>
    if (
        parsed &&
        typeof parsed === 'object' &&
        'format' in parsed &&
        parsed.format === 'remake-save' &&
        'data' in parsed &&
        parsed.data &&
        typeof parsed.data === 'object'
    ) {
        return parsed.data as SavePayload
    }
    if (
        parsed &&
        typeof parsed === 'object' &&
        ('times' in parsed || 'profile' in parsed)
    ) {
        return { profile: JSON.stringify(parsed) }
    }
    throw new Error('这不是有效的重开存档')
}

function applyData(data: SavePayload) {
    for (const key of SaveKeys) {
        const value = data[key]
        if (value === undefined) continue
        if (value === null) localStorage.removeItem(key)
        else localStorage.setItem(key, value)
    }
    localStorage.setItem('version', '3.0.0')
}

function saveFileName() {
    const stamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, '-')
    return `remake-save-${stamp}.json`
}

export function exportSave() {
    const payload: RemakeSaveFile = {
        format: 'remake-save',
        version: 1,
        exportedAt: new Date().toISOString(),
        data: readData(),
    }
    const text = JSON.stringify(payload, null, 2)
    const fileName = saveFileName()
    logLine('SAVE', 'export', fileName)
    void (async () => {
        if (window.desktopApi?.exportSave) {
            const ok = await window.desktopApi.exportSave(text, fileName)
            logLine('SAVE', 'export desktop', ok ? 'success' : 'cancel')
            return
        }
        if (Capacitor.isNativePlatform()) {
            const result = await Filesystem.writeFile({
                path: fileName,
                data: text,
                directory: Directory.Cache,
                encoding: Encoding.UTF8,
            })
            await Share.share({
                title: '导出重开存档',
                text: '人生重开模拟器存档',
                url: result.uri,
                dialogTitle: '导出存档',
            })
            logLine('SAVE', 'export shared', result.uri)
            return
        }
        const blob = new Blob([text], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        logLine('SAVE', 'export downloaded', fileName)
    })()
}

export function importSave() {
    logLine('SAVE', 'import picker opened')
    if (window.desktopApi?.importSave) {
        void window.desktopApi
            .importSave()
            .then(raw => {
                if (!raw) {
                    logLine('SAVE', 'import cancel')
                    return
                }
                applyData(parseSave(raw))
                logLine('SAVE', 'import desktop success')
                location.reload()
            })
            .catch(error => {
                logLine('SAVE_ERROR', error)
                alert(error instanceof Error ? error.message : '存档导入失败')
            })
        return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        void file
            .text()
            .then(raw => {
                applyData(parseSave(raw))
                logLine('SAVE', 'import success', file.name)
                location.reload()
            })
            .catch(error => {
                logLine('SAVE_ERROR', error)
                alert(error instanceof Error ? error.message : '存档导入失败')
            })
    }
    input.click()
}
