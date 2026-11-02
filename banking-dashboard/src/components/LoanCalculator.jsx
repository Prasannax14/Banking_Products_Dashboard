import { useState } from "react";
import { formatINR } from "../utils/format.js";
import { calculateEmi, emiAfterRateRise } from "../utils/emi.js";

export default function LoanCalculator({ product, eligibility }) {
  const isEligible = eligibility?.result === "eligible";
  const isNotEligible = eligibility?.result === "not_eligible";
  const isFloating = product.interestType === "floating";

  const minAmount = product.eligibility?.minLoanAmount || 50000;
  const maxAmount = isEligible && eligibility?.maxAmount != null
    ? Math.max(minAmount, eligibility.maxAmount)
    : (product.sortLimit || product.eligibility?.minLoanAmount || 500000);

  const maxTenure = product.eligibility?.tenureMonths || 60;
  const minTenure = 12;

  const indicativeRate = eligibility?.indicativeRate ?? product.sortRate ?? 8.0;

  // Amount slider state
  const [amount, setAmount] = useState(() => {
    if (isEligible && eligibility?.maxAmount != null) return eligibility.maxAmount;
    return Math.min(maxAmount, Math.max(minAmount, 500000));
  });

  // Tenure slider state (months)
  const [tenure, setTenure] = useState(maxTenure);

  // Rate shock slider state (% rise)
  const [rateRise, setRateRise] = useState(0);

  // Clamp amount if bounds change
  const currentAmount = Math.min(maxAmount, Math.max(minAmount, amount));
  const currentTenure = Math.min(maxTenure, Math.max(minTenure, tenure));

  const emiData = calculateEmi(currentAmount, indicativeRate, currentTenure);
  const shockData = isFloating
    ? emiAfterRateRise(currentAmount, indicativeRate, currentTenure, rateRise)
    : null;

  const tenureYears = currentTenure / 12;
  const tenureText = `${tenureYears} ${tenureYears === 1 ? "year" : "years"} (${currentTenure} months)`;

  // Slider step for amount
  const amountStep = minAmount >= 100000 ? 50000 : 10000;

  return (
    <section className="loan-calculator" aria-labelledby="loan-calc-heading">
      <div className="calc-header">
        <h3 id="loan-calc-heading" className="calc-title">Loan EMI Calculator</h3>
        {isNotEligible && (
          <span className="calc-badge calc-badge-indicative" role="note">
            Indicative only
          </span>
        )}
      </div>

      {isNotEligible && (
        <p className="calc-note">
          <strong>Indicative only:</strong> You do not currently meet the eligibility criteria for this loan. Figures below are for illustration based on standard terms.
        </p>
      )}

      {/* Sliders */}
      <div className="calc-controls">
        {/* Loan Amount Slider */}
        <div className="calc-field">
          <div className="calc-field-head">
            <label htmlFor="calc-amount-slider" className="calc-label">
              Loan amount
            </label>
            <span className="calc-value" aria-live="polite">
              {formatINR(currentAmount)}
            </span>
          </div>
          <input
            id="calc-amount-slider"
            type="range"
            min={minAmount}
            max={maxAmount}
            step={amountStep}
            value={currentAmount}
            aria-valuemin={minAmount}
            aria-valuemax={maxAmount}
            aria-valuenow={currentAmount}
            aria-valuetext={formatINR(currentAmount)}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="calc-slider"
          />
          <div className="calc-range-limits" aria-hidden="true">
            <span>{formatINR(minAmount)}</span>
            <span>{formatINR(maxAmount)}</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="calc-field">
          <div className="calc-field-head">
            <label htmlFor="calc-tenure-slider" className="calc-label">
              Tenure
            </label>
            <span className="calc-value" aria-live="polite">
              {tenureText}
            </span>
          </div>
          <input
            id="calc-tenure-slider"
            type="range"
            min={minTenure}
            max={maxTenure}
            step={12}
            value={currentTenure}
            aria-valuemin={minTenure}
            aria-valuemax={maxTenure}
            aria-valuenow={currentTenure}
            aria-valuetext={tenureText}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="calc-slider"
          />
          <div className="calc-range-limits" aria-hidden="true">
            <span>1 year</span>
            <span>{maxTenure / 12} years</span>
          </div>
        </div>

        {/* Rate Shock Slider (Floating loans only) */}
        {isFloating ? (
          <div className="calc-field calc-field-shock">
            <div className="calc-field-head">
              <label htmlFor="calc-rate-shock-slider" className="calc-label">
                If the rate rises by
              </label>
              <span className="calc-value calc-value-shock" aria-live="polite">
                +{rateRise.toFixed(2)}% ({(indicativeRate + rateRise).toFixed(2)}% p.a.)
              </span>
            </div>
            <input
              id="calc-rate-shock-slider"
              type="range"
              min={0}
              max={3.0}
              step={0.25}
              value={rateRise}
              aria-valuemin={0}
              aria-valuemax={3.0}
              aria-valuenow={rateRise}
              aria-valuetext={`+${rateRise.toFixed(2)}%`}
              onChange={(e) => setRateRise(Number(e.target.value))}
              className="calc-slider"
            />
            <div className="calc-range-limits" aria-hidden="true">
              <span>0% (no change)</span>
              <span>+3.00%</span>
            </div>
          </div>
        ) : (
          <div className="calc-fixed-note" role="note">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 7V5a4 4 0 018 0v2M5 7h6a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Rate locked for the full term. Your EMI will not change.</span>
          </div>
        )}
      </div>

      {/* Figures Breakdown */}
      <div className="calc-summary">
        <div className="calc-summary-primary">
          <span className="calc-summary-label">Monthly EMI</span>
          <span className="calc-summary-amount">{formatINR(emiData.emi)}/mo</span>
          <span className="calc-summary-rate">at {indicativeRate.toFixed(2)}% p.a. (indicative)</span>
        </div>

        <div className="calc-summary-grid">
          <div className="calc-summary-item">
            <dt>Total interest</dt>
            <dd>{formatINR(emiData.totalInterest)}</dd>
          </div>
          <div className="calc-summary-item">
            <dt>Total payable</dt>
            <dd>{formatINR(emiData.totalPayable)}</dd>
          </div>
        </div>

        {/* Rate rise shock outcome */}
        {isFloating && rateRise > 0 && shockData && (
          <div className="calc-shock-result" role="region" aria-label="Rate rise impact">
            <p className="calc-shock-title">Impact of +{rateRise.toFixed(2)}% rate rise</p>
            <dl className="calc-shock-grid">
              <div>
                <dt>EMI now</dt>
                <dd>{formatINR(shockData.emi)}/mo</dd>
              </div>
              <div>
                <dt>EMI after rise</dt>
                <dd className="shock-highlight">{formatINR(shockData.shockedEmi)}/mo</dd>
              </div>
              <div>
                <dt>Monthly difference</dt>
                <dd className="shock-diff">+{formatINR(shockData.monthlyDifference)}/mo</dd>
              </div>
              <div>
                <dt>Extra total interest</dt>
                <dd className="shock-diff">+{formatINR(shockData.extraTotalInterest)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

