// A short celebration melody played when the timer finishes.
// Uses the Web Audio API directly so no sound files need to be shipped.
// A handful of little tunes, one picked at random each time, so it
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
const C5 = 523.25, D5 = 587.33, E5 = 659.25, FS5 = 739.99, G5 = 783.99, A5 = 880
const C6 = 1046.5, E6 = 1318.51, G6 = 1567.98

// Each tune is a list of "chords": a set of frequencies played together,
// starting at `time` seconds and ringing for `duration` seconds. A single
// freq is just a one-note chord.
const TUNES = [
  // Classic ta-da
  [
    { time: 0, duration: 0.35, freqs: [C5] },
    { time: 0.18, duration: 0.9, freqs: [E5, G5] },
  ],
  // Triumphant fanfare
  [
    { time: 0, duration: 0.15, freqs: [C5] },
    { time: 0.15, duration: 0.15, freqs: [E5] },
    { time: 0.3, duration: 0.15, freqs: [G5] },
    { time: 0.45, duration: 0.7, freqs: [C6, E6, G6] },
  ],
  // Playful bounce
  [
    { time: 0, duration: 0.12, freqs: [C5] },
    { time: 0.12, duration: 0.12, freqs: [G5] },
    { time: 0.24, duration: 0.12, freqs: [E5] },
    { time: 0.36, duration: 0.12, freqs: [C6] },
    { time: 0.48, duration: 0.6, freqs: [G5, C6] },
  ],
  // Sparkly run-up
  [
    { time: 0, duration: 0.09, freqs: [C5] },
    { time: 0.09, duration: 0.09, freqs: [D5] },
    { time: 0.18, duration: 0.09, freqs: [E5] },
    { time: 0.27, duration: 0.09, freqs: [FS5] },
    { time: 0.36, duration: 0.09, freqs: [G5] },
    { time: 0.45, duration: 0.09, freqs: [A5] },
    { time: 0.54, duration: 0.7, freqs: [C6, E6] },
  ],
]

export function playChime() {
  const audioCtx = getContext()
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const tune = TUNES[Math.floor(Math.random() * TUNES.length)]
  const now = audioCtx.currentTime

  tune.forEach(({ time, duration, freqs }) => {
    const start = now + time
    freqs.forEach(freq => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.22, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start(start)
      osc.stop(start + duration)
    })
  })
}
