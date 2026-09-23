import { PullCount } from '@/config'
import { useModeChoose } from '@remake/hooks'
import { logLine } from '@/storage/logger'
import './Mode.css'

export function Mode() {
    const [Mode, choose] = useModeChoose()
    const pick = (mode: (typeof Mode)[keyof typeof Mode], name: string) => {
        logLine('MODE', name)
        choose(mode)
    }
    return (
        <div className="screen mode">
            <button onClick={() => pick(Mode.Classic, '经典模式')}>
                <div className="name">经典模式</div>
                <div className="description">
                    <span>{PullCount} 连抽天赋</span>
                    <span>自由分配属性</span>
                </div>
            </button>
            <button onClick={() => pick(Mode.Celebrity, '名人模式')}>
                <div className="name">名人模式</div>
                <div className="description">
                    <span>前世古代名人，重开到了现代</span>
                </div>
            </button>
            <button onClick={() => pick(Mode.Custom, '我的命运我做主')}>
                <div className="name">我的命运我做主！</div>
                <div className="description">
                    <span>列出全部天赋</span>
                    <span>最多可选10个</span>
                </div>
            </button>
        </div>
    )
}

export default Mode
