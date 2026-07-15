import { EDITORS } from '../lib/firebase-config'

export default function Masthead({ onAccount, onSurprise }) {
  const who = EDITORS.map((e) => e.label).join(' & ')
  return (
    <header className="mast">
      <div className="mast-rail">
        <button className="btn btn-ghost" onClick={onAccount}>
          Account
        </button>
      </div>
      <div className="mast-kicker">A Shared Ledger · Est. 2026</div>
      <h1>Places Visited</h1>
      <p className="mast-sub">Everywhere {who} have eaten, ranked with feeling.</p>

      {/* The masthead's ornament rule is the Surprise affordance: the signature
          moment reads as a printed device, not a button next to "Add a place". */}
      <div className="rule-orn">
        <button className="surprise-orn" onClick={onSurprise}>
          <i aria-hidden="true">❦</i>
          <span>Surprise us</span>
          <i aria-hidden="true">❦</i>
        </button>
      </div>
    </header>
  )
}
