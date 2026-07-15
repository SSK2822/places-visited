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
export async function initCloud(onPlaces, onUser) {
  const { fs, auth, db, a } = await fb()
  const unsubAuth = auth.onAuthStateChanged(a, onUser)
  const unsubSnap = fs.onSnapshot(fs.collection(db, 'places'), (snap) => {
    onPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
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
  await fs.setDoc(fs.doc(db, 'places', id), data)
}

export async function deletePlaceCloud(id) {
  const { fs, db } = await fb()
  await fs.deleteDoc(fs.doc(db, 'places', id))
}

// One-time import of public/places.json into Firestore (max 500 per batch).
export async function seedPlaces(places) {
  const { fs, db } = await fb()
  const batch = fs.writeBatch(db)
  places.forEach(({ id, ...data }) => batch.set(fs.doc(db, 'places', id), data))
  await batch.commit()
}
