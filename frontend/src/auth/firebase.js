/**
 * auth/firebase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports the shared Firebase auth & db instances plus a scoped Google
 * provider that requests the user's email address.
 *
 * Import from here (not lib/firebase.js) when working in the auth layer.
 */
import { auth, db } from '../lib/firebase'
import { GoogleAuthProvider } from 'firebase/auth'

// Scoped provider — requests email so we can trust provider.email
export const googleAuthProvider = new GoogleAuthProvider()
googleAuthProvider.addScope('email')
googleAuthProvider.addScope('profile')

export { auth, db }
