import Button from 'react-bootstrap/Button'

export default function DirtyBar({ show, publishing, onPublish, onExport, onDiscard }) {
  if (!show) return null
  return (
    <div className="dirty-bar fixed-bottom border-top">
      <div className="container-xl d-flex flex-wrap align-items-center gap-2 py-2">
        <span className="me-auto small">⚠️ Unpublished changes (saved on this device only)</span>
        <Button size="sm" variant="warning" onClick={onPublish} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish to GitHub'}
        </Button>
        <Button size="sm" variant="outline-secondary" onClick={onExport}>
          Export JSON
        </Button>
        <Button size="sm" variant="outline-secondary" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  )
}
