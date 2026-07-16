import { useRef, useState } from 'react'
import Dialog from './Dialog'
import {
  signInGoogle, signOutCloud, canEdit, editorKeyFor, seedPlaces, planRestore, applyRestore,
} from '../lib/cloud'
import { normalizeBackup, describePlan } from '../lib/restore'
import { EDITORS } from '../lib/firebase-config'

export default function AccountModal({ show, onClose, user, places, canSeed, onToast }) {
  const [busy, setBusy] = useState(false)
  const [seedError, setSeedError] = useState(null)
  const [plan, setPlan] = useState(null)
  const fileRef = useRef(null)
  const myEditor = EDITORS.find((e) => e.key === editorKeyFor(user))

  // Read a backup and work out what it would fill in — without writing anything.
  async function handlePickBackup(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setSeedError(null)
    setPlan(null)
    try {
      const entries = normalizeBackup(JSON.parse(await file.text()))
      const p = await planRestore(entries)
      setPlan({ ...p, ...describePlan(p), fileName: file.name })
    } catch (err) {
      console.error('[places] restore preview failed:', err)
      setSeedError(err.message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleApplyRestore() {
    const { ratings, comments, places } = plan
    if (!confirm(
      `Restore ${places} places?\n\n` +
        `Fills ${ratings} blank ratings and ${comments} blank comments. ` +
        `Nothing that already has a value will be touched.`,
    )) return
    setBusy(true)
    try {
      const n = await applyRestore(plan.fills)
      onToast(`Restored ${n} places ✓`)
      setPlan(null)
      onClose()
    } catch (err) {
      console.error('[places] restore failed:', err)
      setSeedError(err.message)
    } finally {
      setBusy(false)
    }
  }

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
          {canEdit(user) && (
            <div className="restore">
              <div className="section-head">Restore from a backup</div>
              <p className="text-muted seed-warn">
                Fills blank ratings and comments from a backup file. Never overwrites a value
                that’s already there, so an old export can’t undo newer edits.
              </p>
              <input
                className="input"
                type="file"
                accept="application/json,.json"
                ref={fileRef}
                disabled={busy}
                onChange={handlePickBackup}
              />
              {plan && (
                <div className="restore-plan">
                  <p>
                    <b>{plan.fileName}</b> — would fill <b>{plan.ratings}</b> ratings and{' '}
                    <b>{plan.comments}</b> comments across <b>{plan.places}</b> places
                    {' '}(database holds {plan.serverCount}).
                  </p>
                  {plan.skipped.alreadyHasValue.length > 0 && (
                    <p className="text-muted">
                      {plan.skipped.alreadyHasValue.length} left alone — already have a value.
                    </p>
                  )}
                  {plan.skipped.noSuchPlace.length > 0 && (
                    <p className="text-muted">
                      {plan.skipped.noSuchPlace.length} skipped — no matching place.
                    </p>
                  )}
                  {plan.places === 0 ? (
                    <p className="text-muted">Nothing to restore from this file.</p>
                  ) : (
                    <button className="btn btn-primary btn-block" disabled={busy} onClick={handleApplyRestore}>
                      {busy ? 'Restoring…' : `Restore ${plan.places} places`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {seedError && <p className="seed-error">Stopped: {seedError}</p>}
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
