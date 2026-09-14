import { useState } from 'react'
import { JAR_CAPACITY, jarStats } from './stars.js'
import PhysicsJar from './PhysicsJar.jsx'
import { T } from './T.jsx'

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
      <h1><T k="starJarTitle" vars={{ name: kid.name }} /></h1>
      <div className="jar-stats-row">
        <div className="jar-stat-tile">
          <span className="jar-stat-number">{totalStars}</span>
          <span className="jar-stat-label"><T k="totalStars" /></span>
        </div>
        <div className="jar-stat-tile">
          <span className="jar-stat-number">{fullJars}</span>
          <span className="jar-stat-label"><T k="fullJars" /></span>
        </div>
      </div>
      <PhysicsJar
        count={currentJarStars}
        size={170}
        shakeSignal={shakeSignal}
        onShake={() => setShakeSignal(s => s + 1)}
      />
      <p className="jar-progress-label">
        <T k="starsInThisJar" vars={{ count: currentJarStars, capacity: JAR_CAPACITY }} />
      </p>
      <p className="peek-hint"><T k="tapToShake" /></p>
      <button className="text-btn" onClick={onBack}>
        <T k="back" />
      </button>
    </div>
  )
}
