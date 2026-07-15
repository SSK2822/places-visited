import { overall, fmt, ratingClass, mapsUrl } from '../lib/utils'
import { DEFAULT_CITY } from '../lib/constants'

function RatingPill({ label, value, emphasis }) {
  return (
    <div className={`rating-pill flex-fill text-center border rounded-2 py-1 ${emphasis ? 'rating-pill-overall' : ''}`}>
      <div className="text-body-secondary text-uppercase rating-pill-label">{label}</div>
      <div className={`fw-bolder ${ratingClass(value)}`}>{fmt(value)}</div>
    </div>
  )
}

export default function PlaceCard({ place, onEdit }) {
  const ov = overall(place)
  return (
    <div className="card place-card h-100">
      <div className="card-body d-flex flex-column gap-2 position-relative">
        <div className="position-absolute top-0 end-0 mt-2 me-2 d-flex gap-1">
          <a
            className="btn btn-sm btn-link text-decoration-none p-1"
            href={mapsUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Maps"
          >
            📍
          </a>
          <button className="btn btn-sm btn-link text-decoration-none p-1" onClick={onEdit} title="Edit">
            ✏️
          </button>
        </div>
        <h2 className="h6 fw-bold mb-0 pe-5">{place.name}</h2>
        <div className="d-flex flex-wrap gap-1">
          <span className="badge text-bg-secondary fw-semibold">{place.cuisine}</span>
          {place.city !== DEFAULT_CITY && (
            <span className="badge text-bg-warning fw-semibold">{place.city}</span>
          )}
        </div>
        {place.notes && (
          <p className="text-body-secondary small fst-italic mb-0">{place.notes}</p>
        )}
        <div className="d-flex gap-2 mt-auto pt-1">
          <RatingPill label="YK" value={place.yk} />
          <RatingPill label="Ac" value={place.ac} />
          <RatingPill label="Overall" value={ov} emphasis />
        </div>
      </div>
    </div>
  )
}
