import { EDITORS } from './firebase-config'

// Overall = average of whichever of the two ratings exist; null if neither does.
export const overall = (p) => {
  const r = [p.yk, p.ac].filter((v) => v !== null && v !== undefined)
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null
}

// A place only counts as "rated" — ranked, out of the To-rate queue — once
// BOTH editors have weighed in. A single verdict leaves it pending, waiting on
// the other. This is the ranking predicate; `overall` still averages whatever
// exists, for display.
export const fullyRated = (p) =>
  EDITORS.every((e) => p[e.key] !== null && p[e.key] !== undefined)

// Which editors haven't scored a place yet — used to nudge in the To-rate list.
export const pendingEditors = (p) =>
  EDITORS.filter((e) => p[e.key] === null || p[e.key] === undefined)

// The blind-rating game: a partner's score stays concealed until you've rated
// too. You always see your own; both reveal to everyone once the pair is
// complete. NOTE: this is cosmetic — Firestore reads are public, so it hides
// the number in the UI, it doesn't cryptographically keep it secret.
export function scoreHidden(place, key, myKey) {
  if (fullyRated(place)) return false // both in — revealed
  if (key === myKey) return false // always your own
  return place[key] !== null && place[key] !== undefined // partner's, and they've weighed in
}

// The playful verdict shown at the reveal, from how the two scores compare.
export function verdict(yk, ac) {
  const d = Math.abs(yk - ac)
  const bothNeg = yk < 0 && ac < 0
  const oppose = (yk > 0 && ac < 0) || (yk < 0 && ac > 0)
  if (d === 0) {
    if (yk > 0) return { title: 'Twin flames 🔥', line: 'Identical scores — you both loved it exactly this much.' }
    if (yk < 0) return { title: 'United in regret 🫠', line: 'Same score, same disappointment. Never again — together.' }
    return { title: 'Perfectly mid 😐', line: 'You both landed on a shrug. Iconic.' }
  }
  if (oppose && d >= 2) return { title: 'Far opps fr 🧨', line: 'One of you would go back tomorrow, the other filed a complaint.' }
  if (d <= 0.5) {
    if (bothNeg) return { title: 'Agreed: avoid 🚫', line: 'A hair apart, and united in “no”.' }
    return { title: 'Soulmates 💫', line: 'Barely a hair apart — same wavelength.' }
  }
  if (d <= 1.25) return { title: 'In sync 🤝', line: 'Pretty much on the same page.' }
  if (d <= 2.5) return { title: 'A little spicy 🌶️', line: 'Some healthy disagreement never hurt anyone.' }
  return { title: 'Different planets 🪐', line: 'How do you two even eat at the same table?' }
}

// Ratings step in quarters, so an overall average can land on eighths
// (e.g. (1.25 + 1.5) / 2 = 1.375) — round to kill float noise, then
// trim trailing zeros without forcing a fixed decimal count.
export const fmt = (v) => {
  if (v === null || v === undefined) return '–'
  const rounded = Math.round(v * 1000) / 1000
  const str = rounded.toFixed(3).replace(/\.?0+$/, '') || '0'
  return (rounded > 0 ? '+' : '') + str
}

// The design system colours a score by sign: accent-2 for positive, a warm
// red for negative, muted neutral for zero and unrated.
export const ratingClass = (v) => {
  if (v === null || v === undefined) return 'zero'
  if (v > 0) return 'pos'
  if (v < 0) return 'neg'
  return 'zero'
}

export function slugify(name, places, editingId = null) {
  const base =
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'place'
  let out = base
  let i = 2
  while (places.some((p) => p.id === out && p.id !== editingId)) out = `${base}-${i++}`
  return out
}

export const mapsUrl = (p) =>
  `https://www.google.com/maps/search/${encodeURIComponent(p.name + ' ' + p.city)}`

// A stored visit date ("YYYY-MM-DD") as a readable label. The "T00:00:00"
// anchors it to local time so the day doesn't slip a date in western zones.
export const fmtVisited = (v) => {
  if (!v) return null
  const d = new Date(`${v}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// The most recently written of the two per-editor comments, for the
// ledger row's note line. Returns null when neither editor has left one.
export function latestComment(place) {
  const entries = EDITORS.map((e) => ({
    name: e.name,
    text: place[`${e.key}Comment`],
    at: place[`${e.key}CommentAt`] || 0,
  })).filter((c) => c.text)
  if (!entries.length) return null
  entries.sort((a, b) => b.at - a.at)
  return entries[0]
}
