import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'

// All pages are lazy-loaded; Suspense boundary lives in App.jsx
const Home         = lazy(() => import('../pages/Home.jsx'))
const Login        = lazy(() => import('../pages/Login.jsx'))
const SignUp       = lazy(() => import('../pages/SignUp.jsx'))
const ConfirmStore = lazy(() => import('../pages/ConfirmStore.jsx'))
const Scanner      = lazy(() => import('../pages/Scanner.jsx'))
const Cart         = lazy(() => import('../pages/Cart.jsx'))
const Checkout     = lazy(() => import('../pages/Checkout.jsx'))
const ExitPass     = lazy(() => import('../pages/ExitPass.jsx'))
const GuardPanel   = lazy(() => import('../pages/GuardPanel.jsx'))

/**
 * Centralised route table.
 *
 * Public routes:  /  /login  /signup  /guard
 * Protected routes (require login):  /confirm-store  /scan  /cart  /checkout  /success
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"       element={<Home />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/guard"  element={<GuardPanel />} />

      {/* ── Protected (login required) ── */}
      <Route
        path="/confirm-store"
        element={<ProtectedRoute><ConfirmStore /></ProtectedRoute>}
      />
      <Route
        path="/scan"
        element={<ProtectedRoute><Scanner /></ProtectedRoute>}
      />
      <Route
        path="/cart"
        element={<ProtectedRoute><Cart /></ProtectedRoute>}
      />
      <Route
        path="/checkout"
        element={<ProtectedRoute><Checkout /></ProtectedRoute>}
      />
      <Route
        path="/success"
        element={<ProtectedRoute><ExitPass /></ProtectedRoute>}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
