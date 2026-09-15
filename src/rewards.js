// What stars are actually for. Rewards live per-family in Firestore
// under families/{familyCode}/rewards so every device sees the same
// list, and every family can set its own — "go to Grandma's" isn't
// something this app could have guessed.
import {
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, authReady } from './firebase.js'

// A starting point, so a new family sees something usable rather than
// an empty screen. Seeded once and then entirely theirs to change.
// Fixed ids keep seeding idempotent if two devices try at once.
export const DEFAULT_REWARDS = [
  { id: 'starter-screen', emoji: '📺', cost: 30, label: { zh: '30 分鐘螢幕時間', en: '30 min screen time' } },
  { id: 'starter-dinner', emoji: '🍜', cost: 50, label: { zh: '今晚我選晚餐', en: 'I pick dinner' } },
  { id: 'starter-park', emoji: '🛝', cost: 100, label: { zh: '去公園玩', en: 'A trip to the park' } },
  { id: 'starter-toy', emoji: '🧸', cost: 200, label: { zh: '一個新玩具', en: 'A new toy' } },
]

export const MAX_REWARD_COST = 9999
export const MAX_REWARD_NAME = 40

function rewardsCollection(familyCode) {
  return collection(db, 'families', familyCode, 'rewards')
}

export function watchRewards(familyCode, onChange, onError) {
  let unsubscribe = () => {}
  authReady
    .then(() => {
      unsubscribe = onSnapshot(
        query(rewardsCollection(familyCode), orderBy('cost')),
        snap => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        onError,
      )
    })
    .catch(onError)
  return () => unsubscribe()
}

// Puts the starters in place the first time a family opens the rewards
// screen. The flag on the family document means a family that clears
// the list on purpose doesn't get them back.
export async function seedDefaultRewards(familyCode) {
  await authReady
  const familyRef = doc(db, 'families', familyCode)
  const snap = await getDoc(familyRef)
  if (snap.exists() && snap.data().rewardsSeeded) return false

  const batch = writeBatch(db)
  DEFAULT_REWARDS.forEach(({ id, ...reward }) => {
    batch.set(doc(db, 'families', familyCode, 'rewards', id), { ...reward, createdAt: serverTimestamp() })
  })
  batch.set(familyRef, { rewardsSeeded: true }, { merge: true })
  await batch.commit()
  return true
}

export async function addReward(familyCode, { label, emoji, cost }) {
  await authReady
  await addDoc(rewardsCollection(familyCode), {
    label,
    emoji: emoji || '🎁',
    cost,
    createdAt: serverTimestamp(),
  })
}

export async function removeReward(familyCode, rewardId) {
  await authReady
  await deleteDoc(doc(db, 'families', familyCode, 'rewards', rewardId))
}

// A starter's label is written in both languages; one a family typed is
// whatever they typed, in whichever language they typed it.
export function isBilingualLabel(label) {
  return Boolean(label) && typeof label === 'object'
}

// What a typed name and cost have to satisfy before the form will save.
// Pure, so the rules are checked without a form or a network.
export function validateReward({ name, cost }) {
  const trimmed = (name ?? '').trim()
  const stars = Number(cost)
  if (!trimmed) return { ok: false, reason: 'name-missing' }
  if (trimmed.length > MAX_REWARD_NAME) return { ok: false, reason: 'name-too-long' }
  if (!Number.isInteger(stars) || stars <= 0) return { ok: false, reason: 'cost-invalid' }
  if (stars > MAX_REWARD_COST) return { ok: false, reason: 'cost-too-big' }
  return { ok: true, value: { label: trimmed, cost: stars } }
}
