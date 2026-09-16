import { useState } from 'react'
import { THEMES } from './themes'
import { tBoth } from './i18n.js'
import { T } from './T.jsx'
import FocusCard from './FocusCard.jsx'
import { loadSessions } from './session.js'

// Every kid in the family, side by side, each with their own timer.
//
// On a phone that's one card you scroll between; on an iPad propped on
// the kitchen table it's the whole family at once, which is the point:
// one kid can start reading while another is halfway through a HIIT
// round and a third has already finished.
export default function FocusBoard({
  familyCode, kids, kidsLoaded, loadError,
  colorTheme, onColorThemeChange,
  onViewStarJar, onEditAvatar, onAddKid,
}) {
  // Read once, at mount: every card takes its own restored session from
  // here, so a reload brings the whole board back rather than whichever
  // card happens to render first.
  const [restored] = useState(() => loadSessions())

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
        {kids.map(kid => (
          <FocusCard
            key={kid.id}
            familyCode={familyCode}
            kid={kid}
            restored={restored[kid.id] ?? null}
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
