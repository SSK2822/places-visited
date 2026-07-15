import { useRef, useState } from 'react'
import { fmt, ratingClass } from '../lib/utils'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
// Ratings run -3..+3 and step in quarters, so an overall average can land on
// an eighth — see fmt() in lib/utils.
const MIN = -3
const MAX = 3
const STEP = 0.25
const snap = (v) => clamp(Math.round(v / STEP) * STEP, MIN, MAX)

export default function RatingDial({
  label, value, notRated, onValue, onNotRated, locked, lockedHint,
}) {
  const trackRef = useRef(null)
  const [grabbing, setGrabbing] = useState(false)
  const off = locked || notRated

  const pct = ((value - MIN) / (MAX - MIN)) * 100

  function setFromX(clientX) {
    const r = trackRef.current.getBoundingClientRect()
    const p = clamp((clientX - r.left) / r.width, 0, 1)
    onValue(snap(MIN + p * (MAX - MIN)))
  }

  function onPointerDown(e) {
    if (off) return
    setGrabbing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromX(e.clientX)
  }

  function onKeyDown(e) {
    if (off) return
    const delta = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP }[e.key]
    if (delta === undefined) return
    e.preventDefault()
    onValue(snap(value + delta))
  }

  return (
    <div className="dial">
      <div className="dial-head">
        <div className="dial-who">{label}</div>
        <div className={`dial-read ${off ? 'zero' : ratingClass(value)}`}>
          {off ? '–' : fmt(value)}
        </div>
      </div>

      <div
        className={`dial-track ${off ? 'is-off' : ''}`}
        ref={trackRef}
        role="slider"
        tabIndex={off ? -1 : 0}
        aria-label={`${label} rating`}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={off ? undefined : value}
        aria-valuetext={off ? 'not rated' : fmt(value)}
        aria-disabled={off || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => grabbing && setFromX(e.clientX)}
        onPointerUp={() => setGrabbing(false)}
        onPointerCancel={() => setGrabbing(false)}
        onKeyDown={onKeyDown}
      >
        <div
          className="dial-fill"
          style={{ left: `${Math.min(50, pct)}%`, width: `${Math.abs(pct - 50)}%` }}
        />
        <div className="dial-mid" />
        <div className={`dial-knob ${grabbing ? 'grab' : ''}`} style={{ left: `${pct}%` }} />
      </div>

      <div className="dial-ticks">
        <span>−3</span><span>−2</span><span>−1</span><span>0</span><span>+1</span><span>+2</span><span>+3</span>
      </div>

      {locked ? (
        <p className="dial-locked">{lockedHint}</p>
      ) : (
        <label className="radio dial-unrated">
          <input
            type="checkbox"
            checked={notRated}
            onChange={(e) => onNotRated(e.target.checked)}
          />
          <span className="dot" /> Haven’t decided yet
        </label>
      )}
    </div>
  )
}
