export default function LedgerControls({
  query, setQuery,
  cuisine, setCuisine, chips,
  mode, setMode,
  onAdd,
}) {
  return (
    <>
      <div className="controls">
        <div className="search-row">
          <input
            className="input"
            type="search"
            placeholder="Search the ledger…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the ledger"
          />
        </div>

        <div className="chips">
          <button
            className={`tag tag-outline chip ${cuisine === '' ? 'on' : ''}`}
            aria-pressed={cuisine === ''}
            onClick={() => setCuisine('')}
          >
            All
          </button>
          {chips.map((c) => (
            <button
              key={c.name}
              className={`tag tag-outline chip ${cuisine === c.name ? 'on' : ''}`}
              aria-pressed={cuisine === c.name}
              onClick={() => setCuisine(cuisine === c.name ? '' : c.name)}
            >
              {c.name}
              <span className="chip-count">{c.count}</span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={onAdd}>
            Add a place
          </button>
        </div>
      </div>

      <div className="mode">
        <div className="seg">
          <label className="seg-opt">
            <input
              type="radio"
              name="mode"
              value="ranked"
              checked={mode === 'ranked'}
              onChange={() => setMode('ranked')}
            />
            Ranked
          </label>
          <label className="seg-opt">
            <input
              type="radio"
              name="mode"
              value="pending"
              checked={mode === 'pending'}
              onChange={() => setMode('pending')}
            />
            To rate
          </label>
        </div>
      </div>
    </>
  )
}
