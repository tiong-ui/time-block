import { AVATARS } from './avatars.js'
import { tBoth } from './i18n.js'

// A grid of emoji to pick one from. Used for kid avatars and for the
// picture on a reward — the same interaction, so the same component
// rather than two that drift apart.
export default function EmojiGrid({ options = AVATARS, value, onChange, labelKey = 'avatarOption' }) {
  return (
    <div className="emoji-grid">
      {options.map(emoji => (
        <button
          key={emoji}
          type="button"
          className={`emoji-btn${value === emoji ? ' active' : ''}`}
          onClick={() => onChange(emoji)}
          aria-pressed={value === emoji}
          aria-label={tBoth(labelKey, { emoji })}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
