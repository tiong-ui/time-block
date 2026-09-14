import { useState } from 'react'
import { AVATARS } from './avatars.js'
import AvatarGrid from './AvatarGrid.jsx'
import { errorDetail } from './errorMessage.js'
import { T } from './T.jsx'
import { tBoth, tZh } from './i18n.js'

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
      setError(tBoth('errAddKid', { detail: errorDetail(err) }))
      setBusy(false)
    }
  }

  if (loadError && kids.length === 0) {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">😕</div>
        <h1><T k="cantConnect" /></h1>
        <p className="form-error">{loadError}</p>
        <button className="preset-btn wide-btn" onClick={() => window.location.reload()}>
          <T k="retry" />
        </button>
      </div>
    )
  }

  if (adding || (kidsLoaded && kids.length === 0)) {
    return (
      <div className="screen">
        <div className="hero-icon" aria-hidden="true">{avatar}</div>
        <h1><T k="addAKid" /></h1>
        <p className="subtitle"><T k="nameAndAvatar" /></p>
        <form className="join-form" onSubmit={handleAdd}>
          <input
            id="kid-name"
            className="join-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={tZh('namePlaceholder')}
            autoComplete="off"
            maxLength={20}
          />
          <AvatarGrid value={avatar} onChange={setAvatar} />
          {error && <p className="form-error">{error}</p>}
          <button className="preset-btn wide-btn" type="submit" disabled={busy || !name.trim()}>
            <T k={busy ? 'adding' : 'add'} />
          </button>
          {kids.length > 0 && (
            <button type="button" className="text-btn" onClick={() => setAdding(false)}>
              <T k="back" />
            </button>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">👋</div>
      <h1><T k="whosFocusing" /></h1>
      <div className="kid-grid">
        {kidsLoaded ? (
          kids.map(kid => (
            <button key={kid.id} className="kid-card" onClick={() => onSelectKid(kid.id)}>
              <span className="kid-avatar" aria-hidden="true">{kid.avatar}</span>
              <span className="kid-name">{kid.name}</span>
            </button>
          ))
        ) : (
          <p className="subtitle"><T k="loading" /></p>
        )}
      </div>
      {kidsLoaded && (
        <button className="text-btn" onClick={() => setAdding(true)}>
          <T k="addAnotherKid" />
        </button>
      )}
    </div>
  )
}
