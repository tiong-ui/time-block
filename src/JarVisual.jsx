import { JAR_CAPACITY } from './stars.js'

// A jar drawn in plain CSS, filled bottom-up with stars up to `count`
// (0-JAR_CAPACITY). Purely presentational — used both for the static
// Star Jar page and by JarDropAnimation.
export default function JarVisual({ count, size = 180 }) {
  const clamped = Math.max(0, Math.min(JAR_CAPACITY, count))
  const slots = Array.from({ length: JAR_CAPACITY })

  return (
    <div className="jar-visual" style={{ '--jar-size': `${size}px` }}>
      <div className="jar-lid" aria-hidden="true" />
      <div className="jar-neck" aria-hidden="true" />
      <div className="jar-body">
        {slots.map((_, i) => (
          <span key={i} className={`jar-star${i < clamped ? ' filled' : ''}`} aria-hidden="true">
            ⭐
          </span>
        ))}
      </div>
    </div>
  )
}
