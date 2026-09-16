// HIIT sessions alternate work and rest intervals for the length of the
// chosen session. These are the interval lengths kids can pick, in
// seconds — short enough to stay achievable, long enough to be worth
// doing.
export const HIIT_ACTIVITY_ID = 'hiit'

export const EXERCISE_OPTIONS = [20, 30, 45, 60]
export const REST_OPTIONS = [10, 15, 20, 30]

export const DEFAULT_EXERCISE_SEC = 30
export const DEFAULT_REST_SEC = 15

export const EXERCISE_STORAGE_KEY = 'focus-timer-hiit-exercise'
export const REST_STORAGE_KEY = 'focus-timer-hiit-rest'

function loadSeconds(key, options, fallback) {
  try {
    const stored = Number(localStorage.getItem(key))
    return options.includes(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

// Kids share a device but not their preferences: one is doing 20-second
// bursts while another does 60, so the choice is remembered per kid.
export function perKidKey(key, kidId) {
  return kidId ? `${key}:${kidId}` : key
}

export function loadStoredExerciseSec(kidId) {
  return loadSeconds(perKidKey(EXERCISE_STORAGE_KEY, kidId), EXERCISE_OPTIONS, DEFAULT_EXERCISE_SEC)
}

export function loadStoredRestSec(kidId) {
  return loadSeconds(perKidKey(REST_STORAGE_KEY, kidId), REST_OPTIONS, DEFAULT_REST_SEC)
}

export function storeSeconds(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Storage can be unavailable (private browsing); choice just won't persist.
  }
}

// Where the work/rest cycle stands `elapsedMs` into a session.
//
// Derived from elapsed time rather than flipped step by step, which
// matters a lot: after the screen has been off for several intervals,
// or after a reload, this lands on the right interval in one go
// instead of catching up one flip per frame.
//
// `sessionRemainingMs` clips the last interval so it never runs past
// the end of the session.
export function intervalAt({ elapsedMs, exerciseSec, restSec, sessionRemainingMs = Infinity }) {
  const workMs = exerciseSec * 1000
  const restMs = restSec * 1000
  const cycleMs = workMs + restMs
  const into = elapsedMs % cycleMs
  const round = Math.floor(elapsedMs / cycleMs) + 1

  const working = into < workMs
  const totalMs = working ? workMs : restMs
  const remainingMs = working ? workMs - into : cycleMs - into

  return {
    kind: working ? 'work' : 'rest',
    totalMs,
    remainingMs: Math.max(0, Math.min(remainingMs, sessionRemainingMs)),
    round,
  }
}

// Every work/rest switch still to come, as offsets from now — used to
// schedule the audio cues ahead of time on the Web Audio clock so they
// fire even with the screen off.
export function upcomingCues({ elapsedMs, exerciseSec, restSec, sessionRemainingMs }) {
  const cues = []
  const current = intervalAt({ elapsedMs, exerciseSec, restSec })
  let at = current.remainingMs
  let kind = current.kind === 'work' ? 'rest' : 'work'

  // The session end gets its own chime, so stop short of it.
  while (at < sessionRemainingMs) {
    cues.push({ atMs: at, kind })
    at += (kind === 'work' ? exerciseSec : restSec) * 1000
    kind = kind === 'work' ? 'rest' : 'work'
  }
  return cues
}
