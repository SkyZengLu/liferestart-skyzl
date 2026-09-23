import { atom, useAtomValue } from 'jotai'
import { logLine } from './logger'

/** localStorage / 存档中的字段名 */
export const CheatModeKey = 'cheatmode'

/**
 * 解锁【我的天赋我做主】所需的存档标记值。
 * 只有存档里 `cheatmode` 等于这个字符串时，该模式才会出现。
 */
export const CheatModeValue = 'aaaxingnai5bot'

/** 普通存档里该字段的默认值 */
export const CheatModeDefault = 'false'

function detect() {
    try {
        return localStorage.getItem(CheatModeKey) === CheatModeValue
    } catch {
        return false
    }
}

/** 作弊模式是否已解锁；导入存档后页面会重载，所以初值读一次即可 */
export const cheatModeAtom = atom(detect())

export const useCheatMode = () => useAtomValue(cheatModeAtom)

/**
 * 导入存档时调用：把存档里的 cheatmode 写进本地存储。
 * 顺带写一条日志，方便排查"为什么没解锁"。
 */
export function applyCheatMode(value: string | null | undefined) {
    if (value === null || value === undefined) return
    try {
        localStorage.setItem(CheatModeKey, value)
        logLine(
            'CHEATMODE',
            value === CheatModeValue ? 'unlocked' : 'locked',
            value,
        )
    } catch {
        /* 存储不可用时忽略 */
    }
}

/**
 * 首次运行补一个默认值，这样导出的存档里就带有
 * `"cheatmode": "false"`，方便手动改成解锁值后再导入。
 */
export function ensureCheatModeField() {
    try {
        if (localStorage.getItem(CheatModeKey) === null) {
            localStorage.setItem(CheatModeKey, CheatModeDefault)
        }
    } catch {
        /* 忽略 */
    }
}
