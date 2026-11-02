import { formatINR } from "../utils/format.js";

export default function UserInfoBar({ user, products = [] }) {
  if (!user) return null;

  // 1. Credit Card Calculations
  const creditLimit = user.accounts?.creditLimit || 0;
  const creditUsed = user.accounts?.creditUsed || 0;
  const creditPct =
    creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  let creditColor = "var(--emerald)";
  let usageLabel = "Low usage";
  if (creditPct >= 70) {
    creditColor = "var(--crimson)";
    usageLabel = "High usage";
  } else if (creditPct >= 30) {
    creditColor = "var(--teal)";
    usageLabel = "Moderate usage";
  }

  // Ring geometry: radius 36, circumference ~226.19
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, creditPct) / 100) * circumference;

  // 2. Bank Balance Calculations
  const savings = user.accounts?.availableBalance || 0;
  const deposits = user.accounts?.fixedDeposits || 0;
  const investments = user.accounts?.investments || 0;
  const totalBalance = savings + deposits + investments;

  const segments = [];
  if (totalBalance > 0) {
    if (savings > 0) {
      segments.push({
        label: "Savings",
        amount: savings,
        pct: (savings / totalBalance) * 100,
        color: "var(--navy)",
      });
    }
    if (deposits > 0) {
      segments.push({
        label: "Deposits",
        amount: deposits,
        pct: (deposits / totalBalance) * 100,
        color: "var(--teal)",
      });
    }
    if (investments > 0) {
      segments.push({
        label: "Investments",
        amount: investments,
        pct: (investments / totalBalance) * 100,
        color: "var(--emerald)",
      });
    }
  }

  // 3. Loans Calculations
  // Find all active loans held by this user
  const activeLoans = products.filter(
    (p) => p.category === "loan" && user.holdings?.[p.id] === "Active"
  );

  const totalLoanOutstanding = activeLoans.reduce((sum, p) => {
    return sum + (typeof p.outstandingAmount === "number" ? p.outstandingAmount : 0);
  }, 0);

  // Original principal if data exists
  let totalOriginalPrincipal = 0;
  let hasOriginalData = false;
  activeLoans.forEach((p) => {
    if (typeof p.originalAmount === "number" && p.originalAmount > 0) {
      totalOriginalPrincipal += p.originalAmount;
      hasOriginalData = true;
    }
  });

  const principalRemainingPct =
    hasOriginalData && totalOriginalPrincipal > 0
      ? Math.min(100, (totalLoanOutstanding / totalOriginalPrincipal) * 100)
      : null;

  return (
    <section
      id="user-info-bar"
      className="user-info-bar"
      aria-label={`Account overview for ${user.name}`}
    >
      <div className="wrap info-bar-inner">
        {/* Credit Tile */}
        <div className="info-tile credit-tile">
          <div className="info-tile-head">
            <span className="info-tile-title">Credit utilisation</span>
            <span
              className={"usage-tag " + usageLabel.toLowerCase().replace(" ", "-")}
              style={{ color: creditColor }}
            >
              {usageLabel}
            </span>
          </div>

          <div className="credit-tile-body">
            {/* Hand-built SVG ring */}
            <div className="credit-ring-wrap" aria-hidden="true">
              <svg width="86" height="86" viewBox="0 0 86 86" className="credit-svg-ring">
                {/* Background track */}
                <circle
                  cx="43"
                  cy="43"
                  r={radius}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="8"
                />
                {/* Filled arc */}
                <circle
                  cx="43"
                  cy="43"
                  r={radius}
                  fill="none"
                  stroke={creditColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 43 43)"
                />
                {/* Centered % */}
                <text
                  x="43"
                  y="47"
                  textAnchor="middle"
                  className="credit-ring-text"
                >
                  {creditLimit > 0 ? `${creditPct}%` : "0%"}
                </text>
              </svg>
            </div>

            <div className="credit-tile-meta">
              <span className="credit-used-val">
                {creditLimit > 0 ? formatINR(creditUsed) : "₹0"}
              </span>
              <span className="credit-limit-val">
                {creditLimit > 0 ? `of ${formatINR(creditLimit)} limit` : "No active card"}
              </span>
            </div>
          </div>

          {/* Accessible text equivalent */}
          <div className="visually-hidden">
            Credit card utilisation is {creditPct}%, {usageLabel}.{" "}
            {creditLimit > 0
              ? `${formatINR(creditUsed)} used of ${formatINR(creditLimit)} total limit.`
              : "No active credit card on file."}
          </div>
        </div>

        {/* Bank Balance Tile */}
        <div className="info-tile balance-tile">
          <div className="info-tile-head">
            <span className="info-tile-title">Total balances</span>
            <span className="total-balance-val">{formatINR(totalBalance)}</span>
          </div>

          {/* Stacked horizontal bar */}
          <div className="balance-bar-wrap" aria-hidden="true">
            <svg width="100%" height="12" className="stacked-svg-bar">
              <rect x="0" y="0" width="100%" height="12" rx="6" fill="var(--line)" />
              {(() => {
                let currentX = 0;
                return segments.map((seg, idx) => {
                  const x = currentX;
                  currentX += seg.pct;
                  return (
                    <rect
                      key={seg.label}
                      x={`${x}%`}
                      y="0"
                      width={`${seg.pct}%`}
                      height="12"
                      fill={seg.color}
                      rx={idx === 0 && segments.length === 1 ? 6 : 0}
                    />
                  );
                });
              })()}
            </svg>
          </div>

          {/* Legend (only non-zero segments) */}
          <div className="balance-legend">
            {segments.length > 0 ? (
              segments.map((seg) => (
                <div key={seg.label} className="legend-item">
                  <span
                    className="legend-dot"
                    style={{ background: seg.color }}
                    aria-hidden="true"
                  />
                  <span className="legend-label">{seg.label}:</span>
                  <strong className="legend-amount">{formatINR(seg.amount)}</strong>
                </div>
              ))
            ) : (
              <span className="legend-empty">No active balance accounts</span>
            )}
          </div>

          {/* Accessible text equivalent */}
          <div className="visually-hidden">
            Total bank balance {formatINR(totalBalance)}, comprising:{" "}
            {segments.map((s) => `${s.label} ${formatINR(s.amount)}`).join(", ") ||
              "no deposits or investments"}.
          </div>
        </div>

        {/* Loans Tile */}
        <div className="info-tile loans-tile">
          <div className="info-tile-head">
            <span className="info-tile-title">Active loans</span>
            <span className="loan-active-count">
              {activeLoans.length} active {activeLoans.length === 1 ? "loan" : "loans"}
            </span>
          </div>

          <div className="loan-tile-body">
            <div className="loan-tile-figures">
              <div className="loan-fig-item">
                <span className="loan-fig-label">Outstanding balance</span>
                <strong className="loan-fig-amount">
                  {totalLoanOutstanding > 0 ? formatINR(totalLoanOutstanding) : "₹0"}
                </strong>
              </div>
              <div className="loan-fig-item">
                <span className="loan-fig-label">Total monthly EMI</span>
                <span className="loan-fig-sub">
                  {user.existingEmi > 0 ? `${formatINR(user.existingEmi)}/mo` : "None"}
                </span>
              </div>
            </div>

            {/* Thin bar of outstanding vs original principal if data exists */}
            {hasOriginalData && principalRemainingPct !== null && (
              <div className="loan-principal-progress">
                <div className="loan-progress-wrap" aria-hidden="true">
                  <svg width="100%" height="6" className="loan-progress-svg">
                    <rect x="0" y="0" width="100%" height="6" rx="3" fill="var(--line)" />
                    <rect
                      x="0"
                      y="0"
                      width={`${principalRemainingPct}%`}
                      height="6"
                      rx="3"
                      fill="var(--teal)"
                    />
                  </svg>
                </div>
                <span className="loan-principal-caption">
                  {formatINR(totalLoanOutstanding)} remaining of{" "}
                  {formatINR(totalOriginalPrincipal)} original principal
                </span>
              </div>
            )}
          </div>

          {/* Accessible text equivalent */}
          <div className="visually-hidden">
            {activeLoans.length > 0
              ? `${activeLoans.length} active loans with total outstanding balance of ${formatINR(totalLoanOutstanding)} and monthly EMI of ${formatINR(user.existingEmi)}.`
              : "No active loans."}
          </div>
        </div>
      </div>
    </section>
  );
}

