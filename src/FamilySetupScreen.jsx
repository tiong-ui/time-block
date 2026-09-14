import { useState } from 'react'
import { createFamily, familyExists, normalizeCode } from './family.js'
import { errorDetail } from './errorMessage.js'

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
      setError(`Couldn't create a family right now.${errorDetail(err)} Check your connection and try again.`)
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
        setError("We couldn't find that code. Double-check it and try again.")
      }
    } catch (err) {
      console.error('Failed to check family code:', err)
      setError(`Couldn't check that code right now.${errorDetail(err)} Check your connection and try again.`)
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'created') {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">🎉</div>
        <h1>Family created!</h1>
        <p className="subtitle">Use this code on your kids' other devices too:</p>
        <p className="family-code-display">{newCode}</p>
        <button className="preset-btn wide-btn" onClick={() => onFamilyReady(newCode)}>
          Continue
        </button>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">🔑</div>
        <h1>Join a family</h1>
        <p className="subtitle">Enter the code from your other device</p>
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
            {busy ? 'Checking…' : 'Join'}
          </button>
          <button type="button" className="text-btn" onClick={() => { setMode('choose'); setError('') }}>
            Back
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">🎯</div>
      <h1>Focus Time</h1>
      <p className="subtitle">Set up a Star Jar your kids can fill as they focus.</p>
      {error && <p className="form-error">{error}</p>}
      <button className="preset-btn wide-btn" onClick={handleCreate} disabled={busy}>
        {busy ? 'Creating…' : '✨ Create a new family'}
      </button>
      <button className="preset-btn wide-btn" onClick={() => setMode('join')} disabled={busy}>
        🔑 I have a code
      </button>
    </div>
  )
}
