import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, sendPasswordResetEmail,
         onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

// ─── ADMIN: Google OAuth ───────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function checkIsAdmin(user) {
  if (!user) return false
  const token = await user.getIdTokenResult(true)
  return !!token.claims.admin
}

// ─── CLIENTES: Email/Password ──────────────────────────
export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

// ─── COMÚN ─────────────────────────────────────────────
export function listenAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function logout() {
  return signOut(auth)
}
