import { overall, fmt, ratingClass, mapsUrl, cuisineHue, latestComment } from '../lib/utils'
import { DEFAULT_CITY } from '../lib/constants'

function RatingPill({ label, value, emphasis }) {
  return (
    <div className={`rating-pill flex-fill text-center rounded-3 py-1 ${ratingClass(value)} ${emphasis ? 'rating-pill-overall' : ''}`}>
      <div className="text-uppercase rating-pill-label">{label}</div>
      <div className="fw-bolder">{fmt(value)}</div>
    </div>
  )
}

export default function PlaceCard({ place, onEdit }) {
  const ov = overall(place)
  const comment = latestComment(place)
  return (
    <div
      className="card place-card h-100"
      style={{ '--hue': cuisineHue(place.cuisine) }}
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
    >
      <div className="card-body d-flex flex-column gap-2 position-relative">
        <a
          className="btn btn-sm btn-link text-decoration-none p-1 position-absolute top-0 end-0 mt-2 me-2"
          href={mapsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Maps"
          onClick={(e) => e.stopPropagation()}
        >
          📍
        </a>
        <h2 className="h6 fw-bold mb-0 pe-5">{place.name}</h2>
        <div className="d-flex flex-wrap gap-1">
          <span className="badge cuisine-badge rounded-pill">{place.cuisine}</span>
          {place.city !== DEFAULT_CITY && (
            <span className="badge city-badge rounded-pill">{place.city}</span>
          )}
        </div>
        {comment && (
          <p className="text-body-secondary small fst-italic mb-0">
            <span className="fw-semibold">{comment.name}:</span> {comment.text}
          </p>
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
