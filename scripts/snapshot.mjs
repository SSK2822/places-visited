// Export the live Firestore `places` collection to backups/places.latest.json.
//
// This is the repo's safety net. Firestore on the Spark plan has no
// point-in-time recovery and no scheduled backups, so if the database is
// overwritten there is nothing on Google's side to roll back to — as we found
// out. Committing a snapshot on a schedule makes git the recovery log: every
// run that changes anything leaves a diff you can read, and any past commit can
// be fed back through Account → "Restore from a backup".
//
// Reads only. It can never write to Firestore.
//
// Auth: a Firebase service-account JSON in the FIREBASE_SERVICE_ACCOUNT env var
// (a GitHub Actions secret). Admin credentials bypass security rules, which is
// why this runs in CI and not in the browser.
import { writeFileSync, mkdirSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const raw = process.env.FIREBASE_SERVICE_ACCOUNT
if (!raw) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not set — see README, "Automatic backups".')
  process.exit(1)
}

let credentials
try {
  credentials = JSON.parse(raw)
} catch {
  console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  process.exit(1)
}

initializeApp({ credential: cert(credentials) })
const db = getFirestore()

const snap = await db.collection('places').get()

// A snapshot of nothing is far more likely to be a broken read than a genuinely
// emptied database, and committing it would overwrite a good backup with an
// empty one — the same class of mistake that caused the incident. Refuse.
if (snap.empty) {
  console.error('Refusing to write a snapshot: the places collection came back empty.')
  process.exit(1)
}

const places = snap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  // Stable key order and stable sort, so a snapshot only diffs when the data
  // actually changed rather than on Firestore's arbitrary ordering.
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((p) => Object.fromEntries(Object.keys(p).sort().map((k) => [k, p[k]])))

const rated = places.filter((p) => p.yk != null || p.ac != null).length

mkdirSync('backups', { recursive: true })
writeFileSync(
  'backups/places.latest.json',
  JSON.stringify({ takenAt: new Date().toISOString(), count: places.length, rated, places }, null, 2) + '\n',
)

console.log(`Snapshot: ${places.length} places, ${rated} rated.`)
