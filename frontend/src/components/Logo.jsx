import { Link } from 'react-router-dom'

/**
 * Brand lockup — SmartCart logo image + wordmark.
 * Logo image is served from public/SmartCart_remade.png.
 * `to` prop: pass null/false to render a non-navigable version.
 */
export default function Logo({ to = '/' }) {
  const inner = (
    <span className="flex items-center gap-2">
      <img
        src="/SmartCart_remade.png"
        alt="SmartCart logo"
        className="h-8 w-auto object-contain"
      />
      <span className="text-xl font-black tracking-tighter text-on-surface select-none">
        SmartCart
      </span>
    </span>
  )

  return to ? (
    <Link to={to} aria-label="SmartCart home" className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    <div aria-hidden="true">{inner}</div>
  )
}
