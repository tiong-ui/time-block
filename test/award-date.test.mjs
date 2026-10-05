// Which day a hand-added star lands on. All of this is about local
// time: the log and the calendar bucket by the day a family lived
// through, not by a UTC slice of it, and the two disagree for most of
// the world for most of the day.
import { dateInputValue, msFromDateInput, isSameLocalDay, resolveAwardDate, BACKDATE_HOUR } from '../src/awardDate.js'
import { validateAward } from '../src/pin.js'
import { earnedEntry } from '../src/ledger.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime()

// ── Reading the field ────────────────────────────────────────────────
eq(dateInputValue(at(2026, 10, 3, 9)), '2026-10-03', 'a morning reads as its own day')
// The case toISOString() gets wrong east of Greenwich: late evening is
// already tomorrow in UTC.
eq(dateInputValue(at(2026, 10, 3, 23, 30)), '2026-10-03', 'and so does half past eleven at night')
eq(dateInputValue(at(2026, 1, 5)), '2026-01-05', 'single-digit months and days are padded')

// ── Writing it back ──────────────────────────────────────────────────
eq(msFromDateInput('2026-10-03'), at(2026, 10, 3, BACKDATE_HOUR), 'a picked day lands at midday, local')
eq(msFromDateInput(''), null, 'nothing is not a date')
eq(msFromDateInput('2026-10'), null, 'nor half of one')
eq(msFromDateInput('03/10/2026'), null, 'nor another format')
eq(msFromDateInput('2026-02-31'), null, 'nor the 31st of February')
eq(msFromDateInput('2026-13-01'), null, 'nor a thirteenth month')
eq(msFromDateInput('2026-02-29'), null, 'nor a leap day that year does not have')
eq(msFromDateInput('2024-02-29'), at(2024, 2, 29, BACKDATE_HOUR), 'but a real leap day is fine')

// Round-tripping is what keeps a backdated star in the day it was
// filed under: the day goes in, the same day comes back out.
for (const day of ['2026-01-01', '2026-03-29', '2026-06-15', '2026-10-25', '2026-12-31']) {
  eq(dateInputValue(msFromDateInput(day)), day, `${day} survives the round trip`)
}

eq(isSameLocalDay(at(2026, 10, 3, 0, 1), at(2026, 10, 3, 23, 59)), true, 'a day is a day from one minute past midnight to one before')
eq(isSameLocalDay(at(2026, 10, 3, 23, 59), at(2026, 10, 4, 0, 1)), false, 'two minutes apart across midnight is two days')

// ── Which moment gets written ────────────────────────────────────────
const now = at(2026, 10, 3, 14, 20)

eq(resolveAwardDate('2026-10-03', now), { ok: true, atMs: null }, 'today is left to the server clock')
eq(resolveAwardDate('', now), { ok: true, atMs: null }, 'and so is no date at all')
eq(resolveAwardDate(undefined, now), { ok: true, atMs: null }, 'or a missing one')
eq(resolveAwardDate('2026-10-02', now), { ok: true, atMs: at(2026, 10, 2, BACKDATE_HOUR) }, 'yesterday is written as yesterday midday')
eq(resolveAwardDate('2026-10-04', now).reason, 'date-future', 'tomorrow has not happened')
eq(resolveAwardDate('2026-02-31', now).reason, 'date-invalid', 'and neither has the 31st of February')

// Earlier the same day is still today: nothing is backdated to a few
// hours ago, because the server stamp is the better answer.
eq(resolveAwardDate('2026-10-03', at(2026, 10, 3, 0, 5)), { ok: true, atMs: null }, 'five past midnight is still today')
eq(resolveAwardDate('2026-10-03', at(2026, 10, 3, 23, 55)), { ok: true, atMs: null }, 'so is five to')

// ── Through the form's validator ─────────────────────────────────────
eq(validateAward({ stars: '5', date: '2026-10-02' }, now).value.atMs, at(2026, 10, 2, BACKDATE_HOUR), 'a valid backdated award carries its moment')
eq(validateAward({ stars: '5', date: '2026-10-03' }, now).value.atMs, null, 'one for today carries none')
eq(validateAward({ stars: '5', date: '2026-10-04' }, now).reason, 'date-future', 'a future day is refused')
eq(validateAward({ stars: '5', date: 'nonsense' }, now).reason, 'date-invalid', 'so is nonsense')
// The amount is checked first: a form with two things wrong should
// fix the number it is complaining about.
eq(validateAward({ stars: '0', date: '2026-10-04' }, now).reason, 'amount-invalid', 'the amount is judged before the date')

// ── What reaches the ledger ──────────────────────────────────────────
// A backdated entry has to carry a real timestamp: a server stamp
// would file it under the day the grown-up got round to it, which is
// the whole thing this is meant to stop.
const backdated = earnedEntry({ stars: 5, manual: true, atMs: at(2026, 10, 2, BACKDATE_HOUR) })
eq(backdated.at.toMillis(), at(2026, 10, 2, BACKDATE_HOUR), 'a backdated entry is stamped with its own day')
eq(backdated.backdated, true, 'and says so, so the log does not print a time nobody knows')

const todayEntry = earnedEntry({ stars: 5, manual: true })
eq(todayEntry.backdated, false, 'an ordinary entry is not backdated')
eq(typeof todayEntry.at.toMillis, 'undefined', 'and is left for the server to stamp')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
