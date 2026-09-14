// The sticker catalog. One is awarded at random each time a focus
// session completes — duplicates are fine, kids like collecting more
// of a favorite as much as new ones.
export const STICKERS = [
  { id: 'star', emoji: '🌟', name: 'Star' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy' },
  { id: 'dolphin', emoji: '🐬', name: 'Dolphin' },
  { id: 'balloon', emoji: '🎈', name: 'Balloon' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon' },
  { id: 'medal', emoji: '🎖️', name: 'Medal' },
  { id: 'sparkles', emoji: '✨', name: 'Sparkles' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly' },
  { id: 'gem', emoji: '💎', name: 'Gem' },
]

export const STICKER_MAP = Object.fromEntries(STICKERS.map(s => [s.id, s]))

export function randomSticker() {
  return STICKERS[Math.floor(Math.random() * STICKERS.length)]
}

// Kid avatar choices, shown when creating a profile.
export const AVATARS = ['🦊', '🐼', '🐯', '🐨', '🐰', '🦁', '🐸', '🐵', '🦄', '🐶', '🐱', '🐧']
