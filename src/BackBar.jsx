import { T } from './T.jsx'

// The way out of a screen, pinned to the top of it.
//
// It used to be the last thing on the page, which is fine on a screen
// that fits — and useless on the star log, where three months of
// entries put "back" a long scroll below the fold. Up here it is in
// the same place on every screen and always one tap away, whether the
// screen is two lines long or two hundred.
export default function BackBar({ onBack, disabled = false }) {
  return (
    <button className="back-bar" type="button" onClick={onBack} disabled={disabled}>
      <span className="back-bar-arrow" aria-hidden="true">‹</span>
      <T k="back" />
    </button>
  )
}
