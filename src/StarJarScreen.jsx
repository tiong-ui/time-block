import { JAR_CAPACITY, jarStats } from './stars.js'
import JarVisual from './JarVisual.jsx'

// Lets a kid check their progress: total stars ever earned, how many
// jars they've filled, and how far along the current one is.
export default function StarJarScreen({ kid, onBack }) {
  const totalStars = kid.totalStars ?? 0
  const { fullJars, currentJarStars } = jarStats(totalStars)

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
      <JarVisual count={currentJarStars} size={170} />
      <p className="jar-progress-label">
        {currentJarStars}/{JAR_CAPACITY} stars in this jar
      </p>
      <button className="text-btn" onClick={onBack}>
        Back
      </button>
    </div>
  )
}
