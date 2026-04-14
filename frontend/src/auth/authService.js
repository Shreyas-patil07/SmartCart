/**
 * auth/authService.js
 * ─────────────────────────────────────────────────────────────────────────
 * ALL Firebase Auth operations live here.
 *
 * Design goals:
 *  - One user = one UID, multiple linked providers
 *  - Never create duplicate accounts for the same email
 *  - Handle auth/account-exists-with-different-credential gracefully
 *
 * Every exported function returns { user } on success, or throws an
 * enriched Error with a `.friendlyMessage` string ready to display.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
  linkWithPopup,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  updateProfile,
  signOut,
  deleteUser,
  OAuthProvider,
  GoogleAuthProvider,
  getAdditionalUserInfo,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleAuthProvider } from './firebase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map Firebase error codes → user-friendly messages.
 * Returns a generic fallback for unknown codes.
 */
export function toFriendlyError(code, fallback = 'Something went wrong. Please try again.') {
  const map = {
    'auth/user-not-found':                        'No account found with this email.',
    'auth/wrong-password':                        'Incorrect password.',
    'auth/invalid-credential':                    'Incorrect email or password.',
    'auth/email-already-in-use':                  'An account with this email already exists.',
    'auth/weak-password':                         'Password must be at least 6 characters.',
    'auth/invalid-email':                         'Please enter a valid email address.',
    'auth/popup-closed-by-user':                  '',           // user cancelled — no error to show
    'auth/popup-blocked':                         'Browser blocked the popup. Please allow popups and try again.',
    'auth/unauthorized-domain':                   'This domain is not authorized for Google sign-in in Firebase. Add your ngrok domain in Firebase Console > Authentication > Settings > Authorized domains.',
    'auth/operation-not-supported-in-this-environment':
      'Google popup sign-in is not supported in this browser/environment. Try Chrome or use email/password sign-in.',
    'auth/too-many-requests':                     'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':                'Network error. Check your connection and try again.',
    'auth/user-disabled':                         'This account has been disabled. Contact support.',
    'auth/requires-recent-login':                 'Please log out and log back in to perform this action.',
    'auth/provider-already-linked':               'This provider is already linked to your account.',
    'auth/credential-already-in-use':             'This credential is already linked to a different account.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email under a different sign-in method.',
  }
  return map[code] ?? fallback
}

/**
 * Ensure a Firestore user document exists.
 * - Uses merge:true so existing fields are never wiped.
 * - createdAt is only written on first creation — never overwritten on re-login.
 */
async function upsertFirestoreUser(user, extra = {}) {
  const ref  = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)

  const writeData = {
    name:  extra.name  || user.displayName || 'SmartCart User',
    email: user.email  || '',
    phone: extra.phone || '',
  }

  // Only stamp createdAt once — never overwrite on subsequent logins
  if (!snap.exists()) {
    writeData.createdAt = serverTimestamp()
  }

  await setDoc(ref, writeData, { merge: true })
}

/** Fetch Firestore profile; returns null if not found. */
export async function fetchFirestoreProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

/**
 * Returns a list of provider IDs currently linked to the authenticated user.
 * Examples: ['password', 'google.com']
 */
export function getLinkedProviders(firebaseUser) {
  if (!firebaseUser) return []
  return firebaseUser.providerData.map((p) => p.providerId)
}

/** Returns true if the user already has a given provider linked. */
export function hasProvider(firebaseUser, providerId) {
  return getLinkedProviders(firebaseUser).includes(providerId)
}

// ─── Sign-Up ─────────────────────────────────────────────────────────────────

/**
 * Create a new account with email + password.
 * Also writes a Firestore user document.
 *
 * @param {string} email
 * @param {string} password
 * @param {{ fullName?: string, phone?: string }} profile
 * @returns {{ user: import('firebase/auth').User }}
 */
export async function signUpWithEmail(email, password, profile = {}) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    if (profile.fullName) {
      await updateProfile(user, { displayName: profile.fullName })
    }

    await upsertFirestoreUser(user, {
      name:  profile.fullName || '',
      phone: profile.phone   || '',
    })

    return { user }
  } catch (err) {
    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    throw enhanced
  }
}

// ─── Sign-In ─────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * @returns {{ user }}
 */
export async function signInWithEmail(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return { user }
  } catch (err) {
    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    throw enhanced
  }
}

/**
 * Sign in (or up) with Google popup.
 *
 * Proactive linking strategy:
 *  1. Do the Google popup sign-in normally.
 *  2. If Firebase says it's a NEW Google user but the email is already
 *     registered under email/password, Firebase silently created a 2nd
 *     account. We detect this via fetchSignInMethodsForEmail and throw a
 *     structured LINK_REQUIRED error so the UI can ask for the password
 *     and merge the accounts.
 *  3. If it's a genuine new user or an existing Google user — proceed.
 *
 * @returns {{ user, isNewUser }}
 */
export async function signInWithGoogle() {
  let googleUser = null
  let googleCredential = null

  try {
    const result = await signInWithPopup(auth, googleAuthProvider)
    googleUser = result.user
    googleCredential = GoogleAuthProvider.credentialFromResult(result)
    const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false

    if (isNewUser && googleUser.email) {
      // Check if this email is already registered with email/password
      let existingMethods = []
      try {
        existingMethods = await fetchSignInMethodsForEmail(auth, googleUser.email)
      } catch {
        // fetchSignInMethodsForEmail may be disabled (email enumeration protection).
        // Fall through — can't proactively detect, conflict banner will catch it.
      }

      if (existingMethods.includes('password')) {
        // A password account exists for this email.
        // Delete the phantom Google account Firebase just created, then
        // throw a structured error so the UI can ask for the password and link.
        try { await deleteUser(googleUser) } catch { /* already gone or no perms */ }
        await signOut(auth)

        const err = new Error(
          'An account with this email already exists. Enter your password to link Google sign-in.'
        )
        err.code = 'auth/link-required'
        err.friendlyMessage = err.message
        err.email = googleUser.email
        err.pendingGoogleCredential = googleCredential
        throw err
      }
    }

    // Normal path — new genuine Google user OR existing Google user returning
    await upsertFirestoreUser(googleUser)
    return { user: googleUser, isNewUser }

  } catch (err) {
    // Re-throw our own structured errors as-is
    if (err.code === 'auth/link-required') throw err

    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    enhanced.credential = GoogleAuthProvider.credentialFromError(err) ?? null
    enhanced.email = err.customData?.email ?? null
    throw enhanced
  }
}

/**
 * Called after user provides their password to merge accounts.
 * Signs in with email+password (original UID), links Google credential,
 * and returns the unified user.
 *
 * @param {string} email
 * @param {string} password
 * @param {import('firebase/auth').OAuthCredential} pendingGoogleCredential
 * @returns {{ user }}
 */
export async function linkGoogleToExistingEmailAccount(email, password, pendingGoogleCredential) {
  try {
    // Sign in with the original email/password account (gets the original UID)
    const { user } = await signInWithEmailAndPassword(auth, email, password)

    // Link the Google credential to that UID
    if (pendingGoogleCredential) {
      await linkWithCredential(user, pendingGoogleCredential)
    }

    // Reload so providerData reflects both providers
    await user.reload()
    return { user: auth.currentUser }
  } catch (err) {
    // auth/provider-already-linked = already merged, treat as success
    if (err.code === 'auth/provider-already-linked' ||
        err.code === 'auth/credential-already-in-use') {
      return { user: auth.currentUser }
    }
    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    throw enhanced
  }
}

// ─── Account Linking ─────────────────────────────────────────────────────────

/**
 * Link an Email/Password credential to an already-authenticated user.
 * Use this when a Google-only user wants to set a password.
 *
 * @param {import('firebase/auth').User} firebaseUser  — must be signed in
 * @param {string} email
 * @param {string} password
 * @returns {{ user }}
 */
export async function linkEmailPassword(firebaseUser, email, password) {
  if (!firebaseUser) throw new Error('User must be signed in before linking.')

  if (hasProvider(firebaseUser, 'password')) {
    const err = new Error('Email/Password provider is already linked.')
    err.code = 'auth/provider-already-linked'
    err.friendlyMessage = toFriendlyError('auth/provider-already-linked')
    throw err
  }

  try {
    const credential = EmailAuthProvider.credential(email, password)
    const { user } = await linkWithCredential(firebaseUser, credential)
    return { user }
  } catch (err) {
    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    throw enhanced
  }
}

/**
 * Link Google provider to an already-authenticated user.
 * Use this when an Email/Password user wants to connect Google.
 *
 * @param {import('firebase/auth').User} firebaseUser — must be signed in
 * @returns {{ user }}
 */
export async function linkGoogle(firebaseUser) {
  if (!firebaseUser) throw new Error('User must be signed in before linking.')

  if (hasProvider(firebaseUser, 'google.com')) {
    const err = new Error('Google provider is already linked.')
    err.code = 'auth/provider-already-linked'
    err.friendlyMessage = toFriendlyError('auth/provider-already-linked')
    throw err
  }

  try {
    const { user } = await linkWithPopup(firebaseUser, googleAuthProvider)
    return { user }
  } catch (err) {
    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    // Same fix as signInWithGoogle: must use GoogleAuthProvider for Google errors
    enhanced.credential = GoogleAuthProvider.credentialFromError(err) ?? null
    enhanced.email = err.customData?.email ?? null
    throw enhanced
  }
}

/**
 * Link a pending OAuthCredential to a user AFTER they have authenticated
 * with their existing method (conflict resolution step 3).
 *
 * @param {import('firebase/auth').User} firebaseUser — freshly authenticated
 * @param {import('firebase/auth').OAuthCredential} pendingCredential
 * @returns {{ user }}
 */
export async function linkPendingCredential(firebaseUser, pendingCredential) {
  if (!firebaseUser || !pendingCredential) {
    throw new Error('Both user and pending credential are required.')
  }

  try {
    const { user } = await linkWithCredential(firebaseUser, pendingCredential)
    return { user }
  } catch (err) {
    // auth/provider-already-linked is safe to ignore here — the accounts
    // are effectively unified; treat as success.
    if (err.code === 'auth/provider-already-linked' ||
        err.code === 'auth/credential-already-in-use') {
      return { user: firebaseUser }
    }
    const msg = toFriendlyError(err.code)
    const enhanced = new Error(msg || err.message)
    enhanced.code = err.code
    enhanced.friendlyMessage = msg
    throw enhanced
  }
}

// ─── Conflict Resolution ─────────────────────────────────────────────────────

/**
 * Resolve auth/account-exists-with-different-credential.
 *
 * Flow:
 *   1. Extract email from error
 *   2. fetchSignInMethodsForEmail → find existing method(s)
 *   3. Return info so UI can ask the user to sign-in with the existing method
 *   4. After successful sign-in, call linkPendingCredential
 *
 * @param {Error} err — the original Firebase error
 * @returns {{ email: string|null, methods: string[], pendingCredential: import('firebase/auth').OAuthCredential|null }}
 */
export async function resolveAccountConflict(err) {
  const email = err.customData?.email ?? err.email ?? null

  // Try Google-specific extraction first, then generic OAuth.
  // OAuthProvider.credentialFromError alone returns null for Google errors.
  const pendingCredential =
    GoogleAuthProvider.credentialFromError(err) ??
    OAuthProvider.credentialFromError(err) ??
    null

  let methods = []
  if (email) {
    try {
      // fetchSignInMethodsForEmail is deprecated in newer Firebase projects that
      // have "Email enumeration protection" enabled. It will throw
      // auth/operation-not-allowed in that case. We soft-fail and let the UI
      // fall back to showing both sign-in options (see ConflictBanner fallback).
      methods = await fetchSignInMethodsForEmail(auth, email)
    } catch {
      // Soft fail — ConflictBanner handles empty methods gracefully
    }
  }

  return { email, methods, pendingCredential }
}

// ─── Sign-Out ─────────────────────────────────────────────────────────────────

export async function logOut() {
  await signOut(auth)
}
