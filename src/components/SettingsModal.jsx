import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
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

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">⚙️ GitHub sync</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-body-secondary">
          To publish edits from this site, create a fine-grained personal access token
          (repo → Contents: read &amp; write) and paste it here. It's stored only in this browser.
        </p>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-bold text-body-secondary text-uppercase">
            Owner / Repo / Branch
          </Form.Label>
          <div className="d-flex gap-2">
            <Form.Control type="text" placeholder="owner" value={cfg.owner} onChange={set('owner')} />
            <Form.Control type="text" placeholder="repo" value={cfg.repo} onChange={set('repo')} />
            <Form.Control type="text" placeholder="main" value={cfg.branch} onChange={set('branch')} style={{ flex: '.6' }} />
          </div>
        </Form.Group>
        <Form.Group>
          <Form.Label className="small fw-bold text-body-secondary text-uppercase">Token</Form.Label>
          <Form.Control type="password" placeholder="github_pat_…" value={cfg.token} onChange={set('token')} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={save}>
          Save settings
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
