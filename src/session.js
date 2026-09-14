// Keeps a running timer alive across a reload. Only the facts needed to
// rebuild it are stored, and the end time is absolute — so restoring is
// just "how much wall-clock time is left", with no drift.
const SESSION_STORAGE_KEY = 'focus-timer-running-session'

// How long after a session should have finished we still count it. A
// kid who locks the phone and comes back a few minutes later has earned
// their stars; one who reopens the app the next morning shouldn't be
// met with a stale "Great job!".
const STALE_AFTER_MS = 60 * 60 * 1000

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable (private browsing); a reload just
    // loses the session, as it did before.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Nothing to clean up.
  }
}

// Returns { status: 'running' | 'finished', session } or null.
export function loadSession(now = Date.now()) {
  let raw
  try {
    raw = localStorage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let session
  try {
    session = JSON.parse(raw)
  } catch {
    return null
  }

  const { endAt, totalMs, startedAt } = session ?? {}
  if (!Number.isFinite(endAt) || !Number.isFinite(totalMs) || !Number.isFinite(startedAt)) {
    return null
  }

  if (now < endAt) return { status: 'running', session }
  if (now - endAt <= STALE_AFTER_MS) return { status: 'finished', session }
  return null
}

// Turns whatever `loadSession` found into the timer's opening state.
// Kept here, and pure, because the app can't easily be driven into a
// restored session by hand — this is the part worth testing directly.
export function restoredTimerState(restored, now = Date.now()) {
  if (!restored) {
    return { phase: 'select', totalMs: 0, remainingMs: 0, paused: false, owesStars: false, session: null }
  }

  const { status, session } = restored

  if (status === 'finished') {
    // The time was served while the app was closed, so the stars are
    // owed — but only once we know which kid to pay.
    return { phase: 'done', totalMs: session.totalMs, remainingMs: 0, paused: false, owesStars: true, session }
  }

  const pausedAt = session.pausedAt ?? null
  return {
    phase: 'running',
    totalMs: session.totalMs,
    remainingMs: Math.max(0, session.endAt - (pausedAt ?? now)),
    paused: Boolean(pausedAt),
    owesStars: false,
    session,
  }
}
