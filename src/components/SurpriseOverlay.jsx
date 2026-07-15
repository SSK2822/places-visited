import { useEffect, useRef, useState } from 'react'
import { overall, fmt } from '../lib/utils'

// The signature moment: a slot machine that cycles the ranking, decelerates,
// and lands. Spin timing is lifted from the reference frame — 55ms ticks
// stretching by 1.14× until 1.5s have passed.
export default function SurpriseOverlay({ places, onClose }) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(null)
  const [landed, setLanded] = useState(false)
  // Frozen on mount: a live Firestore update mid-spin must not reshuffle the
  // pool out from under the animation.
  const poolRef = useRef(places)

  useEffect(() => {
    const pool = poolRef.current
    if (!pool.length) return
    // Drawn from the top of the ranking — "surprise us" should still land
    // somewhere you'd actually want to eat.
    const winner = pool[Math.floor(Math.random() * Math.min(pool.length, 8))]

    const raf = requestAnimationFrame(() => setOpen(true))
    let timer
    let elapsed = 0
    let interval = 55
    const spin = () => {
      setShown(pool[Math.floor(Math.random() * pool.length)])
      elapsed += interval
      interval *= 1.14
      if (elapsed < 1500) {
        timer = setTimeout(spin, interval)
      } else {
        setShown(winner)
        setLanded(true)
      }
    }
    spin()
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const closedRef = useRef(false)
  function close() {
    if (closedRef.current) return
    closedRef.current = true
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const meta = shown
    ? `${shown.cuisine} · ${shown.city}${landed ? `  ·  ${fmt(overall(shown))}` : ''}`
    : ''

  return (
    <div
      className={`pv-surprise-back ${open ? 'is-open' : ''}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="A surprise pick"
    >
      <div className={`pv-surprise-stage ${landed ? 'is-landed' : ''}`}>
        <div className="pv-surprise-kicker">tonight you’re going to…</div>
        <div className="pv-surprise-name">{shown?.name ?? ''}</div>
        <div className="pv-surprise-meta">{meta}</div>
      </div>
    </div>
  )
}
