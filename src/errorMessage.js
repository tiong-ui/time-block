// Firebase errors carry a `.code` (e.g. "permission-denied",
// "auth/operation-not-allowed") that's far more useful for diagnosing
// setup issues than a generic message. Surfacing it inline means a
// parent can report the exact problem without needing to open
// DevTools — it's also always logged to the console in full.
export function errorDetail(err) {
  const code = err?.code || err?.message
  return code ? ` (${code})` : ''
}
