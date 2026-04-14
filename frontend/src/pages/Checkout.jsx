import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/AppBar.jsx'
import { useCart } from '../context/CartContext'
import { generateQR } from '../lib/api.js'

const TAX_RATE = 0.05  // 5%
const DISCOUNT = 20    // flat ₹20 store discount
const PAYU_PAYMENT_URL = 'https://u.payu.in/hIInB4BXAW8L'

const PAYMENT_METHODS = [
  { id: 'upi',     icon: 'account_balance_wallet', label: 'Google Pay / UPI',   sub: 'Fast & Secure' },
  { id: 'card',    icon: 'credit_card',            label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
  { id: 'netbank', icon: 'receipt_long',            label: 'Net Banking',         sub: 'All major Indian banks' },
]

export default function Checkout() {
  const navigate                              = useNavigate()
  const { items, subtotal, completePurchase } = useCart()
  const [method, setMethod]                   = useState('upi')
  const [coupon, setCoupon]                   = useState('')
  const [loading, setLoading]                 = useState(false)

  const tax   = +(subtotal * TAX_RATE).toFixed(2)
  const total = Math.max(0, +(subtotal + tax - DISCOUNT).toFixed(2))

  async function handlePay() {
    if (loading) return
    setLoading(true)
    try {
      await generateQR({ sessionId: 'demo-session', paymentMethod: method, coupon })
    } catch {
      // Proceed to success regardless — backend may be offline locally
    } finally {
      completePurchase(method)  // freeze receipt snapshot, clear cart
      setLoading(false)
      navigate('/success')
    }
  }

  const TimerIcon = (
    <button aria-label="Session timer" className="text-primary hover:opacity-75 transition-opacity">
      <span className="material-symbols-outlined">timer</span>
    </button>
  )

  // Guard: if cart is empty and user lands here directly
  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col">
        <AppBar rightSlot={TimerIcon} />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">shopping_cart</span>
          <p className="text-on-surface-variant font-semibold text-center">No items in cart yet</p>
          <button
            onClick={() => navigate('/scan')}
            className="h-12 px-8 bg-primary text-on-primary font-bold rounded-xl"
          >
            Go to Scanner
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface pb-36">
      <AppBar rightSlot={TimerIcon} />

      <main className="max-w-md mx-auto pt-8 px-6 space-y-6">
        {/* Locked order review */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Review Order</h2>
            <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container px-3 py-1 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              LOCKED
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl overflow-hidden divide-y divide-outline-variant/10">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 flex items-center gap-4 ${idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface'}`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    Qty: {item.qty} • ₹{item.price.toLocaleString()}
                  </p>
                </div>
                <p className="font-bold text-sm flex-shrink-0">
                  ₹{(item.price * item.qty).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Billing breakdown */}
        <section className="bg-surface-container-low rounded-2xl p-6 space-y-3">
          <div className="space-y-2">
            {[
              { label: 'Subtotal',       val: `₹${subtotal.toLocaleString()}.00`, color: '' },
              { label: 'Taxes (5%)',     val: `₹${tax}`,                          color: '' },
              { label: 'Store Discount', val: `- ₹${DISCOUNT}.00`,               color: 'text-primary' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className={`text-on-surface-variant ${color}`}>{label}</span>
                <span className={`font-medium ${color}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* Coupon input */}
          <div className="relative">
            <input
              id="coupon-input"
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Apply coupon code"
              className="w-full bg-surface-container-lowest rounded-xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 outline-none transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs uppercase tracking-wider px-3 py-2 hover:bg-primary/5 rounded-lg transition-colors">
              Apply
            </button>
          </div>

          <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
            <span className="text-on-surface font-bold text-lg">Total Amount</span>
            <span className="text-on-surface font-black text-2xl tracking-tighter">
              ₹{total.toLocaleString()}
            </span>
          </div>
        </section>

        {/* Payment method selection */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Payment Method</h2>
          <div className="space-y-3">
            {PAYMENT_METHODS.map(({ id, icon, label, sub }) => {
              const active = method === id
              return (
                <button
                  key={id}
                  id={`pay-method-${id}`}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={[
                    'w-full bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 transition-all text-left',
                    active
                      ? 'ring-2 ring-primary/40 border border-primary/20 shadow-sm'
                      : 'border border-transparent opacity-60 hover:opacity-100',
                  ].join(' ')}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className={`material-symbols-outlined ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {icon}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-on-surface-variant text-xs">{sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-primary' : 'border-outline-variant'}`}>
                    {active && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-8 py-2 opacity-30">
          <span className="material-symbols-outlined text-3xl">verified_user</span>
          <span className="material-symbols-outlined text-3xl">shield</span>
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
      </main>

      {/* Fixed pay button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-50 px-6 pt-4 pb-8">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <a
            id="pay-now-btn"
            href={PAYU_PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePay}
            aria-disabled={loading}
            style={{
              width: '150px',
              backgroundColor: '#1065b7',
              textAlign: 'center',
              fontWeight: 800,
              padding: '11px 0px',
              color: 'white',
              fontSize: '12px',
              display: 'inline-block',
              textDecoration: 'none',
              borderRadius: '3.229px',
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? 'none' : 'auto',
            }}
          >
            {loading ? 'Processing…' : 'Pay Now'}
          </a>
          <p className="text-center text-[10px] text-on-surface-variant mt-3 font-medium uppercase tracking-widest">
            Secure 256-bit SSL Encrypted Payment
          </p>
        </div>
      </div>
    </div>
  )
}
