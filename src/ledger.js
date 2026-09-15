// Every star a kid earns or spends, kept as a log under
// families/{familyCode}/kids/{kidId}/ledger. Totals alone can't answer
// "when did I earn these, and what was I doing?" — this can.
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, authReady } from './firebase.js'

// Enough to cover months of sessions without pulling down a whole
// history onto a phone.
export const LEDGER_LIMIT = 100

export function ledgerCollection(familyCode, kidId) {
  return collection(db, 'families', familyCode, 'kids', kidId, 'ledger')
}

export function newLedgerEntry(familyCode, kidId) {
  return doc(ledgerCollection(familyCode, kidId))
}

// `manual` marks stars a grown-up added by hand rather than ones a
// finished session paid out — worth telling apart when reading the log
// back, so "where did these 20 come from?" has an answer.
export function earnedEntry({ stars, activityId, minutes, manual, note }) {
  return {
    kind: 'earned',
    stars,
    activityId: activityId ?? null,
    minutes: minutes ?? null,
    manual: Boolean(manual),
    note: note || null,
    at: serverTimestamp(),
  }
}

export function spentEntry({ stars, rewardLabel, rewardEmoji }) {
  return {
    kind: 'spent',
    stars,
    rewardLabel: rewardLabel ?? null,
    rewardEmoji: rewardEmoji ?? null,
    at: serverTimestamp(),
  }
}

// A just-written entry arrives locally before the server stamps it, so
// `at` is briefly null. Treating that as "now" keeps it at the top of
// the log instead of falling to the bottom for a moment.
export function entryFromDoc(snapshotDoc, now = Date.now()) {
  const data = snapshotDoc.data()
  return { id: snapshotDoc.id, ...data, atMs: data.at?.toMillis?.() ?? now }
}

export function watchLedger(familyCode, kidId, onChange, onError) {
  let unsubscribe = () => {}
  authReady
    .then(() => {
      unsubscribe = onSnapshot(
        query(ledgerCollection(familyCode, kidId), orderBy('at', 'desc'), limit(LEDGER_LIMIT)),
        snap => onChange(snap.docs.map(d => entryFromDoc(d))),
        onError,
      )
    })
    .catch(onError)
  return () => unsubscribe()
}

// Writes an entry on its own — used when stars are added outside a
// transaction that's already writing one.
export async function logEarned(familyCode, kidId, entry) {
  await authReady
  const batch = writeBatch(db)
  batch.set(newLedgerEntry(familyCode, kidId), earnedEntry(entry))
  await batch.commit()
}

function startOfDay(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// Buckets the log into days, newest first, so it reads as "today,
// yesterday, last Tuesday" rather than one long undifferentiated list.
// `daysAgo` lets the caller label each bucket in either language.
export function groupByDay(entries, now = Date.now()) {
  const today = startOfDay(now)
  const days = []
  for (const entry of [...entries].sort((a, b) => b.atMs - a.atMs)) {
    const day = startOfDay(entry.atMs)
    let group = days[days.length - 1]
    if (!group || group.day !== day) {
      // Day boundaries, not 24-hour blocks: rounding absorbs the hour a
      // daylight-saving change adds or removes.
      group = { day, daysAgo: Math.round((today - day) / 86400000), entries: [] }
      days.push(group)
    }
    group.entries.push(entry)
  }
  return days
}

// Running totals for the log's header.
export function ledgerTotals(entries) {
  return entries.reduce(
    (acc, e) => {
      if (e.kind === 'spent') acc.spent += e.stars
      else acc.earned += e.stars
      return acc
    },
    { earned: 0, spent: 0 },
  )
}
