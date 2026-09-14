// A "family code" links every device that knows it to the same set of
// kid profiles and sticker collections in Firestore. It's not real
// security — anyone with the code could join — but stickers aren't
// sensitive data, and this avoids building real accounts/passwords for
// a kids' app.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, authReady } from './firebase.js'

export const FAMILY_STORAGE_KEY = 'focus-timer-family-code'

const COLORS = ['Blue', 'Red', 'Green', 'Purple', 'Orange', 'Pink', 'Yellow', 'Teal']
const ANIMALS = ['Fox', 'Panda', 'Tiger', 'Otter', 'Eagle', 'Koala', 'Rabbit', 'Dolphin']

function randomCode() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const number = Math.floor(Math.random() * 90) + 10 // 10-99
  return `${color}-${animal}-${number}`.toUpperCase()
}

export function normalizeCode(code) {
  return code.trim().toUpperCase()
}

export function loadStoredFamilyCode() {
  try {
    return localStorage.getItem(FAMILY_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeFamilyCode(code) {
  try {
    localStorage.setItem(FAMILY_STORAGE_KEY, code)
  } catch {
    // Storage can be unavailable (private browsing); code just won't persist.
  }
}

// Generates a fresh, unused code and creates its Firestore document.
export async function createFamily() {
  await authReady
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const ref = doc(db, 'families', code)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { createdAt: serverTimestamp() })
      return code
    }
  }
  throw new Error('Could not generate a unique family code, please try again.')
}

// Returns true if the code exists, false otherwise. Throws on network error.
export async function familyExists(code) {
  await authReady
  const snap = await getDoc(doc(db, 'families', normalizeCode(code)))
  return snap.exists()
}
