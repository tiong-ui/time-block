import { useCallback, useState } from 'react'
import { THEMES } from './themes'
import { tBoth } from './i18n.js'
import { T } from './T.jsx'
import FocusCard from './FocusCard.jsx'
import { loadSessions, loadLastKid } from './session.js'

// Every kid in the family, side by side, each with their own timer.
//
// On a phone that's one card you scroll between; on an iPad propped on
// the kitchen table it's the whole family at once, which is the point:
// one kid can start reading while another is halfway through a HIIT
// round and a third has already finished.
//
// Most of the time, though, a device is one kid's. So an idle card
// folds down to a single row and the board opens on whoever last used
// this device — no setting to keep up to date, nobody hidden, and any
// kid one tap away. A card that is counting down or waiting for its
// stars never folds: it has to stay where it can be seen.
export default function FocusBoard({
  familyCode, kids, activities, kidsLoaded, loadError,
  colorTheme, onColorThemeChange,
  onViewStarJar, onEditAvatar, onAddKid,
}) {
  // Read once, at mount: every card takes its own restored session from
  // here, so a reload brings the whole board back rather than whichever
  // card happens to render first.
  const [restored] = useState(() => loadSessions())
  // Cards that are counting down or waiting to be collected. Seeded
  // from what was restored, then kept up to date by the cards
  // themselves as timers start and stop.
  const [busyIds, setBusyIds] = useState(() => new Set(Object.keys(restored)))
  const [openIds, setOpenIds] = useState(() => {
    const last = loadLastKid()
    return new Set(last ? [last] : [])
  })

  const setBusy = useCallback((kidId, busy) => {
    setBusyIds(prev => {
      // Returning the same set when nothing changed lets React bail
      // out, so a card re-rendering can't set off a loop.
      if (prev.has(kidId) === busy) return prev
      const next = new Set(prev)
      if (busy) next.add(kidId)
      else next.delete(kidId)
      return next
    })
  }, [])

  const toggle = useCallback(kidId => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(kidId)) next.delete(kidId)
      else next.add(kidId)
      return next
    })
  }, [])

  // One kid in the family has nothing to fold away from.
  const foldable = kids.length > 1
  const isCollapsed = kid => foldable && !busyIds.has(kid.id) && !openIds.has(kid.id)

  // Open cards first, folded ones beneath. Folding a kid away is a way
  // of saying "not this one, not now", so leaving them above whoever is
  // actually focusing reads as backwards. Family order is kept within
  // each group.
  //
  // Sorted here rather than with CSS `order` so the reading order and
  // the tab order match what's on screen. React reconciles by key, so
  // a card that moves is moved, not rebuilt — its timer carries on.
  const ordered = [...kids].sort((a, b) => Number(isCollapsed(a)) - Number(isCollapsed(b)))

  return (
    <div className="board">
      <header className="board-head">
        <h1><T k="focusTime" /></h1>
        <ThemePicker value={colorTheme} onChange={onColorThemeChange} />
      </header>

      {loadError && <p className="form-error">{loadError}</p>}
      {!kidsLoaded && !loadError && <p className="subtitle"><T k="loading" /></p>}

      {kidsLoaded && kids.length === 0 && (
        <p className="subtitle"><T k="whosFocusing" /></p>
      )}

      <div className="board-grid">
        {ordered.map(kid => (
          <FocusCard
            key={kid.id}
            familyCode={familyCode}
            kid={kid}
            activities={activities}
            restored={restored[kid.id] ?? null}
            collapsed={isCollapsed(kid)}
            onToggle={() => toggle(kid.id)}
            onActiveChange={setBusy}
            onViewStarJar={() => onViewStarJar(kid.id)}
            onEditAvatar={() => onEditAvatar(kid.id)}
          />
        ))}
      </div>

      {kidsLoaded && (
        <button className="text-btn bi-inline board-add" onClick={onAddKid}>
          <T k="addAnotherKid" />
        </button>
      )}
    </div>
  )
}

function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label={tBoth('colorTheme')}>
      {THEMES.map(theme => (
        <button
          key={theme.id}
          className={`theme-swatch${value === theme.id ? ' active' : ''}`}
          style={{ '--swatch-color': theme.swatch }}
          role="radio"
          aria-checked={value === theme.id}
          aria-label={`${theme.name.zh} / ${theme.name.en}`}
          onClick={() => onChange(theme.id)}
        />
      ))}
    </div>
  )
}
