import { EDITORS } from '../lib/firebase-config'

export default function Masthead({
  onAccount, notifyCount = 0, onBell, theme, onToggleTheme, onSurprise, surpriseScope,
}) {
  const who = EDITORS.map((e) => e.label).join(' & ')
  const dark = theme === 'dark'
  return (
    <header className="mast">
      <div className="mast-rail">
        {/* Surprise lives top-left as a compact pill rather than a full-width
            card, so it's one tap away without taking over the page. The scope
            says which top 10 it's drawing from. */}
        <button
          className="btn surprise-pill"
          onClick={onSurprise}
          title={`Pick from the top 10${surpriseScope ? ` in ${surpriseScope}` : ''}`}
        >
          <span className="surprise-pill-orn" aria-hidden="true">❦</span>
          Surprise us
          {surpriseScope && <span className="surprise-pill-scope"> · {surpriseScope}</span>}
        </button>

        <div className="mast-rail-end">
          <button
            className="btn btn-ghost theme-toggle"
            onClick={onToggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? '☀' : '☾'}
          </button>
          {notifyCount > 0 && (
            <button
              className="btn btn-ghost bell"
              onClick={onBell}
              aria-label={`${notifyCount} new ${notifyCount === 1 ? 'reveal' : 'reveals'}`}
            >
              🔔
              <span className="bell-badge">{notifyCount}</span>
            </button>
          )}
          <button className="btn btn-ghost" onClick={onAccount}>
            Account
          </button>
        </div>
      </div>
      <div className="mast-kicker">A Shared Ledger · Est. 2026</div>
      <h1>Places Visited</h1>
      <p className="mast-sub">Everywhere {who} have eaten, ranked with feeling.</p>
      <div className="rule-orn">
        <i>❦</i>
      </div>
    </header>
  )
}
