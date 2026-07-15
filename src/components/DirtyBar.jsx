export default function DirtyBar({ show, publishing, onPublish, onExport, onDiscard }) {
  if (!show) return null
  return (
    <div className="dirty-bar">
      <div className="dirty-inner">
        <span className="msg">Unpublished changes — saved on this device only.</span>
        <button className="btn btn-primary" onClick={onPublish} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish to GitHub'}
        </button>
        <button className="btn btn-secondary" onClick={onExport}>
          Export JSON
        </button>
        <button className="btn btn-ghost" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  )
}
