import { Capacitor, registerPlugin } from '@capacitor/core'

interface LoggerStatus {
    granted: boolean
    path: string
}

interface SkyLoggerPlugin {
    append(options: { line: string }): Promise<LoggerStatus>
    getStatus(): Promise<LoggerStatus>
    requestAccess(): Promise<LoggerStatus>
}

const SkyLogger = registerPlugin<SkyLoggerPlugin>('SkyLogger')
const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
}
let initialized = false
let queue = Promise.resolve<unknown>()

function stamp() {
    return new Date().toLocaleString('zh-CN', { hour12: false })
}

function stringify(value: unknown) {
    if (value instanceof Error) return value.stack || value.message
    if (typeof value === 'string') return value
    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}

export function logLine(scope: string, ...values: unknown[]) {
    const line = `[${stamp()}] [${scope}] ${values
        .map(stringify)
        .join(' ')}`
    if (window.desktopApi?.appendLog) {
        window.desktopApi.appendLog(line)
        return
    }
    if (!Capacitor.isNativePlatform()) return
    queue = queue
        .then(() => SkyLogger.append({ line }))
        .catch(() => undefined)
}

export function initLogger() {
    if (initialized) return
    initialized = true

    const intercept = (method: 'log' | 'warn' | 'error') => {
        return (...args: unknown[]) => {
            originalConsole[method](...args)
            logLine(method.toUpperCase(), ...args)
        }
    }
    console.log = intercept('log')
    console.warn = intercept('warn')
    console.error = intercept('error')

    window.addEventListener('error', event => {
        logLine(
            'WINDOW_ERROR',
            event.message,
            `${event.filename}:${event.lineno}:${event.colno}`,
            event.error,
        )
    })
    window.addEventListener('unhandledrejection', event => {
        logLine('UNHANDLED_REJECTION', event.reason)
    })

    logLine('APP', 'start', navigator.userAgent)
    if (Capacitor.isNativePlatform()) {
        void SkyLogger.getStatus()
            .then(status => {
                logLine(
                    'LOGGER',
                    `path=${status.path}`,
                    `granted=${status.granted}`,
                )
            })
            .catch(error => logLine('LOGGER_ERROR', error))
    }
    if (window.desktopApi?.appendLog) {
        logLine('LOGGER', 'desktop log file enabled')
    }
}
