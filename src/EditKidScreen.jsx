import { useEffect, useState } from 'react'
import EmojiGrid from './EmojiGrid.jsx'
import { validateKidName, MAX_KID_NAME_LENGTH } from './kids.js'
import { errorDetail } from './errorMessage.js'
import { T } from './T.jsx'
import { tBoth, tZh } from './i18n.js'
import BackBar from './BackBar.jsx'

// Everything about a kid that isn't their stars: what they're called
// and what they look like.
//
// The two save differently on purpose. An avatar is a choice from a
// grid, so tapping one is the whole gesture and it saves there and
// then. A name is typed, and typing is not a decision until it stops —
// so that one waits for a button.
export default function EditKidScreen({ kid, onSaveName, onSaveAvatar, onBack }) {
  const [busy, setBusy] = useState(false)
  // Shown straight away so the tap feels answered, and put back if the
  // write doesn't land — the kid list stays the source of truth. Held
  // up here so the big icon and the grid can't disagree.
  const [picked, setPicked] = useState(null)
  const [avatarError, setAvatarError] = useState('')
  const avatar = picked ?? kid.avatar

  async function handlePick(next) {
    setPicked(next)
    setAvatarError('')
    setBusy(true)
    try {
      await onSaveAvatar(next)
    } catch (err) {
      console.error('Failed to update avatar:', err)
      setAvatarError(tBoth('errSaveAvatar', { detail: errorDetail(err) }))
      setPicked(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <BackBar onBack={onBack} disabled={busy} />
      <div className="hero-icon" aria-hidden="true">{avatar}</div>
      <h1><T k="editKidTitle" vars={{ name: kid.name }} /></h1>
      <NameField kid={kid} onSave={onSaveName} onBusyChange={setBusy} />
      <p className="subtitle edit-kid-avatar-label"><T k="pickNewAvatar" /></p>
      <EmojiGrid value={avatar} onChange={handlePick} />
      {avatarError && <p className="form-error">{avatarError}</p>}
    </div>
  )
}

function NameField({ kid, onSave, onBusyChange }) {
  const [name, setName] = useState(kid.name)
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const changed = name.trim() !== kid.name

  useEffect(() => {
    if (!saved) return undefined
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  async function handleSubmit(event) {
    event.preventDefault()
    const result = validateKidName(name)
    if (!result.ok) return setProblem('nameNeeded')
    setProblem(null)
    setError('')
    setSaved(false)
    setSaving(true)
    onBusyChange(true)
    try {
      await onSave(result.value)
      // Shown as typed-and-trimmed, so the field agrees with what was
      // actually stored rather than keeping stray spaces on screen.
      setName(result.value)
      setSaved(true)
    } catch (err) {
      console.error('Failed to rename a kid:', err)
      setError(tBoth('errSaveName', { detail: errorDetail(err) }))
    } finally {
      setSaving(false)
      onBusyChange(false)
    }
  }

  return (
    <form className="edit-name-form" onSubmit={handleSubmit}>
      <label className="subtitle" htmlFor="kid-rename"><T k="theirName" /></label>
      <div className="edit-name-row">
        <input
          id="kid-rename"
          className="text-input"
          value={name}
          onChange={e => { setName(e.target.value); setProblem(null) }}
          placeholder={tZh('namePlaceholder')}
          maxLength={MAX_KID_NAME_LENGTH}
          autoComplete="off"
        />
        <button className="preset-btn" type="submit" disabled={saving || !changed}>
          <T k={saving ? 'savingName' : 'saveChanges'} />
        </button>
      </div>
      {problem && <p className="form-error"><T k={problem} /></p>}
      {error && <p className="form-error">{error}</p>}
      {saved && <p className="confirm-grownup"><T k="nameSaved" /></p>}
    </form>
  )
}
