import { firebaseConfig, EDITORS } from './firebase-config'

// Cloud mode turns on as soon as firebaseConfig is filled in.
// Firebase modules are imported lazily so the bundle stays lean
// (and nothing firebase-related loads at all) while it is off.
export const cloudEnabled = Boolean(firebaseConfig)

let ready = null
function fb() {
  if (!ready) {
    ready = Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
      import('firebase/auth'),
    ]).then(([appMod, fs, auth]) => {
      const app = appMod.initializeApp(firebaseConfig)
      return { fs, auth, db: fs.getFirestore(app), a: auth.getAuth(app) }
    })
  }
  return ready
}

export const canEdit = (user) => Boolean(user) && EDITORS.some((e) => e.email === user.email)

// Which rating/comment field ('yk' | 'ac') the signed-in account owns,
// or null when signed out or not an approved editor.
export const editorKeyFor = (user) => EDITORS.find((e) => e.email === user?.email)?.key ?? null

// Subscribes to the places collection and auth state.
// Returns a cleanup function that unsubscribes from both.
//
// onError is not optional in spirit: a listener that fails silently leaves the
// app showing an empty ledger that is indistinguishable from a genuinely empty
// database — which is how a read glitch once talked a signed-in editor into
// running the seed import over 252 real places. A failed read must surface and
// stop, never degrade into "there is no data here".
export async function initCloud(onPlaces, onUser, onError) {
  const { fs, auth, db, a } = await fb()
  const unsubAuth = auth.onAuthStateChanged(a, onUser)
  const unsubSnap = fs.onSnapshot(
    fs.collection(db, 'places'),
    (snap) => onPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('[places] Firestore listener failed:', err)
      onError(err)
    },
  )
  return () => {
    unsubAuth()
    unsubSnap()
  }
}

export async function signInGoogle() {
  const { auth, a } = await fb()
  await auth.signInWithPopup(a, new auth.GoogleAuthProvider())
}

export async function signOutCloud() {
  const { auth, a } = await fb()
  await auth.signOut(a)
}

export async function savePlaceCloud(rec) {
  const { fs, db } = await fb()
  const { id, ...data } = rec
  // setDoc replaces the whole document, so a field that is `undefined` here
  // would be silently dropped rather than saved. Fail loudly instead.
  const bad = Object.entries(data).filter(([, v]) => v === undefined).map(([k]) => k)
  if (bad.length) throw new Error(`Refusing to save "${id}": ${bad.join(', ')} is undefined`)
  await fs.setDoc(fs.doc(db, 'places', id), data)
}

export async function deletePlaceCloud(id) {
  const { fs, db } = await fb()
  await fs.deleteDoc(fs.doc(db, 'places', id))
}

// Restore from a backup file.
//
// The defining rule: a restore only ever *fills blanks*. It never overwrites a
// field that already holds a value, so an old export can't clobber a newer
// rating, and running the same restore twice is a no-op. That is the opposite
// of seedPlaces — which is why this, not the import, is the way back from a bad
// write. Nothing is committed until the caller has seen the plan.
export async function planRestore(entries) {
  const { fs, db } = await fb()
  const snap = await fs.getDocsFromServer(fs.collection(db, 'places'))
  const current = new Map(snap.docs.map((d) => [d.id, d.data()]))

  const fills = []
  const skipped = { noSuchPlace: [], alreadyHasValue: [] }

  for (const e of entries) {
    const cur = current.get(e.id)
    if (!cur) {
      if (e.yk !== null || e.ac !== null || e.ykComment || e.acComment) skipped.noSuchPlace.push(e.id)
      continue
    }
    const patch = {}
    let blocked = false
    for (const k of ['yk', 'ac']) {
      if (e[k] === null || e[k] === undefined) continue
      if (cur[k] === null || cur[k] === undefined) patch[k] = e[k]
      else blocked = true
    }
    for (const k of ['ykComment', 'acComment']) {
      if (!e[k]) continue
      if (!cur[k]) patch[k] = e[k]
      else blocked = true
    }
    if (Object.keys(patch).length) fills.push({ id: e.id, name: e.name, patch })
    else if (blocked) skipped.alreadyHasValue.push(e.id)
  }
  return { fills, skipped, serverCount: snap.size }
}

// Commits a plan from planRestore. Merge writes, so fields outside the patch
// (name, cuisine, city, the other editor's rating) are left exactly as they are.
export async function applyRestore(fills) {
  const { fs, db } = await fb()
  const CHUNK = 400 // batches cap at 500 writes
  for (let i = 0; i < fills.length; i += CHUNK) {
    const batch = fs.writeBatch(db)
    for (const { id, patch } of fills.slice(i, i + CHUNK)) {
      batch.set(fs.doc(db, 'places', id), patch, { merge: true })
    }
    await batch.commit()
  }
  return fills.length
}

// One-time import of public/places.json into Firestore (max 500 per batch).
//
// This is the most destructive call in the app: every write is a whole-document
// `set`, so importing over real data resets each place's ratings and comments to
// the seed file's nulls. It has already cost one database. The caller's "is it
// empty?" check is not good enough on its own — it reads the live listener,
// which reports empty both when the collection is empty and when the read
// failed. So re-read the collection straight from the server here, at commit
// time, and refuse unless it is genuinely empty.
export async function seedPlaces(places) {
  const { fs, db } = await fb()
  const existing = await fs.getDocsFromServer(fs.collection(db, 'places'))
  if (!existing.empty) {
    throw new Error(
      `Refusing to import: the database already holds ${existing.size} places. ` +
        `Importing would overwrite every rating and comment. Use a restore instead.`,
    )
  }
  const batch = fs.writeBatch(db)
  places.forEach(({ id, ...data }) => batch.set(fs.doc(db, 'places', id), data))
  await batch.commit()
}
