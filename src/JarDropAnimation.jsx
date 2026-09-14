import { useEffect, useState } from 'react'
import { JAR_CAPACITY } from './stars.js'
import PhysicsJar from './PhysicsJar.jsx'

const DROP_DELAY_MS = 400
const FALL_SETTLE_MS = 1600
const CELEBRATE_MS = 1600

// Plays on the completion screen: the newly-earned stars drop into the
// jar under gravity and pile up. If that fills the jar, it gets a
// celebratory shake before a fresh jar catches the overflow.
export default function JarDropAnimation({ before, after, starsAdded }) {
  const beforeInJar = before % JAR_CAPACITY
  const afterInJar = after % JAR_CAPACITY
  const jarCompleted = Math.floor(after / JAR_CAPACITY) > Math.floor(before / JAR_CAPACITY)
  const fullJarsNow = Math.floor(after / JAR_CAPACITY)

  const [phase, setPhase] = useState('falling') // 'falling' -> 'celebrate'? -> 'settled'
  const [jarCount, setJarCount] = useState(beforeInJar)
  const [shakeSignal, setShakeSignal] = useState(0)

  // A beat to take in the jar as it stands, then the new stars drop in.
  useEffect(() => {
    const dropTimer = setTimeout(() => {
      setJarCount(Math.min(beforeInJar + starsAdded, JAR_CAPACITY))
    }, DROP_DELAY_MS)

    const landTimer = setTimeout(() => {
      if (jarCompleted) {
        setPhase('celebrate')
        setShakeSignal(s => s + 1)
      } else {
        setPhase('settled')
      }
    }, DROP_DELAY_MS + FALL_SETTLE_MS)

    return () => {
      clearTimeout(dropTimer)
      clearTimeout(landTimer)
    }
    // One completion event, one drop — nothing here changes mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  if (phase === 'falling') progressLabel = beforeInJar
  else if (phase === 'celebrate') progressLabel = JAR_CAPACITY

  return (
    <div className="jar-drop">
      <PhysicsJar count={jarCount} size={170} shakeSignal={shakeSignal} />
      {phase === 'celebrate' && <p className="jar-full-banner">🎉 Jar #{fullJarsNow} full!</p>}
      <p className="jar-progress-label">
        {progressLabel}/{JAR_CAPACITY} stars in this jar
      </p>
    </div>
  )
}
