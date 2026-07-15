import { useEffect, useState } from 'react'
import RatingDial from './RatingDial'
import { fmt } from '../lib/utils'
import { DEFAULT_CITY } from '../lib/constants'
import { EDITORS } from '../lib/firebase-config'

export default function PlaceForm({
  place, defaultCuisine, cuisines, cities, myKey, onSave, onDelete, onCancel,
}) {
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState(defaultCuisine)
  const [city, setCity] = useState(DEFAULT_CITY)
  const [ratings, setRatings] = useState({})
  const [notRated, setNotRated] = useState({})
  const [comments, setComments] = useState({})

  useEffect(() => {
    setName(place?.name ?? '')
    setCuisine(place?.cuisine ?? defaultCuisine)
    setCity(place?.city ?? DEFAULT_CITY)

    const r = {}, nr = {}, c = {}
    EDITORS.forEach((e) => {
      r[e.key] = place?.[e.key] ?? 0
      // Your own field starts enabled so you can rate right away.
      // A field you don't own always mirrors its real saved state,
      // so leaving the form open never silently changes their rating.
      const isMine = myKey === null || myKey === e.key
      nr[e.key] = isMine ? false : (place ? place[e.key] === null : true)
      c[e.key] = place?.[`${e.key}Comment`] ?? ''
    })
    setRatings(r)
    setNotRated(nr)
    setComments(c)
  }, [place, defaultCuisine, myKey])

  const previewValues = EDITORS
    .map((e) => (notRated[e.key] ? null : ratings[e.key]))
    .filter((v) => v !== null && v !== undefined)
  const preview = previewValues.length
    ? previewValues.reduce((a, b) => a + b, 0) / previewValues.length
    : null

  return (
    <section className="view">
      <button className="back" onClick={onCancel}>
        ← Cancel
      </button>
      <h1 className="form-title">{place ? 'Edit place' : 'Add a place'}</h1>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="f-name">Name</label>
          <input
            className="input"
            id="f-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Where did you go?"
            autoFocus={!place}
          />
        </div>
        <div className="field">
          <label htmlFor="f-city">City / neighborhood</label>
          <input
            className="input"
            id="f-city"
            list="city-options"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={DEFAULT_CITY}
          />
          <datalist id="city-options">
            {cities.map((c) => (
              <option value={c} key={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-cuisine">Cuisine</label>
        <select
          className="input"
          id="f-cuisine"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
        >
          {cuisines.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {EDITORS.map((e) => {
        const locked = myKey !== null && myKey !== e.key
        return (
          <RatingDial
            key={e.key}
            label={e.label}
            value={ratings[e.key] ?? 0}
            notRated={Boolean(notRated[e.key])}
            onValue={(v) => setRatings((r) => ({ ...r, [e.key]: v }))}
            onNotRated={(v) => setNotRated((nr) => ({ ...nr, [e.key]: v }))}
            locked={locked}
            lockedHint={locked ? `Only ${e.name} can set this` : null}
          />
        )
      })}

      <p className="overall-preview">
        {preview === null ? 'Overall: unrated' : `Overall: ${fmt(preview)}`}
      </p>

      {EDITORS.map((e) => {
        const locked = myKey !== null && myKey !== e.key
        return (
          <div className="field" key={e.key}>
            <label htmlFor={`f-${e.key}-note`}>{e.name}’s note</label>
            <textarea
              className="input"
              id={`f-${e.key}-note`}
              value={comments[e.key] ?? ''}
              disabled={locked}
              onChange={(ev) => setComments((c) => ({ ...c, [e.key]: ev.target.value }))}
              placeholder={locked ? `Only ${e.name} can write this` : 'A line for the ledger…'}
            />
          </div>
        )
      })}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => onSave({ name, cuisine, city, ratings, notRated, comments })}
        >
          Save to the ledger
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        {place && (
          <button className="btn btn-secondary danger" onClick={() => onDelete(place.id)}>
            Delete
          </button>
        )}
      </div>
    </section>
  )
}
