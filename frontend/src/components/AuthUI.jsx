/**
 * components/AuthUI.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable auth UI component that covers every flow in the spec:
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  mode="login"    — email+password sign-in  +  Google sign-in           │
 *  │  mode="signup"   — email+password sign-up  +  Google sign-up           │
 *  │  mode="link"     — (authenticated) link panel: set password OR         │
 *  │                    connect Google, with conflict resolution             │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * Conflict resolution (auth/account-exists-with-different-credential):
 *  • When triggered during login/signup this component shows an inline banner
 *    with the existing-method info and the correct action button.
 *  • The caller only needs to handle `onSuccess(user)`.
 *
 * Props:
 *   mode           : 'login' | 'signup' | 'link'
 *   onSuccess      : (user: FirebaseUser) => void
 *   onSwitchMode   : (newMode: 'login' | 'signup') => void   (optional)
 *   className      : string  (optional outer wrapper class)
 */

import { useState } from 'react'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  linkEmailPassword,
  linkGoogle,
  linkPendingCredential,
  linkGoogleToExistingEmailAccount,
  resolveAccountConflict,
  toFriendlyError,
} from '../auth/authService'
import { auth } from '../auth/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useAuth } from '../hooks/useAuth'

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoogleButton({ onClick, loading, label = 'Continue with Google' }) {
  return (
    <button
      type="button"
      id="btn-google-auth"
      onClick={onClick}
      disabled={loading}
      className="w-full h-14 bg-surface-container-lowest font-semibold rounded-xl ring-1 ring-surface-container-highest flex items-center justify-center gap-3 hover:bg-surface-container-low transition-colors disabled:opacity-60"
    >
      <GoogleLogo />
      {label}
    </button>
  )
}

function GoogleLogo() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function PasswordInput({ id, label, value, onChange, autoComplete, placeholder = '••••••••', hint }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">lock</span>
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-14 pl-12 pr-12 bg-surface-container-lowest rounded-xl text-base font-medium ring-1 ring-inset ring-surface-container-highest focus:ring-2 focus:ring-primary transition-all outline-none placeholder:text-outline-variant"
        />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-4 flex items-center text-outline-variant hover:text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">{show ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
      {hint && <p className="text-xs text-on-surface-variant/70 px-1">{hint}</p>}
    </div>
  )
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="p-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-sm font-semibold">
      {message}
    </div>
  )
}

function SuccessBanner({ message }) {
  if (!message) return null
  return (
    <div role="status" className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">check_circle</span>
      {message}
    </div>
  )
}

function Divider({ label = 'or' }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-surface-container-highest" />
      <span className="flex-shrink mx-4 text-[11px] font-bold text-outline uppercase tracking-widest">{label}</span>
      <div className="flex-grow border-t border-surface-container-highest" />
    </div>
  )
}

// ─── Link Required Banner ─────────────────────────────────────────────────────

/**
 * Shows when auth/link-required fires — i.e. user clicked "Continue with Google"
 * but has an existing email/password account with that email.
 * They enter their password → we sign into the original account → link Google.
 */
function LinkRequiredBanner({ email, pendingGoogleCredential, onResolved, onDismiss }) {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLink(e) {
    e.preventDefault()
    if (!password) return
    setError('')
    setLoading(true)
    try {
      const { user } = await linkGoogleToExistingEmailAccount(email, password, pendingGoogleCredential)
      onResolved(user)
    } catch (err) {
      setError(err.friendlyMessage || 'Incorrect password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0 mt-0.5">link</span>
        <div>
          <p className="text-sm font-bold text-blue-800">Link your Google account</p>
          <p className="text-xs text-blue-700 mt-0.5">
            <strong>{email}</strong> is already registered with email &amp; password.
            Enter your password to connect Google sign-in to the same account.
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleLink} className="space-y-3">
        <PasswordInput
          id="link-required-password"
          label="Your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          id="btn-link-required-submit"
          type="submit"
          disabled={loading || !password}
          className="w-full h-12 bg-primary text-on-primary font-bold text-sm rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">link</span>
          {loading ? 'Linking…' : 'Confirm & Link Google'}
        </button>
      </form>

      <button
        type="button"
        onClick={onDismiss}
        className="w-full text-xs text-blue-700 hover:underline py-1"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Conflict Resolution Banner ───────────────────────────────────────────────

/**
 * Shows when auth/account-exists-with-different-credential happens.
 * Tells the user which method to use and offers the right button.
 */
function ConflictBanner({ email, methods, pendingCredential, onResolved, onDismiss }) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [password, setPassword] = useState('')

  const hasEmail  = methods.includes('password')
  const hasGoogle = methods.includes('google.com')

  // If fetchSignInMethodsForEmail failed (deprecated / email-enumeration protection
  // enabled in Firebase console), methods will be []. In that case we can't know
  // which provider the account uses, so we offer BOTH options — whichever succeeds
  // will merge the credentials. This is the recommended secure fallback.
  const unknownMethod = methods.length === 0
  const showGoogle    = hasGoogle || unknownMethod
  const showEmail     = hasEmail  || unknownMethod

  async function resolveViaGoogle() {
    setError('')
    setLoading(true)
    try {
      const { user } = await signInWithGoogle()
      if (pendingCredential) {
        await linkPendingCredential(user, pendingCredential)
      }
      onResolved(user)
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') { /* noop */ }
      else setError(err.friendlyMessage || 'Failed to sign in with Google.')
    } finally {
      setLoading(false)
    }
  }

  async function resolveViaEmail(e) {
    e.preventDefault()
    if (!password) return
    setError('')
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      if (pendingCredential) {
        await linkPendingCredential(result.user, pendingCredential)
      }
      onResolved(result.user)
    } catch (err) {
      setError(toFriendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">warning</span>
        <div>
          <p className="text-sm font-bold text-amber-800">Account already exists</p>
          <p className="text-xs text-amber-700 mt-0.5">
            {email && <><strong>{email}</strong>{' '}is already registered. </>}
            {unknownMethod
              ? 'Please sign in with your existing method below to link both sign-in options.'
              : <>It uses{' '}
                  {hasGoogle && !hasEmail ? 'Google' : null}
                  {hasEmail  && !hasGoogle ? 'Email & Password' : null}
                  {hasEmail  && hasGoogle  ? 'Email & Password and Google' : null}.
                  {' '}Sign in using that method to link your accounts.
                </>
            }
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {showGoogle && (
        <button
          id="btn-conflict-google"
          type="button"
          onClick={resolveViaGoogle}
          disabled={loading}
          className="w-full h-12 bg-white border border-gray-200 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <GoogleLogo />
          {loading ? 'Signing in…' : 'Continue with Google to link'}
        </button>
      )}

      {showEmail && (
        <form onSubmit={resolveViaEmail} className="space-y-3">
          {unknownMethod && showGoogle && <Divider label="or" />}
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
            Login with Email to link
          </p>
          <PasswordInput
            id="conflict-password"
            label="Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            id="btn-conflict-email"
            type="submit"
            disabled={loading || !password}
            className="w-full h-12 bg-primary text-on-primary font-bold text-sm rounded-xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? 'Linking…' : 'Login with Email'}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="w-full text-xs text-amber-700 hover:underline py-1"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitchMode }) {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [conflict,     setConflict]     = useState(null)   // { email, methods, pendingCredential }
  const [linkRequired, setLinkRequired] = useState(null)   // { email, pendingGoogleCredential }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setConflict(null)
    setLoading(true)
    try {
      const { user } = await signInWithEmail(email, password)
      onSuccess(user)
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        const info = await resolveAccountConflict(err)
        setConflict(info)
      } else {
        setError(err.friendlyMessage || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setConflict(null)
    setLinkRequired(null)
    setLoading(true)
    try {
      const { user } = await signInWithGoogle()
      onSuccess(user)
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') { /* noop */ }
      else if (err.code === 'auth/link-required') {
        setLinkRequired({ email: err.email, pendingGoogleCredential: err.pendingGoogleCredential })
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const info = await resolveAccountConflict(err)
        setConflict(info)
      } else {
        setError(err.friendlyMessage || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (linkRequired) {
    return (
      <LinkRequiredBanner
        email={linkRequired.email}
        pendingGoogleCredential={linkRequired.pendingGoogleCredential}
        onResolved={(user) => { setLinkRequired(null); onSuccess(user) }}
        onDismiss={() => setLinkRequired(null)}
      />
    )
  }

  if (conflict) {
    return (
      <ConflictBanner
        email={conflict.email}
        methods={conflict.methods}
        pendingCredential={conflict.pendingCredential}
        onResolved={(user) => { setConflict(null); onSuccess(user) }}
        onDismiss={() => setConflict(null)}
      />
    )
  }

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />

      <form onSubmit={handleEmail} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc@gmail.com"
              className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest rounded-xl text-base font-medium ring-1 ring-inset ring-surface-container-highest focus:ring-2 focus:ring-primary transition-all outline-none placeholder:text-outline-variant"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          id="btn-login-email"
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold text-base rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Login with Email'}
          <span className="material-symbols-outlined text-[18px]">login</span>
        </button>
      </form>

      <Divider label="or continue with" />
      <GoogleButton onClick={handleGoogle} loading={loading} />

      {onSwitchMode && (
        <p className="text-center text-sm text-on-surface-variant">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onSwitchMode('signup')}
            className="text-primary font-bold hover:underline"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  )
}

// ─── Signup Form ──────────────────────────────────────────────────────────────

function SignupForm({ onSuccess, onSwitchMode }) {
  const [step,     setStep]     = useState(1)   // 1 = name+email, 2 = password
  const [email,    setEmail]    = useState('')
  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [conflict,     setConflict]     = useState(null)
  const [linkRequired, setLinkRequired] = useState(null)   // { email, pendingGoogleCredential }

  const passwordsMatch = password && password === confirm
  const canSubmit = password.length >= 6 && passwordsMatch

  async function handleEmailSignup() {
    setError('')
    setConflict(null)
    setLoading(true)
    try {
      const { user } = await signUpWithEmail(email, password, { fullName, phone })
      onSuccess(user)
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        const info = await resolveAccountConflict(err)
        setConflict(info)
      } else {
        setError(err.friendlyMessage || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setError('')
    setConflict(null)
    setLinkRequired(null)
    setLoading(true)
    try {
      const { user } = await signInWithGoogle()
      onSuccess(user)
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') { /* noop */ }
      else if (err.code === 'auth/link-required') {
        setLinkRequired({ email: err.email, pendingGoogleCredential: err.pendingGoogleCredential })
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const info = await resolveAccountConflict(err)
        setConflict(info)
      } else {
        setError(err.friendlyMessage || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (linkRequired) {
    return (
      <LinkRequiredBanner
        email={linkRequired.email}
        pendingGoogleCredential={linkRequired.pendingGoogleCredential}
        onResolved={(user) => { setLinkRequired(null); onSuccess(user) }}
        onDismiss={() => setLinkRequired(null)}
      />
    )
  }

  if (conflict) {
    return (
      <ConflictBanner
        email={conflict.email}
        methods={conflict.methods}
        pendingCredential={conflict.pendingCredential}
        onResolved={(user) => { setConflict(null); onSuccess(user) }}
        onDismiss={() => setConflict(null)}
      />
    )
  }

  if (step === 1) {
    return (
      <div className="space-y-5">
        <ErrorBanner message={error} />

        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Johnson"
            className="w-full h-14 px-5 bg-surface-container-lowest rounded-xl text-base font-medium ring-1 ring-inset ring-surface-container-highest focus:ring-2 focus:ring-primary transition-all outline-none placeholder:text-outline-variant"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full h-14 px-5 bg-surface-container-lowest rounded-xl text-base font-medium ring-1 ring-inset ring-surface-container-highest focus:ring-2 focus:ring-primary transition-all outline-none placeholder:text-outline-variant"
          />
        </div>

        {/* Phone (optional) */}
        <div className="space-y-2">
          <label htmlFor="signup-phone" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
            Phone <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full h-14 px-5 bg-surface-container-lowest rounded-xl text-base font-medium ring-1 ring-inset ring-surface-container-highest focus:ring-2 focus:ring-primary transition-all outline-none placeholder:text-outline-variant"
          />
        </div>

        <button
          id="btn-signup-continue"
          type="button"
          onClick={() => { setError(''); setStep(2) }}
          disabled={!fullName.trim() || !email.trim()}
          className="w-full h-14 bg-primary text-on-primary font-bold text-base rounded-xl shadow-md active:scale-[0.98] hover:bg-primary-dim transition-all disabled:opacity-50"
        >
          Continue
        </button>

        <Divider />

        <GoogleButton onClick={handleGoogleSignup} loading={loading} label="Sign up with Google" />

        {onSwitchMode && (
          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchMode('login')}
              className="text-primary font-bold hover:underline"
            >
              Log in
            </button>
          </p>
        )}
      </div>
    )
  }

  // Step 2 — Password
  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />

      <PasswordInput
        id="signup-password"
        label="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        hint="Must be at least 6 characters."
      />

      <PasswordInput
        id="signup-confirm-password"
        label="Confirm Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      {confirm && !passwordsMatch && (
        <p className="text-xs text-error font-semibold px-1">Passwords do not match.</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="h-14 px-5 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          id="btn-signup-create"
          type="button"
          onClick={handleEmailSignup}
          disabled={loading || !canSubmit}
          className="flex-1 h-14 bg-primary text-on-primary font-bold text-base rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}

// ─── Link Panel (for authenticated users) ────────────────────────────────────

/**
 * Shown on an account/settings page to let the user:
 *  • Set a password  (if they signed in with Google only)
 *  • Connect Google  (if they signed in with email/password only)
 */
function LinkPanel() {
  // refreshUser syncs context after linking (onAuthStateChanged doesn't fire for link ops)
  const { rawUser, hasPassword, hasGoogle, refreshUser } = useAuth()

  const [view,     setView]     = useState('idle')   // 'idle' | 'set-password' | 'connect-google'
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [conflict, setConflict] = useState(null)

  const passwordsMatch = password && password === confirm
  const canSetPw = password.length >= 6 && passwordsMatch

  async function handleSetPassword(e) {
    e.preventDefault()
    if (!rawUser)   return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await linkEmailPassword(rawUser, rawUser.email, password)
      // Reload providerData in context — onAuthStateChanged doesn't fire on link
      await refreshUser()
      setSuccess('Password set! You can now log in with email & password.')
      setView('idle')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(err.friendlyMessage || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnectGoogle() {
    if (!rawUser) return
    setError('')
    setSuccess('')
    setConflict(null)
    setLoading(true)
    try {
      await linkGoogle(rawUser)
      // Reload providerData in context — onAuthStateChanged doesn't fire on link
      await refreshUser()
      setSuccess('Google account connected successfully!')
      setView('idle')
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') { /* noop */ }
      else if (err.code === 'auth/account-exists-with-different-credential') {
        const info = await resolveAccountConflict(err)
        setConflict(info)
      } else {
        setError(err.friendlyMessage || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (conflict) {
    return (
      <ConflictBanner
        email={conflict.email}
        methods={conflict.methods}
        pendingCredential={conflict.pendingCredential}
        onResolved={() => { setConflict(null); setSuccess('Accounts linked successfully!') }}
        onDismiss={() => setConflict(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <SuccessBanner message={success} />
      <ErrorBanner   message={error} />

      {/* Connected providers summary */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Linked Sign-In Methods
        </p>
        <div className="flex flex-wrap gap-2">
          {hasGoogle && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold">
              <GoogleLogo />
              Google
            </span>
          )}
          {hasPassword && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Email / Password
            </span>
          )}
          {!hasGoogle && !hasPassword && (
            <span className="text-xs text-on-surface-variant/60">No providers detected.</span>
          )}
        </div>
      </div>

      {/* Action: Set Password (Google-only users) */}
      {!hasPassword && (
        view === 'set-password' ? (
          <form onSubmit={handleSetPassword} className="space-y-4 p-4 bg-surface-container-low rounded-2xl">
            <p className="text-sm font-bold text-on-surface">Set a Password</p>
            <PasswordInput
              id="link-new-password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              hint="Min. 6 characters"
            />
            <PasswordInput
              id="link-confirm-password"
              label="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {confirm && !passwordsMatch && (
              <p className="text-xs text-error font-semibold px-1">Passwords do not match.</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setView('idle'); setPassword(''); setConfirm('') }}
                className="h-12 px-4 bg-surface-container text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-set-password"
                type="submit"
                disabled={loading || !canSetPw}
                className="flex-1 h-12 bg-primary text-on-primary font-bold text-sm rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Setting…' : 'Set Password'}
              </button>
            </div>
          </form>
        ) : (
          <button
            id="btn-open-set-password"
            type="button"
            onClick={() => setView('set-password')}
            className="w-full h-12 bg-surface-container text-on-surface font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            Set Password
          </button>
        )
      )}

      {/* Action: Connect Google */}
      {!hasGoogle && (
        <button
          id="btn-connect-google"
          type="button"
          onClick={handleConnectGoogle}
          disabled={loading}
          className="w-full h-12 bg-surface-container-lowest ring-1 ring-surface-container-highest font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors disabled:opacity-60"
        >
          <GoogleLogo />
          Connect Google Account
        </button>
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * @param {{ mode: 'login'|'signup'|'link', onSuccess?: Function, onSwitchMode?: Function, className?: string }} props
 */
export default function AuthUI({ mode = 'login', onSuccess = () => {}, onSwitchMode, className = '' }) {
  return (
    <div className={className}>
      {mode === 'login'  && <LoginForm  onSuccess={onSuccess} onSwitchMode={onSwitchMode} />}
      {mode === 'signup' && <SignupForm onSuccess={onSuccess} onSwitchMode={onSwitchMode} />}
      {mode === 'link'   && <LinkPanel />}
    </div>
  )
}

// Named exports for individual use
export { LoginForm, SignupForm, LinkPanel, ConflictBanner }
