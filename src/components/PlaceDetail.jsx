import { overall, fmt, ratingClass, mapsUrl, fullyRated, scoreHidden } from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

export default function PlaceDetail({ place, rank, myKey, onBack, onEdit }) {
  const ov = overall(place)
  const complete = fullyRated(place)
  // Someone's rated, you haven't — the reveal is one tap away.
  const hiddenEditor = EDITORS.find((e) => scoreHidden(place, e.key, myKey))
  const iHaventRated = myKey && (place[myKey] === null || place[myKey] === undefined)

  return (
    <section className="view">
      <button className="back" onClick={onBack}>
        ← Back to the ledger
      </button>

      <div className="d-kicker">
        {rank >= 0 ? `No. ${rank + 1} in the ranking` : 'Awaiting a verdict'}
      </div>
      <h1 className="d-name">{place.name}</h1>
      <div className="d-meta">
        {place.cuisine} · {place.city} ·{' '}
        <a href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">
          Open in Maps ↗
        </a>
      </div>

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
    </section>
  )
}
