import { useEffect, useMemo } from 'react'
import {
    useTalentPuller,
    useTalentPicker,
    useTalentClear,
    useTalentSubmit,
    useSubmitIsEnable,
    useMode,
    useSetStep,
    Mode,
    Step,
} from '@remake/hooks'
import { talents as allTalents } from '@remake/data'
import { PullCount, dev } from '@/config'
import { useCheatMode } from '@/storage/cheat'
import { toastMsg } from '@/toast'
import Talent from '@/components/Talent'
import { logLine } from '@/storage/logger'
import './Pick.css'

export function Pick() {
    const mode = useMode()
    const isCustom = mode === Mode.Custom
    const [pulled, puller] = useTalentPuller()
    const [talents, picker, colorfulLimit] = useTalentPicker(
        isCustom ? 10 : undefined,
    )
    const clear = useTalentClear()
    const { enabled, min, max } = useSubmitIsEnable(
        isCustom ? 0 : undefined,
        isCustom ? 10 : undefined,
    )
    const submit = useTalentSubmit(enabled)
    const customList = useMemo(
        () =>
            Array.from(allTalents.keys()).sort((a, b) => {
                const ga = allTalents.get(a)?.grade ?? 0
                const gb = allTalents.get(b)?.grade ?? 0
                return gb - ga || a - b
            }),
        [],
    )
    // 作弊模式失效时（例如导入了普通存档）回到模式选择，避免卡在空列表
    const cheatMode = useCheatMode()
    const setStep = useSetStep()
    useEffect(() => {
        if (isCustom && !cheatMode) setStep(Step.Mode)
    }, [isCustom, cheatMode, setStep])
    const msg = enabled
        ? '下一步'
        : `请选取 ${min == max ? min : `${min}~${max}`} 个天赋`
    const handleSubmit = () => {
        if (enabled) {
            logLine('TALENT', Array.from(talents).join(','))
            return submit()
        }
        toastMsg(msg, 'pick-toast')
    }
    const handlePicker = (id: number) => {
        const result = picker(id)
        if (result.type === 'limit') {
            toastMsg(`本局最多选择 ${colorfulLimit} 个彩色天赋`, 'pick-toast')
        }
    }
    if (isCustom) {
        const customMsg = `开始新人生 · 已选 ${talents.size}/10`
        return (
            <div className="screen talent-pick custom-pick">
                <div className="section custom-header">
                    <div className="title">我的命运我做主！</div>
                    <div className="custom-hint">
                        全部天赋已列出 · 最多选择 10 个 · 彩色天赋上限{' '}
                        {colorfulLimit} 个 · 点击可取消
                    </div>
                </div>
                <ul className="talent-list custom-talent-list">
                    {customList.map(id => (
                        <li key={id} onClick={() => handlePicker(id)}>
                            <Talent id={id} selected={talents.has(id)} />
                        </li>
                    ))}
                </ul>
                <div className="controls">
                    <button className="secondary" onClick={clear}>
                        清空
                    </button>
                    <button
                        className={enabled ? 'primary' : 'error'}
                        onClick={handleSubmit}
                    >
                        {customMsg}
                    </button>
                </div>
            </div>
        )
    }
    if (!pulled)
        return (
            <div className="screen talent-pick">
                <button
                    className="primary font-mono focus"
                    onClick={() => puller()}
                >
                    {PullCount} 连抽!
                </button>
            </div>
        )
    const ps = dev.locked
        ? Array.from(new Set([...dev.locked, ...pulled]))
        : pulled
    return (
        <div className="screen talent-pick">
            <ul className="talent-list">
                {ps.map(id => (
                    <li key={id} onClick={() => handlePicker(id)}>
                        <Talent id={id} selected={talents.has(id)} />
                    </li>
                ))}
            </ul>
            <button
                className={enabled ? 'primary' : 'error'}
                onClick={handleSubmit}
            >
                {msg}
            </button>
        </div>
    )
}
export default Pick
