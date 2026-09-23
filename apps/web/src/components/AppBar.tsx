import { useGoHome } from '@remake/hooks'
import './AppBar.css'

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 10.7 12 3l9 7.7v9.8a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5v-9.8Z" />
        </svg>
    )
}

export function AppBar() {
    const goHome = useGoHome()
    return (
        <header className="m3-top-app-bar">
            <button
                className="m3-icon-button"
                onClick={goHome}
                aria-label="回到主页"
            >
                <HomeIcon />
            </button>
            <div className="m3-app-title">
                <span>人生重开</span>
                <small>离线版</small>
            </div>
        </header>
    )
}

export default AppBar
