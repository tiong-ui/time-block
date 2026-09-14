// A gentle two-note chime played when the timer finishes.
// Uses the Web Audio API directly so no sound file needs to be shipped.
let ctx = null

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  return ctx
}

export function playChime() {
  const audioCtx = getContext()
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const notes = [523.25, 659.25] // C5, E5 — a soft, friendly ding
  const now = audioCtx.currentTime

  notes.forEach((freq, i) => {
    const start = now + i * 0.18
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc.type = 'sine'
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.25, start + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9)

    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(start)
    osc.stop(start + 0.9)
  })
}
