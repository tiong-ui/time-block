// A short celebration melody played when the timer finishes.
// Uses the Web Audio API directly so no sound files need to be shipped.
// A handful of ~4-5 second tunes, one picked at random each time, so it
// doesn't feel identical every session.
let ctx = null

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  return ctx
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
    const peakGain = freqs.length > 1 ? 0.15 : 0.22

    freqs.forEach(freq => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = waveTypeFor(freq)
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start(start)
      osc.stop(start + duration)
      nodes.push({ osc, gain })
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

// Schedules the finishing melody `delayMs` from now on the Web Audio
// clock, which keeps running while the tab is hidden — so the timer is
// still heard when the phone is face-down or in a pocket.
export function scheduleChime(delayMs) {
  const audioCtx = getContext()
  if (!audioCtx) return () => {}
  if (audioCtx.state === 'suspended') audioCtx.resume()
  const nodes = scheduleTune(audioCtx, pickTune(), audioCtx.currentTime + Math.max(0, delayMs) / 1000)
  return cancelHandle(nodes)
}

// Interval cues for HIIT: a rising double beep to start working, a
// softer note to drop into rest. Short and distinct — they fire
// mid-workout, when nobody is looking at the screen.
function scheduleCue(audioCtx, kind, startAt) {
  const notes =
    kind === 'work'
      ? [{ freq: G5, time: 0, duration: 0.12 }, { freq: C6, time: 0.13, duration: 0.22 }]
      : [{ freq: E5, time: 0, duration: 0.3 }]

  return notes.map(({ freq, time, duration }) => {
    const start = startAt + time
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = kind === 'work' ? 'triangle' : 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
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
