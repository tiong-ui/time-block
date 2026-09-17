// What kids can tag a focus session with. Optional — the timer works
// fine with none selected.
//
// The list is the family's, kept in Firestore alongside the rewards, so
// a household that does violin and 圍棋 rather than piano and drawing
// can say so. Seeded once with a sensible set and then theirs.
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, authReady } from './firebase.js'

export const ACTIVITY_STORAGE_KEY = 'focus-timer-last-activity'
export const MAX_ACTIVITY_NAME = 20

// HIIT is not a tag like the others: picking it runs the timer as
// work/rest intervals. That behaviour lives in code, so the entry that
// switches it on stays in code too — it can't be renamed away or
// deleted, and it's always offered last.
export const HIIT_ACTIVITY = {
  id: 'hiit',
  label: { zh: '間歇運動', en: 'HIIT' },
  emoji: '💪',
  intervals: true,
  builtIn: true,
}

// The starting set, matching what the app shipped with.
export const DEFAULT_ACTIVITIES = [
  { id: 'starter-homework', label: { zh: '作業', en: 'Homework' }, emoji: '📝' },
  { id: 'starter-reading', label: { zh: '閱讀', en: 'Reading' }, emoji: '📚' },
  { id: 'starter-piano', label: { zh: '鋼琴', en: 'Piano' }, emoji: '🎹' },
  { id: 'starter-drawing', label: { zh: '畫畫', en: 'Drawing' }, emoji: '🎨' },
  { id: 'starter-tidy', label: { zh: '整理房間', en: 'Tidy Up' }, emoji: '🧹' },
  { id: 'starter-mealtime', label: { zh: '吃飯', en: 'Mealtime' }, emoji: '🍽️' },
  { id: 'starter-quietplay', label: { zh: '安靜玩', en: 'Quiet Play' }, emoji: '🧩' },
]

// What a focus task can look like. Chosen to cover the usual homework,
// practice, chores and quiet-time without becoming an emoji keyboard.
export const ACTIVITY_EMOJI = [
  '📝', '📚', '🎹', '🎨', '🧹', '🧩',
  '🍽️', '🎻', '♟️', '🧮', '✏️', '🔬',
  '🌱', '🐕', '🧺', '🛏️', '🦷', '🧘',
]

export const DEFAULT_ACTIVITY_EMOJI = ACTIVITY_EMOJI[0]

function activitiesCollection(familyCode) {
  return collection(db, 'families', familyCode, 'activities')
}

// The family's own list, with HIIT appended. Callers get one list and
// don't have to remember that one of them is special.
export function withHiit(list) {
  return [...(list ?? []), HIIT_ACTIVITY]
}

export function watchActivities(familyCode, onChange, onError) {
  let unsubscribe = () => {}
  authReady
    .then(() => {
      unsubscribe = onSnapshot(
        query(activitiesCollection(familyCode), orderBy('createdAt')),
        snap => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        onError,
      )
    })
    .catch(onError)
  return () => unsubscribe()
}

// Puts the starters in place the first time a family looks. The flag on
// the family document means a family that clears the list on purpose
// doesn't get them back.
export async function seedDefaultActivities(familyCode) {
  await authReady
  const familyRef = doc(db, 'families', familyCode)
  const snap = await getDoc(familyRef)
  if (snap.exists() && snap.data().activitiesSeeded) return false

  const batch = writeBatch(db)
  DEFAULT_ACTIVITIES.forEach(({ id, ...activity }, index) => {
    batch.set(doc(db, 'families', familyCode, 'activities', id), {
      ...activity,
      // Spaced so the starters keep their order, and anything added
      // later lands after them.
      createdAt: index,
    })
  })
  batch.set(familyRef, { activitiesSeeded: true }, { merge: true })
  await batch.commit()
  return true
}

export async function addActivity(familyCode, { label, emoji }) {
  await authReady
  await addDoc(activitiesCollection(familyCode), {
    label,
    emoji: emoji || DEFAULT_ACTIVITY_EMOJI,
    createdAt: serverTimestamp(),
  })
}

export async function updateActivity(familyCode, activityId, { label, emoji }) {
  await authReady
  await updateDoc(doc(db, 'families', familyCode, 'activities', activityId), {
    label,
    emoji: emoji || DEFAULT_ACTIVITY_EMOJI,
  })
}

export async function removeActivity(familyCode, activityId) {
  await authReady
  await deleteDoc(doc(db, 'families', familyCode, 'activities', activityId))
}

export function isBilingualLabel(label) {
  return Boolean(label) && typeof label === 'object'
}

export function labelToText(label) {
  if (isBilingualLabel(label)) return label.zh
  return label ?? ''
}

// Renaming makes it the family's own words; leaving the name alone
// keeps whatever it had, both languages included.
export function editedLabel(original, typedName) {
  const trimmed = (typedName ?? '').trim()
  if (trimmed === labelToText(original)) return original
  return trimmed
}

export function emojiChoices(current) {
  return current && !ACTIVITY_EMOJI.includes(current) ? [current, ...ACTIVITY_EMOJI] : ACTIVITY_EMOJI
}

export function validateActivity({ name }) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return { ok: false, reason: 'name-missing' }
  if (trimmed.length > MAX_ACTIVITY_NAME) return { ok: false, reason: 'name-too-long' }
  return { ok: true, value: { label: trimmed } }
}
