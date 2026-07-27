// Surprise, as its own feature rather than a line in the masthead: a bordered
// card that lifts on hover, so the one playful moment reads as a thing you do.
export default function SurpriseCard({ onSurprise }) {
  return (
    <button className="surprise-card" onClick={onSurprise}>
      <span className="surprise-card-orn" aria-hidden="true">❦</span>
      <span className="surprise-card-text">
        <span className="surprise-card-title">Surprise us</span>
        <span className="surprise-card-sub">Can’t decide? Let the ledger pick tonight’s spot.</span>
      </span>
      <span className="surprise-card-arrow" aria-hidden="true">→</span>
    </button>
  )
}
