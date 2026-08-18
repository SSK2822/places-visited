import { useMemo } from 'react'
import { fmt, ratingClass, ratingGap, fullyRated } from '../lib/utils'
import { EDITORS } from '../lib/firebase-config'

// Only fully-rated places can be compared — which conveniently means everything
// here is already revealed, so the blind-rating gate never applies.
const TOP_N = 10

// A verdict on the pair as a whole, from the average gap. Deliberately its own
// scale rather than the reveal's per-place one, which reads the sign of two
// scores and would produce nonsense copy when fed an average distance.
function summaryVerdict(avg) {
  if (avg <= 0.25) return { title: 'Practically one palate 🍽', line: 'Your scores barely disagree. Suspicious, honestly.' }
  if (avg <= 0.6) return { title: 'In step 🤝', line: 'Small differences, same instincts.' }
  if (avg <= 1.1) return { title: 'Healthy debate 🌶️', line: 'You agree on the big calls and argue about the rest.' }
  if (avg <= 1.8) return { title: 'Divided table 🍴', line: 'A lot of "how did you like that?" energy.' }
  return { title: 'Far opps fr 🧨', line: 'Genuinely remarkable that you still eat together.' }
}

function GapRow({ place, index, onOpen }) {
  const gap = ratingGap(place)
  return (
    <li
      className="row is-in cmp-row"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(place)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(place)
        }
      }}
    >
      <div className="rank">{index + 1}</div>
      <div>
        <h3 className="r-name">{place.name}</h3>
        <div className="r-meta">{place.cuisine} · {place.city}</div>
      </div>
      <div className="scores">
        {EDITORS.map((e) => (
          <div className="score" key={e.key}>
            <div className="score-lab">{e.label}</div>
            <div className={`score-fig ${ratingClass(place[e.key])}`}>{fmt(place[e.key])}</div>
          </div>
        ))}
        <div className="score">
          <div className="score-lab">Gap</div>
          <div className={`score-fig cmp-gap ${gap === 0 ? 'is-zero' : ''}`}>
            {gap === 0 ? '—' : gap.toFixed(2).replace(/\.?0+$/, '')}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function Compare({ places, onOpen }) {
  const rated = useMemo(() => places.filter(fullyRated), [places])

  const stats = useMemo(() => {
    if (!rated.length) return null
    const gaps = rated.map(ratingGap)
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const identical = gaps.filter((g) => g === 0).length
    const close = gaps.filter((g) => g <= 0.5).length
    // Who runs more generous overall — a fun aside, not a judgement.
    const means = EDITORS.map((e) => ({
      label: e.label,
      name: e.name,
      mean: rated.reduce((a, p) => a + p[e.key], 0) / rated.length,
    }))
    const softest = [...means].sort((a, b) => b.mean - a.mean)[0]
    return { avg, identical, close, means, softest, total: rated.length }
  }, [rated])

  if (!stats) {
    return (
      <p className="pending-note">
        Nothing to compare yet — you both need to rate the same place first.
      </p>
    )
  }

  const byGap = [...rated].sort(
    (a, b) => ratingGap(a) - ratingGap(b) || a.name.localeCompare(b.name),
  )
  const agreed = byGap.slice(0, TOP_N)
  const clashed = [...byGap].reverse().slice(0, TOP_N)
  const headline = summaryVerdict(stats.avg)

  return (
    <div className="cmp">
      <div className="stats cmp-stats">
        <div className="stat">
          <div className="stat-fig">{stats.avg.toFixed(2).replace(/\.?0+$/, '')}</div>
          <div className="stat-lab">average gap</div>
        </div>
        <div className="stat">
          <div className="stat-fig">{stats.identical}</div>
          <div className="stat-lab">exact matches</div>
        </div>
        <div className="stat">
          <div className="stat-fig">{Math.round((stats.close / stats.total) * 100)}%</div>
          <div className="stat-lab">within half a point</div>
        </div>
        <div className="stat">
          <div className="stat-fig">{stats.softest.label}</div>
          <div className="stat-lab">softer touch</div>
        </div>
      </div>

      <p className="cmp-headline">
        <b>{headline.title}</b> {headline.line}
      </p>

      <p className="cmp-means">
        {stats.means.map((m, i) => (
          <span key={m.label}>
            {i > 0 && ' · '}
            {m.name} averages{' '}
            <span className={ratingClass(m.mean)}>{fmt(m.mean)}</span>
          </span>
        ))}
      </p>

      <div className="section-head">Where you agree · closest {agreed.length}</div>
      <p className="section-sub">Same wavelength, same verdict.</p>
      <ol className="list">
        {agreed.map((p, i) => (
          <GapRow key={p.id} place={p} index={i} onOpen={onOpen} />
        ))}
      </ol>

      <div className="section-head urgent">Where you clash · furthest {clashed.length}</div>
      <p className="section-sub">One of you has some explaining to do.</p>
      <ol className="list">
        {clashed.map((p, i) => (
          <GapRow key={p.id} place={p} index={i} onOpen={onOpen} />
        ))}
      </ol>
    </div>
  )
}
