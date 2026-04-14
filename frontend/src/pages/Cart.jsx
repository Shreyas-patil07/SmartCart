import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { useCart } from '../context/CartContext'
import { updateCartItem, removeCartItem } from '../lib/api.js'

const MAX_CART   = 2000
const SESSION_ID = 'demo-session'

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <span className="material-symbols-outlined text-3xl text-primary/40">shopping_bag</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <div className="flex gap-4 items-center bg-surface-container-lowest p-3 rounded-2xl">
      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low">
        <ProductImage src={item.img} alt={item.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h3 className="font-bold text-on-surface text-sm truncate pr-2">{item.name}</h3>
          <button
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(item.id)}
            className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <p className="text-on-surface-variant text-xs mb-3">{item.variant}</p>
        <div className="flex justify-between items-center">
          <span className="text-primary font-extrabold">
            ₹{(item.price * item.qty).toLocaleString()}
          </span>
          <div className="flex items-center bg-surface-container rounded-full p-0.5 shadow-sm">
            <button
              aria-label="Decrease quantity"
              onClick={() => onQtyChange(item.id, item.qty - 1)}
              disabled={item.qty <= 1}
              className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-base">remove</span>
            </button>
            <span className="px-3 font-bold text-sm tabular-nums">{item.qty}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => onQtyChange(item.id, item.qty + 1)}
              className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Cart() {
  const navigate = useNavigate()
  const { items, subtotal, itemCount, updateQty, removeItem } = useCart()

  const spent     = subtotal
  const remaining = MAX_CART - spent
  const progress  = Math.min((spent / MAX_CART) * 100, 100)

  function handleQtyChange(id, newQty) {
    if (newQty < 1) return
    updateQty(id, newQty)
    updateCartItem(SESSION_ID, { itemId: id, qty: newQty }).catch(() => {})
  }

  function handleRemove(id) {
    removeItem(id)
    removeCartItem(SESSION_ID, id).catch(() => {})
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* App bar */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-surface-container-low">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-md mx-auto">
          <Logo />
          <button aria-label="Session timer" className="text-primary">
            <span className="material-symbols-outlined">timer</span>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-4 pt-6 pb-40">
        {/* Cart budget banner */}
        <div className="mb-6 p-4 bg-primary/5 rounded-2xl flex items-center gap-4 border-l-4 border-primary">
          <div className="flex-1">
            <p className="text-on-surface-variant text-xs font-semibold mb-1.5">Cart Progress</p>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-primary font-bold text-sm tracking-tight">
              ₹{remaining.toLocaleString()} remaining
            </p>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
              of ₹{MAX_CART.toLocaleString()} max
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-5">
          Your Shopping Cart
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">
              shopping_cart
            </span>
            <p className="text-on-surface-variant font-semibold">Your cart is empty</p>
            <button
              onClick={() => navigate('/scan')}
              className="text-primary font-bold hover:underline"
            >
              Start scanning →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQtyChange={handleQtyChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* Price summary */}
        {items.length > 0 && (
          <div className="mt-10 p-6 bg-surface-container-low rounded-[2rem] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Subtotal</span>
              <span className="font-bold">₹{subtotal.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Store Tax</span>
              <span className="font-bold">₹0.00</span>
            </div>
            <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-end">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">
                  Grand Total
                </p>
                <p className="text-4xl font-black text-on-surface tracking-tighter">
                  ₹{subtotal.toLocaleString()}
                </p>
              </div>
              <span className="bg-primary-container text-on-primary-container text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Sticky checkout button */}
      {items.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 max-w-md mx-auto">
          <button
            id="proceed-to-pay-btn"
            onClick={() => navigate('/checkout')}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-black text-lg rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            Proceed to Pay
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
