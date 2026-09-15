// The month view. Month lengths, leap years and where the first week's
// blanks fall are exactly the things that look fine until February, so
// the grid and the per-day totals are built by pure functions and
// checked here rather than by squinting at a rendered calendar.
import {
  monthGrid, monthRange, shiftMonth, dayKey,
  dailyTotals, monthTotals, busiestDay, tintStep, TINT_STEPS,
} from '../src/calendar.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

// ── The grid ─────────────────────────────────────────────────────────
// September 2026 starts on a Tuesday and has 30 days.
const sep = monthGrid(2026, 8)
eq(sep.every(week => week.length === 7), true, 'every row is a full week')
eq(sep[0].slice(0, 2), [null, null], 'a month starting on Tuesday is padded by two blanks')
eq(sep[0][2].day, 1, 'and the 1st lands on Tuesday')
eq(sep.flat().filter(Boolean).length, 30, 'September has 30 cells')
eq(sep.flat().at(-1), null, 'the last week is padded out')

// February, the month that breaks calendars.
eq(monthGrid(2026, 1).flat().filter(Boolean).length, 28, 'February 2026 has 28 days')
eq(monthGrid(2028, 1).flat().filter(Boolean).length, 29, 'February 2028 is a leap year')

// A month starting on Sunday needs no leading blanks at all.
const nov2026 = monthGrid(2026, 10)
eq(nov2026[0][0].day, 1, 'a month starting on Sunday opens the grid with the 1st')

// ── The fetch window ─────────────────────────────────────────────────
const { fromMs, toMs } = monthRange(2026, 8)
eq(new Date(fromMs).getDate(), 1, 'the window opens on the 1st')
eq(new Date(fromMs).getHours(), 0, 'at local midnight')
eq(new Date(toMs).getMonth(), 9, 'and closes at the start of the next month')
// Half-open, so the last day is included exactly once.
eq(new Date(2026, 8, 30, 23, 59).getTime() < toMs, true, 'the last evening of the month is inside the window')
eq(new Date(2026, 9, 1, 0, 0).getTime() < toMs, false, 'the next month is not')

eq(shiftMonth(2026, 11, 1), { year: 2027, month: 0 }, 'December rolls forward into next January')
eq(shiftMonth(2026, 0, -1), { year: 2025, month: 11 }, 'January rolls back into last December')

// ── Per-day totals ───────────────────────────────────────────────────
const at = (d, h) => new Date(2026, 8, d, h).getTime()
const entries = [
  { kind: 'earned', stars: 5, atMs: at(3, 9) },
  { kind: 'earned', stars: 5, atMs: at(3, 16) },
  { kind: 'earned', stars: 20, atMs: at(7, 10) },
  { kind: 'spent', stars: 100, atMs: at(7, 18) },
]
const byDay = dailyTotals(entries)
eq(byDay[dayKey(at(3, 9))], { earned: 10, spent: 0 }, 'two sessions on one day add up')
eq(byDay[dayKey(at(7, 10))], { earned: 20, spent: 100 }, 'earning and spending on the same day stay apart')
eq(Object.keys(byDay).length, 2, 'only days with something on them appear')
eq(monthTotals(byDay), { earned: 30, spent: 100 }, 'the month adds up')
eq(monthTotals({}), { earned: 0, spent: 0 }, 'an empty month is zero, not a crash')

// ── Shading ──────────────────────────────────────────────────────────
eq(busiestDay(byDay), 20, 'the busiest day sets the top of the scale')
eq(tintStep(0, 20), 0, 'a day with no stars gets no shading')
eq(tintStep(20, 20), TINT_STEPS, 'the busiest day gets the darkest step')
eq(tintStep(5, 20), 1, 'a quiet day gets the lightest')
eq(tintStep(1, 20), 1, 'a single star is still visibly more than none')
// A month where every day is the same must not come out uniformly pale.
eq(tintStep(5, 5), TINT_STEPS, 'scaling is relative to the month, not an absolute')
eq(tintStep(5, 0), 1, 'stars with no scale to compare against still show')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
