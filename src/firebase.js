// Firebase setup for the family-code sticker sync. This config is meant
// to be public — it identifies the project, it isn't a secret — access
// is controlled by Firestore security rules instead. Analytics is
// intentionally not used: this is a kids' app, no reason to track usage.
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyACirvYpxr8hqsHnnuSCalCoxlAGKMkw00',
  authDomain: 'kids-focus-time-sticker.firebaseapp.com',
  projectId: 'kids-focus-time-sticker',
  storageBucket: 'kids-focus-time-sticker.firebasestorage.app',
  messagingSenderId: '975262674560',
  appId: '1:975262674560:web:78a7903b3d89ddb9b98065',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

const auth = getAuth(app)

// Every device signs in anonymously (silently, no UI) so Firestore's
// security rules have a `request.auth` to check against. Firestore
// calls should wait on this before reading/writing. Guarded with a
// timeout so a blocked/slow network fails fast with a clear error
// instead of leaving callers (and their loading spinners) hanging
// forever.
const AUTH_TIMEOUT_MS = 12000

export const authReady = new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    reject(new Error('Sign-in timed out — check your internet connection.'))
  }, AUTH_TIMEOUT_MS)

  const unsubscribe = onAuthStateChanged(auth, user => {
    if (user) {
      clearTimeout(timer)
      unsubscribe()
      resolve(user)
    }
  })

  signInAnonymously(auth).catch(err => {
    clearTimeout(timer)
    console.error('Anonymous sign-in failed:', err)
    reject(err)
  })
})
