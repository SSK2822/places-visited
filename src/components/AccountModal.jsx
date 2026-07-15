import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import { signInGoogle, signOutCloud, canEdit, editorKeyFor, seedPlaces } from '../lib/cloud'
import { EDITORS } from '../lib/firebase-config'

export default function AccountModal({ show, onClose, user, places, onToast }) {
  const [busy, setBusy] = useState(false)
  const myEditor = EDITORS.find((e) => e.key === editorKeyFor(user))

  async function handleSignIn() {
    setBusy(true)
    try {
      await signInGoogle()
      onClose()
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') onToast('Sign-in failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSeed() {
    if (!confirm('Import all places from places.json into the cloud database?')) return
    setBusy(true)
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}places.json?cb=${Date.now()}`)
      const j = await r.json()
      await seedPlaces(j.places)
      onToast(`Imported ${j.places.length} places ✓`)
      onClose()
    } catch (e) {
      onToast('Import failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  function exportJson() {
    const a = document.createElement('a')
    const data = { updated: new Date().toISOString().slice(0, 10), places }
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = 'places.json'
    a.click()
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">👤 Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {user ? (
          <>
            <p className="small mb-2">
              Signed in as <b>{user.email}</b>
            </p>
            {canEdit(user) ? (
              <p className="small text-body-secondary">
                You can add places and set {myEditor?.name}'s ({myEditor?.label}) rating and
                comment on each one. Changes sync live to everyone.
              </p>
            ) : (
              <p className="small text-body-secondary">
                This Google account doesn't have edit access — the list is read-only for you.
              </p>
            )}
            {canEdit(user) && places.length === 0 && (
              <Button variant="warning" size="sm" className="me-2" disabled={busy} onClick={handleSeed}>
                {busy ? 'Importing…' : 'Import places from places.json'}
              </Button>
            )}
          </>
        ) : (
          <p className="small text-body-secondary">
            Anyone can browse the list. To add or edit places, sign in with an approved
            Google account.
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" className="me-auto" onClick={exportJson}>
          Download backup
        </Button>
        {user ? (
          <Button variant="secondary" onClick={() => signOutCloud().then(onClose)}>
            Sign out
          </Button>
        ) : (
          <Button variant="primary" disabled={busy} onClick={handleSignIn}>
            {busy ? 'Signing in…' : 'Sign in with Google'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
