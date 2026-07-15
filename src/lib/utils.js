import { CUISINE_HUES } from './constants'
import { EDITORS } from './firebase-config'

// Overall = average of whichever of the two ratings exist; null if neither does.
export const overall = (p) => {
  const r = [p.yk, p.ac].filter((v) => v !== null && v !== undefined)
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null
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

export const ratingClass = (v) => {
  if (v === null) return 'rating-zero'
  if (v > 0) return 'rating-pos'
  if (v < 0) return 'rating-neg'
  return 'rating-zero'
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

export function cuisineHue(name) {
  if (name in CUISINE_HUES) return CUISINE_HUES[name]
  let h = 0
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 360
  return h
}

// The most recently written of the two per-editor comments, for the
// card preview. Returns null when neither editor has left one.
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
