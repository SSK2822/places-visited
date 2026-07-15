import Button from 'react-bootstrap/Button'

export default function AppNavbar({ onSurprise, onSettings, onAdd }) {
  return (
    <nav className="container-xl d-flex align-items-center flex-wrap gap-2 pt-3 pb-2">
      <div className="me-auto">
        <h1 className="h4 fw-bold mb-0 app-title">❤️ Places Visited</h1>
        <div className="text-body-secondary text-uppercase app-subtitle">
          YK &amp; Ac's snack and supper command center
        </div>
      </div>
      <Button variant="outline-secondary" size="sm" onClick={onSurprise} title="Pick a random place">
        🎲 Surprise
      </Button>
      <Button variant="outline-secondary" size="sm" onClick={onSettings} title="GitHub sync settings">
        ⚙️
      </Button>
      <Button variant="primary" size="sm" onClick={onAdd}>
        ＋ Add place
      </Button>
    </nav>
  )
}
