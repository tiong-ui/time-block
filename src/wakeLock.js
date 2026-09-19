// Keeps the screen awake while a timer is counting down.
//
// This exists because of how iOS and iPadOS treat a web page. The
// finishing alarm is booked ahead on the Web Audio clock, which keeps
// running under a hidden tab on a desktop browser — but Safari
// suspends the whole audio context when the device locks or the app
// goes to the background, so nothing booked ever sounds. A web page
// cannot reserve an alarm slot the way a native app can.
//
// What it *can* do is ask the screen not to sleep in the first place,
// which is the difference between "leave the iPad awake yourself" and
// the app just working. Screen Wake Lock is supported on iPadOS 16.4
// and up; where it isn't, everything carries on as before.
//
// Several timers can run at once, so holders are counted: the lock is
// taken when the first one starts and dropped when the last one ends.

let sentinel = null
let holders = 0

function supported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

async function take() {
  if (!supported() || sentinel || holders === 0) return
  // Only a visible document may hold one; the visibility listener
  // below picks it up again when the page comes back.
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
  try {
    sentinel = await navigator.wakeLock.request('screen')
    // The browser drops it on its own when the page is hidden, so
    // forget ours rather than holding a dead handle.
    sentinel.addEventListener('release', () => { sentinel = null })
  } catch {
    // Refused (low battery, no permission, unsupported): the timer
    // still runs, the screen just sleeps as it always did.
    sentinel = null
  }
}

function drop() {
  if (!sentinel) return
  const held = sentinel
  sentinel = null
  held.release().catch(() => {
    // Already gone — nothing to do.
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && holders > 0) take()
  })
}

// Hold the screen awake until the returned function is called.
export function holdScreenAwake() {
  holders += 1
  take()
  let released = false
  return () => {
    if (released) return
    released = true
    holders -= 1
    if (holders <= 0) {
      holders = 0
      drop()
    }
  }
}

// For tests and for reporting what the device actually allows.
export function screenWakeSupported() {
  return supported()
}
