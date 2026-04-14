import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

/**
 * Slim app bar used on auth / transactional pages (no bottom nav).
 * `rightSlot` accepts arbitrary JSX (timer, lock icon, etc.)
 */
export default function AppBar({ rightSlot, to = '/' }) {
  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-surface-container-low">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-md mx-auto">
        <Logo to={to} />
        {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
      </div>
    </header>
  )
}
