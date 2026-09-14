import { useEffect, useRef, useState } from 'react'
import { PRESETS } from './presets'
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from './themes'
import { ACTIVITIES, ACTIVITY_STORAGE_KEY } from './activities'
import PieTimer from './PieTimer'
import { playChime } from './chime'
import './App.css'

// App states: 'select' (choose a duration) -> 'running' (counting down,
// possibly paused) -> 'done' (celebration screen)

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function loadStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.some(t => t.id === stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function loadStoredActivity() {
  try {
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY)
    return ACTIVITIES.some(a => a.id === stored) ? stored : null
  } catch {
    return null
  }
}

export default function App() {
  const [phase, setPhase] = useState('select')
  const [totalMs, setTotalMs] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [colorTheme, setColorTheme] = useState(loadStoredTheme)
  const [activityId, setActivityId] = useState(loadStoredActivity)

  // Apply the chosen color theme to the whole page and remember it.
  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, colorTheme)
    } catch {
      // Storage can be unavailable (private browsing); theme just won't persist.
    }
  }, [colorTheme])

  // Remember the last chosen activity so it's pre-picked next time.
  useEffect(() => {
    try {
      if (activityId) {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, activityId)
      } else {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY)
      }
    } catch {
      // Storage can be unavailable (private browsing); choice just won't persist.
    }
  }, [activityId])

  const activity = ACTIVITIES.find(a => a.id === activityId) ?? null

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
        <SelectScreen
          onSelect={startTimer}
          colorTheme={colorTheme}
          onColorThemeChange={setColorTheme}
          activityId={activityId}
          onActivityChange={setActivityId}
        />
      )}

      {phase === 'running' && (
        <RunningScreen
          fraction={fraction}
          remainingMs={remainingMs}
          paused={paused}
          activity={activity}
          onTogglePause={togglePause}
          onStop={stopTimer}
        />
      )}

      {phase === 'done' && (
        <DoneScreen activity={activity} onRestart={stopTimer} />
      )}
    </div>
  )
}

function SelectScreen({ onSelect, colorTheme, onColorThemeChange, activityId, onActivityChange }) {
  return (
    <div className="screen select-screen">
      <div className="hero-icon" aria-hidden="true">🎯</div>
      <h1>Focus Time</h1>
      <p className="subtitle">What are you focusing on? (optional)</p>
      <ActivityPicker value={activityId} onChange={onActivityChange} />
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
      <ThemePicker value={colorTheme} onChange={onColorThemeChange} />
    </div>
  )
}

function ActivityPicker({ value, onChange }) {
  return (
    <div className="activity-picker" role="radiogroup" aria-label="Activity">
      {ACTIVITIES.map(activity => (
        <button
          key={activity.id}
          className={`activity-chip${value === activity.id ? ' active' : ''}`}
          role="radio"
          aria-checked={value === activity.id}
          onClick={() => onChange(value === activity.id ? null : activity.id)}
        >
          <span className="activity-emoji" aria-hidden="true">{activity.emoji}</span>
          <span className="activity-label">{activity.label}</span>
        </button>
      ))}
    </div>
  )
}

function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Color theme">
      {THEMES.map(theme => (
        <button
          key={theme.id}
          className={`theme-swatch${value === theme.id ? ' active' : ''}`}
          style={{ '--swatch-color': theme.swatch }}
          role="radio"
          aria-checked={value === theme.id}
          aria-label={theme.name}
          onClick={() => onChange(theme.id)}
        />
      ))}
    </div>
  )
}

function RunningScreen({ fraction, remainingMs, paused, activity, onTogglePause, onStop }) {
  const [peeking, setPeeking] = useState(false)

  function startPeek(e) {
    e.preventDefault()
    setPeeking(true)
  }

  function endPeek() {
    setPeeking(false)
  }

  return (
    <div className="screen running-screen">
      {activity && (
        <p className="activity-tag">
          <span aria-hidden="true">{activity.emoji}</span> {activity.label}
        </p>
      )}
      <div
        className="pie-touch-target"
        onPointerDown={startPeek}
        onPointerUp={endPeek}
        onPointerLeave={endPeek}
        onPointerCancel={endPeek}
        onContextMenu={e => e.preventDefault()}
      >
        <PieTimer
          fraction={fraction}
          color={paused ? 'var(--accent-pale)' : 'var(--accent)'}
          trackColor="var(--accent-soft)"
          overlayText={peeking ? formatTime(remainingMs) : null}
          size={300}
        />
      </div>
      <p className="running-hint">{paused ? 'Paused' : 'Stay focused!'}</p>
      <p className="peek-hint">👆 Hold the circle to peek at the time</p>
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

function DoneScreen({ activity, onRestart }) {
  return (
    <div className="screen done-screen">
      <div className="hero-icon" aria-hidden="true">🎉</div>
      <h1>Great job!</h1>
      <p className="subtitle">
        {activity ? `Nice work on ${activity.label.toLowerCase()}!` : 'Your focus time is up.'}
      </p>
      <button className="preset-btn wide-btn" onClick={onRestart}>
        Start Again
      </button>
    </div>
  )
}
