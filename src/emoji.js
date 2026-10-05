// Telling an emoji from everything else someone can type.
//
// Harder than it looks, in two ways. An emoji is not one character —
// '👨‍👩‍👧'.length is 8 and '👍🏽'.length is 4 — so slice(0, 1) cuts a
// family in half and strips a skin tone. And the obvious test,
// \p{Emoji}, matches the digits 0-9 and # and *, which would let a kid
// set their avatar to "7".

// Flags are two regional indicators; keycaps are a digit, # or * with
// the enclosing mark. Neither is Extended_Pictographic, so both need
// saying out loud.
const FLAG = /^\p{RI}\p{RI}$/u
const KEYCAP = /^[\d#*]️?⃣$/u
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u
// Drawn as an emoji by default, or asked to be with U+FE0F. Without
// this, ™ and © count, and a bare ❤ or ☂ — which render as text
// glyphs, not pictures — would too. Anything the system emoji keyboard
// inserts carries the selector, so a real pick always passes.
const EMOJI_PRESENTATION = /\p{Emoji_Presentation}/u

function graphemes(text) {
  if (typeof Intl?.Segmenter !== 'function') {
    // Safari before 16.4. Treating the whole string as one unit still
    // rejects letters and digits; it just can't catch two emoji pasted
    // together, which is a far smaller problem than not working.
    return [text]
  }
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(s => s.segment)
}

export function isEmoji(grapheme) {
  if (!grapheme) return false
  if (FLAG.test(grapheme) || KEYCAP.test(grapheme)) return true
  return PICTOGRAPHIC.test(grapheme) && (EMOJI_PRESENTATION.test(grapheme) || grapheme.includes('️'))
}

// One emoji and nothing else, or ''. Used as a question as much as a
// conversion: the picker accepts the moment this stops being empty.
export function toSingleEmoji(text) {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return ''
  const parts = graphemes(trimmed)
  if (parts.length !== 1) return ''
  return isEmoji(parts[0]) ? parts[0] : ''
}

// What the picker offers before its own lists: an emoji already in use
// that isn't on any of them — a starter, or one chosen before the
// lists changed — followed by whatever this device has typed in. Both
// pickers had their own copy of the first half of this rule; two
// copies of a rule is one of them waiting to go stale.
export function leadingEmoji({ value, groups = [], custom = [] }) {
  const onAList = groups.some(group => group.emoji.includes(value)) || custom.includes(value)
  return [...new Set([...(value && !onAList ? [value] : []), ...custom])]
}

// Emoji a family typed in themselves, kept so the ones they actually
// use are a tap away next time instead of a trip back to the keyboard.
//
// Per device rather than per family: it is a convenience, not data
// worth a Firestore collection, and a tablet on the kitchen table —
// where this app mostly lives — is already the shared one.
const CUSTOM_KEY = 'focus-timer-custom-emoji'
export const CUSTOM_LIMIT = 12

export function loadCustomEmoji() {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(isEmoji).slice(0, CUSTOM_LIMIT) : []
  } catch {
    return []
  }
}

// Most recent first, no duplicates, oldest dropped past the limit.
export function withCustomEmoji(list, emoji) {
  return [emoji, ...list.filter(e => e !== emoji)].slice(0, CUSTOM_LIMIT)
}

export function rememberCustomEmoji(emoji) {
  const next = withCustomEmoji(loadCustomEmoji(), emoji)
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
  } catch {
    // Private mode, or a full quota. The emoji is already chosen; only
    // the shortcut for next time is lost.
  }
  return next
}
