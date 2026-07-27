import Dialog from './Dialog'

// The reveal bell's contents: a digest of pairs the partner completed while you
// were away. Deliberately no scores here — the numbers stay sealed until you
// tap an item and watch the reveal, so the surprise survives the batching.
export default function NotificationsDialog({ show, items, partnerName, onPick, onClose }) {
  const actions = (
    <button className="btn btn-secondary" onClick={onClose}>
      Close
    </button>
  )
  return (
    <Dialog show={show} title="While you were away" onClose={onClose} actions={actions}>
      {items.length ? (
        <>
          <p className="text-muted">
            {partnerName} weighed in on {items.length}{' '}
            {items.length === 1 ? 'place' : 'places'} — tap to reveal how you matched.
          </p>
          <ul className="notif-list">
            {items.map((p) => (
              <li key={p.id}>
                <button className="notif-item" onClick={() => onPick(p)}>
                  <span className="notif-text">
                    <span className="notif-name">{p.name}</span>
                    <span className="notif-meta">{p.cuisine} · {p.city}</span>
                  </span>
                  <span className="notif-cta">Reveal →</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted">All caught up — nothing new to reveal.</p>
      )}
    </Dialog>
  )
}
