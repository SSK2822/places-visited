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
