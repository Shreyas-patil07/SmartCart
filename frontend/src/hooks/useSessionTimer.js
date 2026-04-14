import { useState, useEffect } from 'react'

/**
 * Shared session countdown timer hook.
 * @param {number} initialSeconds - Starting value (default 30 min)
 */
export function useSessionTimer(initialSeconds = 30 * 60) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    const id = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000
    )
    return () => clearInterval(id)
  }, [])

  const formatted = (() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  })()

  return {
    seconds,
    formatted,
    isExpiring: seconds > 0 && seconds < 5 * 60, // last 5 min
    isExpired:  seconds === 0,
  }
}
