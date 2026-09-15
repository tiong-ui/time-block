// A grown-up PIN, guarding the things a kid shouldn't be able to do to
// their own star count.
//
// It is a speed bump, not security, and it's worth being clear about
// why: the family code already grants full access to everything, the
// check runs on the device, and four digits is ten thousand guesses.
// What it actually stops is the realistic threat — a kid tapping
// "add stars" on the family tablet.
//
// The PIN is still never stored as typed. Parents reuse PINs across
// door codes and bank cards, and a hash costs nothing, so a glance at
// the database doesn't hand over a number that might unlock something
// that matters.
export const PIN_LENGTH = 4

// Wrong guesses are cheap without this: a kid can sit and count up
// from 0000. Five tries then a pause makes that tedious enough to give
// up on, without locking out a parent who fumbled once.
export const MAX_ATTEMPTS = 5
export const LOCKOUT_MS = 60000
const ATTEMPTS_KEY = 'focus-timer-pin-attempts'

export function isValidPin(pin) {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin ?? '')
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

export async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

export async function pinMatches(pin, { pinSalt, pinHash }) {
  if (!pinSalt || !pinHash || !isValidPin(pin)) return false
  return (await hashPin(pin, pinSalt)) === pinHash
}

// How a run of wrong guesses turns into a pause. Pure, so the counting
// and the expiry can be checked without a clock or a keypad.
export function lockoutAfter(attempts, now = Date.now()) {
  const failures = (attempts?.failures ?? 0) + 1
  if (failures < MAX_ATTEMPTS) return { failures, lockedUntil: 0 }
  return { failures: 0, lockedUntil: now + LOCKOUT_MS }
}

export function lockoutStatus(attempts, now = Date.now()) {
  const lockedUntil = attempts?.lockedUntil ?? 0
  const msLeft = Math.max(0, lockedUntil - now)
  return {
    locked: msLeft > 0,
    secondsLeft: Math.ceil(msLeft / 1000),
    triesLeft: Math.max(0, MAX_ATTEMPTS - (attempts?.failures ?? 0)),
  }
}

// Kept on the device rather than in memory, so closing the tab isn't a
// way to skip the pause.
export function loadAttempts() {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) ?? { failures: 0, lockedUntil: 0 }
  } catch {
    return { failures: 0, lockedUntil: 0 }
  }
}

export function storeAttempts(attempts) {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
  } catch {
    // Private browsing — the pause just won't survive a reload.
  }
}

export function clearAttempts() {
  storeAttempts({ failures: 0, lockedUntil: 0 })
}

// What a manual award has to be before it's worth writing down.
export const MAX_MANUAL_STARS = 100
export const MAX_NOTE_LENGTH = 40

export function validateAward({ stars, note }) {
  const amount = Number(stars)
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: 'amount-invalid' }
  if (amount > MAX_MANUAL_STARS) return { ok: false, reason: 'amount-too-big' }
  return { ok: true, value: { stars: amount, note: (note ?? '').trim().slice(0, MAX_NOTE_LENGTH) } }
}
