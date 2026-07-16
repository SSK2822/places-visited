import { useState } from 'react'
import Dialog from './Dialog'
import { signInGoogle, signOutCloud, canEdit, editorKeyFor, seedPlaces } from '../lib/cloud'
import { EDITORS } from '../lib/firebase-config'

export default function AccountModal({ show, onClose, user, places, canSeed, onToast }) {
  const [busy, setBusy] = useState(false)
  const [seedError, setSeedError] = useState(null)
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
    if (
      !confirm(
        'Import places.json into the cloud database?\n\n' +
          'This is only for a first-time, empty database. places.json has no ratings, ' +
          'so importing over existing places would reset every rating and comment to blank. ' +
          'The import re-checks the database and will refuse if it is not empty.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}places.json?cb=${Date.now()}`)
      if (!r.ok) throw new Error(`places.json returned ${r.status}`)
      const j = await r.json()
      await seedPlaces(j.places)
      onToast(`Imported ${j.places.length} places ✓`)
      onClose()
    } catch (e) {
      console.error('[places] import failed:', e)
      setSeedError(e.message)
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

  const actions = (
    <>
      <button className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={exportJson}>
        Download backup
      </button>
      {user ? (
        <button className="btn btn-secondary" onClick={() => signOutCloud().then(onClose)}>
          Sign out
        </button>
      ) : (
        <button className="btn btn-primary" disabled={busy} onClick={handleSignIn}>
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
      )}
    </>
  )

  return (
    <Dialog show={show} title="Account" onClose={onClose} actions={actions}>
      {user ? (
        <>
          <p>
            Signed in as <b>{user.email}</b>
          </p>
          {canEdit(user) ? (
            <p className="text-muted">
              You can add places and set {myEditor?.name}’s ({myEditor?.label}) rating and
              comment on each one. Changes sync live to everyone.
            </p>
          ) : (
            <p className="text-muted">
              This Google account doesn’t have edit access — the ledger is read-only for you.
            </p>
          )}
          {canEdit(user) && canSeed && (
            <>
              <button className="btn btn-primary btn-block" disabled={busy} onClick={handleSeed}>
                {busy ? 'Importing…' : 'Import places from places.json'}
              </button>
              <p className="seed-warn">
                Only for a first-time, empty database — places.json carries no ratings.
              </p>
            </>
          )}
          {seedError && <p className="seed-error">Import stopped: {seedError}</p>}
        </>
      ) : (
        <p className="text-muted">
          Anyone can browse the ledger. To add or edit places, sign in with an approved
          Google account.
        </p>
      )}
    </Dialog>
  )
}
