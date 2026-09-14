import { useState } from 'react'
import { JAR_CAPACITY, jarStats } from './stars.js'
import PhysicsJar from './PhysicsJar.jsx'

// Lets a kid check their progress: total stars ever earned, how many
// jars they've filled, and how far along the current one is. Tapping
// the jar gives it a shake.
export default function StarJarScreen({ kid, onBack }) {
  const totalStars = kid.totalStars ?? 0
  const { fullJars, currentJarStars } = jarStats(totalStars)
  const [shakeSignal, setShakeSignal] = useState(0)

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">{kid.avatar}</div>
      <h1>{kid.name}'s Star Jar</h1>
      <div className="jar-stats-row">
        <div className="jar-stat-tile">
          <span className="jar-stat-number">{totalStars}</span>
          <span className="jar-stat-label">Total Stars</span>
        </div>
        <div className="jar-stat-tile">
          <span className="jar-stat-number">{fullJars}</span>
          <span className="jar-stat-label">Full Jars</span>
        </div>
      </div>
      <PhysicsJar
        count={currentJarStars}
        size={170}
        shakeSignal={shakeSignal}
        onShake={() => setShakeSignal(s => s + 1)}
      />
      <p className="jar-progress-label">
        {currentJarStars}/{JAR_CAPACITY} stars in this jar
      </p>
      <p className="peek-hint">👆 Tap the jar to shake it</p>
      <button className="text-btn" onClick={onBack}>
        Back
      </button>
    </div>
  )
}
