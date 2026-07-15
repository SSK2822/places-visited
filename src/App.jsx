import { useEffect, useMemo, useState } from 'react'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'
import AppNavbar from './components/AppNavbar'
import StatsBar from './components/StatsBar'
import FilterBar from './components/FilterBar'
import PlaceCard from './components/PlaceCard'
import EditPlaceModal from './components/EditPlaceModal'
import SettingsModal from './components/SettingsModal'
import AccountModal from './components/AccountModal'
import DirtyBar from './components/DirtyBar'
import { CUISINES, LSK_DATA, LSK_THEME, DEFAULT_CITY } from './lib/constants'
import { overall, fmt, slugify } from './lib/utils'
import { loadCfg, publishPlaces } from './lib/github'
import { cloudEnabled, initCloud, canEdit, savePlaceCloud, deletePlaceCloud } from './lib/cloud'

const EMPTY_DB = { updated: '', places: [] }

export default function App() {
  const [db, setDb] = useState(EMPTY_DB)
  const [dirty, setDirty] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [sort, setSort] = useState('name')
  const [cuisine, setCuisine] = useState('')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPlace, setEditingPlace] = useState(null) // null = adding a new place
  const [showSettings, setShowSettings] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem(LSK_THEME) || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem(LSK_THEME, theme)
  }, [theme])

  const toast = (msg) => setToastMsg(msg)

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = db.places.filter((p) => {
      if (cuisine && p.cuisine !== cuisine) return false
      if (city && p.city !== city) return false
      const ov = overall(p)
      if (ratingFilter === 'rated' && ov === null) return false
      if (ratingFilter === 'unrated' && ov !== null) return false
      if (['2', '1', '0'].includes(ratingFilter) && (ov === null || ov < +ratingFilter)) return false
      if (ratingFilter === 'neg' && (ov === null || ov >= 0)) return false
      if (q && !(p.name + ' ' + p.cuisine + ' ' + p.city + ' ' + (p.notes || '')).toLowerCase().includes(q)) return false
      return true
    })
    const key = { overall, yk: (p) => p.yk, ac: (p) => p.ac }[sort]
    if (key) list.sort((a, b) => ((key(b) ?? -99) - (key(a) ?? -99)) || a.name.localeCompare(b.name))
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [db.places, query, city, ratingFilter, sort, cuisine])

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
      avg: rated.length ? fmt(rated.reduce((a, p) => a + overall(p), 0) / rated.length) : '–',
      topCuisine: top ? top[0].split(' ').slice(1).join(' ') : '–',
    }
  }, [db.places])

  /* ---------- actions ---------- */
  // In cloud mode, editing needs an approved Google account.
  function requireEditor() {
    if (!cloudEnabled || canEdit(user)) return true
    setShowSettings(true)
    toast(user ? "This account doesn't have edit access" : 'Sign in with Google to edit')
    return false
  }

  function openAdd() {
    if (!requireEditor()) return
    setEditingPlace(null)
    setEditorOpen(true)
  }

  function openEdit(place) {
    if (!requireEditor()) return
    setEditingPlace(place)
    setEditorOpen(true)
  }

  function savePlace(form) {
    const rec = {
      id: editingPlace ? editingPlace.id : slugify(form.name, db.places),
      name: form.name.trim(),
      cuisine: form.cuisine,
      city: form.city.trim() || DEFAULT_CITY,
      yk: form.ykNr ? null : form.yk,
      ac: form.acNr ? null : form.ac,
      notes: form.notes.trim(),
    }
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
    setEditorOpen(false)
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
    setEditorOpen(false)
  }

  function surprise() {
    if (!filtered.length) return toast('No places match your filters')
    const p = filtered[Math.floor(Math.random() * filtered.length)]
    const ov = overall(p)
    toast(`🎲 ${p.name} — ${p.cuisine}${ov !== null ? ` (${fmt(ov)})` : ''}`)
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
      <header className="app-header sticky-top border-bottom pb-3">
        <AppNavbar
          onSurprise={surprise}
          onSettings={() => setShowSettings(true)}
          onAdd={openAdd}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
        <div className="container-xl">
          <StatsBar stats={stats} />
          <FilterBar
            query={query} setQuery={setQuery}
            city={city} setCity={setCity} cities={cities}
            ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
            sort={sort} setSort={setSort}
            cuisine={cuisine} setCuisine={setCuisine}
            chips={cuisineChips}
          />
        </div>
      </header>

      <main className="container-xl py-4 pb-5 mb-5">
        <p className="text-body-secondary small">
          {filtered.length} of {db.places.length} places
        </p>
        {filtered.length ? (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xxl-4 g-3">
            {filtered.map((p) => (
              <div className="col" key={p.id}>
                <PlaceCard place={p} onEdit={() => openEdit(p)} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-body-secondary py-5">
            Nothing matches. Try clearing a filter or two.
          </p>
        )}
        <footer className="text-center text-body-secondary small pt-5 lh-base">
          Ratings: -3 (never again) to +3 (bookmarked for repeat visits).
          <br />
          Overall is the average of YK and Ac, aka the diplomatic score.
          {db.updated && <> Last updated {db.updated}.</>}
        </footer>
      </main>

      <DirtyBar
        show={dirty}
        publishing={publishing}
        onPublish={handlePublish}
        onExport={exportJson}
        onDiscard={discard}
      />

      <EditPlaceModal
        show={editorOpen}
        place={editingPlace}
        defaultCuisine={cuisine || CUISINES[0]}
        cuisines={cuisineOptions}
        cities={cities}
        onSave={savePlace}
        onDelete={deletePlace}
        onClose={() => setEditorOpen(false)}
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

      <ToastContainer position="bottom-center" className="position-fixed pb-5 mb-4">
        <Toast
          show={!!toastMsg}
          onClose={() => setToastMsg('')}
          delay={3200}
          autohide
          className="text-center"
        >
          <Toast.Body>{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  )
}
