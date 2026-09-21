import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'com.skyzenglu.liferestart',
    appName: '人生重开 · 离线版',
    webDir: 'apps/web/dist',
    bundledWebRuntime: false,
    android: {
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: false,
    },
}

export default config
