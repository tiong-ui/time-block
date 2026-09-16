// Keeps running timers alive across a reload. Only the facts needed to
// rebuild one are stored, and the end time is absolute — so restoring
// is just "how much wall-clock time is left", with no drift.
//
// Several kids can be counting down at once, so sessions are stored as
// a map keyed by kid. The old single-session key is deliberately not
// migrated: it recorded no kid, so there is no way to say whose it was,
// and anything under it is an hour old at most anyway.
const SESSIONS_STORAGE_KEY = 'focus-timer-running-sessions'

// How long after a session should have finished we still count it. A
// kid who locks the phone and comes back a few minutes later has earned
// their stars; one who reopens the app the next morning shouldn't be
// met with a stale "Great job!".
const STALE_AFTER_MS = 60 * 60 * 1000

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // Storage can be unavailable (private browsing); a reload just
    // loses the sessions, as it did before.
  }
}

export function saveSession(kidId, session) {
  if (!kidId) return
  writeAll({ ...readAll(), [kidId]: session })
}

// One kid stopping or finishing must not disturb anyone else's saved
// session, so this rewrites the map without their entry rather than
// clearing the key.
export function clearSession(kidId) {
  if (!kidId) return
  const sessions = readAll()
  if (!(kidId in sessions)) return
  delete sessions[kidId]
  writeAll(sessions)
}

// Returns { status: 'running' | 'finished', session } or null, for one
// kid. Pure apart from the read, so what counts as still-running and
// what counts as too stale is testable.
export function sessionStatus(session, now = Date.now()) {
  const { endAt, totalMs, startedAt } = session ?? {}
  if (!Number.isFinite(endAt) || !Number.isFinite(totalMs) || !Number.isFinite(startedAt)) {
    return null
  }

  if (now < endAt) return { status: 'running', session }
  if (now - endAt <= STALE_AFTER_MS) return { status: 'finished', session }
  return null
}

export function loadSession(kidId, now = Date.now()) {
  if (!kidId) return null
  return sessionStatus(readAll()[kidId], now)
}

// Every kid with something to restore, so a board full of timers comes
// back together rather than one at a time.
export function loadSessions(now = Date.now()) {
  const restored = {}
  for (const [kidId, session] of Object.entries(readAll())) {
    const found = sessionStatus(session, now)
    if (found) restored[kidId] = found
  }
  return restored
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

// Who last started a session on this device. A shared iPad is used by
// everyone, but a phone is nearly always one kid — remembering them
// means the board opens on the right card without anyone configuring
// anything, and quietly follows if that changes.
const LAST_KID_STORAGE_KEY = 'focus-timer-last-kid'

export function loadLastKid() {
  try {
    return localStorage.getItem(LAST_KID_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeLastKid(kidId) {
  try {
    localStorage.setItem(LAST_KID_STORAGE_KEY, kidId)
  } catch {
    // Storage can be unavailable; the board just opens collapsed.
  }
}
