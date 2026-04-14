import { useNavigate } from 'react-router-dom'
import AppBar from '../components/AppBar.jsx'
import { useCart } from '../context/CartContext'

export default function ExitPass() {
  const navigate = useNavigate()
  const { purchaseSnapshot } = useCart()

  // Fallback when navigating directly to /success in dev
  const snapshot = purchaseSnapshot ?? {
    items: [
      { id: 'almond-milk', name: 'Organic Almond Milk', variant: '1L • Unsweetened',  price: 245, qty: 1 },
      { id: 'avocado',     name: 'Fresh Avocado Pack',  variant: '2 Pieces • Premium', price: 190, qty: 2 },
      { id: 'coffee',      name: 'Dark Roast Coffee',   variant: '250g • Whole Beans', price: 825, qty: 1 },
    ],
    subtotal:  1450,
    sessionId: 'SC-99214',
    paidAt:   new Date().toISOString(),
  }

  const totalPaid = snapshot.subtotal
  const paidAt    = new Date(snapshot.paidAt)

  const TimerIcon = (
    <span className="material-symbols-outlined text-primary">timer</span>
  )

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <AppBar rightSlot={TimerIcon} />

      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-8 pb-32">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container rounded-full mb-5 ring-8 ring-primary/10">
            <span
              className="material-symbols-outlined text-on-primary-container text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="text-[2.75rem] font-black leading-tight text-primary tracking-tight uppercase">
            SUCCESS
          </h1>
          <p className="text-on-surface-variant font-semibold tracking-wide mt-1">
            Thank you for your purchase
          </p>
        </div>

        {/* QR card */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-6 mb-6 shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Show this at the exit gate
          </p>

          {/* QR placeholder – backend supplies real image URL via POST /generate-qr */}
          <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center mb-6 border border-outline-variant/10">
            <span className="material-symbols-outlined text-[9rem] text-on-surface/80">qr_code_2</span>
          </div>

          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <span className="block text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mb-1">Total Paid</span>
              <p className="text-xl font-bold">₹{totalPaid.toLocaleString()}.00</p>
            </div>
            <div className="text-right">
              <span className="block text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mb-1">Session ID</span>
              <p className="text-xl font-bold">{snapshot.sessionId}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-outline-variant/10">
              <span className="block text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mb-1">Timestamp</span>
              <p className="text-on-surface font-medium text-sm">
                {paidAt.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* Receipt details */}
        <div className="mb-6">
          <h3 className="font-bold tracking-tight mb-4 flex items-center gap-2 text-lg">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Receipt Details
          </h3>

          <div className="space-y-3">
            {snapshot.items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-2xl ${
                  idx % 2 !== 0 ? 'bg-surface-container-lowest' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">grocery</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
                      {item.variant ? `${item.variant} • ` : ''}Qty: {item.qty}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-sm">₹{(item.price * item.qty).toLocaleString()}.00</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary totals */}
        <div className="bg-surface-container-low rounded-3xl p-6 space-y-3">
          {[
            { label: 'Subtotal',       val: `₹${totalPaid.toLocaleString()}.00`, cls: 'text-on-surface-variant' },
            { label: 'Store Tax (0%)', val: '₹0.00',                             cls: 'text-on-surface-variant' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="flex justify-between items-center">
              <span className={cls}>{label}</span>
              <span className={cls}>{val}</span>
            </div>
          ))}
          <div className="pt-3 flex justify-between items-center border-t border-outline-variant/10">
            <span className="font-bold text-lg">Total Paid</span>
            <span className="text-2xl font-black text-primary tracking-tight">
              ₹{totalPaid.toLocaleString()}.00
            </span>
          </div>
        </div>
      </main>

      {/* Fixed done button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/85 backdrop-blur-xl z-50 border-t border-surface-container-low">
        <button
          id="exit-done-btn"
          onClick={() => navigate('/')}
          className="w-full max-w-md mx-auto flex h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl font-bold text-lg items-center justify-center transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          Done
        </button>
      </div>
    </div>
  )
}
