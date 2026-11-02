import { formatINR } from "../utils/format.js";

// One card renders every product type: the data shape is identical.
// For loan cards, eligibility is passed and displayed as a badge + summary line.
export default function ProductCard({
  product,
  categoryLabel,
  interestType,
  onAction,
  eligibility,
  isCompared = false,
  canCompareMore = true,
  onToggleCompare,
}) {
  const isLoan = product.category === "loan";
  const { name, metrics, ctaLabel } = product;

  // Status and effective CTA
  const status = product.status;
  const isApply = ctaLabel === "Apply";

  // Loan eligibility display
  let eligBadge = null;
  let eligSummary = null;
  let ctaDisabled = false;
  let ctaDescId = null;

  if (isLoan && eligibility) {
    const { result, maxAmount, indicativeRate, estimatedEmi, checks } = eligibility;

    if (result === "already_holds") {
      eligBadge = (
        <span className="elig-badge elig-holds">
          <span className="elig-dot" aria-hidden="true" />
          {status === "Pending" ? "Pending" : "Active"}
        </span>
      );
    } else if (result === "eligible") {
      eligBadge = (
        <span className="elig-badge elig-ok">
          <span className="elig-dot" aria-hidden="true" />
          Eligible
        </span>
      );
      if (maxAmount != null && estimatedEmi != null && indicativeRate != null) {
        eligSummary = (
          <p className="elig-summary elig-summary-ok">
            {"Up to " + formatINR(maxAmount) + ", EMI about " + formatINR(estimatedEmi) + "/month at " + indicativeRate.toFixed(2) + "% (indicative)"}
          </p>
        );
      }
    } else {
      // not_eligible
      const firstFail = checks && checks.find((c) => !c.pass);
      const reasonId = "elig-reason-" + product.id;
      ctaDisabled = true;
      ctaDescId = reasonId;
      eligBadge = (
        <span className="elig-badge elig-no">
          <span className="elig-dot" aria-hidden="true" />
          Not eligible
        </span>
      );
      eligSummary = (
        <p id={reasonId} className="elig-summary elig-summary-no">
          {firstFail ? (firstFail.fix || firstFail.detail) : "Does not meet eligibility criteria."}
        </p>
      );
    }
  }

  return (
    <article className="card">
      <header className="card-head">
        <div className="card-head-left">
          <p className="card-category">{categoryLabel}</p>
          {onToggleCompare && (
            <label className={"card-compare" + (!canCompareMore && !isCompared ? " disabled" : "")}>
              <input
                type="checkbox"
                checked={isCompared}
                disabled={!canCompareMore && !isCompared}
                onChange={() => onToggleCompare(product.id)}
                aria-label={
                  !canCompareMore && !isCompared
                    ? `Compare ${name} (Maximum 3 products reached)`
                    : `Compare ${name}`
                }
                title={
                  !canCompareMore && !isCompared
                    ? "You can compare up to 3 products at a time"
                    : undefined
                }
              />
              <span>Compare</span>
            </label>
          )}
        </div>
        <span className={"status status-" + status.toLowerCase()}>{status}</span>
      </header>
      <h3 className="card-title">{name}</h3>
      {interestType && (
        <p className={"rate-type rate-" + product.interestType}>{interestType.label}</p>
      )}
      {eligBadge}
      <dl className="metrics">
        {metrics.map((m) => (
          <div key={m.label} className="metric">
            <dt>{m.label}</dt>
            <dd>{m.value}</dd>
          </div>
        ))}
      </dl>
      {eligSummary}
      <button
        type="button"
        className={isApply ? "cta cta-primary" : "cta cta-secondary"}
        onClick={() => onAction(product)}
        aria-label={ctaLabel + ": " + name}
        disabled={ctaDisabled}
        aria-describedby={ctaDescId || undefined}
      >
        {ctaLabel}
      </button>
    </article>
  );
}
