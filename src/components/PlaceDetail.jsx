import { overall, fmt, ratingClass, mapsUrl } from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

export default function PlaceDetail({ place, rank, onBack, onEdit }) {
  const ov = overall(place)
  const scores = [
    ...EDITORS.map((e) => ({ label: e.label, value: place[e.key], overall: false })),
    { label: 'Overall', value: ov, overall: true },
  ]

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
        {scores.map((s) => (
          <div className={`d-score ${s.overall ? 'overall' : ''}`} key={s.label}>
            <div className="d-score-lab">{s.label}</div>
            <div className={`d-score-fig ${ratingClass(s.value)}`}>{fmt(s.value)}</div>
          </div>
        ))}
      </div>

      <div className="section-head">Table talk</div>
      <ul className="talk">
        {EDITORS.map((e) => {
          const text = place[`${e.key}Comment`]
          return (
            <li key={e.key}>
              <div className="who">{e.label}</div>
              <div className={`what ${text ? '' : 'empty'}`}>{text || 'No note yet.'}</div>
            </li>
          )
        })}
      </ul>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => onEdit(place)}>
          Edit ratings
        </button>
      </div>
    </section>
  )
}
