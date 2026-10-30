import { forwardRef } from "react";
import { formatINR } from "../utils/format.js";
import { scoreBandLabel } from "../utils/loanEligibility.js";

// Credit score band colours (CSS variables are on :root so inline style references them)
function scoreBandClass(score) {
  if (score === null || score === undefined) return "band-none";
  if (score >= 750) return "band-excellent";
  if (score >= 700) return "band-good";
  if (score >= 650) return "band-fair";
  return "band-poor";
}

function kycIcon(kyc) {
  if (kyc === "Verified") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="6" fill="var(--emerald)" />
        <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="var(--slate)" />
      <path d="M7 4v3M7 9.5v.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function initials(name) {
  return name ? name.charAt(0).toUpperCase() : "";
}

// forwardRef so UserSwitcher can attach a ref for outside-click detection
const UserProfileCard = forwardRef(function UserProfileCard(
  { user, onClose, onMouseEnter, onMouseLeave },
  ref
) {
  const foir = user.monthlyIncome > 0
    ? ((user.existingEmi / user.monthlyIncome) * 100).toFixed(0) + "%"
    : "N/A";

  const scoreLabel = scoreBandLabel(user.creditScore);
  const bClass = scoreBandClass(user.creditScore);
  const holdingCount = Object.keys(user.holdings || {}).length;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={"Profile: " + user.name}
      aria-modal="false"
      className="profile-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Demo data note */}
      <p className="profile-demo-note">Demo data — all details are fictional</p>

      {/* Header */}
      <div className="profile-header">
        <span className="profile-avatar">{initials(user.name)}</span>
        <div className="profile-id">
          <p className="profile-name">{user.name}</p>
          <p className="profile-pan">{user.maskedPan}</p>
        </div>
        <button
          type="button"
          className="profile-close"
          aria-label="Close profile"
          onClick={onClose}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Details */}
      <dl className="profile-grid">
        <div className="profile-row">
          <dt>City</dt>
          <dd>{user.city}</dd>
        </div>
        <div className="profile-row">
          <dt>Age</dt>
          <dd>{user.age} yrs</dd>
        </div>
        <div className="profile-row">
          <dt>Employment</dt>
          <dd>{user.employment}</dd>
        </div>
        <div className="profile-row">
          <dt>KYC</dt>
          <dd className="profile-kyc">
            {kycIcon(user.kyc)}
            <span>{user.kyc}</span>
          </dd>
        </div>
        <div className="profile-row">
          <dt>Monthly income</dt>
          <dd>{user.monthlyIncome > 0 ? formatINR(user.monthlyIncome) : "—"}</dd>
        </div>
        <div className="profile-row">
          <dt>Credit score</dt>
          <dd>
            {user.creditScore !== null && user.creditScore !== undefined
              ? user.creditScore + " "
              : ""}
            <span className={"score-band " + bClass}>{scoreLabel}</span>
          </dd>
        </div>
        <div className="profile-row">
          <dt>Existing EMIs</dt>
          <dd>{user.existingEmi > 0 ? formatINR(user.existingEmi) + "/mo" : "None"}</dd>
        </div>
        <div className="profile-row">
          <dt>Repayment burden</dt>
          <dd>{foir}</dd>
        </div>
        <div className="profile-row">
          <dt>Customer since</dt>
          <dd>{user.customerSinceYears} yr{user.customerSinceYears !== 1 ? "s" : ""}</dd>
        </div>
        <div className="profile-row">
          <dt>Products held</dt>
          <dd>{holdingCount === 0 ? "None" : holdingCount + " product" + (holdingCount !== 1 ? "s" : "")}</dd>
        </div>
      </dl>
    </div>
  );
});

export default UserProfileCard;
