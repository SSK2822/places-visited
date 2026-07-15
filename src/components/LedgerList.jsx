import useInView from '../hooks/useInView'
import CountUp from './CountUp'
import { overall, fmt, ratingClass, latestComment } from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

// The reference frame staggered every row by index — fine for its 12 fixtures,
// but this ledger runs to hundreds, and an index-scaled delay makes a row you
// scrolled to sit blank for seconds before it fades. Stagger the opening
// cascade only; rows further down reveal as soon as they're reached (scrolling
// crosses them one by one, so the cascade reads the same).
const CASCADE = 8
const revealDelay = (index, step) => (index < CASCADE ? index * step : 0)

function onActivate(fn) {
  return (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    fn()
  }
}

function RankedRow({ place, index, onOpen }) {
  const [ref, inView] = useInView({ delay: revealDelay(index, 60) })
  const ov = overall(place)
  const comment = latestComment(place)

  return (
    <li
      ref={ref}
      className={`row ${inView ? 'is-in' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(place)}
      onKeyDown={onActivate(() => onOpen(place))}
    >
      <div className="rank">{index + 1}</div>
      <div>
        <h3 className="r-name">{place.name}</h3>
        <div className="r-meta">
          {place.cuisine} · {place.city}
        </div>
        {comment && (
          <p className="r-note">
            <span className="who">{comment.name}:</span>
            {comment.text}
          </p>
        )}
      </div>
      <div className="scores">
        {EDITORS.map((e) => (
          <div className="score" key={e.key}>
            <div className="score-lab">{e.label}</div>
            <div className={`score-fig ${ratingClass(place[e.key])}`}>{fmt(place[e.key])}</div>
          </div>
        ))}
        <div className="score overall">
          <div className="score-lab">Overall</div>
          <CountUp value={ov} start={inView} className={`score-fig ${ratingClass(ov)}`} />
        </div>
      </div>
    </li>
  )
}

function PendingRow({ place, index, onOpen, onRate }) {
  const [ref, inView] = useInView({ delay: revealDelay(index, 55) })
  return (
    <li
      ref={ref}
      className={`row pending ${inView ? 'is-in' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(place)}
      onKeyDown={onActivate(() => onOpen(place))}
    >
      <div className="rank">–</div>
      <div>
        <h3 className="r-name">{place.name}</h3>
        <div className="r-meta">
          {place.cuisine} · {place.city}
        </div>
      </div>
      <button
        className="rate-link"
        onClick={(e) => {
          e.stopPropagation()
          onRate(place)
        }}
      >
        Rate it →
      </button>
    </li>
  )
}

export default function LedgerList({ places, mode, onOpen, onRate }) {
  if (mode === 'pending') {
    return (
      <>
        <p className="pending-note">
          Been here, verdict still pending — give it a score when you’re ready.
        </p>
        {places.length ? (
          <ol className="list">
            {places.map((p, i) => (
              <PendingRow key={p.id} place={p} index={i} onOpen={onOpen} onRate={onRate} />
            ))}
          </ol>
        ) : (
          <p className="pending-note">Nothing left to rate. Impressive.</p>
        )}
      </>
    )
  }

  if (!places.length) return <p className="pending-note">Nothing matches — try another cuisine.</p>

  return (
    <ol className="list">
      {places.map((p, i) => (
        <RankedRow key={p.id} place={p} index={i} onOpen={onOpen} />
      ))}
    </ol>
  )
}
