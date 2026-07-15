import { useCallback, useEffect, useMemo, useState } from 'react'
import Masthead from './components/Masthead'
import StatsLedger from './components/StatsLedger'
import LedgerControls from './components/LedgerControls'
import LedgerList from './components/LedgerList'
import PlaceDetail from './components/PlaceDetail'
import PlaceForm from './components/PlaceForm'
import SurpriseOverlay from './components/SurpriseOverlay'
import SettingsModal from './components/SettingsModal'
import AccountModal from './components/AccountModal'
import DirtyBar from './components/DirtyBar'
import Toast from './components/Toast'
import { CUISINES, LSK_DATA, DEFAULT_CITY } from './lib/constants'
import { overall, fmt, slugify } from './lib/utils'
import { loadCfg, publishPlaces } from './lib/github'
import { cloudEnabled, initCloud, canEdit, editorKeyFor, savePlaceCloud, deletePlaceCloud } from './lib/cloud'
import { EDITORS } from './lib/firebase-config'

const EMPTY_DB = { updated: '', places: [] }

// Ranked = rated places, best first; the ledger's spine.
const byRank = (a, b) => (overall(b) - overall(a)) || a.name.localeCompare(b.name)

export default function App() {
  const [db, setDb] = useState(EMPTY_DB)
  const [dirty, setDirty] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mode, setMode] = useState('ranked')

  const [view, setView] = useState('browse')
  const [selectedId, setSelectedId] = useState(null)
  const [editingPlace, setEditingPlace] = useState(null) // null = adding a new place
  const [surprising, setSurprising] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [user, setUser] = useState(null)
  const myKey = useMemo(() => editorKeyFor(user), [user])

  const toast = (msg) => setToastMsg(msg)
  const clearToast = useCallback(() => setToastMsg(''), [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view, selectedId])

  /* ---------- data loading ---------- */
  useEffect(() => {
    if (cloudEnabled) {
      let cleanup
      initCloud(
        (places) => setDb({ updated: '', places }),
        setUser,
      ).then((fn) => {
        cleanup = fn
      })
      return () => cleanup && cleanup()
    }
    ;(async () => {
      let remote = null
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}places.json?cb=${Date.now()}`)
        if (r.ok) remote = await r.json()
      } catch {
        /* offline or file:// */
      }
      const local = JSON.parse(localStorage.getItem(LSK_DATA) || 'null')
      if (remote && local && JSON.stringify(local.places) === JSON.stringify(remote.places)) {
        setDb(remote)
        setDirty(false)
        localStorage.removeItem(LSK_DATA)
      } else if (local) {
        setDb(local)
        setDirty(true)
      } else if (remote) {
        setDb(remote)
        setDirty(false)
      } else {
        toast("Couldn't load places.json — serve over http or GitHub Pages")
      }
    })()
  }, [])

  function updatePlaces(nextPlaces) {
    const next = { updated: new Date().toISOString().slice(0, 10), places: nextPlaces }
    setDb(next)
    localStorage.setItem(LSK_DATA, JSON.stringify(next))
    setDirty(true)
  }

  /* ---------- derived data ---------- */
  const cities = useMemo(
    () => [...new Set(db.places.map((p) => p.city))].sort(),
    [db.places],
  )

  const cuisineChips = useMemo(() => {
    const present = CUISINES.filter((c) => db.places.some((p) => p.cuisine === c))
    db.places.forEach((p) => {
      if (!present.includes(p.cuisine)) present.push(p.cuisine)
    })
    return present.map((c) => ({
      name: c,
      count: db.places.filter((p) => p.cuisine === c).length,
    }))
  }, [db.places])

  const cuisineOptions = useMemo(
    () => [...new Set([...CUISINES, ...cuisineChips.map((c) => c.name)])],
    [cuisineChips],
  )

  // The full ranking, unfiltered — the detail view's "No. N" and the Surprise
  // pool both mean position in the whole ledger, not within a search.
  const rankedAll = useMemo(
    () => db.places.filter((p) => overall(p) !== null).sort(byRank),
    [db.places],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = db.places.filter((p) => {
      if (cuisine && p.cuisine !== cuisine) return false
      const rated = overall(p) !== null
      if (mode === 'ranked' && !rated) return false
      if (mode === 'pending' && rated) return false
      const commentText = EDITORS.map((e) => p[`${e.key}Comment`] || '').join(' ')
      if (q && !(p.name + ' ' + p.cuisine + ' ' + p.city + ' ' + commentText).toLowerCase().includes(q)) return false
      return true
    })
    return list.sort(mode === 'ranked' ? byRank : (a, b) => a.name.localeCompare(b.name))
  }, [db.places, query, cuisine, mode])

  const stats = useMemo(() => {
    const rated = db.places.filter((p) => overall(p) !== null)
    // Top cuisine = highest average overall score, not most-visited.
    const cuisineScores = {}
    rated.forEach((p) => {
      const c = cuisineScores[p.cuisine] || { sum: 0, count: 0 }
      c.sum += overall(p)
      c.count += 1
      cuisineScores[p.cuisine] = c
    })
    const top = Object.entries(cuisineScores)
      .map(([name, { sum, count }]) => [name, sum / count])
      .sort((a, b) => b[1] - a[1])[0]
    return {
      total: db.places.length,
      rated: rated.length,
      unrated: db.places.length - rated.length,
      // Strip the leading emoji — the ledger sets this in Cormorant.
      topCuisine: top ? top[0].split(' ').slice(1).join(' ') : '–',
    }
  }, [db.places])

  // Re-looked-up each render so a live Firestore edit shows through, and a
  // place deleted from another device drops us back to the ledger.
  const selected = db.places.find((p) => p.id === selectedId) || null
  useEffect(() => {
    if (view === 'detail' && !selected) setView('browse')
  }, [view, selected])

  /* ---------- actions ---------- */
  // In cloud mode, editing needs an approved Google account.
  function requireEditor() {
    if (!cloudEnabled || canEdit(user)) return true
    setShowSettings(true)
    toast(user ? "This account doesn't have edit access" : 'Sign in with Google to edit')
    return false
  }

  function openDetail(place) {
    setSelectedId(place.id)
    setView('detail')
  }

  function openAdd() {
    if (!requireEditor()) return
    setEditingPlace(null)
    setView('add')
  }

  function openEdit(place) {
    if (!requireEditor()) return
    setEditingPlace(place)
    setView('add')
  }

  function savePlace(form) {
    const rec = {
      id: editingPlace ? editingPlace.id : slugify(form.name, db.places),
      name: form.name.trim(),
      cuisine: form.cuisine,
      city: form.city.trim() || DEFAULT_CITY,
    }
    const now = Date.now()
    EDITORS.forEach((e) => {
      rec[e.key] = form.notRated[e.key] ? null : form.ratings[e.key]
      const text = (form.comments[e.key] || '').trim()
      const prevText = (editingPlace?.[`${e.key}Comment`] ?? '').trim()
      rec[`${e.key}Comment`] = text
      rec[`${e.key}CommentAt`] = text !== prevText ? now : (editingPlace?.[`${e.key}CommentAt`] ?? null)
    })
    const wasEditing = Boolean(editingPlace)
    if (cloudEnabled) {
      savePlaceCloud(rec)
        .then(() => toast(wasEditing ? 'Updated ✓' : 'Added ✓'))
        .catch((e) => toast('Save failed: ' + e.message))
    } else if (wasEditing) {
      updatePlaces(db.places.map((p) => (p.id === editingPlace.id ? rec : p)))
      toast('Updated ✓')
    } else {
      updatePlaces([...db.places, rec])
      toast('Added ✓ — publish when ready')
    }
    // Land the viewer where the place now lives.
    setMode(overall(rec) === null ? 'pending' : 'ranked')
    setView('browse')
  }

  function deletePlace(id) {
    if (!confirm('Delete this place?')) return
    if (cloudEnabled) {
      deletePlaceCloud(id)
        .then(() => toast('Deleted ✓'))
        .catch((e) => toast('Delete failed: ' + e.message))
    } else {
      updatePlaces(db.places.filter((p) => p.id !== id))
    }
    setSelectedId(null)
    setView('browse')
  }

  function surprise() {
    if (!rankedAll.length) return toast('Nothing rated yet — no pick to make')
    setSurprising(true)
  }

  async function handlePublish() {
    const cfg = loadCfg()
    if (!cfg.token) {
      setShowSettings(true)
      toast('Add a GitHub token first')
      return
    }
    setPublishing(true)
    try {
      await publishPlaces(db, cfg)
      localStorage.removeItem(LSK_DATA)
      setDirty(false)
      toast('Published ✓ — Pages will refresh in about a minute')
    } catch (e) {
      toast('Publish failed: ' + e.message)
    } finally {
      setPublishing(false)
    }
  }

  function exportJson() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }))
    a.download = 'places.json'
    a.click()
  }

  function discard() {
    if (!confirm('Discard local changes and reload published data?')) return
    localStorage.removeItem(LSK_DATA)
    location.reload()
  }

  /* ---------- render ---------- */
  return (
    <>
      <div className="flavour" aria-hidden="true">
        <span className="b1" />
        <span className="b2" />
        <span className="b3" />
      </div>

      <div className="wrap">
        {view === 'browse' && (
          <section className="view">
            <Masthead onAccount={() => setShowSettings(true)} onSurprise={surprise} />
            <StatsLedger stats={stats} />
            <LedgerControls
              query={query} setQuery={setQuery}
              cuisine={cuisine} setCuisine={setCuisine} chips={cuisineChips}
              mode={mode} setMode={setMode}
              onAdd={openAdd}
            />
            <p className="count-line">
              {filtered.length} of {db.places.length} places
            </p>
            <LedgerList
              places={filtered}
              mode={mode}
              onOpen={openDetail}
              onRate={openEdit}
            />
            <p className="pending-note" style={{ marginTop: 'var(--space-8)' }}>
              Ratings run −3 (never again) to +3 (bookmarked for repeat visits). Overall is the
              average of {EDITORS.map((e) => e.label).join(' and ')} — the diplomatic score.
              {db.updated && ` Last updated ${db.updated}.`}
            </p>
          </section>
        )}

        {view === 'detail' && selected && (
          <PlaceDetail
            place={selected}
            rank={rankedAll.findIndex((p) => p.id === selected.id)}
            onBack={() => setView('browse')}
            onEdit={openEdit}
          />
        )}

        {view === 'add' && (
          <PlaceForm
            place={editingPlace}
            defaultCuisine={cuisine || CUISINES[0]}
            cuisines={cuisineOptions}
            cities={cities}
            myKey={myKey}
            onSave={savePlace}
            onDelete={deletePlace}
            onCancel={() => setView('browse')}
          />
        )}
      </div>

      {surprising && (
        <SurpriseOverlay places={rankedAll} onClose={() => setSurprising(false)} />
      )}

      <DirtyBar
        show={dirty}
        publishing={publishing}
        onPublish={handlePublish}
        onExport={exportJson}
        onDiscard={discard}
      />

      {cloudEnabled ? (
        <AccountModal
          show={showSettings}
          onClose={() => setShowSettings(false)}
          user={user}
          places={db.places}
          onToast={toast}
        />
      ) : (
        <SettingsModal
          show={showSettings}
          onClose={() => setShowSettings(false)}
          onSaved={() => toast('Settings saved')}
        />
      )}

      <Toast message={toastMsg} onDone={clearToast} />
    </>
  )
}
