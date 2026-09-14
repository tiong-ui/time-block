import { STICKERS } from './stickers.js'

// Shows a kid's sticker collection: every sticker type they've earned
// at least once, with a count — collecting more of a favorite is just
// as fun as a new one, so duplicates aren't hidden.
export default function StickersScreen({ kid, onBack }) {
  const counts = {}
  for (const s of kid.stickers ?? []) {
    counts[s.id] = (counts[s.id] ?? 0) + 1
  }
  const earnedCount = Object.keys(counts).length
  const totalCount = kid.stickers?.length ?? 0

  return (
    <div className="screen">
      <div className="hero-icon" aria-hidden="true">{kid.avatar}</div>
      <h1>{kid.name}'s Stickers</h1>
      <p className="subtitle">
        {totalCount === 0
          ? 'Finish a focus session to earn your first sticker!'
          : `${earnedCount} of ${STICKERS.length} kinds collected`}
      </p>
      <div className="sticker-grid">
        {STICKERS.map(sticker => {
          const count = counts[sticker.id] ?? 0
          return (
            <div key={sticker.id} className={`sticker-tile${count > 0 ? ' earned' : ''}`}>
              <span className="sticker-emoji" aria-hidden="true">{sticker.emoji}</span>
              <span className="sticker-name">{sticker.name}</span>
              {count > 1 && <span className="sticker-count">×{count}</span>}
            </div>
          )
        })}
      </div>
      <button className="text-btn" onClick={onBack}>
        Back
      </button>
    </div>
  )
}
