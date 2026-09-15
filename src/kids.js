// Kid profiles and their Star Jar totals, stored under
// families/{familyCode}/kids/{kidId} in Firestore.
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  increment,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, authReady } from './firebase.js'
import { starBalance } from './stars.js'
import { earnedEntry, spentEntry, newLedgerEntry } from './ledger.js'

function kidsCollection(familyCode) {
  return collection(db, 'families', familyCode, 'kids')
}

// Live-subscribes to the kid list for a family. Calls `onChange` with
// an array of { id, name, avatar, totalStars } each time it updates,
// and returns an unsubscribe function.
export function watchKids(familyCode, onChange, onError) {
  let unsubscribe = () => {}
  authReady
    .then(() => {
      unsubscribe = onSnapshot(
        kidsCollection(familyCode),
        snap => {
          const kids = snap.docs.map(d => ({ id: d.id, totalStars: 0, starsSpent: 0, ...d.data() }))
          onChange(kids)
        },
        onError,
      )
    })
    .catch(onError)
  return () => unsubscribe()
}

export async function addKid(familyCode, { name, avatar }) {
  await authReady
  const ref = await addDoc(kidsCollection(familyCode), {
    name,
    avatar,
    totalStars: 0,
    starsSpent: 0,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// The total and the log entry go up together where they can, so the
// log doesn't disagree with the number a kid is looking at.
//
// But a batch is all-or-nothing, and that cuts the wrong way here: a
// ledger write the security rules reject takes the stars down with it,
// and a kid who finished a session loses them. The log is a nice thing
// to have; the stars are the whole point. So a failed batch falls back
// to writing the total on its own, and reports that the log entry
// didn't make it rather than pretending everything is fine.
export async function addStars(familyCode, kidId, amount, { activityId, minutes, manual, note } = {}) {
  await authReady
  const kidRef = doc(db, 'families', familyCode, 'kids', kidId)
  const entry = earnedEntry({ stars: amount, activityId, minutes, manual, note })

  return saveTotalEvenIfUnlogged(
    () => {
      const batch = writeBatch(db)
      batch.update(kidRef, { totalStars: increment(amount) })
      batch.set(newLedgerEntry(familyCode, kidId), entry)
      return batch.commit()
    },
    () => updateDoc(kidRef, { totalStars: increment(amount) }),
  )
}

// The rule the stars depend on, kept separate from Firestore so it can
// be tested without one: try to write both, fall back to the total
// alone, and only give up if even that fails.
export async function saveTotalEvenIfUnlogged(writeBoth, writeTotalOnly) {
  try {
    await writeBoth()
    return { logged: true }
  } catch (err) {
    console.error('Star ledger entry failed, saving the total on its own:', err)
    await writeTotalOnly()
    return { logged: false, logError: err }
  }
}

// Spending has to check the balance and deduct it as one indivisible
// step: two phones redeeming at the same moment must not both succeed
// against the same stars. A transaction re-reads and retries if the
// count moved underneath it.
export class NotEnoughStarsError extends Error {
  constructor(balance) {
    super('not-enough-stars')
    this.name = 'NotEnoughStarsError'
    this.balance = balance
  }
}

export async function redeemReward(familyCode, kidId, { cost, label, emoji }) {
  await authReady
  const kidRef = doc(db, 'families', familyCode, 'kids', kidId)
  await runTransaction(db, async tx => {
    const snap = await tx.get(kidRef)
    if (!snap.exists()) throw new Error('This kid no longer exists.')
    const { balance } = starBalance(snap.data())
    if (balance < cost) throw new NotEnoughStarsError(balance)
    tx.update(kidRef, { starsSpent: increment(cost) })
    tx.set(newLedgerEntry(familyCode, kidId), spentEntry({ stars: cost, rewardLabel: label, rewardEmoji: emoji }))
  })
}

export async function updateKidAvatar(familyCode, kidId, avatar) {
  await authReady
  const ref = doc(db, 'families', familyCode, 'kids', kidId)
  await updateDoc(ref, { avatar })
}
