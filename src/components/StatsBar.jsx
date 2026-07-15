export default function StatsBar({ stats }) {
  const items = [
    { label: 'places', value: stats.total, icon: '📍', accent: 'coral' },
    { label: 'rated', value: stats.rated, icon: '⭐', accent: 'gold' },
    { label: 'avg overall', value: stats.avg, icon: '🎯', accent: 'teal' },
    { label: 'top cuisine', value: stats.topCuisine, icon: '👑', accent: 'violet' },
  ]
  return (
    <div className="row g-2 mb-2">
      {items.map((s) => (
        <div className="col-6 col-md-3" key={s.label}>
          <div className={`stat-card stat-${s.accent} rounded-4 px-3 py-2 d-flex align-items-center gap-2`}>
            <span className="stat-icon" aria-hidden="true">{s.icon}</span>
            <div className="lh-sm">
              <b className="d-block fs-5">{s.value}</b>
              <span className="text-body-secondary small">{s.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
