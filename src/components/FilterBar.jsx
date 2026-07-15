import Form from 'react-bootstrap/Form'
import { cuisineHue } from '../lib/utils'

export default function FilterBar({
  query, setQuery,
  city, setCity, cities,
  ratingFilter, setRatingFilter,
  sort, setSort,
  cuisine, setCuisine,
  chips,
}) {
  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-2">
        <Form.Control
          type="search"
          placeholder="Search places, cuisine, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow-1 rounded-pill px-3"
          style={{ minWidth: '180px', flexBasis: '200px' }}
        />
        <Form.Select value={city} onChange={(e) => setCity(e.target.value)} className="w-auto">
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Form.Select>
        <Form.Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="w-auto">
          <option value="">Any rating</option>
          <option value="rated">Rated</option>
          <option value="unrated">Unrated</option>
          <option value="2">Overall ≥ +2</option>
          <option value="1">Overall ≥ +1</option>
          <option value="0">Overall ≥ 0</option>
          <option value="neg">Overall &lt; 0</option>
        </Form.Select>
        <Form.Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
          <option value="name">Sort: Name</option>
          <option value="overall">Sort: Overall ↓</option>
          <option value="yk">Sort: YK ↓</option>
          <option value="ac">Sort: Ac ↓</option>
        </Form.Select>
      </div>

      <div className="cuisine-chips">
        <button
          style={{ '--hue': 16 }}
          className={`chip btn btn-sm rounded-pill ${cuisine === '' ? 'chip-on' : ''}`}
          onClick={() => setCuisine('')}
        >
          All
        </button>
        {chips.map((c) => (
          <button
            key={c.name}
            style={{ '--hue': cuisineHue(c.name) }}
            className={`chip btn btn-sm rounded-pill text-nowrap ${cuisine === c.name ? 'chip-on' : ''}`}
            onClick={() => setCuisine(cuisine === c.name ? '' : c.name)}
          >
            {c.name} <span className="chip-count">{c.count}</span>
          </button>
        ))}
      </div>
    </>
  )
}
