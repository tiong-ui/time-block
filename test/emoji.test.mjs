// Telling an emoji from everything else someone can type, which is
// harder than it looks in two ways: an emoji is not one character, and
// the obvious test matches the digits.
import { isEmoji, toSingleEmoji, leadingEmoji, withCustomEmoji, CUSTOM_LIMIT } from '../src/emoji.js'
import { AVATARS, AVATAR_GROUPS } from '../src/avatars.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

// ── What counts ──────────────────────────────────────────────────────
eq(toSingleEmoji('🦊'), '🦊', 'a plain emoji')
// Eight code units and four, which is why slice(0, 1) is no good here.
eq('👨‍👩‍👧'.length, 8, 'a family is eight characters long')
eq(toSingleEmoji('👨‍👩‍👧'), '👨‍👩‍👧', 'and survives whole')
eq('👍🏽'.length, 4, 'a skin tone is four')
eq(toSingleEmoji('👍🏽'), '👍🏽', 'and keeps its tone')
eq(toSingleEmoji('🇹🇼'), '🇹🇼', 'a flag is two regional indicators, not a picture')
eq(toSingleEmoji('1️⃣'), '1️⃣', 'a keycap is a digit wearing an enclosing mark')
eq(toSingleEmoji('🏳️‍🌈'), '🏳️‍🌈', 'a joined sequence stays joined')
eq(toSingleEmoji('  🦊  '), '🦊', 'spaces around it are not part of it')

// ── What does not ────────────────────────────────────────────────────
eq(toSingleEmoji('A'), '', 'a letter is not an emoji')
eq(toSingleEmoji('小'), '', 'nor a character')
// The classic trap: \p{Emoji} matches 0-9, # and *, so the obvious
// test would let a kid set their avatar to "7".
eq(toSingleEmoji('7'), '', 'nor a bare digit')
eq(toSingleEmoji('#'), '', 'nor a bare hash')
eq(toSingleEmoji('™'), '', 'nor a trademark sign, pictographic though it is')
eq(toSingleEmoji('©'), '', 'nor a copyright sign')
// Without the selector these render as text glyphs rather than
// pictures; the system keyboard always inserts the selector form.
eq(toSingleEmoji('❤'), '', 'a bare heart is a text glyph')
eq(toSingleEmoji('❤️'), '❤️', 'the same heart asked to be drawn is an emoji')
eq(toSingleEmoji('☂'), '', 'and the same goes for an umbrella')
eq(toSingleEmoji('☂️'), '☂️', 'either way round')
eq(toSingleEmoji(''), '', 'nothing is nothing')
eq(toSingleEmoji('   '), '', 'and so is whitespace')
eq(toSingleEmoji(undefined), '', 'and so is nothing at all')
eq(toSingleEmoji('🦊🐼'), '', 'two emoji are not one')
eq(toSingleEmoji('🦊 is a fox'), '', 'nor is one with words after it')

// Every built-in has to pass the rule the typed-in ones are held to,
// or the picker would offer something it would refuse.
eq(AVATARS.every(e => isEmoji(e)), true, 'every built-in avatar passes the same rule')
eq(AVATARS.length, new Set(AVATARS).size, 'and none is listed twice')

// ── What the picker leads with ───────────────────────────────────────
eq(leadingEmoji({ value: '🦊', groups: AVATAR_GROUPS }), [], 'a built-in needs no special place')
eq(leadingEmoji({ value: '🐙', groups: AVATAR_GROUPS }), [], 'and neither does one in another group')
eq(leadingEmoji({ value: '🫎', groups: AVATAR_GROUPS }), ['🫎'], 'one from the keyboard leads')
eq(leadingEmoji({ value: '🦊', groups: AVATAR_GROUPS, custom: ['🫎'] }), ['🫎'], "what this device typed in stays offered")
eq(leadingEmoji({ value: '', groups: AVATAR_GROUPS }), [], 'nothing chosen leads with nothing')

// ── Remembering what was typed in ────────────────────────────────────
eq(withCustomEmoji([], '🫎'), ['🫎'], 'the first one is kept')
eq(withCustomEmoji(['🦕'], '🫎'), ['🫎', '🦕'], 'the newest comes first')
eq(withCustomEmoji(['🦕', '🫎'], '🫎'), ['🫎', '🦕'], 'choosing one again moves it up rather than doubling it')
const many = Array.from({ length: CUSTOM_LIMIT }, (_, i) => String.fromCodePoint(0x1f600 + i))
eq(withCustomEmoji(many, '🫎').length, CUSTOM_LIMIT, 'the list stops growing at the limit')
eq(withCustomEmoji(many, '🫎').at(-1), many.at(-2), 'and the oldest is the one that goes')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
