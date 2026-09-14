import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { playChime, TUNE_COUNT } from './chime.js'

// Exposed on window purely so the completion melodies can be previewed
// from the browser console without waiting out a real timer, e.g.:
//   playChime()   -> a random tune
//   playChime(0)  -> a specific one (0..TUNE_COUNT-1)
window.playChime = playChime
window.TUNE_COUNT = TUNE_COUNT

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
