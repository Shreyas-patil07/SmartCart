import { useState } from 'react'
import AppBar from '../components/AppBar.jsx'
import { verifyExitQR } from '../lib/api.js'
import { STORES } from '../lib/stores.js'

const MOCK_ORDER = {
  store: STORES[0]?.name || 'City Supermarket Downtown',
  status: 'PAID',
  total: '$42.85',
  itemCount: 5,
  items: [
    {
      id: 1,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpYeh3cj8fJjWIDeK-W5th1UmP3CnFY7ImpD8hqMqMjjDODPgKefTmwdjSYOmtcgd_UoyarKiYntGn4kzpjB5RhDYLcBnQFaR-EOin3DC2BewhDitZ0eQmoRHZzAwjlIR5vOwiDzn4LLDy8rPbs3eHsIYCQ28E-ihjFEDXP4Dgbiroceomn3fPiNJSLxQqBSOyGG1K2JTIvtGPnqMbeNtgxNTCU60In0XQ4SEZrWV9LN7o2qDrnXpPbk3CmMOE-4QdXR0d4mS4x9w',
      name: 'Organic Fuji Apples',
      qty: 4,
      price: '$6.40',
    },
    {
      id: 2,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFDEEM9yTJblpLg0hlxiExb5lVcdRUuussO6FLkwqCacwgo4bcFxwAwEVWeRtMvvsfwKIKRAHBEdafpLl_m1EeJOZRAoqxt5D_VUmGSODmQnpPGBUgjVQoFTOK3NtMDLtO4E3YVKAx2D29jKJxqjH9JYErptqyGo7KvMDROUCrlT_w8mMjckVNSOyQfw55H78O485Gx4ujD19aKa-pVxu5jbDonCtZldaOjFl3cufA2VILEZ3GpLe0OPj4lzdvUeM8lbU9bwB7j0o',
      name: 'Whole Milk 1L',
      qty: 2,
      price: '$8.50',
    },
    {
      id: 3,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSEOwspxr89s4Galv_VdSBJMhjNFFlaKG6dkDZTfMQSfBsHyZ8BwCyPpNyPPPA_c6ieEhkmEnJ8EUJWPB5g-vt0XUoFdp2nJIx0i3wmB0I2PHYJzGPjTGEjJjvybkG4kYSjuUL5Ba8Jb1lSU6h0_Fa-cTBcVKu6DTV8ov2pYYcG4Kg3ANjyiaAhJPSqu0-9T9hgMzqwYq_W_JxOpUfEWsZGWQJhmCQbIwTKs0sU9s7pmyEF4YC7uyiDsh7ZN2t7VinJLMSwQCMlys',
      name: 'Sourdough Loaf',
      qty: 1,
      price: '$5.95',
    },
  ],
}

export default function GuardPanel() {
  const [verified, setVerified] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [flagged,  setFlagged]  = useState(false)

  async function handleVerify() {
    setScanning(true)
    try {
      await verifyExitQR({ qrCode: 'SC-99214' })
    } catch {
      // show mock result anyway
    }
    setScanning(false)
    setVerified(true)
  }

  function handleFlag() {
    setFlagged((v) => !v)
  }

  const TimerIcon = (
    <span className="material-symbols-outlined text-primary">timer</span>
  )

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <AppBar rightSlot={TimerIcon} />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-32 space-y-5">
        {/* Scanner view */}
        <section className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-inverse-surface shadow-2xl">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4v9vLfRCCd_Qh7QDiv87pxm67e4p6GJ_ptqtTSmyUEiaNHkx6Gxy8EQm7w7uOimVqcBcRJGTxEFYvaSlP4sIRlVpoW0Cf-76oS4TMlxHNn2-lKAJE8iJW1KeIhtWIr7CWE8r2d9yicYh5JptL_mW7vdrS4hHPMAgKKiAJz8jG7p3-Erqjg6n1QZzgEmh7Jf5JA-cejsdqZzFu8xtlzroaZqLGFCmC_JQet9476Y6g-SskGo5mzjf4USIsX3Bc8rABm-B8zMcnOPk"
            alt="Guard scanner camera view"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Scanner frame */}
            <div className="w-64 h-64 relative">
              {[
                '-top-1 -left-1 border-t-4 border-l-4 rounded-tl-xl',
                '-top-1 -right-1 border-t-4 border-r-4 rounded-tr-xl',
                '-bottom-1 -left-1 border-b-4 border-l-4 rounded-bl-xl',
                '-bottom-1 -right-1 border-b-4 border-r-4 rounded-br-xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-primary ${cls}`} />
              ))}
              {/* scan line */}
              <div className="w-full h-0.5 bg-primary/60 absolute top-1/2 -translate-y-1/2 blur-[1px]" />
            </div>
            <p className="mt-5 text-white font-bold text-xs tracking-widest uppercase bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
              Align Customer QR Code
            </p>
          </div>

          {/* Verified badge overlay */}
          {verified && (
            <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white space-y-2">
                <span
                  className="material-symbols-outlined text-6xl text-green-300"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <p className="font-black text-xl uppercase tracking-widest">Verified</p>
              </div>
            </div>
          )}
        </section>

        {/* Order card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <span className="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full text-xs font-black tracking-wider">
                {MOCK_ORDER.status}
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-2">{MOCK_ORDER.store}</h2>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-xs font-semibold uppercase">Total</p>
              <p className="text-2xl font-black text-primary">{MOCK_ORDER.total}</p>
            </div>
          </div>

          {/* Items list */}
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-on-surface font-bold text-sm">
                Cart Content ({MOCK_ORDER.itemCount} items)
              </span>
              <span className="material-symbols-outlined text-on-surface-variant">inventory_2</span>
            </div>

            <div className="space-y-3">
              {MOCK_ORDER.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">Qty: {item.qty}</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0">{item.price}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-3 text-primary text-xs font-bold py-2 hover:bg-primary/5 rounded-xl transition-colors">
              VIEW ALL {MOCK_ORDER.itemCount} ITEMS
            </button>
          </div>
        </div>
      </main>

      {/* Fixed action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl px-4 pt-4 pb-8 flex flex-col gap-3 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        <div className="max-w-md mx-auto w-full space-y-3">
          <button
            id="approve-exit-btn"
            onClick={handleVerify}
            disabled={scanning || verified}
            className="w-full h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
          >
            <span className="material-symbols-outlined">check_circle</span>
            {scanning ? 'Verifying…' : verified ? 'Exit Approved ✓' : 'Approve Exit'}
          </button>

          <button
            id="flag-issue-btn"
            onClick={handleFlag}
            className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
              flagged
                ? 'bg-error/10 text-error border border-error/20'
                : 'bg-error-container/10 text-error-dim hover:bg-error-container/20'
            }`}
          >
            <span className="material-symbols-outlined">report_problem</span>
            {flagged ? 'Issue Flagged — Supervisor Notified' : 'Flag Issue'}
          </button>
        </div>
      </div>
    </div>
  )
}
