// Minimal localStorage stand-in so the module can be exercised in node.
const store = new Map()
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
}
const { saveSession, loadSession, loadSessions, clearSession } = await import('../src/session.js')
let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got ${JSON.stringify(a)} want ${JSON.stringify(e)}`}`) }

const T0 = 1_000_000_000_000
eq(loadSession('kid1', T0), null, 'nothing saved -> null')

saveSession('kid1', { startedAt: T0, endAt: T0 + 600000, totalMs: 600000, activityId: 'piano' })
eq(loadSession('kid1', T0 + 60000)?.status, 'running', 'mid-session -> running')
eq(loadSession('kid1', T0 + 60000)?.session.activityId, 'piano', 'restores what it saved')
eq(loadSession('kid1', T0 + 600001)?.status, 'finished', 'just past the end -> finished')
eq(loadSession('kid1', T0 + 600000 + 59 * 60000)?.status, 'finished', '59 min late still counts')
eq(loadSession('kid1', T0 + 600000 + 61 * 60000), null, 'next-morning stale session is discarded')

clearSession('kid1')
eq(loadSession('kid1', T0 + 60000), null, 'cleared -> null')

store.set('focus-timer-running-session', 'not json{')
eq(loadSession(T0), null, 'corrupt json -> null, no throw')
store.set('focus-timer-running-session', JSON.stringify({ endAt: 'soon' }))
eq(loadSession(T0), null, 'garbage fields -> null, no throw')
console.log(`-- storage: ${pass} passed, ${fail} failed --\n`)

// --- restoredTimerState ---
const { restoredTimerState } = await import('../src/session.js')
const N = 2_000_000_000_000
let p2 = 0, f2 = 0
const eq2 = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? p2++ : f2++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got ${JSON.stringify(a)} want ${JSON.stringify(e)}`}`) }

const mid = { status: 'running', session: { startedAt: N - 240000, endAt: N + 360000, totalMs: 600000, pausedAt: null } }
eq2(restoredTimerState(null, N), { phase: 'select', totalMs: 0, remainingMs: 0, paused: false, owesStars: false, session: null }, 'nothing saved -> select screen')
eq2(restoredTimerState(mid, N).phase, 'running', 'mid-session -> resumes running')
eq2(restoredTimerState(mid, N).remainingMs, 360000, 'picks up with exactly the wall-clock time left')
eq2(restoredTimerState(mid, N).paused, false, 'and still ticking')

const pausedSess = { status: 'running', session: { startedAt: N - 300000, endAt: N + 300000, totalMs: 600000, pausedAt: N - 120000 } }
eq2(restoredTimerState(pausedSess, N).paused, true, 'paused session comes back paused')
eq2(restoredTimerState(pausedSess, N).remainingMs, 420000, 'frozen where it paused — closed-app time is not deducted')

const fin = { status: 'finished', session: { startedAt: N - 660000, endAt: N - 60000, totalMs: 600000, pausedAt: null } }
eq2(restoredTimerState(fin, N), { phase: 'done', totalMs: 600000, remainingMs: 0, paused: false, owesStars: true, session: fin.session }, 'finished while away -> done screen, stars owed')
// ── Several kids at once ─────────────────────────────────────────────
// The whole point of the board: one kid's timer must be untouchable by
// anything another kid does.
store.clear()
saveSession('amy', { startedAt: T0, endAt: T0 + 600000, totalMs: 600000, activityId: 'piano' })
saveSession('ben', { startedAt: T0, endAt: T0 + 1200000, totalMs: 1200000, activityId: 'homework' })
saveSession('cat', { startedAt: T0, endAt: T0 + 300000, totalMs: 300000, activityId: 'hiit' })

eq(Object.keys(loadSessions(T0 + 60000)).sort(), ['amy', 'ben', 'cat'], 'three kids, three saved sessions')
eq(loadSessions(T0 + 60000).amy.session.activityId, 'piano', 'each keeps its own activity')
eq(loadSessions(T0 + 60000).ben.session.totalMs, 1200000, 'and its own length')

// Stopping one kid's timer clears only theirs.
clearSession('ben')
eq(Object.keys(loadSessions(T0 + 60000)).sort(), ['amy', 'cat'], "stopping Ben's timer leaves the others running")
eq(loadSession('amy', T0 + 60000)?.status, 'running', 'Amy is still counting down')
eq(loadSession('ben', T0 + 60000), null, 'and Ben really is gone')

// Pausing one rewrites only that entry.
saveSession('amy', { startedAt: T0, endAt: T0 + 600000, totalMs: 600000, activityId: 'piano', pausedAt: T0 + 60000 })
eq(loadSession('amy', T0 + 90000)?.session.pausedAt, T0 + 60000, 'Amy is paused')
eq(loadSession('cat', T0 + 90000)?.session.pausedAt, undefined, "and pausing Amy did not pause Cat")

// They finish and go stale on their own clocks, not together.
eq(loadSession('cat', T0 + 310000)?.status, 'finished', 'the short session has finished')
eq(loadSession('amy', T0 + 310000)?.status, 'running', 'while the longer one is still going')
eq(Object.keys(loadSessions(T0 + 310000)).sort(), ['amy', 'cat'], 'and both are still restorable')

// Each ages out on its own end time, not on whoever finished first.
const nextMorning = T0 + 600000 + 61 * 60000
eq(Object.keys(loadSessions(nextMorning)), [], 'opened the next morning -> nothing stale is restored')
// Cat's shorter session goes stale before Amy's longer one does.
const betweenTheTwo = T0 + 300000 + 61 * 60000
eq(Object.keys(loadSessions(betweenTheTwo)), ['amy'], 'the shorter session ages out first, on its own clock')

console.log(`\n${pass + p2} passed, ${fail + f2} failed`); process.exit(fail + f2 ? 1 : 0)
