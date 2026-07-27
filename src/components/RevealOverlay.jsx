import { useEffect, useRef, useState } from 'react'
import { overall, fmt, ratingClass, fullyRated, verdict } from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// The payoff of the blind-rating game: once you complete a pair, both scores
// flip open one at a time, the overall lands, and a playful verdict pops. Phases
// 0→4 gate each beat; reduced-motion jumps straight to the end.
export default function RevealOverlay({ place, onClose }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState(0)
  const closedRef = useRef(false)

  useEffect(() => {
    if (reducedMotion()) {
      setOpen(true)
      setPhase(4)
      return
    }
    const timers = [
      requestAnimationFrame(() => setOpen(true)),
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1700),
      setTimeout(() => setPhase(4), 2300),
    ]
    return () => timers.forEach((t) => {
      cancelAnimationFrame(t)
      clearTimeout(t)
    })
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function close() {
    if (closedRef.current) return
    closedRef.current = true
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const ov = overall(place)
  const v = verdict(place.yk, place.ac)

  return (
    <div
      className={`reveal-back ${open ? 'is-open' : ''}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Rating reveal"
    >
      <div className="reveal-stage" onClick={(e) => e.stopPropagation()}>
        <div className="reveal-kicker">the verdict is in…</div>
        <div className="reveal-name">{place.name}</div>

        <div className="reveal-scores">
          {EDITORS.map((e, i) => {
            const shown = phase > i
            return (
              <div key={e.key} className={`reveal-card ${shown ? 'shown' : ''}`}>
                <div className="reveal-card-lab">{e.label}</div>
                <div className={`reveal-card-fig ${shown ? ratingClass(place[e.key]) : ''}`}>
                  {shown ? fmt(place[e.key]) : '?'}
                </div>
              </div>
            )
          })}
        </div>

        <div className={`reveal-overall ${phase >= 3 ? 'show' : ''}`}>
          <span className="reveal-overall-lab">Overall</span>
          <span className={`reveal-overall-fig ${ratingClass(ov)}`}>
            {phase >= 3 && fullyRated(place) ? fmt(ov) : '·'}
          </span>
        </div>

        <div className={`reveal-verdict ${phase >= 4 ? 'show' : ''}`}>
          <div className="reveal-verdict-title">{v.title}</div>
          <div className="reveal-verdict-line">{v.line}</div>
        </div>

        <button className="btn btn-primary reveal-close" onClick={close}>
          Nice
        </button>
      </div>
    </div>
  )
}
