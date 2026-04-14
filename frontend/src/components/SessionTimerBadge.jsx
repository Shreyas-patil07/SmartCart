/**
 * Pill badge showing the session countdown.
 * Turns red in the last 5 minutes.
 */
export default function SessionTimerBadge({ formatted, isExpiring }) {
  return (
    <div
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-500',
        isExpiring ? 'bg-error/10' : 'bg-surface-container-low',
      ].join(' ')}
    >
      <span
        className={[
          'material-symbols-outlined text-sm',
          isExpiring ? 'text-error animate-pulse' : 'text-primary',
        ].join(' ')}
      >
        timer
      </span>
      <span
        className={[
          'font-bold text-sm tabular-nums',
          isExpiring ? 'text-error' : 'text-primary',
        ].join(' ')}
      >
        {formatted}
      </span>
    </div>
  )
}
