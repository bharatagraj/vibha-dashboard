// Polyfill for react-grid-layout (Vite compatibility)
if (typeof process === 'undefined') {
  (window as any).process = { env: {} }
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles/design-tokens.css'
import './styles/vibha-components.css'
import './index.css'
import { registerVibhaTheme } from './theme/vibhaTheme'

// Register the Vibha ECharts theme once at startup, before any chart renders
registerVibhaTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
