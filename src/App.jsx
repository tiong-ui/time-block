import { useEffect, useRef, useState } from 'react'
import { PRESETS } from './presets'
import PieTimer from './PieTimer'
import { playChime } from './chime'
import './App.css'

// App states: 'select' (choose a duration) -> 'running' (counting down,
// possibly paused) -> 'done' (celebration screen)

export default function App() {
  const [phase, setPhase] = useState('select')
  const [totalMs, setTotalMs] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [paused, setPaused] = useState(false)

  // Wall-clock bookkeeping so the countdown stays accurate even if the
  // tab is backgrounded and rAF/timers get throttled.
  const endAtRef = useRef(0)
  const rafRef = useRef(null)

  function startTimer(minutes) {
    const ms = minutes * 60 * 1000
    setTotalMs(ms)
    setRemainingMs(ms)
    setPaused(false)
    endAtRef.current = Date.now() + ms
    setPhase('running')
  }

  function togglePause() {
    setPaused(prev => {
      const resuming = prev
      if (resuming) {
        // Recompute the end time from where we left off.
        endAtRef.current = Date.now() + remainingMs
      }
      // When pausing, the countdown loop simply stops running, so
      // remainingMs stays frozen at its last tick value.
      return !prev
    })
  }

  function stopTimer() {
    setPhase('select')
    setPaused(false)
  }

  // Countdown loop.
  useEffect(() => {
    if (phase !== 'running' || paused) return undefined

    function tick() {
      const msLeft = Math.max(0, endAtRef.current - Date.now())
      setRemainingMs(msLeft)
      if (msLeft <= 0) {
        setPhase('done')
        playChime()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, paused])

  const fraction = totalMs > 0 ? remainingMs / totalMs : 0

  return (
    <div className="app">
      {phase === 'select' && (
        <SelectScreen onSelect={startTimer} />
      )}

      {phase === 'running' && (
        <RunningScreen
          fraction={fraction}
          paused={paused}
          onTogglePause={togglePause}
          onStop={stopTimer}
        />
      )}

      {phase === 'done' && (
        <DoneScreen onRestart={stopTimer} />
      )}
    </div>
  )
}

function SelectScreen({ onSelect }) {
  return (
    <div className="screen select-screen">
      <div className="hero-icon" aria-hidden="true">🎯</div>
      <h1>Focus Time</h1>
      <p className="subtitle">Pick how long you want to focus</p>
      <div className="preset-grid">
        {PRESETS.map(minutes => (
          <button
            key={minutes}
            className="preset-btn"
            onClick={() => onSelect(minutes)}
          >
            <span className="preset-number">{minutes}</span>
            <span className="preset-unit">min</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function RunningScreen({ fraction, paused, onTogglePause, onStop }) {
  return (
    <div className="screen running-screen">
      <PieTimer
        fraction={fraction}
        color={paused ? '#B9C0FF' : '#7C83FD'}
        trackColor="#EDEFFF"
        size={300}
      />
      <p className="running-hint">{paused ? 'Paused' : 'Stay focused!'}</p>
      <div className="controls">
        <button className="icon-btn" onClick={onTogglePause} aria-label={paused ? 'Resume' : 'Pause'}>
          {paused ? '▶' : '⏸'}
        </button>
        <button className="icon-btn stop-btn" onClick={onStop} aria-label="Stop">
          ✕
        </button>
      </div>
    </div>
  )
}

function DoneScreen({ onRestart }) {
  return (
    <div className="screen done-screen">
      <div className="hero-icon" aria-hidden="true">🎉</div>
      <h1>Great job!</h1>
      <p className="subtitle">Your focus time is up.</p>
      <button className="preset-btn wide-btn" onClick={onRestart}>
        Start Again
      </button>
    </div>
  )
}
