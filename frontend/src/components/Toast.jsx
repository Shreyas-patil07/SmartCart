import { useEffect } from 'react'

/**
 * Floating toast notification.
 *
 * @param {{ type: 'success' | 'error', msg: string } | null} toast
 * @param {() => void} onDismiss - called after 3 s or immediately
 */
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(onDismiss, 3000)
    return () => clearTimeout(id)
  }, [toast, onDismiss])

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-20 left-0 right-0 flex justify-center px-6 z-[100] pointer-events-none"
    >
      <div
        className={[
          'flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold',
          'animate-[fadeInDown_0.2s_ease-out]',
          isError
            ? 'bg-error-container text-on-error-container border-error/20'
            : 'bg-green-50 text-green-800 border-green-200',
        ].join(' ')}
      >
        <span className="material-symbols-outlined text-base">
          {isError ? 'error' : 'check_circle'}
        </span>
        {toast.msg}
      </div>
    </div>
  )
}
