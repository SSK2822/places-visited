import { LSK_CFG } from './constants'

export function loadCfg() {
  const c = JSON.parse(localStorage.getItem(LSK_CFG) || '{}')
  return {
    owner: c.owner || 'ssk2822',
    repo: c.repo || 'places-visited',
    branch: c.branch || 'main',
    token: c.token || '',
  }
}

export function saveCfg(cfg) {
  localStorage.setItem(LSK_CFG, JSON.stringify(cfg))
}

function b64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return btoa(bin)
}

// Commits the current DB to public/places.json via the GitHub contents API.
// Pushing to main triggers the Pages workflow, which rebuilds the site.
export async function publishPlaces(db, cfg) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/public/places.json`
  const headers = {
    Authorization: 'Bearer ' + cfg.token,
    Accept: 'application/vnd.github+json',
  }
  let sha
  const g = await fetch(`${url}?ref=${cfg.branch}`, { headers })
  if (g.ok) sha = (await g.json()).sha
  const body = {
    message: 'Update places (' + new Date().toISOString().slice(0, 16) + ')',
    content: b64(JSON.stringify(db, null, 2)),
    branch: cfg.branch,
  }
  if (sha) body.sha = sha
  const r = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) })
  if (!r.ok) throw new Error((await r.json()).message || String(r.status))
}
