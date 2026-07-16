// A read or write against Firestore failed. We deliberately stop here rather
// than fall back to a partial or empty ledger: an empty-looking ledger is what
// invites a destructive "import over the top", so when the data can't be
// trusted the app shows this and nothing else.
export default function CloudError({ error, what }) {
  const detail = [error?.code, error?.message].filter(Boolean).join(' — ')
  return (
    <section className="view cloud-error">
      <div className="rule-orn">
        <i>❦</i>
      </div>
      <h1 className="form-title">The ledger didn’t {what === 'write' ? 'save' : 'load'}</h1>
      <p>
        {what === 'write'
          ? 'Your change was not written. The ledger is untouched.'
          : 'The ledger could not be read, so nothing is being shown — an empty page here would be a lie, not a database.'}
      </p>
      <pre className="cloud-error-detail">{detail || 'Unknown error'}</pre>
      <p className="text-muted">
        No places have been added, changed or removed. Reload to try again; if this keeps
        happening, check the Firestore rules and that you’re online before touching anything
        that writes.
      </p>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    </section>
  )
}
