// Turning the star ledger into a month view. All of it is pure — the
// grid, the per-day totals, the shading step — so the fiddly parts
// (month lengths, leap years, which blanks pad the first week) are
// checked directly rather than by staring at a rendered calendar.

// Sunday-first, which is how a calendar reads in Taiwan.
export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function dayKey(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// The window to fetch for a month, as local time. The end is the first
// instant of the next month, so the query is [from, to) and nothing on
// the last day is missed or double-counted.
export function monthRange(year, month) {
  return {
    fromMs: new Date(year, month, 1).getTime(),
    toMs: new Date(year, month + 1, 1).getTime(),
  }
}

export function shiftMonth(year, month, by) {
  const d = new Date(year, month + by, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

// Weeks of seven cells. Days outside the month are null rather than
// borrowed from the neighbours: this is a scoreboard for one month, and
// a greyed-out 31st from last month is just something to misread.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = first.getDay()

  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1)
      return { day: i + 1, key: dayKey(date.getTime()), ms: date.getTime() }
    }),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Stars earned and spent per day, keyed the same way the grid is.
export function dailyTotals(entries) {
  const byDay = {}
  for (const entry of entries) {
    const key = dayKey(entry.atMs)
    const day = (byDay[key] ??= { earned: 0, spent: 0 })
    if (entry.kind === 'spent') day.spent += entry.stars
    else day.earned += entry.stars
  }
  return byDay
}

export function monthTotals(byDay) {
  return Object.values(byDay).reduce(
    (acc, day) => ({ earned: acc.earned + day.earned, spent: acc.spent + day.spent }),
    { earned: 0, spent: 0 },
  )
}

// Shading steps. One hue, light to dark — the app's accent, so it
// follows whichever colour theme is picked — in four steps against the
// busiest day of the month, so a quiet month still shows its shape
// instead of being uniformly pale.
export const TINT_STEPS = 4

export function tintStep(earned, busiestDay) {
  if (!earned || earned <= 0) return 0
  if (!busiestDay || busiestDay <= 0) return 1
  return Math.max(1, Math.min(TINT_STEPS, Math.ceil((earned / busiestDay) * TINT_STEPS)))
}

export function busiestDay(byDay) {
  return Object.values(byDay).reduce((most, day) => Math.max(most, day.earned), 0)
}
