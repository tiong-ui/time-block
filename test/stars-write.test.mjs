// A kid finished a session: the stars must land. Writing the total and
// the log entry as one batch made that all-or-nothing, so security
// rules that didn't cover the ledger silently swallowed the stars too —
// the jar animated, the count never moved. These pin down the rule that
// replaced it.
import { saveTotalEvenIfUnlogged, validateKidName, MAX_KID_NAME_LENGTH } from '../src/kids.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

const ok = () => Promise.resolve()
const boom = message => () => Promise.reject(new Error(message))

// Normal case: both land together, nothing to report.
let fallbackRan = false
let result = await saveTotalEvenIfUnlogged(ok, () => { fallbackRan = true; return ok() })
eq(result.logged, true, 'when the batch commits, the entry is logged')
eq(fallbackRan, false, 'and the fallback is not used')

// The regression: the ledger write is rejected. The stars must still
// be saved, and the caller must be told the log is incomplete.
let totalWritten = false
result = await saveTotalEvenIfUnlogged(boom('permission-denied'), () => { totalWritten = true; return ok() })
eq(totalWritten, true, "a rejected ledger write does not cost the kid their stars")
eq(result.logged, false, 'and the caller learns the log entry is missing')
eq(result.logError.message, 'permission-denied', 'along with why, so it can be reported')

// Genuinely offline: nothing can be saved, and that must not be
// swallowed — the done screen has to be able to say so.
let threw = null
try {
  await saveTotalEvenIfUnlogged(boom('unavailable'), boom('unavailable'))
} catch (err) {
  threw = err.message
}
eq(threw, 'unavailable', 'if even the total cannot be written, the caller finds out')

// ── Kid names ────────────────────────────────────────────────────────
// One rule, used by both the form that adds a kid and the one that
// renames them: the two drifting apart is how a name that can be typed
// in one place becomes un-saveable in the other.
eq(validateKidName('小明'), { ok: true, value: '小明' }, 'a name is a name')
eq(validateKidName('  小明  '), { ok: true, value: '小明' }, 'and is trimmed')
eq(validateKidName('').reason, 'empty', 'nothing is not a name')
eq(validateKidName('   ').reason, 'empty', 'nor is a handful of spaces')
eq(validateKidName(undefined).reason, 'empty', 'nor a missing one')
eq(validateKidName('x'.repeat(MAX_KID_NAME_LENGTH)).ok, true, 'the longest allowed name fits')
eq(validateKidName('x'.repeat(MAX_KID_NAME_LENGTH + 1)).reason, 'too-long', 'one past it does not')
// Trimming happens before the length check, so trailing spaces can't
// push an otherwise fine name over the edge.
eq(validateKidName('x'.repeat(MAX_KID_NAME_LENGTH) + '   ').ok, true, 'trailing spaces do not count against the limit')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
