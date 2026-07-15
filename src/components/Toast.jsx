import { useEffect, useState } from 'react'

export default function Toast({ message, onDone, delay = 3200 }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!message) return
    const raf = requestAnimationFrame(() => setOpen(true))
    const hide = setTimeout(() => setOpen(false), delay)
    // Clear the message only after the fade-out, so the text doesn't vanish
    // a beat before the toast does.
    const clear = setTimeout(onDone, delay + 250)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hide)
      clearTimeout(clear)
      setOpen(false)
    }
  }, [message, delay, onDone])

  if (!message) return null
  return (
    <div className={`toast ${open ? 'is-open' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
