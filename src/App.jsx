import { useEffect, useRef, useState } from 'react'
import { PRESETS } from './presets'
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from './themes'
import { ACTIVITIES, ACTIVITY_STORAGE_KEY } from './activities'
import {
  HIIT_ACTIVITY_ID,
  EXERCISE_OPTIONS,
  REST_OPTIONS,
  EXERCISE_STORAGE_KEY,
  REST_STORAGE_KEY,
  loadStoredExerciseSec,
  loadStoredRestSec,
  storeSeconds,
  intervalAt,
  upcomingCues,
} from './hiit.js'
import { STARS_PER_SESSION, starBalance } from './stars.js'
import { errorDetail } from './errorMessage.js'
import { T } from './T.jsx'
import { tBoth } from './i18n.js'
import { loadStoredFamilyCode, storeFamilyCode } from './family.js'
import { watchKids, addKid, addStars, updateKidAvatar } from './kids.js'
import FamilySetupScreen from './FamilySetupScreen.jsx'
import KidPickerScreen from './KidPickerScreen.jsx'
import StarJarScreen from './StarJarScreen.jsx'
import StarLogScreen from './StarLogScreen.jsx'
import RewardsScreen from './RewardsScreen.jsx'
import EditAvatarScreen from './EditAvatarScreen.jsx'
import JarDropAnimation from './JarDropAnimation.jsx'
import PieTimer from './PieTimer'
import {
  playIntervalCue,
  scheduleAlarm,
  stopAlarm,
  isAlarmScheduled,
  scheduleIntervalCues,
} from './chime'
import { saveSession, clearSession, loadSession, restoredTimerState } from './session.js'
import './App.css'

// Outer stages: 'family-setup' (no family code yet) -> 'kid-picker'
// (choose/add who's using the device) -> 'timer' (the focus timer
// itself) -> 'starjar' (view a kid's Star Jar) / 'edit-avatar' (change
// the current kid's avatar), switchable back to 'kid-picker' at any
// time from the timer's select screen.
//
// Within 'timer', a separate state machine runs: 'select' (choose a
// duration) -> 'running' (counting down, possibly paused) -> 'done'
// (celebration screen, stars dropped into the jar).

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
  const [kidsError, setKidsError] = useState('')
  const [activeKidId, setActiveKidId] = useState(loadStoredActiveKid)
  const activeKidIdRef = useRef(loadStoredActiveKid())
  const familyCodeRef = useRef(familyCode)
  const activeKidRef = useRef(null)
  const [starsResult, setStarsResult] = useState(null)
  // The finishing alarm keeps sounding after the countdown ends, so the
  // done screen needs to know whether there's still something to hush.
  const [alarmRinging, setAlarmRinging] = useState(false)

  useEffect(() => {
    familyCodeRef.current = familyCode
  }, [familyCode])

  // A timer left running when the page was closed. Read once, at the
  // first render, so the restored session seeds the state below rather
  // than arriving late and overwriting it.
  const [opening] = useState(() => restoredTimerState(loadSession()))
  const restoredSession = opening.session

  const [phase, setPhase] = useState(opening.phase)
  const [totalMs, setTotalMs] = useState(opening.totalMs)
  const [remainingMs, setRemainingMs] = useState(opening.remainingMs)
  const [paused, setPaused] = useState(opening.paused)
  const [colorTheme, setColorTheme] = useState(loadStoredTheme)
  const [activityId, setActivityId] = useState(() => restoredSession?.activityId ?? loadStoredActivity())
  const [exerciseSec, setExerciseSec] = useState(() => restoredSession?.exerciseSec ?? loadStoredExerciseSec())
  const [restSec, setRestSec] = useState(() => restoredSession?.restSec ?? loadStoredRestSec())

  // HIIT only: which half of the cycle we're in, and how far through it.
  const [intervalKind, setIntervalKind] = useState('work')
  const [intervalRemainingMs, setIntervalRemainingMs] = useState(0)
  const [intervalTotalMs, setIntervalTotalMs] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)

  // Subscribe to this family's kid list once we have a code, and
  // auto-advance out of the loading state the first time data arrives.
  useEffect(() => {
    if (!familyCode) return undefined
    const unsubscribe = watchKids(
      familyCode,
      list => {
        setKids(list)
        setKidsLoaded(true)
        setKidsError('')
        setStage(prev => {
          if (prev !== 'loading-kids') return prev
          const stillHere = activeKidIdRef.current && list.some(k => k.id === activeKidIdRef.current)
          return stillHere ? 'timer' : 'kid-picker'
        })
      },
      err => {
        console.error('Failed to load kid profiles:', err)
        setKidsLoaded(true)
        setKidsError(tBoth('errLoadKids', { detail: errorDetail(err) }))
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

  async function handleUpdateAvatar(avatar) {
    await updateKidAvatar(familyCode, activeKidId, avatar)
  }

  const activeKid = kids.find(k => k.id === activeKidId) ?? null

  useEffect(() => {
    activeKidRef.current = activeKid
  }, [activeKid])

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

  useEffect(() => {
    storeSeconds(EXERCISE_STORAGE_KEY, exerciseSec)
  }, [exerciseSec])

  useEffect(() => {
    storeSeconds(REST_STORAGE_KEY, restSec)
  }, [restSec])

  const activity = ACTIVITIES.find(a => a.id === activityId) ?? null
  const isHiit = activityId === HIIT_ACTIVITY_ID

  // The countdown loop reads these without needing to re-arm itself.
  const isHiitRef = useRef(isHiit)
  const exerciseSecRef = useRef(exerciseSec)
  const restSecRef = useRef(restSec)
  // Awarding stars happens from the frame loop and from a restore, both
  // of which run against a stale closure — so what the session was for,
  // and how long it ran, are read through refs like the rest.
  const activityIdRef = useRef(activityId)
  const totalMsRef = useRef(totalMs)
  useEffect(() => {
    isHiitRef.current = isHiit
    exerciseSecRef.current = exerciseSec
    restSecRef.current = restSec
    activityIdRef.current = activityId
    totalMsRef.current = totalMs
  }, [isHiit, exerciseSec, restSec, activityId, totalMs])

  // Wall-clock bookkeeping so the countdown stays accurate even if the
  // tab is backgrounded and rAF/timers get throttled.
  const startedAtRef = useRef(restoredSession?.startedAt ?? 0)
  const endAtRef = useRef(restoredSession?.endAt ?? 0)
  const pausedAtRef = useRef(restoredSession?.pausedAt ?? 0)
  const rafRef = useRef(null)
  const cancelCuesRef = useRef(null)
  // Set when a session that finished while the app was closed still
  // owes its stars, which can only be paid once the kid data loads.
  const owedStarsRef = useRef(opening.owesStars)

  function cancelScheduledCues() {
    if (cancelCuesRef.current) {
      cancelCuesRef.current()
      cancelCuesRef.current = null
    }
  }

  // Everything the session had booked, silenced — including the alarm,
  // whether it's still counting down to the end or already ringing.
  function clearScheduledAudio() {
    cancelScheduledCues()
    stopAlarm()
  }

  // The same, plus letting the done screen know there's nothing left to
  // hush. This is what the kid's "turn it off" button reaches.
  function silenceSession() {
    clearScheduledAudio()
    setAlarmRinging(false)
  }

  // Books the finishing alarm — and, for HIIT, every work/rest switch —
  // on the Web Audio clock up front. That clock keeps running while the
  // tab is hidden, so the timer is still heard with the screen off,
  // rather than everything firing at once when you come back.
  function scheduleAudioFrom(now) {
    clearScheduledAudio()
    const sessionRemainingMs = endAtRef.current - now
    if (sessionRemainingMs <= 0) return

    scheduleAlarm(sessionRemainingMs, { onGiveUp: () => setAlarmRinging(false) })
    if (isHiitRef.current) {
      cancelCuesRef.current = scheduleIntervalCues(
        upcomingCues({
          elapsedMs: now - startedAtRef.current,
          exerciseSec: exerciseSecRef.current,
          restSec: restSecRef.current,
          sessionRemainingMs,
        }),
      )
    }
  }

  function persistSession(pausedAt = null) {
    saveSession({
      startedAt: startedAtRef.current,
      endAt: endAtRef.current,
      totalMs,
      activityId,
      exerciseSec,
      restSec,
      pausedAt,
    })
  }

  function startTimer(minutes) {
    const ms = minutes * 60 * 1000
    const now = Date.now()
    setTotalMs(ms)
    setRemainingMs(ms)
    setPaused(false)
    setStarsResult(null)
    startedAtRef.current = now
    endAtRef.current = now + ms

    if (activityId === HIIT_ACTIVITY_ID) {
      const workMs = Math.min(exerciseSec * 1000, ms)
      setIntervalTotalMs(workMs)
      setIntervalKind('work')
      setIntervalRemainingMs(workMs)
      setRoundNumber(1)
      playIntervalCue('work')
    }

    saveSession({
      startedAt: now,
      endAt: now + ms,
      totalMs: ms,
      activityId,
      exerciseSec,
      restSec,
      pausedAt: null,
    })
    scheduleAudioFrom(now)
    setPhase('running')
  }

  function togglePause() {
    const now = Date.now()
    if (paused) {
      // Shift both clocks forward by however long we sat paused, so
      // elapsed time — which drives the whole interval cycle — stays
      // honest even across a reload while paused.
      const pausedForMs = now - pausedAtRef.current
      startedAtRef.current += pausedForMs
      endAtRef.current += pausedForMs
      persistSession(null)
      scheduleAudioFrom(now)
      setPaused(false)
    } else {
      pausedAtRef.current = now
      silenceSession()
      persistSession(now)
      setPaused(true)
    }
  }

  function stopTimer() {
    silenceSession()
    clearSession()
    setPhase('select')
    setPaused(false)
  }

  function awardStars() {
    // The jar animates the spendable balance, which is what the Star Jar
    // screen shows — the lifetime total keeps its own count.
    const before = starBalance(activeKidRef.current).balance
    setStarsResult({ before, after: before + STARS_PER_SESSION, starsAdded: STARS_PER_SESSION })
    if (activeKidIdRef.current && familyCodeRef.current) {
      addStars(familyCodeRef.current, activeKidIdRef.current, STARS_PER_SESSION, {
        activityId: activityIdRef.current,
        minutes: Math.round(totalMsRef.current / 60000),
      }).catch(err => {
        console.error('Failed to save stars:', err)
      })
    }
  }

  function finishSession() {
    clearSession()
    // Only the interval cues stop here. The alarm is meant to outlive
    // the countdown and keep ringing until the kid turns it off, which
    // is the whole point of it being an alarm.
    cancelScheduledCues()
    setAlarmRinging(isAlarmScheduled())
    setPhase('done')
    if (activeKidRef.current) {
      awardStars()
    } else {
      // Restored on a cold start: the kid data hasn't arrived yet, so
      // settle up once it does.
      owedStarsRef.current = true
    }
  }

  // A session that finished while the app was closed still owes its
  // stars — pay them as soon as we know whose they are.
  useEffect(() => {
    if (!owedStarsRef.current || !activeKid) return
    owedStarsRef.current = false
    awardStars()
  }, [activeKid])

  // Countdown loop.
  useEffect(() => {
    if (phase !== 'running' || paused) return undefined

    function tick() {
      const now = Date.now()
      const msLeft = Math.max(0, endAtRef.current - now)
      setRemainingMs(msLeft)

      if (msLeft > 0 && isHiitRef.current) {
        // Read straight off the elapsed clock, so coming back from a
        // dark screen lands on the right interval in one step.
        const current = intervalAt({
          elapsedMs: now - startedAtRef.current,
          exerciseSec: exerciseSecRef.current,
          restSec: restSecRef.current,
          sessionRemainingMs: msLeft,
        })
        setIntervalKind(current.kind)
        setIntervalTotalMs(current.totalMs)
        setIntervalRemainingMs(current.remainingMs)
        setRoundNumber(current.round)
      }

      if (msLeft <= 0) {
        // The alarm was booked on the audio clock when the session
        // began, so there's nothing to start here — and, importantly,
        // nothing to cancel either: cancelling everything at this point
        // used to silence the melody a frame after it began, leaving a
        // blip where the celebration should have been.
        finishSession()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // finishSession is redefined every render but only touches refs and
    // setters, so re-arming the loop for it would just restart the frame
    // callback for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused])

  // After a restore the audio schedule has to be rebuilt from scratch —
  // the previous page's booked cues died with it.
  const audioRestoredRef = useRef(false)
  useEffect(() => {
    if (audioRestoredRef.current) return
    if (phase !== 'running' || paused) return
    audioRestoredRef.current = true
    if (!isAlarmScheduled()) scheduleAudioFrom(Date.now())
    // scheduleAudioFrom is redefined each render but reads only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused])

  const fraction = isHiit
    ? (intervalTotalMs > 0 ? intervalRemainingMs / intervalTotalMs : 0)
    : (totalMs > 0 ? remainingMs / totalMs : 0)

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
          loadError={kidsError}
          onSelectKid={handleSelectKid}
          onAddKid={handleAddKid}
        />
      </div>
    )
  }

  if (stage === 'starjar') {
    return (
      <div className="app">
        <StarJarScreen
          kid={activeKid}
          onBack={() => setStage('timer')}
          onViewLog={() => setStage('starlog')}
          onViewRewards={() => setStage('rewards')}
        />
      </div>
    )
  }

  if (stage === 'starlog') {
    return (
      <div className="app">
        <StarLogScreen familyCode={familyCode} kid={activeKid} onBack={() => setStage('starjar')} />
      </div>
    )
  }

  if (stage === 'rewards') {
    return (
      <div className="app">
        <RewardsScreen familyCode={familyCode} kid={activeKid} onBack={() => setStage('starjar')} />
      </div>
    )
  }

  if (stage === 'edit-avatar') {
    return (
      <div className="app">
        <EditAvatarScreen kid={activeKid} onSave={handleUpdateAvatar} onBack={() => setStage('timer')} />
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
          onViewStarJar={() => setStage('starjar')}
          onEditAvatar={() => setStage('edit-avatar')}
          isHiit={isHiit}
          exerciseSec={exerciseSec}
          onExerciseSecChange={setExerciseSec}
          restSec={restSec}
          onRestSecChange={setRestSec}
        />
      )}

      {phase === 'running' && (
        <RunningScreen
          fraction={fraction}
          remainingMs={isHiit ? intervalRemainingMs : remainingMs}
          totalRemainingMs={remainingMs}
          paused={paused}
          activity={activity}
          isHiit={isHiit}
          intervalKind={intervalKind}
          roundNumber={roundNumber}
          onTogglePause={togglePause}
          onStop={stopTimer}
        />
      )}

      {phase === 'done' && (
        <DoneScreen
          activity={activity}
          starsResult={starsResult}
          alarmRinging={alarmRinging}
          onSilenceAlarm={silenceSession}
          onRestart={stopTimer}
        />
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
  onViewStarJar,
  onEditAvatar,
  isHiit,
  exerciseSec,
  onExerciseSecChange,
  restSec,
  onRestSecChange,
}) {
  return (
    <div className="screen select-screen">
      {kid && (
        <div className="kid-bar">
          <span className="kid-bar-name">
            <button
              className="kid-bar-avatar"
              onClick={onEditAvatar}
              aria-label={tBoth('changeAvatarOf', { name: kid.name })}
              title={tBoth('changeAvatarOf', { name: kid.name })}
            >
              {kid.avatar}
            </button>
            {kid.name}
          </span>
          <div className="kid-bar-actions">
            <button className="text-btn bi-inline" onClick={onViewStarJar}>
              ⭐ <T k="starJar" /> ({kid.totalStars ?? 0})
            </button>
            <button className="text-btn bi-inline" onClick={onSwitchKid}>
              <T k="switchKid" />
            </button>
          </div>
        </div>
      )}
      <div className="hero-icon" aria-hidden="true">🎯</div>
      <h1><T k="focusTime" /></h1>
      <p className="subtitle"><T k="whatFocusingOn" /></p>
      <ActivityPicker value={activityId} onChange={onActivityChange} />
      {isHiit && (
        <div className="hiit-setup">
          <SecondsRow
            labelKey="exerciseDuration"
            options={EXERCISE_OPTIONS}
            value={exerciseSec}
            onChange={onExerciseSecChange}
          />
          <SecondsRow
            labelKey="restDuration"
            options={REST_OPTIONS}
            value={restSec}
            onChange={onRestSecChange}
          />
        </div>
      )}
      <p className="subtitle"><T k="pickHowLong" /></p>
      <div className="preset-grid">
        {PRESETS.map(minutes => (
          <button
            key={minutes}
            className="preset-btn"
            onClick={() => onSelect(minutes)}
          >
            <span className="preset-number">{minutes}</span>
            <span className="preset-unit"><T k="minutes" /></span>
          </button>
        ))}
      </div>
      <ThemePicker value={colorTheme} onChange={onColorThemeChange} />
    </div>
  )
}

function SecondsRow({ labelKey, options, value, onChange }) {
  return (
    <div className="seconds-row">
      <p className="seconds-label"><T k={labelKey} /></p>
      <div className="seconds-options" role="radiogroup" aria-label={tBoth(labelKey)}>
        {options.map(sec => (
          <button
            key={sec}
            className={`seconds-chip${value === sec ? ' active' : ''}`}
            role="radio"
            aria-checked={value === sec}
            onClick={() => onChange(sec)}
          >
            <T k="seconds" vars={{ count: sec }} />
          </button>
        ))}
      </div>
    </div>
  )
}

function ActivityPicker({ value, onChange }) {
  return (
    <div className="activity-picker" role="radiogroup" aria-label={tBoth('activityLabel')}>
      {ACTIVITIES.map(activity => (
        <button
          key={activity.id}
          className={`activity-chip${value === activity.id ? ' active' : ''}`}
          role="radio"
          aria-checked={value === activity.id}
          onClick={() => onChange(value === activity.id ? null : activity.id)}
        >
          <span className="activity-emoji" aria-hidden="true">{activity.emoji}</span>
          <span className="activity-label">
            <span className="t-zh" lang="zh-Hant">{activity.label.zh}</span>
            <span className="t-en" lang="en">{activity.label.en}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label={tBoth('colorTheme')}>
      {THEMES.map(theme => (
        <button
          key={theme.id}
          className={`theme-swatch${value === theme.id ? ' active' : ''}`}
          style={{ '--swatch-color': theme.swatch }}
          role="radio"
          aria-checked={value === theme.id}
          aria-label={`${theme.name.zh} / ${theme.name.en}`}
          onClick={() => onChange(theme.id)}
        />
      ))}
    </div>
  )
}

function RunningScreen({
  fraction,
  remainingMs,
  totalRemainingMs,
  paused,
  activity,
  isHiit,
  intervalKind,
  roundNumber,
  onTogglePause,
  onStop,
}) {
  const [peeking, setPeeking] = useState(false)

  function startPeek(e) {
    e.preventDefault()
    setPeeking(true)
  }

  function endPeek() {
    setPeeking(false)
  }

  // Work and rest get their own hues — dial, track and label together —
  // so the state is unmistakable mid-workout, and distinct from paused.
  const resting = isHiit && intervalKind === 'rest'
  let pieColor = 'var(--accent)'
  let trackColor = 'var(--accent-soft)'
  let stateInk = null

  if (paused) {
    pieColor = 'var(--accent-pale)'
  } else if (isHiit) {
    pieColor = resting ? 'var(--hiit-rest)' : 'var(--hiit-work)'
    trackColor = resting ? 'var(--hiit-rest-track)' : 'var(--hiit-work-track)'
    stateInk = pieColor
  }

  let hintKey = paused ? 'paused' : 'stayFocused'
  if (isHiit && !paused) hintKey = resting ? 'restNow' : 'workNow'

  return (
    <div className="screen running-screen" style={stateInk ? { '--state-ink': stateInk } : undefined}>
      {isHiit && !paused && (
        <p className="round-tag"><T k="roundNumber" vars={{ number: roundNumber }} /></p>
      )}
      {activity && (
        <p className="activity-tag">
          <span aria-hidden="true">{activity.emoji}</span>{' '}
          <span className="t-zh" lang="zh-Hant">{activity.label.zh}</span>
          <span className="t-en" lang="en">{activity.label.en}</span>
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
          color={pieColor}
          trackColor={trackColor}
          overlayText={peeking ? formatTime(remainingMs) : null}
          size={300}
        />
      </div>
      <p className="running-hint"><T k={hintKey} /></p>
      {isHiit ? (
        <p className="peek-hint">
          <T k="totalLeft" vars={{ time: formatTime(totalRemainingMs) }} />
        </p>
      ) : (
        <p className="peek-hint"><T k="peekHint" /></p>
      )}
      <div className="controls">
        <button className="icon-btn" onClick={onTogglePause} aria-label={tBoth(paused ? 'resume' : 'pause')}>
          {paused ? '▶' : '⏸'}
        </button>
        <button className="icon-btn stop-btn" onClick={onStop} aria-label={tBoth('stop')}>
          ✕
        </button>
      </div>
    </div>
  )
}

function DoneScreen({ activity, starsResult, alarmRinging, onSilenceAlarm, onRestart }) {
  return (
    <div className="screen done-screen">
      <div className={`hero-icon${alarmRinging ? ' hero-ringing' : ''}`} aria-hidden="true">🎉</div>
      <h1><T k="greatJob" /></h1>
      <p className="subtitle">
        {activity ? <T k="niceWorkOn" vars={{ activity: activity.label }} /> : <T k="timeIsUp" />}
      </p>
      {alarmRinging && (
        <button className="preset-btn wide-btn silence-btn" onClick={onSilenceAlarm}>
          <T k="turnOffAlarm" />
        </button>
      )}
      {starsResult && (
        <JarDropAnimation
          before={starsResult.before}
          after={starsResult.after}
          starsAdded={starsResult.starsAdded}
          onCollect={onSilenceAlarm}
        />
      )}
      <button className="preset-btn wide-btn" onClick={onRestart}>
        <T k="startAgain" />
      </button>
    </div>
  )
}
