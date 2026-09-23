import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Game } from './Game'
import './styles/colors.css'
import './styles/common.css'
import './styles/material.css'
import { initLogger } from './storage/logger'

initLogger()

const container = document.getElementById('remake')!
const root = createRoot(container)
root.render(
    <StrictMode>
        <Game />
    </StrictMode>,
)
