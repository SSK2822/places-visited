import { useEffect, useRef } from 'react'
import {
  overall, fmt, ratingClass, mapsUrl, fullyRated, scoreHidden, fmtVisited, cuisineLabel,
} from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

const SWIPE_THRESHOLD = 70 // px of horizontal travel that commits to a step
const EDGE_GUARD = 24 // px at each screen edge left to the OS back/forward swipe

export default function PlaceDetail({
  place, rank, categoryRank, myKey, nav, onPrev, onNext, onBack, onEdit,
}) {
  const ov = overall(place)
  const complete = fullyRated(place)
  // Someone's rated, you haven't — the reveal is one tap away.
  const hiddenEditor = EDITORS.find((e) => scoreHidden(place, e.key, myKey))
  const iHaventRated = myKey && (place[myKey] === null || place[myKey] === undefined)
  const canBrowse = nav && nav.total > 1

  // ← / → step through the list this place was opened from. Ignored while
  // typing, or with a modifier held (so browser shortcuts still work).
  useEffect(() => {
    if (!canBrowse) return
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.key === 'ArrowLeft' && nav.hasPrev) {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight' && nav.hasNext) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canBrowse, nav, onPrev, onNext])

  // Swipe: the page follows your finger horizontally, then either commits to a
  // step or springs back. The axis locks on the first ~10px, so a vertical
  // scroll is never hijacked. Transforms are written straight to the element
  // rather than through state, so dragging doesn't re-render every frame.
  const bodyRef = useRef(null)
  const gesture = useRef(null)

  function springBack() {
    const el = bodyRef.current
    if (!el) return
    el.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1), opacity .25s ease'
    el.style.transform = ''
    el.style.opacity = ''
  }

  function onTouchStart(e) {
    if (!canBrowse || e.touches.length !== 1) return
    const t = e.touches[0]
    if (t.clientX < EDGE_GUARD || t.clientX > window.innerWidth - EDGE_GUARD) return
    gesture.current = { x: t.clientX, y: t.clientY, axis: null, dx: 0 }
  }

  function onTouchMove(e) {
    const g = gesture.current
    if (!g || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - g.x
    const dy = t.clientY - g.y
    if (!g.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (g.axis !== 'x') return
    // Resist when there's nothing on that side, so the end of the list is felt.
    const blocked = (dx > 0 && !nav.hasPrev) || (dx < 0 && !nav.hasNext)
    g.dx = blocked ? dx * 0.25 : dx
    const el = bodyRef.current
    if (el) {
      el.style.transition = 'none'
      el.style.transform = `translateX(${g.dx}px)`
      el.style.opacity = String(1 - Math.min(Math.abs(g.dx) / 600, 0.35))
    }
  }

  function onTouchEnd() {
    const g = gesture.current
    gesture.current = null
    if (!g || g.axis !== 'x') return
    if (g.dx <= -SWIPE_THRESHOLD && nav.hasNext) return onNext()
    if (g.dx >= SWIPE_THRESHOLD && nav.hasPrev) return onPrev()
    springBack()
  }

  const enter = nav?.dir === 'next' ? 'from-right' : nav?.dir === 'prev' ? 'from-left' : ''

  return (
    <section
      className={`view d-swipe ${enter}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div className="d-topbar">
        <button className="back" onClick={onBack}>
          ← Back to the ledger
        </button>
        {canBrowse && (
          <div className="d-pager">
            <button className="d-step" onClick={onPrev} disabled={!nav.hasPrev} aria-label="Previous place">
              ‹
            </button>
            <span className="d-pos" aria-live="polite">
              {nav.position} of {nav.total}
              <span className="d-pos-label"> · {nav.label}</span>
            </span>
            <button className="d-step" onClick={onNext} disabled={!nav.hasNext} aria-label="Next place">
              ›
            </button>
          </div>
        )}
      </div>

      <div className="d-body" ref={bodyRef}>
        <div className="d-kicker">
          {rank >= 0 ? (
            <>
              No. {rank + 1} overall
              {categoryRank >= 0 && (
                <>
                  <span className="d-kicker-sep"> · </span>
                  <span className="d-kicker-cat">No. {categoryRank + 1} in {cuisineLabel(place.cuisine)}</span>
                </>
              )}
            </>
          ) : (
            'Awaiting a verdict'
          )}
        </div>
        <h1 className="d-name">{place.name}</h1>
        <div className="d-meta">
          {place.cuisine} · {place.city} ·{' '}
          <a href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">
            Open in Maps ↗
          </a>
        </div>
        {fmtVisited(place.visited) && (
          <div className="d-visited">🗓 Visited {fmtVisited(place.visited)}</div>
        )}

        <div className="d-scores">
          {EDITORS.map((e) => {
            const hidden = scoreHidden(place, e.key, myKey)
            return (
              <div className="d-score" key={e.key}>
                <div className="d-score-lab">{e.label}</div>
                {hidden ? (
                  <div className="d-score-fig hidden-score">🙈</div>
                ) : (
                  <div className={`d-score-fig ${ratingClass(place[e.key])}`}>{fmt(place[e.key])}</div>
                )}
              </div>
            )
          })}
          <div className="d-score overall">
            <div className="d-score-lab">Overall</div>
            <div className={`d-score-fig ${complete ? ratingClass(ov) : 'zero'}`}>
              {complete ? fmt(ov) : '–'}
            </div>
          </div>
        </div>

        {hiddenEditor && (
          <p className="reveal-hint">
            🙈 {hiddenEditor.name} has already rated — score it yourself to reveal the verdict.
          </p>
        )}

        <div className="section-head">Table talk</div>
        <ul className="talk">
          {EDITORS.map((e) => {
            const text = place[`${e.key}Comment`]
            const hidden = scoreHidden(place, e.key, myKey)
            return (
              <li key={e.key}>
                <div className="who">{e.label}</div>
                {hidden ? (
                  <div className="what empty">🙈 Hidden until you rate.</div>
                ) : (
                  <div className={`what ${text ? '' : 'empty'}`}>{text || 'No note yet.'}</div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={() => onEdit(place)}>
            {iHaventRated ? 'Rate it →' : 'Edit ratings'}
          </button>
        </div>

        {canBrowse && (
          <p className="d-swipe-hint">Swipe left or right to flip through {nav.label}</p>
        )}
      </div>
    </section>
  )
}
