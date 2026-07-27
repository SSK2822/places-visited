import { useMemo, useState } from 'react'
import { overall, fmt, ratingClass, fmtVisited, fullyRated, scoreHidden, latestComment } from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

// A month grid of visits. Days with a logged place are marked with a count and
// are tappable; tapping lists what you ate that day. Prev/next walk the months.
export default function Calendar({ places, myKey, onOpen }) {
  const today = new Date()
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState(null)

  const byDate = useMemo(() => {
    const map = {}
    places.forEach((p) => {
      if (p.visited) (map[p.visited] ||= []).push(p)
    })
    return map
  }, [places])

  const first = new Date(ym.y, ym.m, 1)
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const startWeekday = first.getDay()
  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate())

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const step = (delta) => {
    setSelected(null)
    setYm(({ y, m }) => {
      const next = m + delta
      if (next < 0) return { y: y - 1, m: 11 }
      if (next > 11) return { y: y + 1, m: 0 }
      return { y, m: next }
    })
  }

  const selectedPlaces = selected ? byDate[selected] || [] : []

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => step(-1)} aria-label="Previous month">‹</button>
        <div className="cal-month">{monthLabel}</div>
        <button className="cal-nav" onClick={() => step(1)} aria-label="Next month">›</button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-wd">{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} className="cal-cell empty" />
          const date = iso(ym.y, ym.m, d)
          const count = byDate[date]?.length || 0
          return (
            <button
              key={date}
              className={`cal-cell ${count ? 'has' : ''} ${selected === date ? 'sel' : ''} ${date === todayIso ? 'today' : ''}`}
              onClick={() => count && setSelected(selected === date ? null : date)}
              disabled={!count}
            >
              <span className="cal-day">{d}</span>
              {count > 0 && <span className="cal-dot">{count}</span>}
            </button>
          )
        })}
      </div>

      {selected ? (
        <div className="cal-list">
          <div className="section-head">
            {fmtVisited(selected)} · {selectedPlaces.length} {selectedPlaces.length === 1 ? 'place' : 'places'}
          </div>
          <ol className="list">
            {selectedPlaces.map((p) => {
              const complete = fullyRated(p)
              const ov = complete ? overall(p) : null
              // Only preview a note once both have rated, so a partner's comment
              // can't give their verdict away before the reveal.
              const comment = complete ? latestComment(p) : null
              return (
                <li
                  key={p.id}
                  className="row is-in"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpen(p)
                    }
                  }}
                >
                  <div className="rank">·</div>
                  <div>
                    <h3 className="r-name">{p.name}</h3>
                    <div className="r-meta">{p.cuisine} · {p.city}</div>
                    {comment && (
                      <p className="r-note">
                        <span className="who">{comment.name}:</span>
                        {comment.text}
                      </p>
                    )}
                  </div>
                  <div className="scores">
                    {EDITORS.map((e) => {
                      const hidden = scoreHidden(p, e.key, myKey)
                      return (
                        <div className="score" key={e.key}>
                          <div className="score-lab">{e.label}</div>
                          {hidden ? (
                            <div className="score-fig hidden-score" title="Hidden until you rate">🙈</div>
                          ) : (
                            <div className={`score-fig ${ratingClass(p[e.key])}`}>{fmt(p[e.key])}</div>
                          )}
                        </div>
                      )
                    })}
                    <div className="score overall">
                      <div className="score-lab">Overall</div>
                      <div className={`score-fig ${ratingClass(ov)}`}>{ov === null ? '–' : fmt(ov)}</div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      ) : (
        <p className="pending-note cal-empty">Pick a marked day to see what you ate.</p>
      )}
    </div>
  )
}
