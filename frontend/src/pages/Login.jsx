/**
 * pages/Login.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Login page — delegates ALL auth operations to AuthUI / authService.
 * This component only handles navigation and page-level layout.
 */

import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppBar from '../components/AppBar.jsx'
import { LoginForm } from '../components/AuthUI.jsx'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isAuthenticated } = useAuth()

  // Where to redirect after successful login
  const redirectTo = location.state?.from || '/confirm-store'

  // Already authenticated → skip the form
  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  function handleSuccess(/* firebaseUser */) {
    navigate(redirectTo, { replace: true })
  }

  const LockIcon = (
    <span className="material-symbols-outlined text-on-surface-variant/40">shield_lock</span>
  )

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <AppBar rightSlot={LockIcon} />

      <main className="flex-grow flex flex-col max-w-md mx-auto w-full px-6 py-10">
        {/* Heading */}
        <div className="mb-10">
          <h2 className="text-[2.75rem] leading-tight font-black tracking-tight text-on-surface mb-2">
            Welcome back.
          </h2>
          <p className="text-on-surface-variant font-medium">
            Experience the invisible concierge at your fingertips.
          </p>
        </div>

        {/* All auth logic lives inside LoginForm */}
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchMode={() => navigate('/signup')}
        />

        {/* Privacy note */}
        <div className="mt-8 p-5 bg-surface-container-low rounded-2xl relative overflow-hidden">
          <p className="text-[11px] font-black text-on-surface uppercase tracking-widest mb-1">Privacy First</p>
          <p className="text-xs text-on-surface-variant leading-relaxed relative z-10">
            Your data is encrypted using banking-grade security. We never share your shopping habits.
          </p>
          <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-[80px] opacity-5">shield</span>
        </div>
      </main>
    </div>
  )
}
