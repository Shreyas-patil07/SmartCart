/**
 * context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase-backed authentication state for the entire app.
 *
 * Exposes via context:
 *   user            : { uid, name, email, phone } | null
 *   rawFirebaseUser : raw firebase/auth User object | null
 *   providers       : string[]   — e.g. ['password', 'google.com']
 *   isAuthenticated : boolean
 *   loading         : boolean    — true until Firebase first resolves auth state
 *   logout          : () => Promise<void>
 *   refreshUser     : () => Promise<void>
 *                     Call after linkWithCredential / linkWithPopup so the
 *                     context picks up the newly linked providerData.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [rawFirebaseUser, setRawFirebaseUser] = useState(null)
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── buildUser ────────────────────────────────────────────────────────────
  // Stable function (useCallback) so it can be a safe dependency in other hooks.
  const buildUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return null

    let name  = firebaseUser.displayName || 'SmartCart User'
    let phone = ''

    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (snap.exists()) {
        const data = snap.data()
        name  = data.name  || name
        phone = data.phone || ''
      }
    } catch {
      // Firestore read failed — fall back to Firebase Auth displayName
    }

    return {
      uid:   firebaseUser.uid,
      name,
      email: firebaseUser.email || '',
      phone,
    }
  }, []) // no external deps — safe stable reference

  // ─── onAuthStateChanged ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setRawFirebaseUser(firebaseUser || null)
      setUser(await buildUser(firebaseUser || null))
      setLoading(false)
    })
    return unsubscribe
  }, [buildUser])

  // ─── refreshUser ─────────────────────────────────────────────────────────
  /**
   * Call this after any linkWithCredential / linkWithPopup call.
   *
   * onAuthStateChanged does NOT fire when a provider is linked — only on
   * actual sign-in / sign-out events. So we manually:
   *  1. Call user.reload() to refresh providerData from Firebase servers
   *  2. Re-read auth.currentUser (new object reference post-reload)
   *  3. Push both rawFirebaseUser + enriched user into React state
   */
  const refreshUser = useCallback(async () => {
    const current = auth.currentUser
    if (!current) return

    try {
      // Reload forces Firebase to fetch fresh providerData from the server
      await current.reload()
    } catch {
      // Network error on reload — skip silently; state will be stale but safe
    }

    // auth.currentUser is a fresh reference after reload
    const fresh = auth.currentUser
    setRawFirebaseUser(fresh)
    setUser(await buildUser(fresh))
  }, [buildUser])

  // ─── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOut(auth)
    // onAuthStateChanged will set rawFirebaseUser + user → null automatically
  }, [])

  // ─── context value ────────────────────────────────────────────────────────
  // providers is derived INSIDE useMemo so it always reflects the latest
  // rawFirebaseUser — including after refreshUser() updates it.
  const value = useMemo(
    () => ({
      user,
      rawFirebaseUser,
      providers:       rawFirebaseUser?.providerData?.map((p) => p.providerId) ?? [],
      isAuthenticated: !!user,
      loading,
      logout,
      refreshUser,
    }),
    [user, rawFirebaseUser, loading, logout, refreshUser],
  )

  // Block render until Firebase resolves initial auth state so protected
  // routes don't flash to /login on a hard refresh.
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
