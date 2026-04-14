/**
 * pages/SignUp.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Sign-up page — delegates ALL auth operations to AuthUI / authService.
 * This component only handles navigation and page-level layout.
 */

import { useNavigate } from 'react-router-dom'
import AppBar from '../components/AppBar.jsx'
import { SignupForm } from '../components/AuthUI.jsx'

export default function SignUp() {
  const navigate = useNavigate()

  function handleSuccess(/* firebaseUser */) {
    navigate('/confirm-store', { replace: true })
  }

  const LockIcon = (
    <span className="material-symbols-outlined text-on-surface-variant/40">lock</span>
  )

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <AppBar rightSlot={LockIcon} />

      <main className="flex-grow flex flex-col px-8 pt-10 pb-16 max-w-md mx-auto w-full">
        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-[2.75rem] leading-tight font-black tracking-tight text-on-surface mb-2">
            Create Account
          </h1>
          <p className="text-on-surface-variant font-medium">
            Your privacy is our priority. No tracking, just seamless shopping.
          </p>
        </div>

        {/* All auth logic lives inside SignupForm */}
        <SignupForm
          onSuccess={handleSuccess}
          onSwitchMode={() => navigate('/login')}
        />
      </main>

      <footer className="px-8 pb-10 max-w-md mx-auto w-full">
        <div className="border-t border-surface-container-low pt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-sm">verified</span>
            <p className="text-[10px] font-bold uppercase tracking-widest">AES-256 Encrypted</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
