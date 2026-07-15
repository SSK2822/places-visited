import { useEffect, useState } from 'react'
import Dialog from './Dialog'
import { loadCfg, saveCfg } from '../lib/github'

export default function SettingsModal({ show, onClose, onSaved }) {
  const [cfg, setCfg] = useState(loadCfg)

  useEffect(() => {
    if (show) setCfg(loadCfg())
  }, [show])

  const set = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value })

  function save() {
    saveCfg({
      owner: cfg.owner.trim(),
      repo: cfg.repo.trim(),
      branch: cfg.branch.trim() || 'main',
      token: cfg.token.trim(),
    })
    onClose()
    onSaved()
  }

  const actions = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        Close
      </button>
      <button className="btn btn-primary" onClick={save}>
        Save settings
      </button>
    </>
  )

  return (
    <Dialog show={show} title="GitHub sync" onClose={onClose} actions={actions}>
      <p className="text-muted">
        To publish edits from this site, create a fine-grained personal access token
        (repo → Contents: read &amp; write) and paste it here. It’s stored only in this browser.
      </p>
      <div className="field">
        <label htmlFor="cfg-owner">Owner / Repo / Branch</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input className="input" id="cfg-owner" placeholder="owner" value={cfg.owner} onChange={set('owner')} />
          <input className="input" placeholder="repo" value={cfg.repo} onChange={set('repo')} aria-label="Repo" />
          <input className="input" placeholder="main" value={cfg.branch} onChange={set('branch')} aria-label="Branch" style={{ flex: '.6' }} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cfg-token">Token</label>
        <input className="input" id="cfg-token" type="password" placeholder="github_pat_…" value={cfg.token} onChange={set('token')} />
      </div>
    </Dialog>
  )
}
