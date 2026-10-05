// Which day a hand-added star belongs to.
//
// "Sometimes the kid forgets to use this app" is also sometimes "the
// kid forgot, and so did I, until Sunday" — so a grown-up can say when
// it happened rather than having every backfilled star pile onto the
// day they got round to it. The log and the calendar both bucket by
// local day, so the day is the whole of what matters here.

// A backdated star has no real time of day: nobody remembers whether
// the piano practice was at four or at five. Midday keeps it inside
// its own day whichever way the clock shifts for daylight saving —
// midnight is one hour's change away from being the day before.
export const BACKDATE_HOUR = 12

// What an <input type="date"> wants: the local calendar day, not a UTC
// slice of an instant. toISOString() would hand back yesterday for
// anyone east of Greenwich in the evening.
export function dateInputValue(ms) {
  const d = new Date(ms)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Parsed as a local date on purpose. `new Date('2026-10-03')` is UTC
// midnight, which is the 2nd in the Americas.
export function msFromDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? '').trim())
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const at = new Date(y, m - 1, d, BACKDATE_HOUR, 0, 0, 0)
  // Rejects the dates a calendar doesn't have: 31 February rolls
  // forward into March rather than failing, and a star filed under a
  // day that never happened is worse than one the form refused.
  if (at.getFullYear() !== y || at.getMonth() !== m - 1 || at.getDate() !== d) return null
  return at.getTime()
}

export function isSameLocalDay(aMs, bMs) {
  return dateInputValue(aMs) === dateInputValue(bMs)
}

// Today means "let the server stamp it": the real time of day is
// known, it orders correctly against everything else happening now,
// and it doesn't depend on a tablet's clock being right. Only a day
// that has already passed gets a time written for it.
//
// Returns { ok, atMs } where a null atMs means "now, from the server".
export function resolveAwardDate(value, now = Date.now()) {
  if (!value) return { ok: true, atMs: null }
  const atMs = msFromDateInput(value)
  if (atMs === null) return { ok: false, reason: 'date-invalid' }
  if (isSameLocalDay(atMs, now)) return { ok: true, atMs: null }
  if (atMs > now) return { ok: false, reason: 'date-future' }
  return { ok: true, atMs }
}
