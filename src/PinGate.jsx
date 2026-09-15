import { useEffect, useState } from 'react'
import { setFamilyPin } from './family.js'
import {
  PIN_LENGTH,
  isValidPin,
  pinMatches,
  lockoutAfter,
  lockoutStatus,
  loadAttempts,
  storeAttempts,
  clearAttempts,
} from './pin.js'
import { tBoth } from './i18n.js'
import { T } from './T.jsx'

// The grown-up gate, shared by every screen that has something a kid
// shouldn't be able to do on their own. See pin.js for what the PIN
// does and does not protect.

export function PinGate({ family, onUnlocked }) {
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

export function PinSetup({ familyCode, changing, onSaved }) {
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
