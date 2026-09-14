import { useEffect, useRef, useState } from 'react'
import { PRESETS } from './presets'
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from './themes'
import { ACTIVITIES, ACTIVITY_STORAGE_KEY } from './activities'
import { randomSticker } from './stickers.js'
import { loadStoredFamilyCode, storeFamilyCode } from './family.js'
import { watchKids, addKid, awardSticker } from './kids.js'
import FamilySetupScreen from './FamilySetupScreen.jsx'
import KidPickerScreen from './KidPickerScreen.jsx'
import StickersScreen from './StickersScreen.jsx'
import PieTimer from './PieTimer'
import { playChime } from './chime'
import './App.css'

// Outer stages: 'family-setup' (no family code yet) -> 'kid-picker'
// (choose/add who's using the device) -> 'timer' (the focus timer
// itself) -> 'stickers' (view a kid's collection), switchable back to
// 'kid-picker' at any time from the timer's select screen.
//
// Within 'timer', a separate state machine runs: 'select' (choose a
// duration) -> 'running' (counting down, possibly paused) -> 'done'
// (celebration screen, sticker awarded).

const ACTIVE_KID_STORAGE_KEY = 'focus-timer-active-kid'

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

function loadStoredActiveKid() {
  try {
    return localStorage.getItem(ACTIVE_KID_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeActiveKid(kidId) {
  try {
    localStorage.setItem(ACTIVE_KID_STORAGE_KEY, kidId)
  } catch {
    // Storage can be unavailable (private browsing); choice just won't persist.
  }
}

export default function App() {
  const [familyCode, setFamilyCode] = useState(loadStoredFamilyCode)
  const [stage, setStage] = useState(() => (loadStoredFamilyCode() ? 'loading-kids' : 'family-setup'))
  const [kids, setKids] = useState([])
  const [kidsLoaded, setKidsLoaded] = useState(false)
  const [activeKidId, setActiveKidId] = useState(loadStoredActiveKid)
  const activeKidIdRef = useRef(loadStoredActiveKid())
  const familyCodeRef = useRef(familyCode)
  const [awardedSticker, setAwardedSticker] = useState(null)

  useEffect(() => {
    familyCodeRef.current = familyCode
  }, [familyCode])

  const [phase, setPhase] = useState('select')
  const [totalMs, setTotalMs] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [colorTheme, setColorTheme] = useState(loadStoredTheme)
  const [activityId, setActivityId] = useState(loadStoredActivity)

  // Subscribe to this family's kid list once we have a code, and
  // auto-advance out of the loading state the first time data arrives.
  useEffect(() => {
    if (!familyCode) return undefined
    const unsubscribe = watchKids(
      familyCode,
      list => {
        setKids(list)
        setKidsLoaded(true)
        setStage(prev => {
          if (prev !== 'loading-kids') return prev
          const stillHere = activeKidIdRef.current && list.some(k => k.id === activeKidIdRef.current)
          return stillHere ? 'timer' : 'kid-picker'
        })
      },
      err => {
        console.error('Failed to load kid profiles:', err)
        setKidsLoaded(true)
        setStage(prev => (prev === 'loading-kids' ? 'kid-picker' : prev))
      },
    )
    return unsubscribe
  }, [familyCode])

  function handleFamilyReady(code) {
    storeFamilyCode(code)
    setFamilyCode(code)
    setStage('loading-kids')
  }

  function handleSelectKid(kidId) {
    activeKidIdRef.current = kidId
    setActiveKidId(kidId)
    storeActiveKid(kidId)
    setPhase('select')
    setStage('timer')
  }

  async function handleAddKid({ name, avatar }) {
    const kidId = await addKid(familyCode, { name, avatar })
    handleSelectKid(kidId)
  }

  const activeKid = kids.find(k => k.id === activeKidId) ?? null

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
    setAwardedSticker(null)
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
        const sticker = randomSticker()
        setAwardedSticker(sticker)
        if (activeKidIdRef.current && familyCodeRef.current) {
          awardSticker(familyCodeRef.current, activeKidIdRef.current, sticker).catch(err => {
            console.error('Failed to save sticker:', err)
          })
        }
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, paused])

  const fraction = totalMs > 0 ? remainingMs / totalMs : 0

  if (stage === 'family-setup') {
    return (
      <div className="app">
        <FamilySetupScreen onFamilyReady={handleFamilyReady} />
      </div>
    )
  }

  if (stage === 'loading-kids' || stage === 'kid-picker') {
    return (
      <div className="app">
        <KidPickerScreen
          kids={kids}
          kidsLoaded={stage !== 'loading-kids' && kidsLoaded}
          onSelectKid={handleSelectKid}
          onAddKid={handleAddKid}
        />
      </div>
    )
  }

  if (stage === 'stickers') {
    return (
      <div className="app">
        <StickersScreen kid={activeKid} onBack={() => setStage('timer')} />
      </div>
    )
  }

  return (
    <div className="app">
      {phase === 'select' && (
        <SelectScreen
          onSelect={startTimer}
          colorTheme={colorTheme}
          onColorThemeChange={setColorTheme}
          activityId={activityId}
          onActivityChange={setActivityId}
          kid={activeKid}
          onSwitchKid={() => setStage('kid-picker')}
          onViewStickers={() => setStage('stickers')}
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
        <DoneScreen activity={activity} sticker={awardedSticker} onRestart={stopTimer} />
      )}
    </div>
  )
}

function SelectScreen({
  onSelect,
  colorTheme,
  onColorThemeChange,
  activityId,
  onActivityChange,
  kid,
  onSwitchKid,
  onViewStickers,
}) {
  return (
    <div className="screen select-screen">
      {kid && (
        <div className="kid-bar">
          <span className="kid-bar-name">
            <span aria-hidden="true">{kid.avatar}</span> {kid.name}
          </span>
          <div className="kid-bar-actions">
            <button className="text-btn" onClick={onViewStickers}>
              🎁 Stickers{kid.stickers?.length ? ` (${kid.stickers.length})` : ''}
            </button>
            <button className="text-btn" onClick={onSwitchKid}>
              Switch
            </button>
          </div>
        </div>
      )}
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

function DoneScreen({ activity, sticker, onRestart }) {
  return (
    <div className="screen done-screen">
      <div className="hero-icon" aria-hidden="true">🎉</div>
      <h1>Great job!</h1>
      <p className="subtitle">
        {activity ? `Nice work on ${activity.label.toLowerCase()}!` : 'Your focus time is up.'}
      </p>
      {sticker && (
        <p className="sticker-award">
          You earned <span aria-hidden="true">{sticker.emoji}</span> {sticker.name}!
        </p>
      )}
      <button className="preset-btn wide-btn" onClick={onRestart}>
        Start Again
      </button>
    </div>
  )
}
