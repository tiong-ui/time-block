// The Star Jar economy: every finished focus session adds this many
// stars, and a jar holds this many before it's full and a new one
// starts.
export const STARS_PER_SESSION = 5
export const JAR_CAPACITY = 50

// Given a running total, how many jars have been filled and how many
// stars sit in the current (not-yet-full) jar.
export function jarStats(totalStars) {
  const fullJars = Math.floor(totalStars / JAR_CAPACITY)
  const currentJarStars = totalStars % JAR_CAPACITY
  return { fullJars, currentJarStars }
}
