// The finishing alarm repeats until it's turned off, so its repeats are
// booked a long way ahead on the audio clock and topped up as they're
// used. Getting that wrong is either a silent alarm or a pile-up of
// overlapping melodies, and neither shows up until a session actually
// ends — so the scheduling maths is pure and checked here.
import { alarmRepeats } from '../src/chime.js'

let pass = 0, fail = 0
const eq = (a, e, n) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : `\n   got  ${JSON.stringify(a)}\n   want ${JSON.stringify(e)}`}`) }

// A 5s melody with its gap, booked 150s ahead, giving up after 300s.
const cycleSec = 5
const stopsAtSec = 300

const first = alarmRepeats({ nextAt: 0, cycleSec, horizonSec: 150, stopsAtSec })
eq(first.starts.length, 30, 'fills the whole lookahead window up front')
eq(first.starts.slice(0, 3), [0, 5, 10], 'repeats sit one cycle apart')
eq(first.nextAt, 150, 'hands back where the next repeat goes')

// The top-up runs later and must carry on from there, not re-book what
// has already been scheduled.
const second = alarmRepeats({ nextAt: first.nextAt, cycleSec, horizonSec: 170, stopsAtSec })
eq(second.starts[0], 150, 'the top-up picks up exactly where the last one stopped')
eq(second.starts.some(at => first.starts.includes(at)), false, 'no repeat is booked twice')

// Browsers throttle timers in hidden tabs to about once a minute, so a
// top-up may not run for a long time. What was already booked has to
// cover that gap without a silent patch.
eq(first.starts.some(at => at > 60), true, 'booked far enough ahead to survive a throttled tab')

// It gives up eventually rather than ringing into the evening.
const late = alarmRepeats({ nextAt: 295, cycleSec, horizonSec: 445, stopsAtSec })
eq(late.starts, [295], 'stops booking at the cut-off')
eq(alarmRepeats({ nextAt: 300, cycleSec, horizonSec: 450, stopsAtSec }).starts, [], 'nothing once the cut-off has passed')

// A zero-length cycle would otherwise spin forever.
eq(alarmRepeats({ nextAt: 0, cycleSec: 0, horizonSec: 150, stopsAtSec }), { starts: [], nextAt: 0 }, 'a zero cycle books nothing instead of looping')

// A session starts with its end half an hour away, far outside the
// lookahead. The opening booking still has to cover the first minute of
// ringing on its own, in case the tab is frozen and no top-up ever runs.
const farOff = 1800
const opening = alarmRepeats({ nextAt: farOff, cycleSec, horizonSec: farOff + 60, stopsAtSec: farOff + 300 })
eq(opening.starts.length, 12, 'a distant session still books its first minute of ringing up front')
eq(opening.starts[0], farOff, 'the first repeat lands exactly when the session ends')

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0)
