// A kid finished a session: the stars must land. Writing the total and
// the log entry as one batch made that all-or-nothing, so security
// rules that didn't cover the ledger silently swallowed the stars too —
// the jar animated, the count never moved. These pin down the rule that
// replaced it.
import { saveTotalEvenIfUnlogged } from '../src/kids.js'

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

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
