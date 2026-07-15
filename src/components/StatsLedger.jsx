export default function StatsLedger({ stats }) {
  const items = [
    [stats.total, 'places logged'],
    [stats.rated, 'rated so far'],
    [stats.unrated, 'awaiting a verdict'],
    [stats.topCuisine, 'top cuisine'],
  ]
  return (
    <div className="stats">
      {items.map(([value, label]) => (
        <div className="stat" key={label}>
          <div className="stat-fig">{value}</div>
          <div className="stat-lab">{label}</div>
        </div>
      ))}
    </div>
  )
}
