import { useEffect, useState } from 'react'
import RatingDial from './RatingDial'
import { fmt, scoreHidden } from '../lib/utils'
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

  // A partner who's rated but is still hidden from you — their dial and note are
  // sealed. When one exists, the overall preview must stay hidden too, or you
  // could back-calculate their score from the average.
  const isSealed = (e) => myKey !== null && myKey !== e.key && place && scoreHidden(place, e.key, myKey)
  const anySealed = EDITORS.some(isSealed)

  function save() {
    if (!name.trim()) return
    onSave({ name, cuisine, city, ratings, notRated, comments })
  }

  // Shift+Enter saves from anywhere on the form, including mid-note — matches
  // the disabled state on the button (a blank name blocks both). preventDefault
  // stops the plain-textarea default of also inserting a newline.
  function onKeyDown(e) {
    if (e.key !== 'Enter' || !e.shiftKey) return
    e.preventDefault()
    save()
  }

  return (
    <section className="view" onKeyDown={onKeyDown}>
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
        if (isSealed(e)) {
          return (
            <div className="dial dial-sealed" key={e.key}>
              <div className="dial-head">
                <div className="dial-who">{e.label}</div>
                <div className="dial-read">🙈</div>
              </div>
              <div className="sealed-box">
                {e.name} has already rated — <b>hidden until you lock yours in.</b> No peeking!
              </div>
            </div>
          )
        }
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
        {anySealed
          ? 'Overall reveals once you save 🙈'
          : preview === null
            ? 'Overall: unrated'
            : `Overall: ${fmt(preview)}`}
      </p>

      {EDITORS.map((e) => {
        const locked = myKey !== null && myKey !== e.key
        return (
          <div className="field" key={e.key}>
            <label htmlFor={`f-${e.key}-note`}>{e.name}’s note</label>
            {isSealed(e) ? (
              <div className="input sealed-note">🙈 Hidden until you rate</div>
            ) : (
              <textarea
                className="input"
                id={`f-${e.key}-note`}
                value={comments[e.key] ?? ''}
                disabled={locked}
                onChange={(ev) => setComments((c) => ({ ...c, [e.key]: ev.target.value }))}
                placeholder={locked ? `Only ${e.name} can write this` : 'A line for the ledger…'}
              />
            )}
          </div>
        )
      })}

      <div className="form-actions">
        {place && (
          <button className="btn btn-secondary danger" onClick={() => onDelete(place.id)}>
            Delete
          </button>
        )}
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={save}>
          Save to the ledger
        </button>
      </div>
      <p className="save-hint">Shift + Enter to save</p>
    </section>
  )
}
