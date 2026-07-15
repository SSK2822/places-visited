import { useEffect } from 'react'

// The design system's .dialog over its backdrop. Replaces react-bootstrap's
// Modal so the app has exactly one styling vocabulary.
export default function Dialog({ show, title, onClose, children, actions }) {
  useEffect(() => {
    if (!show) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="dialog-title">{title}</div>
          <button className="btn btn-ghost dialog-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  )
}
