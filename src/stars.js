// The Star Jar economy: every finished focus session adds this many
// stars, and a jar holds this many before it's full and a new one
// starts.
export const STARS_PER_SESSION = 5
export const JAR_CAPACITY = 50

// Stars split three ways. `totalStars` on a kid has always meant stars
// *earned*, and stays that way — spending is tracked separately so the
// lifetime count never goes backwards. What a kid can actually spend
// is the difference.
export function starBalance(kid) {
  const earned = kid?.totalStars ?? 0
  const spent = kid?.starsSpent ?? 0
  return { earned, spent, balance: Math.max(0, earned - spent) }
}

export function canAfford(balance, cost) {
  return Number.isInteger(cost) && cost > 0 && balance >= cost
}

// Given a star count, how many jars that fills and how many sit in the
// current (not-yet-full) jar. Called with the spendable balance for the
// jar a kid is looking at, and with the lifetime earned count for the
// "jars filled" tally, which is a trophy and shouldn't drop when they
// spend.
export function jarStats(totalStars) {
  const fullJars = Math.floor(totalStars / JAR_CAPACITY)
  const currentJarStars = totalStars % JAR_CAPACITY
  return { fullJars, currentJarStars }
}
