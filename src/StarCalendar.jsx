import { useEffect, useMemo, useState } from 'react'

import { watchLedgerMonth } from './ledger.js'
import {
  WEEKDAY_KEYS,
  monthGrid,
  monthRange,
  shiftMonth,
  dailyTotals,
  monthTotals,
  busiestDay,
  tintStep,
  dayKey,
} from './calendar.js'
import { errorDetail } from './errorMessage.js'
import { tBoth, tEn } from './i18n.js'
import { T, Label } from './T.jsx'

// A month at a time, shaded by how many stars each day brought in.
// Fetches its own month rather than reading the recent-entries list,
// so paging back through the year keeps working.
export default function StarCalendar({ familyCode, kid }) {
  const [{ year, month }, setShown] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  // The month a result belongs to is stored with it, so paging to a new
  // month reads as "not loaded yet" without having to clear the old
  // entries from inside an effect.
  const [loaded, setLoaded] = useState(null)
  const [error, setError] = useState(null)

  const { fromMs, toMs } = useMemo(() => monthRange(year, month), [year, month])

  useEffect(() => {
    if (!familyCode || !kid?.id) return undefined
    return watchLedgerMonth(
      familyCode,
      kid.id,
      fromMs,
      toMs,
      monthEntries => setLoaded({ fromMs, entries: monthEntries }),
      err => setError(tBoth('errLoadLog', { detail: errorDetail(err) })),
    )
  }, [familyCode, kid?.id, fromMs, toMs])

  return (
    <StarCalendarView
      year={year}
      month={month}
      entries={loaded?.fromMs === fromMs ? loaded.entries : null}
      error={error}
      onShift={by => setShown(shiftMonth(year, month, by))}
    />
  )
}

// Kept apart from the subscription so a month of entries can be handed
// in directly — the Firestore path isn't reachable from a test.
export function StarCalendarView({ year, month, entries, error, onShift }) {
  const [openDay, setOpenDay] = useState(null)

  const weeks = useMemo(() => monthGrid(year, month), [year, month])
  const byDay = useMemo(() => dailyTotals(entries ?? []), [entries])
  const totals = useMemo(() => monthTotals(byDay), [byDay])
  const busiest = useMemo(() => busiestDay(byDay), [byDay])
  // Fixed for the life of the screen: which day is "today" must not
  // change underneath a re-render.
  const [todayKey] = useState(() => dayKey(Date.now()))

  const monthName = new Date(year, month, 1).toLocaleDateString(tEn('localeEn'), { month: 'long' })
  const selected = openDay ? (entries ?? []).filter(e => dayKey(e.atMs) === openDay) : []

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button className="icon-btn month-btn" onClick={() => onShift(-1)} aria-label={tBoth('prevMonth')}>‹</button>
        <span className="calendar-month">
          <T k="monthLabel" vars={{ year, month: month + 1, monthName }} />
        </span>
        <button className="icon-btn month-btn" onClick={() => onShift(1)} aria-label={tBoth('nextMonth')}>›</button>
      </div>

      <div className="jar-stats-row log-totals">
        <div className="jar-stat-tile">
          <span className="jar-stat-number">+{totals.earned}</span>
          <span className="jar-stat-label"><T k="earnedSoFar" /></span>
        </div>
        <div className="jar-stat-tile">
          <span className="jar-stat-number">−{totals.spent}</span>
          <span className="jar-stat-label"><T k="spentSoFar" /></span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="calendar-grid" role="grid">
        {WEEKDAY_KEYS.map(key => (
          <span className="calendar-weekday" key={key} role="columnheader"><T k={key} /></span>
        ))}
        {weeks.flat().map((cell, i) => {
          if (!cell) return <span className="calendar-cell calendar-blank" key={`blank-${i}`} />
          const day = byDay[cell.key]
          const step = tintStep(day?.earned ?? 0, busiest)
          const classes = [
            'calendar-cell',
            `tint-${step}`,
            cell.key === todayKey ? 'calendar-today' : '',
            openDay === cell.key ? 'calendar-open' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              className={classes}
              key={cell.key}
              onClick={() => setOpenDay(openDay === cell.key ? null : cell.key)}
              aria-label={tBoth('starsOnDay', { month: month + 1, day: cell.day, count: day?.earned ?? 0 })}
            >
              <span className="calendar-date">{cell.day}</span>
              {/* The count is written on the cell, so the shading is a
                  second reading of the same fact rather than the only
                  one — which keeps it legible without relying on colour. */}
              <span className="calendar-count">{day?.earned ? `+${day.earned}` : ''}</span>
            </button>
          )
        })}
      </div>

      {entries !== null && totals.earned === 0 && totals.spent === 0 && (
        <p className="subtitle"><T k="noStarsThisMonth" /></p>
      )}

      {openDay && (
        <ul className="log-list calendar-day-list">
          {selected.length === 0
            ? <li className="log-row"><span className="log-what"><T k="noLogYet" /></span></li>
            : selected.map(entry => <CalendarRow key={entry.id} entry={entry} />)}
        </ul>
      )}
    </div>
  )
}

function CalendarRow({ entry }) {
  const spent = entry.kind === 'spent'
  return (
    <li className={`log-row${spent ? ' log-row-spent' : ''}`}>
      <span className="log-emoji" aria-hidden="true">
        {spent ? (entry.rewardEmoji ?? '🎁') : entry.manual ? '🙌' : (entry.activityEmoji ?? '🎯')}
      </span>
      <span className="log-what">
        {spent
          ? <Label value={entry.rewardLabel} />
          : entry.manual
            ? (entry.note ? <Label value={entry.note} /> : <T k="manualStar" />)
            : entry.activityLabel
              ? <Label value={entry.activityLabel} />
              : <T k="justFocus" />}
      </span>
      <span className="log-amount">{spent ? '−' : '+'}{entry.stars}⭐</span>
    </li>
  )
}
