const TABS = [
  ['top', 'Top 10'],
  ['all', 'All rated'],
  ['torate', 'To rate'],
  ['calendar', 'Calendar'],
]

export default function LedgerControls({
  query, setQuery,
  cuisine, setCuisine, chips,
  tab, setTab,
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

      </div>

      <div className="mode">
        <div className="seg">
          {TABS.map(([value, label]) => (
            <label className="seg-opt" key={value}>
              <input
                type="radio"
                name="tab"
                value={value}
                checked={tab === value}
                onChange={() => setTab(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
