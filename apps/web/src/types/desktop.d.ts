export {}

declare global {
    interface Window {
        desktopApi?: {
            appendLog?: (line: string) => void
            exportSave?: (
                text: string,
                defaultName: string,
            ) => Promise<boolean>
            importSave?: () => Promise<string | null>
        }
    }
}
