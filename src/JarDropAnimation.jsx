import { useEffect, useState } from 'react'
import { JAR_CAPACITY } from './stars.js'
import PhysicsJar from './PhysicsJar.jsx'

const FALL_SETTLE_MS = 1600
const CELEBRATE_MS = 1600

// Plays on the completion screen. The jar sits there with what's
// already in it until the kid taps the button to tip their new stars
// in — then they drop under gravity and pile up. If that fills the
// jar, it gets a celebratory shake before a fresh jar catches the
// overflow.
//
// The stars are banked the moment the timer ends, so this is purely
// the celebration — skipping it costs nothing.
export default function JarDropAnimation({ before, after, starsAdded }) {
  const beforeInJar = before % JAR_CAPACITY
  const afterInJar = after % JAR_CAPACITY
  const jarCompleted = Math.floor(after / JAR_CAPACITY) > Math.floor(before / JAR_CAPACITY)
  const fullJarsNow = Math.floor(after / JAR_CAPACITY)

  const [phase, setPhase] = useState('ready') // 'ready' -> 'falling' -> 'celebrate'? -> 'settled'
  const [jarCount, setJarCount] = useState(beforeInJar)
  const [shakeSignal, setShakeSignal] = useState(0)

  function handleCollect() {
    setJarCount(Math.min(beforeInJar + starsAdded, JAR_CAPACITY))
    setPhase('falling')
  }

  // Give the stars time to fall and settle before celebrating.
  useEffect(() => {
    if (phase !== 'falling') return undefined
    const landTimer = setTimeout(() => {
      if (jarCompleted) {
        setPhase('celebrate')
        setShakeSignal(s => s + 1)
      } else {
        setPhase('settled')
      }
    }, FALL_SETTLE_MS)
    return () => clearTimeout(landTimer)
  }, [phase, jarCompleted])

  useEffect(() => {
    if (phase !== 'celebrate') return undefined
    const resetTimer = setTimeout(() => {
      setJarCount(afterInJar)
      setPhase('settled')
    }, CELEBRATE_MS)
    return () => clearTimeout(resetTimer)
  }, [phase, afterInJar])

  // While the full jar is on screen being celebrated, the label should
  // match what's visibly in it rather than jumping ahead to the next jar.
  let progressLabel = afterInJar
  if (phase === 'ready' || phase === 'falling') progressLabel = beforeInJar
  else if (phase === 'celebrate') progressLabel = JAR_CAPACITY

  return (
    <div className="jar-drop">
      <PhysicsJar count={jarCount} size={170} shakeSignal={shakeSignal} />
      {phase === 'celebrate' && <p className="jar-full-banner">🎉 Jar #{fullJarsNow} full!</p>}
      <p className="jar-progress-label">
        {progressLabel}/{JAR_CAPACITY} stars in this jar
      </p>
      {phase === 'ready' && (
        <button className="preset-btn wide-btn collect-btn" onClick={handleCollect}>
          ⭐ Add my {starsAdded} stars!
        </button>
      )}
    </div>
  )
}
