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

export function loadStoredExerciseSec() {
  return loadSeconds(EXERCISE_STORAGE_KEY, EXERCISE_OPTIONS, DEFAULT_EXERCISE_SEC)
}

export function loadStoredRestSec() {
  return loadSeconds(REST_STORAGE_KEY, REST_OPTIONS, DEFAULT_REST_SEC)
}

export function storeSeconds(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Storage can be unavailable (private browsing); choice just won't persist.
  }
}

// Works out the interval that follows `kind`, clipped so the last one
// never runs past the end of the session — a 30s work interval with 12s
// of session left becomes a 12s one rather than overrunning.
export function nextInterval({ kind, exerciseSec, restSec, sessionLeftMs }) {
  const nextKind = kind === 'work' ? 'rest' : 'work'
  const fullMs = (nextKind === 'work' ? exerciseSec : restSec) * 1000
  return { kind: nextKind, durationMs: Math.max(0, Math.min(fullMs, sessionLeftMs)) }
}
