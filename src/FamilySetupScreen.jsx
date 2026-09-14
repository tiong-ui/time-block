import { useState } from 'react'
import { createFamily, familyExists, normalizeCode } from './family.js'
import { errorDetail } from './errorMessage.js'
import { T } from './T.jsx'
import { tBoth } from './i18n.js'

// First-run screen: create a new family (generates a code) or join an
// existing one (type a code from another device). The code is what
// links devices to the same kid profiles and Star Jars.
export default function FamilySetupScreen({ onFamilyReady }) {
  const [mode, setMode] = useState('choose') // 'choose' | 'join' | 'created'
  const [joinInput, setJoinInput] = useState('')
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate() {
    setBusy(true)
    setError('')
    try {
      const code = await createFamily()
      setNewCode(code)
      setMode('created')
    } catch (err) {
      console.error('Failed to create family:', err)
      setError(tBoth('errCreateFamily', { detail: errorDetail(err) }))
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    const code = normalizeCode(joinInput)
    if (!code) return
    setBusy(true)
    setError('')
    try {
      const exists = await familyExists(code)
      if (exists) {
        onFamilyReady(code)
      } else {
        setError(tBoth('errCodeNotFound'))
      }
    } catch (err) {
      console.error('Failed to check family code:', err)
      setError(tBoth('errCheckCode', { detail: errorDetail(err) }))
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'created') {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">🎉</div>
        <h1><T k="familyCreated" /></h1>
        <p className="subtitle"><T k="useCodeElsewhere" /></p>
        <p className="family-code-display">{newCode}</p>
        <button className="preset-btn wide-btn" onClick={() => onFamilyReady(newCode)}>
          <T k="continueBtn" />
        </button>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">🔑</div>
        <h1><T k="joinFamily" /></h1>
        <p className="subtitle"><T k="enterCode" /></p>
        <form className="join-form" onSubmit={handleJoin}>
          <input
            id="family-join-code"
            className="join-input"
            type="text"
            value={joinInput}
            onChange={e => setJoinInput(e.target.value)}
            placeholder="BLUE-FOX-42"
            autoCapitalize="characters"
            autoComplete="off"
          />
          {error && <p className="form-error">{error}</p>}
          <button className="preset-btn wide-btn" type="submit" disabled={busy || !joinInput.trim()}>
            <T k={busy ? 'checking' : 'join'} />
          </button>
          <button type="button" className="text-btn" onClick={() => { setMode('choose'); setError('') }}>
            <T k="back" />
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">🎯</div>
      <h1><T k="focusTime" /></h1>
      <p className="subtitle"><T k="setUpStarJar" /></p>
      {error && <p className="form-error">{error}</p>}
      <button className="preset-btn wide-btn" onClick={handleCreate} disabled={busy}>
        <T k={busy ? 'creating' : 'createFamily'} />
      </button>
      <button className="preset-btn wide-btn" onClick={() => setMode('join')} disabled={busy}>
        <T k="haveACode" />
      </button>
    </div>
  )
}
