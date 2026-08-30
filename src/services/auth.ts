import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { firebaseApp } from './firebase'

export const auth = getAuth(firebaseApp)

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOutUser() {
  return signOut(auth)
}

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/email-already-in-use': 'An account already exists with this email.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed':
    'Network error. Check your connection and try again.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
