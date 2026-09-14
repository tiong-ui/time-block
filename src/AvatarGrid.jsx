import { AVATARS } from './avatars.js'

// Shared avatar picker grid, used both when adding a kid and when
// changing an existing kid's avatar.
export default function AvatarGrid({ value, onChange }) {
  return (
    <div className="avatar-grid">
      {AVATARS.map(a => (
        <button
          key={a}
          type="button"
          className={`avatar-btn${value === a ? ' active' : ''}`}
          onClick={() => onChange(a)}
          aria-pressed={value === a}
          aria-label={`Avatar ${a}`}
        >
          {a}
        </button>
      ))}
    </div>
  )
}
