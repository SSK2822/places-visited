import Button from 'react-bootstrap/Button'

export default function AppNavbar({ onSurprise, onSettings, onAdd, theme, onToggleTheme }) {
  return (
    <nav className="container-xl d-flex align-items-center flex-wrap gap-2 pt-3 pb-2">
      <div className="me-auto">
        <h1 className="h4 fw-bold mb-0 app-title">
          ❤️ <span className="app-title-gradient">Places Visited</span>
        </h1>
        <div className="text-body-secondary text-uppercase app-subtitle">
          YK &amp; Ac's snack and supper command center
        </div>
      </div>
      <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={onSurprise} title="Pick a random place">
        🎲 Surprise
      </Button>
      <Button
        variant="outline-secondary"
        size="sm"
        className="rounded-pill"
        onClick={onToggleTheme}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>
      <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={onSettings} title="Account & sync settings">
        ⚙️
      </Button>
      <Button variant="primary" size="sm" className="rounded-pill px-3" onClick={onAdd}>
        ＋ Add place
      </Button>
    </nav>
  )
}
