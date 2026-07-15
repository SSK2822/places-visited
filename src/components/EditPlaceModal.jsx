import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { fmt, ratingClass } from '../lib/utils'
import { DEFAULT_CITY } from '../lib/constants'
import { EDITORS } from '../lib/firebase-config'

function RatingField({ label, value, notRated, onValue, onNotRated, locked, lockedHint }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label className="small fw-bold text-body-secondary text-uppercase">{label}</Form.Label>
      <div className="d-flex align-items-center gap-3">
        <Form.Range
          min={-3}
          max={3}
          step={0.25}
          value={value}
          disabled={locked || notRated}
          onChange={(e) => onValue(+e.target.value)}
        />
        <span className={`rating-badge border rounded-2 text-center fw-bolder ${notRated ? 'rating-zero' : ratingClass(value)}`}>
          {notRated ? '–' : fmt(value)}
        </span>
      </div>
      {locked ? (
        <p className="small text-body-secondary fst-italic mt-1 mb-0">{lockedHint}</p>
      ) : (
        <Form.Check
          type="checkbox"
          label="not rated yet"
          checked={notRated}
          onChange={(e) => onNotRated(e.target.checked)}
          className="small text-body-secondary mt-1"
        />
      )}
    </Form.Group>
  )
}

export default function EditPlaceModal({
  show, place, defaultCuisine, cuisines, cities, myKey, onSave, onDelete, onClose,
}) {
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState(defaultCuisine)
  const [city, setCity] = useState(DEFAULT_CITY)
  const [ratings, setRatings] = useState({})
  const [notRated, setNotRated] = useState({})
  const [comments, setComments] = useState({})

  useEffect(() => {
    if (!show) return
    setName(place?.name ?? '')
    setCuisine(place?.cuisine ?? defaultCuisine)
    setCity(place?.city ?? DEFAULT_CITY)

    const r = {}, nr = {}, c = {}
    EDITORS.forEach((e) => {
      r[e.key] = place?.[e.key] ?? 0
      // Your own field starts enabled so you can rate right away.
      // A field you don't own always mirrors its real saved state,
      // so leaving the modal open never silently changes their rating.
      const isMine = myKey === null || myKey === e.key
      nr[e.key] = isMine ? false : (place ? place[e.key] === null : true)
      c[e.key] = place?.[`${e.key}Comment`] ?? ''
    })
    setRatings(r)
    setNotRated(nr)
    setComments(c)
  }, [show, place, defaultCuisine, myKey])

  const previewValues = EDITORS.map((e) => (notRated[e.key] ? null : ratings[e.key])).filter((v) => v !== null && v !== undefined)
  const preview = previewValues.length ? previewValues.reduce((a, b) => a + b, 0) / previewValues.length : null

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">{place ? 'Edit place' : 'Add place'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-bold text-body-secondary text-uppercase">Name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Joe's Steam Rice Roll"
            autoFocus={!place}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-bold text-body-secondary text-uppercase">Cuisine</Form.Label>
          <Form.Select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            {cuisines.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-bold text-body-secondary text-uppercase">City</Form.Label>
          <Form.Control
            type="text"
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
        </Form.Group>

        {EDITORS.map((e) => {
          const locked = myKey !== null && myKey !== e.key
          return (
            <RatingField
              key={e.key}
              label={`${e.label} rating`}
              value={ratings[e.key] ?? 0}
              notRated={Boolean(notRated[e.key])}
              onValue={(v) => setRatings((r) => ({ ...r, [e.key]: v }))}
              onNotRated={(v) => setNotRated((nr) => ({ ...nr, [e.key]: v }))}
              locked={locked}
              lockedHint={locked ? `Only ${e.name} can set this` : null}
            />
          )
        })}

        <p className="text-center text-body-secondary small mb-3">
          {preview === null ? 'Overall: unrated' : 'Overall: ' + fmt(preview)}
        </p>

        {EDITORS.map((e) => {
          const locked = myKey !== null && myKey !== e.key
          return (
            <Form.Group className="mb-3" key={e.key}>
              <Form.Label className="small fw-bold text-body-secondary text-uppercase">
                {e.name}'s comment
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={comments[e.key] ?? ''}
                disabled={locked}
                onChange={(ev) => setComments((c) => ({ ...c, [e.key]: ev.target.value }))}
                placeholder="what to order, vibes…"
              />
            </Form.Group>
          )
        })}
      </Modal.Body>
      <Modal.Footer className="d-flex">
        {place && (
          <Button variant="outline-danger" className="me-auto" onClick={() => onDelete(place.id)}>
            Delete
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!name.trim()}
          onClick={() => onSave({ name, cuisine, city, ratings, notRated, comments })}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
