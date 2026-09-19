// A short celebration melody played when the timer finishes.
// Uses the Web Audio API directly so no sound files need to be shipped.
// A handful of ~4-5 second tunes, one picked at random each time, so it
// doesn't feel identical every session.
let ctx = null
let master = null

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  return ctx
}

// Everything runs through a compressor, which is what lets the interval
// cues be driven hard enough to hear across a room without the peaks
// clipping into a crackle. Phones cap the final volume themselves, so
// the aim is to use all the headroom below that, not to exceed it.
function getMaster(audioCtx) {
  if (!master) {
    const compressor = audioCtx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 12
    compressor.ratio.value = 8
    compressor.attack.value = 0.002
    compressor.release.value = 0.15
    compressor.connect(audioCtx.destination)
    master = compressor
  }
  return master
}

// Note names -> frequencies (Hz), for readability below.
const C4 = 261.63
const G4 = 392.0
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.0, B5 = 987.77
const C6 = 1046.5, D6 = 1174.66, E6 = 1318.51, G6 = 1567.98

// Each tune is a list of "chords": a set of frequencies played together,
// starting at `time` seconds and ringing for `duration` seconds. A single
// freq is just a one-note chord. The last chord of every tune sustains
// with a bass pedal underneath for a fuller finish.
const TUNES = [
  // Fanfare: rising call, echo, quick flourish, big finish
  [
    { time: 0.0, duration: 0.18, freqs: [C5] },
    { time: 0.18, duration: 0.18, freqs: [E5] },
    { time: 0.36, duration: 0.18, freqs: [G5] },
    { time: 0.54, duration: 0.3, freqs: [C6] },
    { time: 0.9, duration: 0.18, freqs: [G5] },
    { time: 1.08, duration: 0.18, freqs: [E5] },
    { time: 1.26, duration: 0.34, freqs: [C5] },
    { time: 1.7, duration: 0.16, freqs: [E5] },
    { time: 1.86, duration: 0.16, freqs: [G5] },
    { time: 2.02, duration: 0.16, freqs: [C6] },
    { time: 2.18, duration: 0.16, freqs: [E6] },
    { time: 2.34, duration: 0.16, freqs: [G6] },
    { time: 2.5, duration: 1.6, freqs: [C6, E6, G6] },
    { time: 2.5, duration: 1.6, freqs: [C4] },
  ],
  // Bounce party: playful skips building to a shimmering finish
  [
    { time: 0.0, duration: 0.14, freqs: [C5] },
    { time: 0.16, duration: 0.14, freqs: [G4] },
    { time: 0.32, duration: 0.14, freqs: [E5] },
    { time: 0.48, duration: 0.14, freqs: [C5] },
    { time: 0.64, duration: 0.14, freqs: [G5] },
    { time: 0.8, duration: 0.14, freqs: [E5] },
    { time: 0.96, duration: 0.2, freqs: [C6] },
    { time: 1.2, duration: 0.14, freqs: [G5] },
    { time: 1.36, duration: 0.14, freqs: [E5] },
    { time: 1.52, duration: 0.14, freqs: [C6] },
    { time: 1.68, duration: 0.14, freqs: [G5] },
    { time: 1.84, duration: 0.28, freqs: [E6] },
    { time: 2.16, duration: 0.14, freqs: [C6] },
    { time: 2.32, duration: 0.14, freqs: [E6] },
    { time: 2.48, duration: 0.14, freqs: [G6] },
    { time: 2.64, duration: 1.6, freqs: [C6, E6, G6] },
    { time: 2.64, duration: 1.6, freqs: [C4] },
  ],
  // Sparkle run: a full scale run up and back, then a glittering finish
  [
    { time: 0.0, duration: 0.12, freqs: [C5] },
    { time: 0.12, duration: 0.12, freqs: [D5] },
    { time: 0.24, duration: 0.12, freqs: [E5] },
    { time: 0.36, duration: 0.12, freqs: [F5] },
    { time: 0.48, duration: 0.12, freqs: [G5] },
    { time: 0.6, duration: 0.12, freqs: [A5] },
    { time: 0.72, duration: 0.12, freqs: [B5] },
    { time: 0.84, duration: 0.2, freqs: [C6] },
    { time: 1.1, duration: 0.12, freqs: [B5] },
    { time: 1.22, duration: 0.12, freqs: [G5] },
    { time: 1.34, duration: 0.12, freqs: [E5] },
    { time: 1.46, duration: 0.3, freqs: [C5] },
    { time: 1.85, duration: 0.12, freqs: [E5] },
    { time: 1.97, duration: 0.12, freqs: [G5] },
    { time: 2.09, duration: 0.12, freqs: [C6] },
    { time: 2.21, duration: 0.12, freqs: [E6] },
    { time: 2.33, duration: 0.12, freqs: [G6] },
    { time: 2.45, duration: 1.7, freqs: [C6, E6, G6] },
    { time: 2.45, duration: 1.7, freqs: [C4] },
  ],
  // Tunes everyone knows. These are all long out of copyright — the
  // newest was published in 1824 — and they're synthesised here rather
  // than sampled, so there's no recording to licence either. A modern
  // pop song, however well it fits, can't be shipped inside a public
  // web app; these carry the same "you did it" feeling and cost
  // nothing but a few lines of notes.

  // Ode to Joy — Beethoven, 1824
  [
    { time: 0.0, duration: 0.3, freqs: [E5] },
    { time: 0.3, duration: 0.3, freqs: [E5] },
    { time: 0.6, duration: 0.3, freqs: [F5] },
    { time: 0.9, duration: 0.3, freqs: [G5] },
    { time: 1.2, duration: 0.3, freqs: [G5] },
    { time: 1.5, duration: 0.3, freqs: [F5] },
    { time: 1.8, duration: 0.3, freqs: [E5] },
    { time: 2.1, duration: 0.3, freqs: [D5] },
    { time: 2.4, duration: 0.3, freqs: [C5] },
    { time: 2.7, duration: 0.3, freqs: [C5] },
    { time: 3.0, duration: 0.3, freqs: [D5] },
    { time: 3.3, duration: 0.3, freqs: [E5] },
    { time: 3.6, duration: 0.45, freqs: [E5] },
    { time: 4.05, duration: 0.15, freqs: [D5] },
    { time: 4.2, duration: 1.5, freqs: [C5, E5, G5] },
    { time: 4.2, duration: 1.5, freqs: [C4] },
  ],
  // For He's a Jolly Good Fellow — traditional, 18th century. The one
  // song that is literally about someone having done well.
  [
    { time: 0.0, duration: 0.25, freqs: [C5] },
    { time: 0.25, duration: 0.25, freqs: [C5] },
    { time: 0.5, duration: 0.25, freqs: [D5] },
    { time: 0.75, duration: 0.25, freqs: [C5] },
    { time: 1.0, duration: 0.25, freqs: [F5] },
    { time: 1.25, duration: 0.6, freqs: [E5] },
    { time: 1.9, duration: 0.25, freqs: [C5] },
    { time: 2.15, duration: 0.25, freqs: [C5] },
    { time: 2.4, duration: 0.25, freqs: [D5] },
    { time: 2.65, duration: 0.25, freqs: [C5] },
    { time: 2.9, duration: 0.25, freqs: [G5] },
    { time: 3.15, duration: 0.6, freqs: [F5] },
    { time: 3.8, duration: 0.25, freqs: [F5] },
    { time: 4.05, duration: 0.25, freqs: [E5] },
    { time: 4.3, duration: 0.25, freqs: [D5] },
    { time: 4.55, duration: 1.5, freqs: [C5, E5, G5] },
    { time: 4.55, duration: 1.5, freqs: [C4] },
  ],
  // When the Saints Go Marching In — traditional
  [
    { time: 0.0, duration: 0.28, freqs: [C5] },
    { time: 0.28, duration: 0.28, freqs: [E5] },
    { time: 0.56, duration: 0.28, freqs: [F5] },
    { time: 0.84, duration: 0.84, freqs: [G5] },
    { time: 1.75, duration: 0.28, freqs: [C5] },
    { time: 2.03, duration: 0.28, freqs: [E5] },
    { time: 2.31, duration: 0.28, freqs: [F5] },
    { time: 2.59, duration: 0.56, freqs: [G5] },
    { time: 3.15, duration: 0.56, freqs: [E5] },
    { time: 3.71, duration: 0.56, freqs: [C5] },
    { time: 4.27, duration: 0.28, freqs: [E5] },
    { time: 4.55, duration: 0.56, freqs: [D5] },
    { time: 5.11, duration: 1.5, freqs: [C5, E5, G5] },
    { time: 5.11, duration: 1.5, freqs: [C4] },
  ],
  // Gentle cheer: a slower, warmer build to the finish
  [
    { time: 0.0, duration: 0.4, freqs: [E5] },
    { time: 0.42, duration: 0.4, freqs: [G5] },
    { time: 0.84, duration: 0.6, freqs: [C6] },
    { time: 1.5, duration: 0.3, freqs: [G5] },
    { time: 1.82, duration: 0.3, freqs: [A5] },
    { time: 2.14, duration: 0.5, freqs: [C6] },
    { time: 2.7, duration: 0.16, freqs: [D6] },
    { time: 2.88, duration: 0.16, freqs: [E6] },
    { time: 3.06, duration: 0.16, freqs: [G6] },
    { time: 3.24, duration: 1.8, freqs: [C6, E6, G6] },
    { time: 3.24, duration: 1.8, freqs: [C4] },
  ],
]

// Warm sine for the bass pedal and the delicate top shimmer, brighter
// triangle for the main melodic register in between.
function waveTypeFor(freq) {
  if (freq < 300 || freq > 1100) return 'sine'
  return 'triangle'
}

export const TUNE_COUNT = TUNES.length

const MELODY_PEAK = 0.5
const MELODY_CHORD_PEAK = 0.34

// Anything scheduled ahead of time hands back a canceller, so a pause
// or an early stop can silence what hasn't sounded yet.
function cancelHandle(nodes) {
  return () => {
    for (const { osc, gain } of nodes) {
      try {
        osc.stop()
        osc.disconnect()
        gain.disconnect()
      } catch {
        // Already finished — nothing to silence.
      }
    }
  }
}

function scheduleTune(audioCtx, tune, startAt) {
  const nodes = []
  tune.forEach(({ time, duration, freqs }) => {
    const start = startAt + time
    // Loud enough to be an alarm, not background music. Chords are
    // pulled down because their notes sum; the compressor catches the
    // rest so the peaks stay clean.
    const peakGain = freqs.length > 1 ? MELODY_CHORD_PEAK : MELODY_PEAK

    freqs.forEach(freq => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = waveTypeFor(freq)
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

      osc.connect(gain)
      gain.connect(getMaster(audioCtx))

      osc.start(start)
      osc.stop(start + duration)
      nodes.push({ osc, gain, endsAt: start + duration })
    })
  })
  return nodes
}

function pickTune(tuneIndex) {
  return TUNES[Number.isInteger(tuneIndex) ? tuneIndex : Math.floor(Math.random() * TUNES.length)]
}

// `tuneIndex` picks a specific tune (0..TUNE_COUNT-1) instead of a random
// one — handy for previewing each melody from the console, e.g.
// `window.playChime(0)`. Omit it for the normal random behavior.
export function playChime(tuneIndex) {
  const audioCtx = getContext()
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()
  scheduleTune(audioCtx, pickTune(tuneIndex), audioCtx.currentTime)
}

// ---------------------------------------------------------------
// The finishing alarm
//
// When the session ends the melody doesn't just play once and stop —
// it repeats like a phone alarm until the kid turns it off, so a timer
// that runs out while they've wandered off still gets noticed.
//
// It's booked on the Web Audio clock rather than fired from a timer,
// because that clock keeps running under a hidden tab — so on a
// desktop browser the alarm still sounds with the window behind
// something else. Since an endless loop can't all be booked up front,
// repeats are scheduled a long way ahead and topped up periodically.
// The lookahead is far wider than the top-up interval on purpose:
// browsers throttle timers in hidden tabs to about once a minute, so
// the booked repeats have to cover that gap on their own.
//
// iOS and iPadOS are the exception, and it's worth being straight
// about it: Safari suspends the audio context outright when the device
// locks or the app is backgrounded, so nothing booked here sounds. No
// amount of scheduling fixes that — a web page can't reserve an alarm
// slot the way a native app can. What the app does instead is hold a
// screen wake lock while a timer runs (see wakeLock.js), so the iPad
// doesn't reach that state on its own.

const ALARM_GAP_SEC = 0.9
const ALARM_LOOKAHEAD_SEC = 150
const ALARM_REFILL_MS = 20000
// Booked the moment the session starts, however far off the end is, so
// the alarm still rings even if the tab is frozen for the whole session
// and no top-up ever gets to run. A minute of it is enough to notice.
const ALARM_MIN_BOOKED_SEC = 60
// Gives up eventually, so a session finishing in an abandoned tab
// doesn't ring into the evening.
const ALARM_MAX_SEC = 5 * 60

// Several kids can be counting down at once on a shared iPad, so an
// alarm is a thing you hold rather than a thing the module owns: each
// caller gets its own handle, and silencing one leaves the others
// ringing. The set is only so nothing is left running if a caller
// forgets — stopping is normally done through the handle.
const liveAlarms = new Set()

function tuneDurationSec(tune) {
  return tune.reduce((end, chord) => Math.max(end, chord.time + chord.duration), 0)
}

// Which repeats fall inside the window we're booking, and where the
// next one after them starts. Pure, so the awkward part — topping up
// without double-booking or overrunning the cut-off — is testable.
export function alarmRepeats({ nextAt, cycleSec, horizonSec, stopsAtSec }) {
  const starts = []
  if (!(cycleSec > 0)) return { starts, nextAt }
  let at = nextAt
  while (at < horizonSec && at < stopsAtSec) {
    starts.push(at)
    at += cycleSec
  }
  return { starts, nextAt: at }
}

function fillAlarmTo(alarm, horizonSec) {
  const { starts, nextAt } = alarmRepeats({
    nextAt: alarm.nextAt,
    cycleSec: alarm.cycleSec,
    horizonSec,
    stopsAtSec: alarm.stopsAt,
  })
  starts.forEach(at => alarm.nodes.push(...scheduleTune(ctx, alarm.tune, at)))
  alarm.nextAt = nextAt
  // Repeats that have already sounded are done with; keeping them would
  // grow the list for as long as the alarm rings.
  alarm.nodes = alarm.nodes.filter(node => node.endsAt > ctx.currentTime)
}

function refillAlarm(alarm) {
  if (!liveAlarms.has(alarm)) return
  if (ctx.currentTime >= alarm.stopsAt) {
    const { onGiveUp } = alarm
    silence(alarm)
    if (onGiveUp) onGiveUp()
    return
  }
  fillAlarmTo(alarm, ctx.currentTime + ALARM_LOOKAHEAD_SEC)
}

function silence(alarm) {
  if (!liveAlarms.delete(alarm)) return
  clearInterval(alarm.refill)
  cancelHandle(alarm.nodes)()
  alarm.nodes = []
}

// Books an alarm to start `delayMs` from now and repeat until stopped.
// `onGiveUp` fires only if it reaches its own cut-off — stopping it by
// hand is the caller's own doing and needs no callback.
//
// Returns a handle: `stop()` silences this alarm and nothing else, and
// `ringing` says whether it is still booked. Returns null when there's
// no audio available at all, so callers can tell "no alarm" from "an
// alarm that has been silenced".
export function scheduleAlarm(delayMs, { onGiveUp } = {}) {
  const audioCtx = getContext()
  if (!audioCtx) return null
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const tune = pickTune()
  const startAt = audioCtx.currentTime + Math.max(0, delayMs) / 1000
  const alarm = {
    tune,
    cycleSec: tuneDurationSec(tune) + ALARM_GAP_SEC,
    nextAt: startAt,
    stopsAt: startAt + ALARM_MAX_SEC,
    nodes: [],
    refill: null,
    onGiveUp,
  }
  liveAlarms.add(alarm)
  fillAlarmTo(alarm, startAt + ALARM_MIN_BOOKED_SEC)
  alarm.refill = setInterval(() => refillAlarm(alarm), ALARM_REFILL_MS)

  return {
    stop: () => silence(alarm),
    get ringing() {
      return liveAlarms.has(alarm)
    },
  }
}

// Everything at once — for leaving the whole board, where no single
// handle is in scope.
export function stopAllAlarms() {
  for (const alarm of [...liveAlarms]) silence(alarm)
}

// Interval cues for HIIT: a rising double beep to start working, a
// softer note to drop into rest. Short and distinct — they fire
// mid-workout, when nobody is looking at the screen.
// Three sharp rising beeps to start work, two firm low ones to drop
// into rest. Square waves carry further than sine at the same level,
// and the count differs as well as the pitch — so the two are told
// apart by ear alone, mid-burpee, without looking.
const CUE_PEAK = 0.85

function scheduleCue(audioCtx, kind, startAt) {
  const notes =
    kind === 'work'
      ? [
          { freq: G5, time: 0, duration: 0.13 },
          { freq: C6, time: 0.17, duration: 0.13 },
          { freq: E6, time: 0.34, duration: 0.32 },
        ]
      : [
          { freq: E5, time: 0, duration: 0.18 },
          { freq: C5, time: 0.22, duration: 0.34 },
        ]

  return notes.map(({ freq, time, duration }) => {
    const start = startAt + time
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(CUE_PEAK, start + 0.01)
    gain.gain.setValueAtTime(CUE_PEAK, start + duration * 0.6)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(gain)
    gain.connect(getMaster(audioCtx))
    osc.start(start)
    osc.stop(start + duration)
    return { osc, gain }
  })
}

export function playIntervalCue(kind) {
  const audioCtx = getContext()
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()
  scheduleCue(audioCtx, kind, audioCtx.currentTime)
}

// Books every upcoming work/rest switch on the audio clock in one go,
// so the cues keep coming with the screen off. `cues` is a list of
// { atMs, kind } offsets from now.
export function scheduleIntervalCues(cues) {
  const audioCtx = getContext()
  if (!audioCtx) return () => {}
  if (audioCtx.state === 'suspended') audioCtx.resume()
  const now = audioCtx.currentTime
  const nodes = cues.flatMap(({ atMs, kind }) => scheduleCue(audioCtx, kind, now + Math.max(0, atMs) / 1000))
  return cancelHandle(nodes)
}
