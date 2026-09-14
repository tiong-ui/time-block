import { useEffect, useState } from 'react'
import { JAR_CAPACITY } from './stars.js'
import JarVisual from './JarVisual.jsx'

const FALL_DURATION_MS = 900
const STAGGER_MS = 150
const CELEBRATE_MS = 1400

// Plays on the completion screen: the newly-earned stars fall into the
// jar one by one, and if that fills it, a little celebration plays
// before settling into the next (now-emptier) jar.
export default function JarDropAnimation({ before, after, starsAdded }) {
  const beforeInJar = before % JAR_CAPACITY
  const afterInJar = after % JAR_CAPACITY
  const jarCompleted = Math.floor(after / JAR_CAPACITY) > Math.floor(before / JAR_CAPACITY)
  const fullJarsNow = Math.floor(after / JAR_CAPACITY)

  const [phase, setPhase] = useState('falling') // 'falling' -> 'celebrate'? -> 'settled'
  const [displayCount, setDisplayCount] = useState(beforeInJar)

  useEffect(() => {
    const fallTotalMs = FALL_DURATION_MS + (starsAdded - 1) * STAGGER_MS

    const landTimer = setTimeout(() => {
      if (jarCompleted) {
        setDisplayCount(JAR_CAPACITY)
        setPhase('celebrate')
      } else {
        setDisplayCount(afterInJar)
        setPhase('settled')
      }
    }, fallTotalMs)

    return () => clearTimeout(landTimer)
    // Only the initial mount should schedule this — before/after/starsAdded
    // describe one single completion event and won't change mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'celebrate') return undefined
    const resetTimer = setTimeout(() => {
      setDisplayCount(afterInJar)
      setPhase('settled')
    }, CELEBRATE_MS)
    return () => clearTimeout(resetTimer)
  }, [phase, afterInJar])

  const progressLabel = phase === 'falling' ? beforeInJar : afterInJar

  return (
    <div className="jar-drop">
      <div className="jar-anim-wrapper">
        <JarVisual key={phase} count={displayCount} size={170} />
        {phase === 'falling' && (
          <div className="falling-stars-layer" aria-hidden="true">
            {Array.from({ length: starsAdded }).map((_, i) => (
              <span
                key={i}
                className="falling-star"
                style={{ animationDelay: `${i * STAGGER_MS}ms` }}
              >
                ⭐
              </span>
            ))}
          </div>
        )}
      </div>
      {phase === 'celebrate' && <p className="jar-full-banner">🎉 Jar #{fullJarsNow} full!</p>}
      <p className="jar-progress-label">
        {progressLabel}/{JAR_CAPACITY} stars in this jar
      </p>
    </div>
  )
}
