import { EDITORS } from '../lib/firebase-config'

export default function Masthead({ onAccount, notifyCount = 0, onBell }) {
  const who = EDITORS.map((e) => e.label).join(' & ')
  return (
    <header className="mast">
      <div className="mast-rail">
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
      <div className="mast-kicker">A Shared Ledger · Est. 2026</div>
      <h1>Places Visited</h1>
      <p className="mast-sub">Everywhere {who} have eaten, ranked with feeling.</p>
      <div className="rule-orn">
        <i>❦</i>
      </div>
    </header>
  )
}
