import useInView from '../hooks/useInView'
import CountUp from './CountUp'
import { overall, fmt, ratingClass, latestComment, pendingEditors } from '../lib/utils'
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

// `rank` is the position label (a number, or null → em-dash for an unrated
// place shown in the "All" list); `index` drives only the reveal stagger.
function RankedRow({ place, rank, index, onOpen }) {
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
      <div className="rank">{rank == null ? '–' : rank}</div>
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

// `waitingOn` set (a partner label) means the viewer has already scored this
// place — it's not their action, so the row is muted and the "Rate it" button
// is replaced with a passive "you're done" marker.
function PendingRow({ place, index, onOpen, onRate, waitingOn }) {
  const [ref, inView] = useInView({ delay: revealDelay(index, 55) })
  // Half-scored places live here too now, so show the score already in and who
  // the ledger is still waiting on — otherwise it looks like nobody has rated.
  const waiting = pendingEditors(place)
  const halfway = waiting.length && waiting.length < EDITORS.length

  return (
    <li
      ref={ref}
      className={`row pending ${waitingOn ? 'row-waiting' : ''} ${inView ? 'is-in' : ''}`}
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
        {halfway && (
          <div className="r-status">
            {EDITORS.map((e) => (
              <span key={e.key}>
                <span className="who">{e.label}</span>{' '}
                {place[e.key] == null
                  ? <span className="await">to rate</span>
                  : <span className={ratingClass(place[e.key])}>{fmt(place[e.key])}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
      {waitingOn ? (
        <span className="rate-done">You’re in&nbsp;✓</span>
      ) : (
        <button
          className="rate-link"
          onClick={(e) => {
            e.stopPropagation()
            onRate(place)
          }}
        >
          Rate it →
        </button>
      )}
    </li>
  )
}

export default function LedgerList({ tab, ranked, unrated, myKey, onOpen, onRate }) {
  if (tab === 'torate') {
    if (!unrated.length) {
      return <p className="pending-note">Nothing left to rate. Impressive.</p>
    }

    // Signed out (or not an editor): no personal "your turn", so keep one plain
    // list — the row buttons prompt sign-in when tapped.
    if (!myKey) {
      return (
        <>
          <p className="pending-note">
            Been here, verdict still pending — give it a score when you’re ready.
          </p>
          <ol className="list">
            {unrated.map((p, i) => (
              <PendingRow key={p.id} place={p} index={i} onOpen={onOpen} onRate={onRate} />
            ))}
          </ol>
        </>
      )
    }

    // Signed in: split into what's yours to do and what's on the other person.
    // "Mine" (I haven't rated) splits further — a place the partner already
    // scored is more urgent than one neither of us has touched, so it gets its
    // own section above the regular queue instead of blending in.
    const partner = EDITORS.find((e) => e.key !== myKey)
    const mine = unrated.filter((p) => p[myKey] === null || p[myKey] === undefined)
    const theirs = unrated.filter((p) => p[myKey] !== null && p[myKey] !== undefined)
    const overdue = partner ? mine.filter((p) => p[partner.key] !== null && p[partner.key] !== undefined) : []
    const queued = partner ? mine.filter((p) => p[partner.key] === null || p[partner.key] === undefined) : mine

    return (
      <>
        {overdue.length > 0 && (
          <>
            <div className="section-head urgent">Overdue · {overdue.length}</div>
            <p className="section-sub">{partner.name} already weighed in — no more stalling.</p>
            <ol className="list">
              {overdue.map((p, i) => (
                <PendingRow key={p.id} place={p} index={i} onOpen={onOpen} onRate={onRate} />
              ))}
            </ol>
          </>
        )}
        {queued.length > 0 && (
          <>
            <div className="section-head">Your turn · {queued.length}</div>
            <ol className="list">
              {queued.map((p, i) => (
                <PendingRow key={p.id} place={p} index={i} onOpen={onOpen} onRate={onRate} />
              ))}
            </ol>
          </>
        )}
        {theirs.length > 0 && (
          <>
            <div className="section-head">Waiting on {partner?.name || 'the other'} · {theirs.length}</div>
            <ol className="list">
              {theirs.map((p, i) => (
                <PendingRow key={p.id} place={p} index={i} onOpen={onOpen} waitingOn={partner?.label} />
              ))}
            </ol>
          </>
        )}
      </>
    )
  }

  if (tab === 'top') {
    const top = ranked.slice(0, 10)
    if (!top.length) return <p className="pending-note">No rated places yet — start scoring.</p>
    return (
      <ol className="list">
        {top.map((p, i) => (
          <RankedRow key={p.id} place={p} rank={i + 1} index={i} onOpen={onOpen} />
        ))}
      </ol>
    )
  }

  // 'all' — the whole filtered ledger: rated first (numbered), then unrated.
  if (!ranked.length && !unrated.length) {
    return <p className="pending-note">Nothing matches — try another cuisine.</p>
  }
  return (
    <ol className="list">
      {ranked.map((p, i) => (
        <RankedRow key={p.id} place={p} rank={i + 1} index={i} onOpen={onOpen} />
      ))}
      {unrated.map((p, i) => (
        <RankedRow key={p.id} place={p} rank={null} index={ranked.length + i} onOpen={onOpen} />
      ))}
    </ol>
  )
}
