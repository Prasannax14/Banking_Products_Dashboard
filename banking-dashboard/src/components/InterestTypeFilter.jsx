// Shown on the Loans tab: explains the two interest types, filters by them,
// shows an eligibility note, and provides an "Eligible only" toggle.
export default function InterestTypeFilter({
  types,
  counts,
  active,
  onChange,
  userName,
  eligibleOnly,
  onToggleEligibleOnly,
}) {
  return (
    <section className="interest" aria-labelledby="interest-heading">
      <div className="interest-header-row">
        <h2 id="interest-heading" className="interest-heading">Loan interest types</h2>
        <div className="interest-controls">
          {userName && (
            <p className="elig-for-note">
              Showing eligibility for <strong>{userName}</strong>
            </p>
          )}
          <label className="elig-only-toggle">
            <input
              type="checkbox"
              checked={eligibleOnly}
              onChange={(e) => onToggleEligibleOnly(e.target.checked)}
            />
            <span>Eligible only</span>
          </label>
        </div>
      </div>
      <div className="interest-options">
        {types.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="interest-option"
              aria-pressed={on}
              onClick={() => onChange(on ? "all" : t.id)}
            >
              <span className="interest-top">
                <span className="interest-label">{t.label}</span>
                <span className="interest-count">{counts[t.id] ?? 0} loans</span>
              </span>
              <span className="interest-desc">{t.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
