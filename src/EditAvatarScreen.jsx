import { useState } from 'react'
import AvatarGrid from './AvatarGrid.jsx'
import { errorDetail } from './errorMessage.js'
import { T } from './T.jsx'
import { tBoth } from './i18n.js'

// Lets a kid pick a new avatar for their existing profile. Saves as
// soon as a new one is tapped — no separate confirm step, matching
// the theme/activity pickers elsewhere in the app.
export default function EditAvatarScreen({ kid, onSave, onBack }) {
  const [avatar, setAvatar] = useState(kid.avatar)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handlePick(next) {
    setAvatar(next)
    setBusy(true)
    setError('')
    try {
      await onSave(next)
    } catch (err) {
      console.error('Failed to update avatar:', err)
      setError(tBoth('errSaveAvatar', { detail: errorDetail(err) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">{avatar}</div>
      <h1><T k="avatarTitle" vars={{ name: kid.name }} /></h1>
      <p className="subtitle"><T k="pickNewAvatar" /></p>
      <AvatarGrid value={avatar} onChange={handlePick} />
      {error && <p className="form-error">{error}</p>}
      <button className="text-btn" onClick={onBack} disabled={busy}>
        <T k="back" />
      </button>
    </div>
  )
}
