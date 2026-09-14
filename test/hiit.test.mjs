import { intervalAt, upcomingCues } from '../src/hiit.js'
let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++;
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }
const o = { exerciseSec: 30, restSec: 15 }

eq(intervalAt({ ...o, elapsedMs: 0 }),      { kind: 'work', totalMs: 30000, remainingMs: 30000, round: 1 }, 'starts on work')
eq(intervalAt({ ...o, elapsedMs: 10000 }),  { kind: 'work', totalMs: 30000, remainingMs: 20000, round: 1 }, '10s in: 20s of work left')
eq(intervalAt({ ...o, elapsedMs: 30000 }),  { kind: 'rest', totalMs: 15000, remainingMs: 15000, round: 1 }, 'work ends -> rest begins')
eq(intervalAt({ ...o, elapsedMs: 44999 }).kind, 'rest', 'still resting just before the cycle ends')
eq(intervalAt({ ...o, elapsedMs: 45000 }),  { kind: 'work', totalMs: 30000, remainingMs: 30000, round: 2 }, 'next cycle -> round 2')

// the whole point: a long gap lands correctly in ONE step
eq(intervalAt({ ...o, elapsedMs: 5 * 45000 + 12000 }), { kind: 'work', totalMs: 30000, remainingMs: 18000, round: 6 }, 'screen off for 5 cycles lands on round 6 directly')
eq(intervalAt({ ...o, elapsedMs: 600000 }).round, 14, '10 min in = round 14')

eq(intervalAt({ ...o, elapsedMs: 10000, sessionRemainingMs: 8000 }).remainingMs, 8000, 'last interval clipped to session end')

const cues = upcomingCues({ ...o, elapsedMs: 0, sessionRemainingMs: 120000 })
eq(cues.slice(0, 4), [{ atMs: 30000, kind: 'rest' }, { atMs: 45000, kind: 'work' }, { atMs: 75000, kind: 'rest' }, { atMs: 90000, kind: 'work' }], 'cue schedule alternates on the right beats')
eq(cues.every(c => c.atMs < 120000), true, 'no cue scheduled past the session end')
eq(upcomingCues({ ...o, elapsedMs: 0, sessionRemainingMs: 20000 }), [], 'session shorter than one interval -> no switch cues')
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
