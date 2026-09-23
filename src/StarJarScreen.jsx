import { useState } from 'react'
import { JAR_CAPACITY, jarStats, starBalance } from './stars.js'
import PhysicsJar from './PhysicsJar.jsx'
import { T } from './T.jsx'
import BackBar from './BackBar.jsx'

// A kid's progress at a glance, and the way in to the two things they
// can do with stars: look back at how they earned them, or spend them.
//
// The jar holds what's left to spend, because that's the honest
// picture — trade 100 stars for a trip to the park and the jar should
// visibly empty. "Jars filled" counts from stars ever earned instead,
// so it's a trophy shelf that spending can never take away.
export default function StarJarScreen({ kid, onBack, onViewLog, onViewRewards, onGrownUp }) {
  const { earned, balance } = starBalance(kid)
  const { fullJars } = jarStats(earned)
  const { currentJarStars } = jarStats(balance)
  const [shakeSignal, setShakeSignal] = useState(0)

  return (
    <div className="screen">
      <BackBar onBack={onBack} />
      <div className="hero-icon" aria-hidden="true">{kid.avatar}</div>
      <h1><T k="starJarTitle" vars={{ name: kid.name }} /></h1>
      <div className="jar-stats-row">
        <div className="jar-stat-tile">
          <span className="jar-stat-number">{balance}</span>
          <span className="jar-stat-label"><T k="spendable" /></span>
        </div>
        <div className="jar-stat-tile">
          <span className="jar-stat-number">{earned}</span>
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
      <div className="jar-links">
        <button className="preset-btn wide-btn collect-btn" onClick={onViewRewards}>
          🎁 <T k="rewards" />
        </button>
        <button className="preset-btn wide-btn" onClick={onViewLog}>
          📜 <T k="starLog" />
        </button>
        <button className="text-btn bi-inline" onClick={onGrownUp}>
          🔑 <T k="grownUp" />
        </button>
      </div>
    </div>
  )
}
