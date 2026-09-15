import { useEffect, useMemo, useState } from 'react'
import { ACTIVITIES } from './activities.js'
import { watchLedger, groupByDay, ledgerTotals } from './ledger.js'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { T, Label } from './T.jsx'

// Where the stars came from and where they went. A running total says
// how many; only this says when, and what the kid was doing at the time.
export default function StarLogScreen({ familyCode, kid, onBack }) {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!familyCode || !kid?.id) return undefined
    return watchLedger(familyCode, kid.id, setEntries, err => setError(tBoth('errLoadLog', { detail: errorDetail(err) })))
  }, [familyCode, kid?.id])

  return <StarLogView kid={kid} entries={entries} error={error} onBack={onBack} />
}

// Kept apart from the subscription above so the log can be rendered
// from a fixed set of entries — the Firestore path isn't reachable from
// a test environment, but this is.
export function StarLogView({ kid, entries, error, onBack }) {
  const days = useMemo(() => groupByDay(entries ?? []), [entries])
  const totals = useMemo(() => ledgerTotals(entries ?? []), [entries])

  return (
    <div className="screen log-screen">
      <div className="hero-icon" aria-hidden="true">{kid.avatar}</div>
      <h1><T k="starLogTitle" vars={{ name: kid.name }} /></h1>
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
      {!error && entries === null && <p className="subtitle"><T k="loading" /></p>}
      {!error && entries?.length === 0 && <p className="subtitle"><T k="noLogYet" /></p>}

      {days.map(day => (
        <section className="log-day" key={day.day}>
          <h2 className="log-day-heading">
            {day.daysAgo === 0 ? <T k="today" />
              : day.daysAgo === 1 ? <T k="yesterday" />
              : <T k="daysAgo" vars={{ count: day.daysAgo }} />}
          </h2>
          <ul className="log-list">
            {day.entries.map(entry => <LogRow key={entry.id} entry={entry} />)}
          </ul>
        </section>
      ))}

      <button className="text-btn" onClick={onBack}><T k="back" /></button>
    </div>
  )
}

function LogRow({ entry }) {
  const spent = entry.kind === 'spent'
  const activity = ACTIVITIES.find(a => a.id === entry.activityId) ?? null
  const time = new Date(entry.atMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <li className={`log-row${spent ? ' log-row-spent' : ''}`}>
      <span className="log-emoji" aria-hidden="true">
        {spent ? (entry.rewardEmoji ?? '🎁') : (activity?.emoji ?? '🎯')}
      </span>
      <span className="log-what">
        {spent
          ? <Label value={entry.rewardLabel} />
          : activity
            ? <Label value={activity.label} />
            : <T k="justFocus" />}
        {/* Time and length as one short line. A stacked bilingual
            "20 minutes of focus" wrapped and doubled every row's height
            for a detail the emoji and the label already carry. */}
        <span className="log-when">
          {time}
          {!spent && entry.minutes ? ` · ⏱${entry.minutes}` : null}
        </span>
      </span>
      <span className="log-amount">{spent ? '−' : '+'}{entry.stars}⭐</span>
    </li>
  )
}
