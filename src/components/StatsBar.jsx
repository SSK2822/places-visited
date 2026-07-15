export default function StatsBar({ stats }) {
  const items = [
    { label: 'places', value: stats.total },
    { label: 'rated', value: stats.rated },
    { label: 'avg overall', value: stats.avg },
    { label: 'top cuisine', value: stats.topCuisine },
  ]
  return (
    <div className="row g-2 mb-2">
      {items.map((s) => (
        <div className="col-6 col-md-3" key={s.label}>
          <div className="stat-card border rounded-3 px-3 py-2">
            <b className="d-block fs-6">{s.value}</b>
            <span className="text-body-secondary small">{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
