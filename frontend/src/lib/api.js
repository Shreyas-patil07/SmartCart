import axios from 'axios'
import { auth } from './firebase'

const defaultApiBase = import.meta.env.DEV ? '/api' : 'http://localhost:5000'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach the current user's Firebase ID token to every request automatically.
// The token is short-lived (1 hour) — getIdToken(true) refreshes it when needed.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Session ──────────────────────────────────────────────────────────────────

export const startSession  = (payload)    => api.post('/session/start', payload)
export const getSession    = (sessionId)  => api.get(`/session/${sessionId}`)

// ─── Scanning ─────────────────────────────────────────────────────────────────

export const scanBarcode   = (payload)    => api.post('/scan', payload)

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getCart        = (sessionId)          => api.get(`/cart/${sessionId}`)
export const updateCartItem = (sessionId, payload) => api.patch(`/cart/${sessionId}/item`, payload)
export const removeCartItem = (sessionId, barcode) => api.delete(`/cart/${sessionId}/item/${barcode}`)

// ─── Payment & QR ─────────────────────────────────────────────────────────────

export const generateQR    = (payload)    => api.post('/generate-qr', payload)
export const getOrderStatus = (sessionId) => api.get(`/order-status/${sessionId}`)

// ─── Guard (no token needed) ──────────────────────────────────────────────────

export const verifyExitQR  = (payload)    => api.post('/guard/verify', payload)

export default api
