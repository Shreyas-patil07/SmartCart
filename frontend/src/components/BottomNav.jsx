import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/',      label: 'Home',    icon: 'home',            exact: true,  requiresAuth: false },
  { to: '/scan',  label: 'Scan',    icon: 'qr_code_scanner', exact: false, requiresAuth: true },
  { to: '/cart',  label: 'Cart',    icon: 'shopping_cart',   exact: false, requiresAuth: true },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  function handleNavClick(e, link) {
    if (link.requiresAuth && !isAuthenticated) {
      e.preventDefault()
      navigate('/login', { state: { from: link.to } })
    }
  }

  async function handleLogout() {
    setShowConfirm(false)
    setLoggingOut(true)
    // Show loading screen for 1-2 seconds before signing out
    await new Promise((r) => setTimeout(r, 1400))
    await logout()
    setLoggingOut(false)
  }

  return (
    <>
      {/* ── Full-screen logout loading overlay ── */}
      {loggingOut && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        >
          {/* Animated logo / spinner */}
          <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 28 }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid rgba(255,255,255,0.15)',
              borderTopColor: '#7c9ef8',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 10,
              border: '3px solid rgba(255,255,255,0.08)',
              borderBottomColor: '#a78bfa',
              borderRadius: '50%',
              animation: 'spin 1.4s linear infinite reverse',
            }} />
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#7c9ef8', fontSize: 28,
              }}
            >
              logout
            </span>
          </div>
          <p style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600, letterSpacing: '0.02em', margin: 0 }}>
            Signing you out…
          </p>
          <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: 13, marginTop: 8 }}>
            See you next time!
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Confirm logout modal ── */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 100px',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              padding: '28px 24px 24px',
              maxWidth: 360,
              width: '92%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
              animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: 28 }}>logout</span>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Log out?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 14,
                  border: '1.5px solid #e5e7eb', background: 'white',
                  color: '#374151', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: 'white', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                  transition: 'opacity 0.15s',
                }}
              >
                Log out
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
          `}</style>
        </div>
      )}

      {/* ── Bottom Nav Bar ── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.07)] border-t border-surface-container"
      >
        <div className="max-w-md mx-auto flex justify-around items-center px-2 pb-6 pt-2">
          {NAV_LINKS.map((link) => {
            const active = link.exact ? pathname === link.to : pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavClick(e, link)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 min-w-[60px]',
                  active
                    ? 'bg-primary/8 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low',
                ].join(' ')}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {link.icon}
                </span>
                <span className="text-[11px] font-semibold mt-0.5">{link.label}</span>
              </Link>
            )
          })}

          {/* Account / Login tab */}
          {isAuthenticated ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 min-w-[60px] text-on-surface-variant hover:bg-surface-container-low"
            >
              <div className="w-[22px] h-[22px] rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
                {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <span className="text-[11px] font-semibold mt-0.5">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              aria-current={pathname === '/login' ? 'page' : undefined}
              className={[
                'flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 min-w-[60px]',
                pathname === '/login'
                  ? 'bg-primary/8 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={pathname === '/login' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                person
              </span>
              <span className="text-[11px] font-semibold mt-0.5">Login</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
