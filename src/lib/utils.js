import { CUISINE_HUES } from './constants'

// Overall = average of whichever of the two ratings exist; null if neither does.
export const overall = (p) => {
  const r = [p.yk, p.ac].filter((v) => v !== null && v !== undefined)
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null
}

export const fmt = (v) =>
  v === null ? '–' : (v > 0 ? '+' : '') + (Number.isInteger(v) ? v : v.toFixed(1))

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
