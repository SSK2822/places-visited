import { useEffect, useState } from 'react'
import { fmt } from '../lib/utils'

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// A score that counts up from zero once `start` flips true (cubic ease-out,
// matching the reference frame). Unrated scores have nothing to count to, so
// they render the em-dash straight away.
export default function CountUp({ value, start, dur = 900, className }) {
  const unrated = value === null || value === undefined
  const [text, setText] = useState(() => fmt(unrated ? null : 0))

  useEffect(() => {
    if (unrated) return setText(fmt(null))
    if (!start) return setText(fmt(0))
    if (reducedMotion()) return setText(fmt(value))

    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      if (k < 1) {
        // Two decimals while in flight — the real value can land on eighths,
        // and three decimals of jitter reads as noise at this size.
        setText(fmt(Math.round(value * eased * 100) / 100))
        raf = requestAnimationFrame(tick)
      } else {
        setText(fmt(value))
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, start, dur, unrated])

  return <div className={className}>{text}</div>
}
