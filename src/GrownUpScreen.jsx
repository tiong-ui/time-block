import { useEffect, useState } from 'react'
import { watchFamily, setFamilyPin, familyHasPin } from './family.js'
import { addStars } from './kids.js'
import { starBalance } from './stars.js'
import {
  PIN_LENGTH,
  isValidPin,
  pinMatches,
  lockoutAfter,
  lockoutStatus,
  loadAttempts,
  storeAttempts,
  clearAttempts,
  validateAward,
  MAX_NOTE_LENGTH,
} from './pin.js'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { T } from './T.jsx'

const QUICK_AMOUNTS = [5, 10, 20]

// Sessions aren't the only way a kid earns stars — sometimes they did
// the thing and simply forgot to start the timer. This is the way to
// settle up, behind a PIN so it stays a grown-up's decision.
export default function GrownUpScreen({ familyCode, kid, onBack }) {
  const [family, setFamily] = useState(undefined)
  const [unlocked, setUnlocked] = useState(false)
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
      onUnlocked={() => setUnlocked(true)}
      onBack={onBack}
    />
  )
}

// Kept apart from the family subscription above so each state of the
// gate — loading, set a PIN, enter a PIN, unlocked — can be rendered
// and looked at without a Firestore connection.
export function GrownUpView({ familyCode, kid, family, unlocked, error, onUnlocked, onBack }) {
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
      <PinSetup familyCode={familyCode} changing onSaved={() => {}} />
    </Shell>
  )
}

function Shell({ kid, onBack, children }) {
  return (
    <div className="screen grownup-screen">
      <div className="hero-icon" aria-hidden="true">🔑</div>
      <h1><T k="grownUpTitle" vars={{ name: kid.name }} /></h1>
      {children}
      <button className="text-btn" onClick={onBack}><T k="back" /></button>
    </div>
  )
}

function PinGate({ family, onUnlocked }) {
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(() => loadAttempts())
  const [problem, setProblem] = useState(null)
  const [, tick] = useState(0)

  const status = lockoutStatus(attempts)

  // While locked out, the countdown has to actually count down.
  useEffect(() => {
    if (!status.locked) return undefined
    const timer = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(timer)
  }, [status.locked])

  async function handleSubmit(event) {
    event.preventDefault()
    if (status.locked) return
    if (await pinMatches(pin, family)) {
      clearAttempts()
      onUnlocked()
      return
    }
    const next = lockoutAfter(attempts)
    storeAttempts(next)
    setAttempts(next)
    setPin('')
    setProblem(lockoutStatus(next).locked ? 'locked' : 'wrong')
  }

  return (
    <form className="pin-form" onSubmit={handleSubmit}>
      <p className="subtitle"><T k="enterPin" /></p>
      <input
        className="text-input pin-input"
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        placeholder={tBoth('pinPlaceholder')}
        inputMode="numeric"
        autoComplete="off"
        type="password"
        disabled={status.locked}
      />
      {problem === 'wrong' && (
        <p className="form-error"><T k="pinWrong" vars={{ count: lockoutStatus(attempts).triesLeft }} /></p>
      )}
      {status.locked && (
        <p className="form-error"><T k="pinLocked" vars={{ count: status.secondsLeft }} /></p>
      )}
      <button className="preset-btn wide-btn collect-btn" type="submit" disabled={status.locked}>
        <T k="unlock" />
      </button>
      <p className="pin-hint"><T k="pinForgot" /></p>
    </form>
  )
}

function PinSetup({ familyCode, changing, onSaved }) {
  const [pin, setPin] = useState('')
  const [again, setAgain] = useState('')
  const [problem, setProblem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(!changing)

  if (!open) {
    return <button className="text-btn" onClick={() => setOpen(true)}><T k="changePin" /></button>
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isValidPin(pin)) return setProblem('pinNeedsFourDigits')
    if (pin !== again) return setProblem('pinMismatch')
    setProblem(null)
    setSaving(true)
    try {
      await setFamilyPin(familyCode, pin)
      clearAttempts()
      setSaved(true)
      setPin('')
      setAgain('')
      onSaved()
    } catch (err) {
      console.error('Could not save PIN:', err)
      setProblem(null)
      setSaved(false)
      setSaving(false)
      return
    }
    setSaving(false)
  }

  return (
    <form className="pin-form" onSubmit={handleSubmit}>
      <p className="confirm-title"><T k="setPinTitle" /></p>
      {!changing && <p className="subtitle"><T k="setPinWhy" /></p>}
      <input
        className="text-input pin-input"
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        placeholder={tBoth('pinPlaceholder')}
        inputMode="numeric"
        autoComplete="off"
        type="password"
      />
      <input
        className="text-input pin-input"
        value={again}
        onChange={e => setAgain(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        placeholder={tBoth('pinAgainPlaceholder')}
        inputMode="numeric"
        autoComplete="off"
        type="password"
      />
      {problem && <p className="form-error"><T k={problem} /></p>}
      {saved && <p className="confirm-grownup"><T k="pinSaved" /></p>}
      <button className="preset-btn wide-btn collect-btn" type="submit" disabled={saving}>
        <T k="savePin" />
      </button>
    </form>
  )
}

function AwardForm({ familyCode, kid }) {
  const [stars, setStars] = useState('5')
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState(null)
  const [given, setGiven] = useState(null)
  const [saving, setSaving] = useState(false)

  const amount = Number(stars) || 0

  async function handleSubmit(event) {
    event.preventDefault()
    const result = validateAward({ stars, note })
    if (!result.ok) return setProblem('awardAmountInvalid')
    setProblem(null)
    setError(null)
    setSaving(true)
    try {
      await addStars(familyCode, kid.id, result.value.stars, {
        manual: true,
        note: result.value.note,
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
