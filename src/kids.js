// Kid profiles and their Star Jar totals, stored under
// families/{familyCode}/kids/{kidId} in Firestore.
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db, authReady } from './firebase.js'

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
          const kids = snap.docs.map(d => ({ id: d.id, totalStars: 0, ...d.data() }))
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
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function addStars(familyCode, kidId, amount) {
  await authReady
  const ref = doc(db, 'families', familyCode, 'kids', kidId)
  await updateDoc(ref, { totalStars: increment(amount) })
}

export async function updateKidAvatar(familyCode, kidId, avatar) {
  await authReady
  const ref = doc(db, 'families', familyCode, 'kids', kidId)
  await updateDoc(ref, { avatar })
}
