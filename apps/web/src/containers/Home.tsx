import { useRemake, useFeatures, useGoAchv, useGoThanks } from '@remake/hooks'
import { TextSvg } from '@/components/TextSvg'
import ThemeToggle from '@/components/ThemeToggle'
import { exportSave, importSave } from '@/storage/save'
import './Home.css'

function ExportIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
        </svg>
    )
}

function ImportIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21a1 1 0 0 1-1-1v-8.6l-2.3 2.3a1 1 0 1 1-1.4-1.4l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.4L13 11.4V20a1 1 0 0 1-1 1Zm-7-4a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
        </svg>
    )
}

export default function Home() {
    const remake = useRemake()
    const features = useFeatures()
    const goAchv = useGoAchv()
    const goThanks = useGoThanks()
    return (
        <div className="screen home">
            <div className="title">
                <TextSvg text="人生重开模拟器" className="main" />
                <TextSvg text="这垃圾人生一秒也不想待了" className="sub" />
            </div>
            <div className="controls">
                <div>
                    <button className="primary focus" onClick={remake}>
                        立即重开
                    </button>
                </div>
                {features && (
                    <div>
                        <button className="secondary" onClick={goAchv}>
                            成就
                        </button>
                        <button className="secondary" onClick={goThanks}>
                            感谢
                        </button>
                    </div>
                )}
            </div>
            <div className="actions">
                <button
                    className="m3-icon-button"
                    onClick={exportSave}
                    aria-label="导出存档"
                >
                    <ExportIcon />
                </button>
                <button
                    className="m3-icon-button"
                    onClick={importSave}
                    aria-label="导入存档"
                >
                    <ImportIcon />
                </button>
                <ThemeToggle />
            </div>
        </div>
    )
}
