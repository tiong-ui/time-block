// The star economy: what's spendable, what a trade does to it, and how
// the log reads back. None of this is reachable from a sandbox — it all
// lives behind Firestore — so the maths is pure and checked here.
import { starBalance, canAfford, jarStats, JAR_CAPACITY } from '../src/stars.js'
import { groupByDay, ledgerTotals } from '../src/ledger.js'
import { validateReward, labelToText, editedLabel, emojiChoices, REWARD_EMOJI } from '../src/rewards.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

// ── Balance ──────────────────────────────────────────────────────────
eq(starBalance({ totalStars: 120, starsSpent: 100 }), { earned: 120, spent: 100, balance: 20 }, 'spending comes off the balance, not the lifetime total')
eq(starBalance({ totalStars: 40 }), { earned: 40, spent: 0, balance: 40 }, 'a kid from before spending existed has spent nothing')
eq(starBalance(null), { earned: 0, spent: 0, balance: 0 }, 'no kid loaded yet reads as zero, not a crash')
eq(starBalance({ totalStars: 10, starsSpent: 25 }).balance, 0, 'a balance can never go negative')

// The lifetime count is a trophy shelf: trading stars away must not
// take a filled jar back off it.
const afterBigSpend = { totalStars: 120, starsSpent: 100 }
eq(jarStats(starBalance(afterBigSpend).earned).fullJars, 2, 'jars filled counts from stars ever earned')
eq(jarStats(starBalance(afterBigSpend).balance).currentJarStars, 20, 'the jar itself shows what is left to spend')
eq(jarStats(JAR_CAPACITY).currentJarStars, 0, 'a jar exactly full starts the next one empty')

// ── Affording ────────────────────────────────────────────────────────
eq(canAfford(100, 100), true, 'exactly enough is enough')
eq(canAfford(99, 100), false, 'one short is short')
eq(canAfford(100, 0), false, 'a free reward is not a reward')
eq(canAfford(100, 2.5), false, 'half a star is not a price')

// ── Reward form ──────────────────────────────────────────────────────
eq(validateReward({ name: ' Ice cream ', cost: '25' }), { ok: true, value: { label: 'Ice cream', cost: 25 } }, 'trims the name and takes the cost as a number')
eq(validateReward({ name: '   ', cost: '25' }).reason, 'name-missing', 'a blank name is rejected')
eq(validateReward({ name: 'Toy', cost: '0' }).reason, 'cost-invalid', 'zero stars is rejected')
eq(validateReward({ name: 'Toy', cost: '-5' }).reason, 'cost-invalid', 'a negative price is rejected')
eq(validateReward({ name: 'Toy', cost: '2.5' }).reason, 'cost-invalid', 'a fractional price is rejected')
eq(validateReward({ name: 'Toy', cost: '' }).reason, 'cost-invalid', 'an empty cost is rejected')
eq(validateReward({ name: 'x'.repeat(41), cost: '5' }).reason, 'name-too-long', 'an unreasonably long name is rejected')

// ── Log grouping ─────────────────────────────────────────────────────
const at = (day, hour) => new Date(2026, 2, day, hour, 0, 0).getTime()
const now = at(15, 20)
const entries = [
  { id: 'a', kind: 'earned', stars: 5, atMs: at(15, 9) },
  { id: 'b', kind: 'earned', stars: 5, atMs: at(15, 17) },
  { id: 'c', kind: 'spent', stars: 100, atMs: at(14, 18) },
  { id: 'd', kind: 'earned', stars: 5, atMs: at(11, 8) },
]
const days = groupByDay(entries, now)
eq(days.map(d => d.daysAgo), [0, 1, 4], 'buckets by day, newest first')
eq(days[0].entries.map(e => e.id), ['b', 'a'], 'and newest first inside a day too')
eq(days[1].entries.length, 1, 'a day with one entry is still its own bucket')
eq(groupByDay([], now), [], 'an empty log groups into nothing')

eq(ledgerTotals(entries), { earned: 15, spent: 100 }, 'totals split earning from spending')
eq(ledgerTotals([]), { earned: 0, spent: 0 }, 'an empty log totals zero')

// ── Editing a reward ─────────────────────────────────────────────────
// The starters ship in both languages. Re-pricing one must not quietly
// throw its English half away, but renaming it should make it the
// parent's own words.
const starter = { zh: '去公園玩', en: 'A trip to the park' }
eq(labelToText(starter), '去公園玩', 'the edit form starts from the Chinese half')
eq(labelToText('看卡通'), '看卡通', "and from a family's own wording as typed")
eq(labelToText(null), '', 'a reward with no label does not crash the form')

eq(editedLabel(starter, '去公園玩'), starter, 'an untouched name keeps both languages')
eq(editedLabel(starter, '  去公園玩  '), starter, 'and stray spaces are not a rename')
eq(editedLabel(starter, '去動物園'), '去動物園', 'a real rename becomes what the parent typed')
eq(editedLabel('看卡通', '看兩集卡通'), '看兩集卡通', 'renaming a typed reward just replaces it')

// ── The picture on a reward ──────────────────────────────────────────
eq(emojiChoices('🛝'), REWARD_EMOJI, 'a picture already on the list adds nothing to it')
eq(emojiChoices('🦖')[0], '🦖', 'one that is not is offered first, so opening the form never drops it')
eq(emojiChoices('🦖').length, REWARD_EMOJI.length + 1, 'and the rest of the list still follows')
eq(emojiChoices(undefined), REWARD_EMOJI, 'a reward with no picture just gets the list')
// Every starter must be representable, or editing one would show
// nothing selected.
eq(['📺', '🍜', '🛝', '🧸'].every(e => REWARD_EMOJI.includes(e)), true, 'every starter picture is on the list')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
