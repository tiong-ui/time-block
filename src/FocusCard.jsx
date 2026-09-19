import { useEffect, useRef, useState } from 'react'
import { PRESETS } from './presets'
import { ACTIVITY_STORAGE_KEY, withHiit } from './activities.js'
import {
  HIIT_ACTIVITY_ID,
  EXERCISE_OPTIONS,
  REST_OPTIONS,
  EXERCISE_STORAGE_KEY,
  REST_STORAGE_KEY,
  perKidKey,
  loadStoredExerciseSec,
  loadStoredRestSec,
  storeSeconds,
  intervalAt,
  upcomingCues,
} from './hiit.js'
import { STARS_PER_SESSION, starBalance } from './stars.js'
import { addStars } from './kids.js'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { T, Label } from './T.jsx'
import JarDropAnimation from './JarDropAnimation.jsx'
import PieTimer from './PieTimer'
import { playIntervalCue, scheduleAlarm, scheduleIntervalCues } from './chime'
import { saveSession, clearSession, restoredTimerState, storeLastKid } from './session.js'
import { holdScreenAwake } from './wakeLock.js'

// One kid's focus session, start to finish, owning everything it needs:
// its own countdown, its own HIIT cycle, its own booked audio, its own
// saved state and its own stars.
//
// That ownership is the point. Several of these run side by side on a
// shared iPad, and pausing or stopping one must not reach into
// another's clocks, silence another's alarm, or clear another's saved
// session — so nothing here is shared, and every handle is held rather
// than looked up.

// How often a running card redraws. See the countdown loop below for
// why this is nowhere near a frame rate.
const TICK_MS = 100

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function loadStoredActivity(kidId) {
  try {
    return localStorage.getItem(perKidKey(ACTIVITY_STORAGE_KEY, kidId))
  } catch {
    return null
  }
}

export default function FocusCard({
  familyCode, kid, activities, restored, collapsed, onToggle, onActiveChange,
  onViewStarJar, onEditAvatar,
}) {
  // The family's own list, plus HIIT, which is built in.
  const choices = withHiit(activities)
  const kidId = kid.id

  // Restoring happens as this card's opening state rather than in an
  // effect, so a reloaded timer is already counting on the first paint.
  const [opening] = useState(() => restoredTimerState(restored))
  const restoredSession = opening.session

  const [phase, setPhase] = useState(opening.phase)
  const [totalMs, setTotalMs] = useState(opening.totalMs)
  const [remainingMs, setRemainingMs] = useState(opening.remainingMs)
  const [paused, setPaused] = useState(opening.paused)
  const [activityId, setActivityId] = useState(
    () => restoredSession?.activityId ?? loadStoredActivity(kidId),
  )
  const [exerciseSec, setExerciseSec] = useState(
    () => restoredSession?.exerciseSec ?? loadStoredExerciseSec(kidId),
  )
  const [restSec, setRestSec] = useState(
    () => restoredSession?.restSec ?? loadStoredRestSec(kidId),
  )
  const [intervalKind, setIntervalKind] = useState('work')
  const [intervalTotalMs, setIntervalTotalMs] = useState(0)
  const [intervalRemainingMs, setIntervalRemainingMs] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [starsResult, setStarsResult] = useState(null)
  const [alarmRinging, setAlarmRinging] = useState(false)
  const [starsError, setStarsError] = useState(null)

  // A remembered pick can name something a grown-up has since removed.
  const activity = choices.find(a => a.id === activityId) ?? null
  const isHiit = activityId === HIIT_ACTIVITY_ID

  useEffect(() => {
    try {
      const key = perKidKey(ACTIVITY_STORAGE_KEY, kidId)
      if (activityId) localStorage.setItem(key, activityId)
      else localStorage.removeItem(key)
    } catch {
      // Storage can be unavailable; the choice just won't persist.
    }
  }, [activityId, kidId])

  useEffect(() => { storeSeconds(perKidKey(EXERCISE_STORAGE_KEY, kidId), exerciseSec) }, [exerciseSec, kidId])
  useEffect(() => { storeSeconds(perKidKey(REST_STORAGE_KEY, kidId), restSec) }, [restSec, kidId])

  // The countdown loop reads these without needing to re-arm itself.
  const isHiitRef = useRef(isHiit)
  const exerciseSecRef = useRef(exerciseSec)
  const restSecRef = useRef(restSec)
  const activityIdRef = useRef(activityId)
  const activityRef = useRef(activity)
  const totalMsRef = useRef(totalMs)
  const kidRef = useRef(kid)
  useEffect(() => {
    isHiitRef.current = isHiit
    exerciseSecRef.current = exerciseSec
    restSecRef.current = restSec
    activityIdRef.current = activityId
    activityRef.current = activity
    totalMsRef.current = totalMs
    kidRef.current = kid
  }, [isHiit, exerciseSec, restSec, activityId, activity, totalMs, kid])

  // Wall-clock bookkeeping, so the countdown stays accurate even if the
  // tab is backgrounded and rAF gets throttled.
  const startedAtRef = useRef(restoredSession?.startedAt ?? 0)
  const endAtRef = useRef(restoredSession?.endAt ?? 0)
  const pausedAtRef = useRef(restoredSession?.pausedAt ?? 0)
  const cancelCuesRef = useRef(null)
  // This card's own alarm handle. Stopping it silences this kid's
  // finish and nobody else's.
  const alarmRef = useRef(null)
  const owedStarsRef = useRef(opening.owesStars)

  function cancelScheduledCues() {
    if (cancelCuesRef.current) {
      cancelCuesRef.current()
      cancelCuesRef.current = null
    }
  }

  function clearScheduledAudio() {
    cancelScheduledCues()
    if (alarmRef.current) {
      alarmRef.current.stop()
      alarmRef.current = null
    }
  }

  function silenceSession() {
    clearScheduledAudio()
    setAlarmRinging(false)
  }

  // Books the finishing alarm — and, for HIIT, every work/rest switch —
  // on the Web Audio clock up front. That clock keeps running while the
  // tab is hidden, so the timer is still heard with the screen off.
  function scheduleAudioFrom(now) {
    clearScheduledAudio()
    const sessionRemainingMs = endAtRef.current - now
    if (sessionRemainingMs <= 0) return

    alarmRef.current = scheduleAlarm(sessionRemainingMs, { onGiveUp: () => setAlarmRinging(false) })
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
    saveSession(kidId, {
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
    setStarsError(null)
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

    saveSession(kidId, {
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
    // This device now belongs to whoever just started, until someone
    // else starts something.
    storeLastKid(kidId)
    onActiveChange(kidId, true)
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
    clearSession(kidId)
    setPhase('select')
    setPaused(false)
    onActiveChange(kidId, false)
  }

  function awardStars() {
    const before = starBalance(kidRef.current).balance
    setStarsResult({ before, after: before + STARS_PER_SESSION, starsAdded: STARS_PER_SESSION })
    setStarsError(null)
    if (!familyCode) return
    addStars(familyCode, kidId, STARS_PER_SESSION, {
      activityId: activityIdRef.current,
      activityLabel: activityRef.current?.label ?? null,
      activityEmoji: activityRef.current?.emoji ?? null,
      minutes: Math.round(totalMsRef.current / 60000),
    })
      .then(result => {
        if (!result.logged) setStarsError(tBoth('errLogEntry', { detail: errorDetail(result.logError) }))
      })
      .catch(err => {
        console.error('Failed to save stars:', err)
        setStarsError(tBoth('errSaveStars', { detail: errorDetail(err) }))
      })
  }

  function finishSession() {
    clearSession(kidId)
    // Only the interval cues stop here. The alarm is meant to outlive
    // the countdown and keep ringing until the kid turns it off.
    cancelScheduledCues()
    setAlarmRinging(Boolean(alarmRef.current?.ringing))
    setPhase('done')
    awardStars()
  }

  // A session that finished while the app was closed still owes its
  // stars — pay them as soon as this card is on screen.
  useEffect(() => {
    if (!owedStarsRef.current) return
    owedStarsRef.current = false
    awardStars()
    // awardStars only reads refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // While this card is counting down, ask the screen to stay awake.
  // On an iPad that's what keeps the finishing alarm audible at all:
  // once the device locks, Safari suspends the audio and nothing that
  // was booked ever sounds. Paused doesn't count — nothing is going to
  // go off — and the hold is dropped the moment the card stops.
  useEffect(() => {
    if (phase !== 'running' || paused) return undefined
    return holdScreenAwake()
  }, [phase, paused])

  // Countdown loop. One per card, armed only while that card is
  // running, so a paused kid costs nothing and a stopped one stops.
  //
  // Ten times a second, not every frame. The dial drains over ten to
  // thirty minutes and the peeked readout only changes once a second,
  // so sixty was redrawing the same picture — and with three kids
  // going at once that was a hundred and eighty repaints a second on a
  // screen the wake lock is now holding open. The fastest thing here
  // is a twenty-second HIIT round, which at this rate still moves less
  // than two degrees a step.
  //
  // None of this touches accuracy: every value is read from the
  // wall clock, so a slower or jittery tick only means the picture
  // catches up a fraction of a second later. The alarm doesn't wait
  // for it at all — that was booked on the audio clock when the
  // session started.
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
        // began, so there's nothing to start here — and nothing to
        // cancel either.
        finishSession()
        clearInterval(id)
      }
    }

    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
    // finishSession is redefined every render but only touches refs and
    // setters, so re-arming the loop for it would restart the frame
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
    if (!alarmRef.current) scheduleAudioFrom(Date.now())
    // scheduleAudioFrom is redefined each render but reads only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused])

  // Leaving the board entirely — a kid removed, the family switched —
  // must not leave an alarm booked with nobody holding it.
  // clearScheduledAudio is redefined each render but only touches refs,
  // and this must run on unmount alone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => clearScheduledAudio(), [])

  const fraction = isHiit
    ? (intervalTotalMs > 0 ? intervalRemainingMs / intervalTotalMs : 0)
    : (totalMs > 0 ? remainingMs / totalMs : 0)

  // Collapsing only changes what is drawn. The card stays mounted, so
  // its clocks, its booked audio and its saved session carry on exactly
  // as they were — a closed card is still counting down.
  if (collapsed) {
    return (
      <button
        className="focus-card focus-collapsed"
        onClick={onToggle}
        aria-expanded={false}
        aria-label={tBoth('expandCard', { name: kid.name })}
      >
        <span className="collapsed-avatar" aria-hidden="true">{kid.avatar}</span>
        <span className="collapsed-name">{kid.name}</span>
        <span className="collapsed-stars">⭐{starBalance(kid).balance}</span>
        <span className="collapsed-start bi-inline"><T k="startFocus" /></span>
      </button>
    )
  }

  return (
    <section className={`focus-card focus-${phase}`}>
      <KidHeader
        kid={kid}
        phase={phase}
        onToggle={onToggle}
        onViewStarJar={onViewStarJar}
        onEditAvatar={onEditAvatar}
      />

      {phase === 'select' && (
        <SelectBody
          activityId={activityId}
          activities={choices}
          onActivityChange={setActivityId}
          isHiit={isHiit}
          exerciseSec={exerciseSec}
          onExerciseSecChange={setExerciseSec}
          restSec={restSec}
          onRestSecChange={setRestSec}
          onSelect={startTimer}
        />
      )}

      {phase === 'running' && (
        <RunningBody
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
        <DoneBody
          activity={activity}
          starsResult={starsResult}
          starsError={starsError}
          alarmRinging={alarmRinging}
          onSilenceAlarm={silenceSession}
          onRestart={stopTimer}
        />
      )}
    </section>
  )
}

function KidHeader({ kid, phase, onToggle, onViewStarJar, onEditAvatar }) {
  return (
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
      <span className="kid-bar-actions">
        <button className="text-btn bi-inline" onClick={onViewStarJar}>
          ⭐ <T k="starJar" /> ({starBalance(kid).balance})
        </button>
        {/* Only an idle card can be put away. One that's counting down
            or waiting to be collected has to stay where it can be seen. */}
        {phase === 'select' && (
          <button
            className="collapse-btn"
            onClick={onToggle}
            aria-expanded
            aria-label={tBoth('collapseCard', { name: kid.name })}
          >
            ▴
          </button>
        )}
      </span>
    </div>
  )
}

function SelectBody({
  activityId, activities, onActivityChange, isHiit,
  exerciseSec, onExerciseSecChange, restSec, onRestSecChange, onSelect,
}) {
  return (
    <div className="card-body select-body">
      <p className="subtitle"><T k="whatFocusingOn" /></p>
      <ActivityPicker options={activities} value={activityId} onChange={onActivityChange} />
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
          <button key={minutes} className="preset-btn" onClick={() => onSelect(minutes)}>
            <span className="preset-number">{minutes}</span>
            <span className="preset-unit"><T k="minutes" /></span>
          </button>
        ))}
      </div>
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

function ActivityPicker({ options, value, onChange }) {
  return (
    <div className="activity-picker" role="radiogroup" aria-label={tBoth('activityLabel')}>
      {options.map(activity => (
        <button
          key={activity.id}
          className={`activity-chip${value === activity.id ? ' active' : ''}`}
          role="radio"
          aria-checked={value === activity.id}
          onClick={() => onChange(value === activity.id ? null : activity.id)}
        >
          <span className="activity-emoji" aria-hidden="true">{activity.emoji}</span>
          <span className="activity-label"><Label value={activity.label} /></span>
        </button>
      ))}
    </div>
  )
}

function RunningBody({
  fraction, remainingMs, totalRemainingMs, paused, activity,
  isHiit, intervalKind, roundNumber, onTogglePause, onStop,
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
    <div className="card-body running-body" style={stateInk ? { '--state-ink': stateInk } : undefined}>
      {isHiit && !paused && (
        <p className="round-tag"><T k="roundNumber" vars={{ number: roundNumber }} /></p>
      )}
      {activity && (
        <p className="activity-tag">
          <span aria-hidden="true">{activity.emoji}</span>{' '}
          <Label value={activity.label} />
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

function DoneBody({ activity, starsResult, starsError, alarmRinging, onSilenceAlarm, onRestart }) {
  return (
    <div className="card-body done-body">
      <div className={`hero-icon${alarmRinging ? ' hero-ringing' : ''}`} aria-hidden="true">🎉</div>
      <h2 className="card-title"><T k="greatJob" /></h2>
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
      {starsError && <p className="form-error">{starsError}</p>}
      <button className="preset-btn wide-btn" onClick={onRestart}>
        <T k="startAgain" />
      </button>
    </div>
  )
}
