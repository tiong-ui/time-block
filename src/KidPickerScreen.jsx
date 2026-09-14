import { useState } from 'react'
import { AVATARS } from './stickers.js'
import { errorDetail } from './errorMessage.js'

// Lets whoever's using the device pick their profile, or add a new one.
// Shown on first use of a family, whenever kids switch, or when a
// stored profile no longer exists.
export default function KidPickerScreen({ kids, kidsLoaded, loadError, onSelectKid, onAddKid }) {
  const [adding, setAdding] = useState(kidsLoaded && kids.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError('')
    try {
      await onAddKid({ name: trimmed, avatar })
    } catch (err) {
      console.error('Failed to add kid:', err)
      setError(`Couldn't add that right now.${errorDetail(err)} Check your connection and try again.`)
      setBusy(false)
    }
  }

  if (loadError && kids.length === 0) {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">😕</div>
        <h1>Couldn't connect</h1>
        <p className="form-error">{loadError}</p>
        <button className="preset-btn wide-btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (adding || (kidsLoaded && kids.length === 0)) {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">{avatar}</div>
        <h1>Add a kid</h1>
        <p className="subtitle">What's their name, and pick an avatar</p>
        <form className="join-form" onSubmit={handleAdd}>
          <input
            id="kid-name"
            className="join-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            autoComplete="off"
            maxLength={20}
          />
          <div className="avatar-grid">
            {AVATARS.map(a => (
              <button
                key={a}
                type="button"
                className={`avatar-btn${avatar === a ? ' active' : ''}`}
                onClick={() => setAvatar(a)}
                aria-pressed={avatar === a}
                aria-label={`Avatar ${a}`}
              >
                {a}
              </button>
            ))}
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="preset-btn wide-btn" type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Adding…' : 'Add'}
          </button>
          {kids.length > 0 && (
            <button type="button" className="text-btn" onClick={() => setAdding(false)}>
              Back
            </button>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">👋</div>
      <h1>Who's focusing today?</h1>
      <div className="kid-grid">
        {kidsLoaded ? (
          kids.map(kid => (
            <button key={kid.id} className="kid-card" onClick={() => onSelectKid(kid.id)}>
              <span className="kid-avatar" aria-hidden="true">{kid.avatar}</span>
              <span className="kid-name">{kid.name}</span>
            </button>
          ))
        ) : (
          <p className="subtitle">Loading…</p>
        )}
      </div>
      {kidsLoaded && (
        <button className="text-btn" onClick={() => setAdding(true)}>
          + Add another kid
        </button>
      )}
    </div>
  )
}
