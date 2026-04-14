import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  {
    num: '01',
    title: 'Enter Store',
    body: 'Open SmartCart as soon as you walk through the doors.',
  },
  {
    num: '02',
    title: 'Scan Items',
    body: 'Point your camera at any barcode. Item added instantly.',
  },
  {
    num: '03',
    title: 'Check Totals',
    body: 'View your live cart. Adjust quantities or remove items easily.',
  },
  {
    num: '04',
    title: 'One-Tap Pay',
    body: 'Pay via Apple Pay, Google Pay, or saved credit card.',
  },
  {
    num: '05',
    title: 'Get Your QR',
    body: 'A digital receipt and exit pass are generated immediately.',
  },
  {
    num: '06',
    title: 'Walk Out',
    body: 'Scan your phone at the exit gate and you\'re finished!',
  },
]

const FEATURES = [
  {
    icon: 'camera',
    title: 'Camera barcode scans',
    body: 'Advanced computer vision detects any product in milliseconds, even in low light.',
    span: 'md:col-span-2',
    accent: false,
  },
  {
    icon: 'receipt_long',
    title: 'Live cart + taxes',
    body: 'Know exactly what you\'re spending. Every tax and discount applied in real-time.',
    span: '',
    accent: true,
    badge: '₹142.50',
  },
  {
    icon: 'redeem',
    title: 'Rewards & coupons',
    body: 'Automatic application of membership deals and digital coupons as you scan.',
    span: '',
    accent: false,
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="bg-surface text-on-surface min-h-dvh">
      {/* ── Top Nav ── */}
      <header className="bg-surface/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-surface-container-low">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Logo />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/confirm-store"
                className="inline-flex h-10 px-5 rounded-xl bg-primary text-on-primary font-bold text-sm items-center gap-2 hover:bg-primary-dim transition-colors"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                Profile
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 px-5 rounded-xl bg-primary text-on-primary font-bold text-sm items-center gap-2 hover:bg-primary-dim transition-colors"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12">
        {/* ── Hero ── */}
        <section className="px-6 pt-14 pb-20 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-8">
              <div className="space-y-5">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-widest uppercase">
                  Retail Revolution
                </span>
                <h1 className="text-[2.75rem] md:text-6xl font-black leading-[1.1] tracking-tighter text-on-surface">
                  Frictionless{' '}
                  <span className="text-primary">in-store</span> checkout
                </h1>
                <p className="text-lg text-on-surface-variant leading-relaxed font-medium max-w-md">
                  Shop freely. Scan as you go. Skip the checkout line entirely.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/confirm-store"
                  id="hero-launch-btn"
                  className="inline-flex h-14 px-8 rounded-xl items-center justify-center bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all duration-200"
                >
                  Launch Shopping
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-14 px-8 rounded-xl items-center justify-center bg-surface-container-low text-on-surface font-bold text-lg hover:bg-surface-container-high transition-colors"
                >
                  How it works
                </a>
              </div>
            </div>

            <div className="w-full md:w-1/2 relative">
              <div className="aspect-[4/5] md:aspect-square rounded-[2rem] overflow-hidden shadow-2xl">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2lzgsQrFNQEfoOFBaEM6igPMd8DyUyKlj42vb3gPgSHmydEdyBvfOHfdy0uVfm-swIEmGaaEk9_zqYR6xVTQ0m55mKtTJBWphrhOBo0GoZILDBZVgyIrkww5n2fHDwPKgySz8EchwHzzYfExR7jkkwMFb1gQ-SplcKRXF2bGLFaWoQvjsWKqD6jvzKBJlO6QjDYD3k5yJTLgXtoGYSd06A80ghtTgh4KvkVD4vL11nK_IBBuzVpx9gvIVSJiAuwYRLvVv7Og_1hg"
                  alt="Modern upscale grocery store interior with warm lighting"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-4 md:-left-8 bg-surface-container-lowest p-5 rounded-2xl shadow-xl max-w-[220px] border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">qr_code_scanner</span>
                  </div>
                  <span className="font-bold text-on-surface text-sm">Instant Scan</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">
                  Lightning fast barcode detection in any light.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Bento ── */}
        <section className="px-6 py-20 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface">
                Precision Features
              </h2>
              <p className="text-on-surface-variant font-medium">
                The technology that makes checkout invisible.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {FEATURES.map(({ icon, title, body, span, accent, badge }) => (
                <div
                  key={title}
                  className={[
                    'p-8 rounded-[2rem] flex flex-col justify-between',
                    span,
                    accent
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest border border-outline-variant/10',
                  ].join(' ')}
                >
                  <div className="space-y-3">
                    <span className={`material-symbols-outlined text-4xl ${accent ? '' : 'text-primary'}`}>
                      {icon}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                    <p className={accent ? 'opacity-80 text-sm' : 'text-on-surface-variant text-sm'}>
                      {body}
                    </p>
                  </div>
                  {badge && (
                    <div className="mt-8 text-4xl font-black">{badge}</div>
                  )}
                </div>
              ))}

              {/* QR Exit Gate wide card */}
              <div className="md:col-span-4 bg-surface-container-highest p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-on-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-surface">gate</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Exit-gate QR proof</h3>
                  <p className="text-on-surface-variant font-medium leading-relaxed">
                    Pay in-app and get a unique secure QR code. Walk out with confidence
                    through our dedicated Smart Lanes.
                  </p>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-inner flex items-center justify-center">
                    <span className="material-symbols-outlined text-[7rem] text-on-surface">qr_code_2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section id="how-it-works" className="px-6 py-24 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-center mb-16">
            The 6-Step Freedom
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map(({ num, title, body }) => (
              <div key={num} className="relative pl-12">
                <span className="absolute left-0 top-0 text-6xl font-black text-primary/10 select-none leading-none">
                  {num}
                </span>
                <h4 className="text-xl font-bold mb-2">{title}</h4>
                <p className="text-on-surface-variant font-medium">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why Stores / Shoppers ── */}
        <section className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-on-surface text-surface p-12 md:p-24">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-8">Why stores love it</h3>
            <ul className="space-y-6">
              {[
                { icon: 'trending_up', text: 'Increased floor space by reducing bulky checkout lanes.' },
                { icon: 'groups', text: 'Employees spend more time helping customers, less time scanning.' },
                { icon: 'insights', text: 'Real-time inventory data as customers add items to carts.' },
              ].map(({ icon, text }) => (
                <li key={icon} className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-primary-fixed flex-shrink-0">{icon}</span>
                  <p className="text-lg opacity-80">{text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-secondary text-on-secondary p-12 md:p-24">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-8">Why shoppers choose it</h3>
            <ul className="space-y-6">
              {[
                { icon: 'schedule', text: 'Zero waiting time. Save up to 20 minutes per grocery trip.' },
                { icon: 'account_balance_wallet', text: 'Budget better by seeing the total before reaching the exit.' },
                { icon: 'shield', text: 'Contactless and secure. No need to touch communal registers.' },
              ].map(({ icon, text }) => (
                <li key={icon} className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-secondary-fixed flex-shrink-0">{icon}</span>
                  <p className="text-lg opacity-80">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-6 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              Ready for the future of retail?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/confirm-store"
                id="cta-launch-btn"
                className="inline-flex h-16 px-10 rounded-2xl items-center justify-center bg-primary text-on-primary font-bold text-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20"
              >
                Launch Shopping
              </Link>
              <button className="h-16 px-10 rounded-2xl bg-surface-container text-on-surface font-bold text-xl hover:bg-surface-container-high transition-colors">
                Partner With Us
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
