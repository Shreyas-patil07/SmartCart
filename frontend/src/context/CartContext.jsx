import { createContext, useContext, useReducer, useCallback, useState } from 'react'

// ─── Mock product catalogue ────────────────────────────────────────────────────
// In production these come from POST /scan response.
const MOCK_PRODUCTS = [
  {
    id: 'tomatoes',
    barcode: '8901234567890',
    name: 'Organic Vine Tomatoes',
    variant: '500g Pack',
    price: 180,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByI0_LdNYaIPc1doXmcAEtlXQ5hnKYoa0rePrh60PqHsILIjrwygCrATHhf0CqOfr2a3E67ua4VWHqMncjwAmwZZv6VP5OlIP38wkfzyecVM8E7EItRiECpNHDnyobRdhE5zzV9DbcpfxtpzdM1Hx04DyqdB9YckuTk9bgp23VFl9Bkx8ycR_lPUpt7dbtm1SZQ4UwANISSF02JfT1imJPIc9CjzaP0NFqX31Y9eTMPE6FQ-W_vgeRV_Pqx8Fg2rALTysgHG9A7o8',
  },
  {
    id: 'olive-oil',
    barcode: '8901234567891',
    name: 'Artisan Olive Oil',
    variant: '750ml • Cold Pressed',
    price: 950,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaTa67u47dr5CTpbFWTVXUR5V_0a3boLYG_IBjTFAQIZfYP0yGb6gDPAj0ntmAo7u_Ynx12nq24r_6ujuXyFPkuYzoWHSyDfZhmsNI2FbdhsbX3PWiDzBSLMX2zx9gIzriUU-jy6C6Q5Rmx5Eq0Eram8gfsz9zJBJOHcHjiuVBCypVXm5lCai2tZbpX_WQI9BAt4rgybfA0KcDU84Grn6A-tmaOBpc52RegLBM_UmyOWB23FTJAJ3WB_gWwkAPSlq3UoO7ES5FZ3s',
  },
  {
    id: 'sourdough',
    barcode: '8901234567892',
    name: 'Sourdough Loaf',
    variant: '400g • Freshly Baked',
    price: 120,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDruPlIDhcCMLRpMShvOAOkkOKvyoZFmApxAPk3_5OGRvevtUsHDvJo8coe6lxRaxAgreW000RinMLigUrNszZmz4f0tlD5jA1fVd2e5ztDwqe-7t3iUMhTPhI3Imp5G-Xy9DJLlyJDmFeVmIY0GLlPRelxFJl2GnCbvosLp0tgPymfM3w-Csii7QvXx2qLSVc1xw9gISy1Yw1x-5vMERCVSp1b5F-ph8FOHE9xYsG6D1JpepUHSyt-pGRduXrVxZ3atWPbTn-VYVY',
  },
  {
    id: 'almond-milk',
    barcode: '8901234567893',
    name: 'Organic Almond Milk',
    variant: '1L • Unsweetened',
    price: 245,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpYeh3cj8fJjWIDeK-W5th1UmP3CnFY7ImpD8hqMqMjjDODPgKefTmwdjSYOmtcgd_UoyarKiYntGn4kzpjB5RhDYLcBnQFaR-EOin3DC2BewhDitZ0eQmoRHZzAwjlIR5vOwiDzn4LLDy8rPbs3eHsIYCQ28E-ihjFEDXP4Dgbiroceomn3fPiNJSLxQqBSOyGG1K2JTIvtGPnqMbeNtgxNTCU60In0XQ4SEZrWV9LN7o2qDrnXpPbk3CmMOE-4QdXR0d4mS4x9w',
  },
  {
    id: 'avocado',
    barcode: '8901234567894',
    name: 'Fresh Avocado Pack',
    variant: '2 Pieces • Premium',
    price: 190,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFDEEM9yTJblpLg0hlxiExb5lVcdRUuussO6FLkwqCacwgo4bcFxwAwEVWeRtMvvsfwKIKRAHBEdafpLl_m1EeJOZRAoqxt5D_VUmGSODmQnpPGBUgjVQoFTOK3NtMDLtO4E3YVKAx2D29jKJxqjH9JYErptqyGo7KvMDROUCrlT_w8mMjckVNSOyQfw55H78O485Gx4ujD19aKa-pVxu5jbDonCtZldaOjFl3cufA2VILEZ3GpLe0OPj4lzdvUeM8lbU9bwB7j0o',
  },
  {
    id: 'coffee',
    barcode: '8901234567895',
    name: 'Dark Roast Coffee',
    variant: '250g • Whole Beans',
    price: 825,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSEOwspxr89s4Galv_VdSBJMhjNFFlaKG6dkDZTfMQSfBsHyZ8BwCyPpNyPPPA_c6ieEhkmEnJ8EUJWPB5g-vt0XUoFdp2nJIx0i3wmB0I2PHYJzGPjTGEjJjvybkG4kYSjuUL5Ba8Jb1lSU6h0_Fa-cTBcVKu6DTV8ov2pYYcG4Kg3ANjyiaAhJPSqu0-9T9hgMzqwYq_W_JxOpUfEWsZGWQJhmCQbIwTKs0sU9s7pmyEF4YC7uyiDsh7ZN2t7VinJLMSwQCMlys',
  },
]

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product } = action
      const existing = state.find((i) => i.id === product.id)
      if (existing) {
        return state.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...state, { ...product, qty: 1 }]
    }
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i
      )
    case 'REMOVE_ITEM':
      return state.filter((i) => i.id !== action.id)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [purchaseSnapshot, setPurchaseSnapshot] = useState(null)
  const [sessionId] = useState(
    () => `SC-${Math.floor(10000 + Math.random() * 90000)}`
  )

  // Derived
  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0)
  const itemCount = items.reduce((s, i) => s + i.qty, 0)

  /**
   * Resolves a barcode to a product (mock catalogue, fallback random).
   * In production, the result comes from POST /scan API response.
   * @returns {object} The product that was added
   */
  const addItemByBarcode = useCallback((barcode) => {
    const product =
      MOCK_PRODUCTS.find((p) => p.barcode === barcode) ||
      MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)]
    dispatch({ type: 'ADD_ITEM', product })
    return product
  }, [])

  const updateQty = useCallback((id, qty) => {
    dispatch({ type: 'UPDATE_QTY', id, qty })
  }, [])

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', id })
  }, [])

  /**
   * Freezes a receipt snapshot, then clears the active cart.
   * Call this after a successful payment to feed ExitPass data.
   */
  const completePurchase = useCallback(
    (paymentMethod = 'upi') => {
      const snapshot = {
        items: items.map((i) => ({ ...i })),
        subtotal,
        itemCount,
        sessionId,
        paymentMethod,
        paidAt: new Date().toISOString(),
      }
      setPurchaseSnapshot(snapshot)
      dispatch({ type: 'CLEAR' })
      return snapshot
    },
    [items, subtotal, itemCount, sessionId]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        itemCount,
        sessionId,
        purchaseSnapshot,
        addItemByBarcode,
        updateQty,
        removeItem,
        completePurchase,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
