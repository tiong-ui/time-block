import { useEffect, useState } from 'react'
import { watchFamily, familyHasPin } from './family.js'
import { addStars } from './kids.js'
import { starBalance } from './stars.js'
import { validateAward, MAX_NOTE_LENGTH } from './pin.js'
import { dateInputValue } from './awardDate.js'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { T } from './T.jsx'
import { PinGate, PinSetup } from './PinGate.jsx'
import BackBar from './BackBar.jsx'

const QUICK_AMOUNTS = [5, 10, 20]

// Sessions aren't the only way a kid earns stars — sometimes they did
// the thing and simply forgot to start the timer. This is the way to
// settle up, behind a PIN so it stays a grown-up's decision.
export default function GrownUpScreen({ familyCode, kid, unlocked, onUnlock, onBack, onManageActivities }) {
  const [family, setFamily] = useState(undefined)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!familyCode) return undefined
    return watchFamily(familyCode, setFamily, err =>
      setError(tBoth('errSavePin', { detail: errorDetail(err) })),
    )
  }, [familyCode])

  return (
    <GrownUpView
      familyCode={familyCode}
      kid={kid}
      family={family}
      unlocked={unlocked}
      error={error}
      onUnlocked={onUnlock}
      onBack={onBack}
      onManageActivities={onManageActivities}
    />
  )
}

// Kept apart from the family subscription above so each state of the
// gate — loading, set a PIN, enter a PIN, unlocked — can be rendered
// and looked at without a Firestore connection.
export function GrownUpView({ familyCode, kid, family, unlocked, error, onUnlocked, onBack, onManageActivities }) {
  if (family === undefined) {
    return <Shell kid={kid} onBack={onBack}><p className="subtitle"><T k="loading" /></p></Shell>
  }

  if (!unlocked) {
    return (
      <Shell kid={kid} onBack={onBack}>
        {error && <p className="form-error">{error}</p>}
        {familyHasPin(family)
          ? <PinGate family={family} onUnlocked={onUnlocked} />
          : <PinSetup familyCode={familyCode} onSaved={onUnlocked} />}
      </Shell>
    )
  }

  return (
    <Shell kid={kid} onBack={onBack}>
      <AwardForm familyCode={familyCode} kid={kid} />
      {/* Family-wide, not this kid's — but this is where a grown-up
          already is when they want to change it. */}
      <button className="preset-btn wide-btn" onClick={onManageActivities}>
        🎯 <T k="manageActivities" />
      </button>
      <FamilyCode code={familyCode} />
      <PinSetup familyCode={familyCode} changing onSaved={() => {}} />
    </Shell>
  )
}

// The code that links every device to this family. Kept behind the
// PIN, because handing it to someone is handing them everything —
// and shown here because this is where a parent is when they want to
// put the app on another device.
function FamilyCode({ code }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // No clipboard (older browser, insecure context) — the code is
      // on screen to be typed, which is how it gets used anyway.
    }
  }

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <div className="family-code-card">
      <p className="confirm-title"><T k="yourFamilyCode" /></p>
      <p className="family-code-display">{code}</p>
      <p className="confirm-body"><T k="familyCodeWhy" /></p>
      <button className="preset-btn wide-btn" type="button" onClick={copy}>
        <T k={copied ? 'codeCopied' : 'copyCode'} />
      </button>
    </div>
  )
}

function Shell({ kid, onBack, children }) {
  return (
    <div className="screen grownup-screen">
      <BackBar onBack={onBack} />
      <div className="hero-icon" aria-hidden="true">🔑</div>
      <h1><T k="grownUpTitle" vars={{ name: kid.name }} /></h1>
      {children}
    </div>
  )
}

// Which message a rejected form shows. Both amount problems share
// one: the field says 1 to 100 either way.
const AWARD_PROBLEM = {
  'amount-invalid': 'awardAmountInvalid',
  'amount-too-big': 'awardAmountInvalid',
  'date-invalid': 'awardDateInvalid',
  'date-future': 'awardDateFuture',
}

// Which day the stars were earned on. Two taps cover almost every
// case — it happened today, or it happened yesterday and nobody
// remembered until now — and the picker is there for the rest.
//
// The days are worked out once, when the form opens. A tablet left on
// the kitchen counter overnight will still be offering yesterday in
// the morning, which is exactly what the field then says it is doing:
// whatever date is showing is the date that gets written.
function AwardDate({ value, onChange }) {
  const [days] = useState(() => {
    const now = Date.now()
    return { today: dateInputValue(now), yesterday: dateInputValue(now - 86400000) }
  })

  return (
    <div className="award-date">
      <p className="confirm-title"><T k="whenDidItHappen" /></p>
      <div className="amount-row">
        <button
          type="button"
          className={`preset-btn amount-btn${value === days.today ? ' amount-active' : ''}`}
          onClick={() => onChange(days.today)}
        >
          <T k="today" />
        </button>
        <button
          type="button"
          className={`preset-btn amount-btn${value === days.yesterday ? ' amount-active' : ''}`}
          onClick={() => onChange(days.yesterday)}
        >
          <T k="yesterday" />
        </button>
      </div>
      <input
        className="text-input"
        type="date"
        value={value}
        max={days.today}
        onChange={e => onChange(e.target.value)}
        aria-label={tBoth('whenDidItHappen')}
      />
    </div>
  )
}

function AwardForm({ familyCode, kid }) {
  const [stars, setStars] = useState('5')
  const [note, setNote] = useState('')
  // Today unless a grown-up says otherwise, because catching up on
  // yesterday is the exception and today is the rule.
  const [date, setDate] = useState(() => dateInputValue(Date.now()))
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState(null)
  const [given, setGiven] = useState(null)
  const [saving, setSaving] = useState(false)

  const amount = Number(stars) || 0

  async function handleSubmit(event) {
    event.preventDefault()
    const result = validateAward({ stars, note, date })
    if (!result.ok) return setProblem(AWARD_PROBLEM[result.reason] ?? 'awardAmountInvalid')
    setProblem(null)
    setError(null)
    setSaving(true)
    try {
      await addStars(familyCode, kid.id, result.value.stars, {
        manual: true,
        note: result.value.note,
        atMs: result.value.atMs,
      })
      setGiven(starBalance(kid).balance + result.value.stars)
      setNote('')
    } catch (err) {
      console.error('Could not add stars:', err)
      setError(tBoth('errGiveStars', { detail: errorDetail(err) }))
    }
    setSaving(false)
  }

  return (
    <form className="award-form" onSubmit={handleSubmit}>
      <p className="confirm-title"><T k="howManyStars" /></p>
      <div className="amount-row">
        {QUICK_AMOUNTS.map(value => (
          <button
            type="button"
            key={value}
            className={`preset-btn amount-btn${amount === value ? ' amount-active' : ''}`}
            onClick={() => setStars(String(value))}
          >
            {value}⭐
          </button>
        ))}
      </div>
      <input
        className="text-input"
        value={stars}
        onChange={e => setStars(e.target.value.replace(/\D/g, '').slice(0, 3))}
        inputMode="numeric"
      />
      <input
        className="text-input"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={tBoth('awardNotePlaceholder')}
        maxLength={MAX_NOTE_LENGTH}
      />
      <AwardDate value={date} onChange={setDate} />
      {problem && <p className="form-error"><T k={problem} /></p>}
      {error && <p className="form-error">{error}</p>}
      {given !== null && (
        <p className="confirm-grownup"><T k="starsGiven" vars={{ name: kid.name, count: given }} /></p>
      )}
      <button className="preset-btn wide-btn collect-btn" type="submit" disabled={saving || amount <= 0}>
        <T k="giveStars" vars={{ count: amount }} />
      </button>
    </form>
  )
}
