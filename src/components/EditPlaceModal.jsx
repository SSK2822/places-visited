import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { fmt, ratingClass } from '../lib/utils'
import { DEFAULT_CITY } from '../lib/constants'

function RatingField({ label, value, notRated, onValue, onNotRated }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label className="small fw-bold text-body-secondary text-uppercase">{label}</Form.Label>
      <div className="d-flex align-items-center gap-3">
        <Form.Range
          min={-3}
          max={3}
          step={1}
          value={value}
          disabled={notRated}
          onChange={(e) => onValue(+e.target.value)}
        />
        <span className={`rating-badge border rounded-2 text-center fw-bolder ${notRated ? 'rating-zero' : ratingClass(value)}`}>
          {notRated ? '–' : fmt(value)}
        </span>
      </div>
      <Form.Check
        type="checkbox"
        label="not rated yet"
        checked={notRated}
        onChange={(e) => onNotRated(e.target.checked)}
        className="small text-body-secondary mt-1"
      />
    </Form.Group>
  )
}

export default function EditPlaceModal({
  show, place, defaultCuisine, cuisines, cities, onSave, onDelete, onClose,
}) {
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState(defaultCuisine)
  const [city, setCity] = useState(DEFAULT_CITY)
  const [yk, setYk] = useState(0)
  const [ac, setAc] = useState(0)
  const [ykNr, setYkNr] = useState(true)
  const [acNr, setAcNr] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!show) return
    setName(place?.name ?? '')
    setCuisine(place?.cuisine ?? defaultCuisine)
    setCity(place?.city ?? DEFAULT_CITY)
    setYk(place?.yk ?? 0)
    setAc(place?.ac ?? 0)
    setYkNr(place ? place.yk === null : true)
    setAcNr(place ? place.ac === null : true)
    setNotes(place?.notes ?? '')
  }, [show, place, defaultCuisine])

  const rated = []
  if (!ykNr) rated.push(yk)
  if (!acNr) rated.push(ac)
  const preview = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null

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
        <RatingField label="YK rating" value={yk} notRated={ykNr} onValue={setYk} onNotRated={setYkNr} />
        <RatingField label="Ac rating" value={ac} notRated={acNr} onValue={setAc} onNotRated={setAcNr} />
        <p className="text-center text-body-secondary small mb-3">
          {preview === null ? 'Overall: unrated' : 'Overall: ' + fmt(preview)}
        </p>
        <Form.Group>
          <Form.Label className="small fw-bold text-body-secondary text-uppercase">Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="what to order, vibes…"
          />
        </Form.Group>
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
          onClick={() => onSave({ name, cuisine, city, yk, ac, ykNr, acNr, notes })}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
