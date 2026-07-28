import { useCallback, useEffect, useMemo, useState } from 'react'
import Masthead from './components/Masthead'
import StatsLedger from './components/StatsLedger'
import LedgerControls from './components/LedgerControls'
import LedgerList from './components/LedgerList'
import Calendar from './components/Calendar'
import PlaceDetail from './components/PlaceDetail'
import PlaceForm from './components/PlaceForm'
import SurpriseCard from './components/SurpriseCard'
import SurpriseOverlay from './components/SurpriseOverlay'
import CloudError from './components/CloudError'
import SettingsModal from './components/SettingsModal'
import AccountModal from './components/AccountModal'
import DirtyBar from './components/DirtyBar'
import Toast from './components/Toast'
import { CUISINES, LSK_DATA, LSK_SEEN, DEFAULT_CITY } from './lib/constants'
import { overall, fmt, slugify, fullyRated } from './lib/utils'
import RevealOverlay from './components/RevealOverlay'
import NotificationsDialog from './components/NotificationsDialog'
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
  // A Firestore read/write that failed. Non-null blocks the whole UI: with the
  // data in an unknown state, every destructive control must be unreachable.
  const [cloudFault, setCloudFault] = useState(null)
  // True only once a snapshot has actually arrived. `db.places.length === 0`
  // cannot tell "empty database" from "hasn't loaded" or "read failed", and
  // conflating those is what let the seed import run over 252 real places.
  const [loaded, setLoaded] = useState(!cloudEnabled)

  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  // Three views of the same list: 'top' (best 10), 'all' (everything, filtered),
  // 'torate' (been there, not yet scored).
  const [tab, setTab] = useState('top')

  const [view, setView] = useState('browse')
  const [selectedId, setSelectedId] = useState(null)
  const [editingPlace, setEditingPlace] = useState(null) // null = adding a new place
  const [surprising, setSurprising] = useState(false)
  // The place currently celebrated in the reveal overlay — one you just
  // completed, or one you tapped in the notifications bell.
  const [revealNow, setRevealNow] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  // Completed pairs this editor has already seen revealed (persisted per
  // editor). null until loaded — while null, we haven't decided whether to seed.
  const [seenIds, setSeenIds] = useState(null)
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
        (places) => {
          setDb({ updated: '', places })
          setLoaded(true)
          setCloudFault(null)
        },
        setUser,
        (err) => setCloudFault({ error: err, what: 'read' }),
      )
        .then((fn) => {
          cleanup = fn
        })
        .catch((err) => setCloudFault({ error: err, what: 'read' }))
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
  // pool both mean position in the whole ledger, not within a search. Only
  // both-rated places are ranked.
  const rankedAll = useMemo(
    () => db.places.filter(fullyRated).sort(byRank),
    [db.places],
  )

  // Cuisine + search filter, applied once; each tab is a slice of this.
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.places.filter((p) => {
      if (cuisine && p.cuisine !== cuisine) return false
      const commentText = EDITORS.map((e) => p[`${e.key}Comment`] || '').join(' ')
      if (q && !(p.name + ' ' + p.cuisine + ' ' + p.city + ' ' + commentText).toLowerCase().includes(q)) return false
      return true
    })
  }, [db.places, query, cuisine])

  // Both-rated (best first) and still-pending (A–Z) partitions of the filtered
  // set. "Pending" now includes places one editor has scored but the other
  // hasn't — they stay in the queue until both weigh in.
  const rankedFiltered = useMemo(
    () => base.filter(fullyRated).sort(byRank),
    [base],
  )
  const unratedFiltered = useMemo(
    () => base.filter((p) => !fullyRated(p)).sort((a, b) => a.name.localeCompare(b.name)),
    [base],
  )
  const visibleCount = tab === 'top'
    ? Math.min(10, rankedFiltered.length)
    : tab === 'torate'
      ? unratedFiltered.length
      : rankedFiltered.length + unratedFiltered.length

  const stats = useMemo(() => {
    // "Rated" everywhere means both editors have scored it (see fullyRated).
    const rated = db.places.filter(fullyRated)
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

  /* ---------- notifications (the reveal bell) ---------- */
  // Load this editor's seen-set when their identity is known.
  useEffect(() => {
    if (!myKey) {
      setSeenIds(null)
      return
    }
    const raw = localStorage.getItem(`${LSK_SEEN}_${myKey}`)
    if (raw !== null) setSeenIds(JSON.parse(raw))
  }, [myKey])

  // Seed once per editor: the first time we have data and nothing stored, mark
  // everything already complete as seen, so old pairs never fill the bell.
  useEffect(() => {
    if (!myKey || !db.places.length) return
    const key = `${LSK_SEEN}_${myKey}`
    if (localStorage.getItem(key) !== null) return
    const complete = db.places.filter(fullyRated).map((p) => p.id)
    localStorage.setItem(key, JSON.stringify(complete))
    setSeenIds(complete)
  }, [myKey, db.places])

  function markSeen(...ids) {
    if (!myKey || !ids.length) return
    const key = `${LSK_SEEN}_${myKey}`
    const raw = localStorage.getItem(key)
    const next = [...new Set([...(raw ? JSON.parse(raw) : []), ...ids])]
    localStorage.setItem(key, JSON.stringify(next))
    setSeenIds(next)
  }

  // The bell's contents: completed pairs this editor hasn't revealed yet —
  // the ones the partner closed while they were away, newest not distinguished.
  const seenSet = useMemo(() => new Set(seenIds || []), [seenIds])
  const inbox = useMemo(
    () => (myKey && seenIds !== null ? db.places.filter((p) => fullyRated(p) && !seenSet.has(p.id)) : []),
    [myKey, seenIds, seenSet, db.places],
  )

  function openReveal(place) {
    markSeen(place.id)
    setShowNotifications(false)
    setRevealNow(place)
  }

  function markAllSeen() {
    if (!inbox.length) return
    if (!confirm(
      `Mark all ${inbox.length} as read?\n\nYou won't see the reveal animation for these — ` +
        'the scores just show up in the ledger as usual.',
    )) return
    markSeen(...inbox.map((p) => p.id))
  }

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
      visited: form.visited || '',
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
    // Completing the pair yourself gets the reveal straight away (your action,
    // not a load-time interruption). Mark it seen now so it never also shows up
    // in the bell, and skip the toast — the reveal is the feedback.
    const completesPair = Boolean(editingPlace && !fullyRated(editingPlace) && fullyRated(rec))
    if (completesPair) markSeen(rec.id)
    const done = (msg) => (completesPair ? setRevealNow(rec) : toast(msg))
    if (cloudEnabled) {
      savePlaceCloud(rec)
        .then(() => done(wasEditing ? 'Updated ✓' : 'Added ✓'))
        .catch((e) => {
          console.error('[places] save failed:', e)
          setCloudFault({ error: e, what: 'write' })
        })
    } else if (wasEditing) {
      updatePlaces(db.places.map((p) => (p.id === editingPlace.id ? rec : p)))
      done('Updated ✓')
    } else {
      updatePlaces([...db.places, rec])
      done('Added ✓ — publish when ready')
    }
    // Editing (e.g. rating from the To-rate queue) returns you to the same tab,
    // so you can keep working down the list; a rated place simply drops off it.
    // A brand-new place lands on "All", where anything is visible.
    if (!wasEditing) setTab('all')
    setView('browse')
  }

  function deletePlace(id) {
    if (!confirm('Delete this place?')) return
    if (cloudEnabled) {
      deletePlaceCloud(id)
        .then(() => toast('Deleted ✓'))
        .catch((e) => {
          console.error('[places] delete failed:', e)
          setCloudFault({ error: e, what: 'write' })
        })
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
  // A failed read or write means the data is in an unknown state, so we stop
  // here and render nothing else — no ledger, no Add, and crucially no Import.
  if (cloudFault) {
    return (
      <>
        <div className="flavour" aria-hidden="true">
          <span className="b1" />
          <span className="b2" />
          <span className="b3" />
        </div>
        <div className="wrap">
          <CloudError error={cloudFault.error} what={cloudFault.what} />
        </div>
      </>
    )
  }

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
            <Masthead
              onAccount={() => setShowSettings(true)}
              notifyCount={inbox.length}
              onBell={() => setShowNotifications(true)}
            />
            <StatsLedger stats={stats} />
            <SurpriseCard onSurprise={surprise} />
            <LedgerControls
              query={query} setQuery={setQuery}
              cuisine={cuisine} setCuisine={setCuisine} chips={cuisineChips}
              tab={tab} setTab={setTab}
            />
            {tab === 'calendar' ? (
              <Calendar places={base} myKey={myKey} onOpen={openDetail} />
            ) : (
              <>
                <p className="count-line">
                  {tab === 'top'
                    ? `Top ${visibleCount}${cuisine || query ? ' — filtered' : ''}`
                    : `${visibleCount} of ${db.places.length} places`}
                </p>
                <LedgerList
                  tab={tab}
                  ranked={rankedFiltered}
                  unrated={unratedFiltered}
                  myKey={myKey}
                  onOpen={openDetail}
                  onRate={openEdit}
                />
                <p className="pending-note" style={{ marginTop: 'var(--space-8)' }}>
                  Ratings run −3 (never again) to +3 (bookmarked for repeat visits). Overall is the
                  average of {EDITORS.map((e) => e.label).join(' and ')} — the diplomatic score.
                  {db.updated && ` Last updated ${db.updated}.`}
                </p>
              </>
            )}
          </section>
        )}

        {view === 'detail' && selected && (
          <PlaceDetail
            place={selected}
            rank={rankedAll.findIndex((p) => p.id === selected.id)}
            myKey={myKey}
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
            places={db.places}
            myKey={myKey}
            onSave={savePlace}
            onDelete={deletePlace}
            onCancel={() => setView('browse')}
            onPickExisting={openEdit}
          />
        )}
      </div>

      {view === 'browse' && (
        <button className="fab" onClick={openAdd} aria-label="Add a place">
          <span className="fab-plus" aria-hidden="true">+</span>
          Add a place
        </button>
      )}

      {surprising && (
        <SurpriseOverlay places={rankedAll} onClose={() => setSurprising(false)} />
      )}

      <NotificationsDialog
        show={showNotifications}
        items={inbox}
        partnerName={EDITORS.find((e) => e.key !== myKey)?.name || 'your partner'}
        onPick={openReveal}
        onMarkAll={markAllSeen}
        onClose={() => setShowNotifications(false)}
      />

      {revealNow && (
        <RevealOverlay key={revealNow.id} place={revealNow} onClose={() => setRevealNow(null)} />
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
          // Seeding is offered only when a snapshot has actually arrived and
          // come back empty — never on "not loaded yet" or a failed read.
          canSeed={loaded && db.places.length === 0}
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
