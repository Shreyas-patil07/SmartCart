/**
 * hooks/useAuth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in extension of the base useAuth from AuthContext.
 *
 * Adds on top of the context values:
 *   providers   : string[]  — IDs of every linked provider ('password', 'google.com')
 *   hasPassword : boolean
 *   hasGoogle   : boolean
 *   rawUser     : raw Firebase User (kept for back-compat; same as rawFirebaseUser)
 *
 * Because AuthContext already derives `providers` from rawFirebaseUser in the
 * same onAuthStateChanged callback, these values are always reactive.
 *
 * Usage (replaces the old context import everywhere):
 *   import { useAuth } from '../hooks/useAuth'
 */

import { useAuth as useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const ctx = useAuthContext()

  // AuthContext now exposes providers[] and rawFirebaseUser directly
  const providers    = ctx.providers ?? []
  const hasPassword  = providers.includes('password')
  const hasGoogle    = providers.includes('google.com')

  return {
    ...ctx,
    rawUser: ctx.rawFirebaseUser,   // convenience alias
    providers,
    hasPassword,
    hasGoogle,
  }
}
