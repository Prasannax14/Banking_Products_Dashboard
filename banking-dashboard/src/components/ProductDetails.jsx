import { useEffect, useRef } from "react";
import { formatINR } from "../utils/format.js";
import LoanCalculator from "./LoanCalculator.jsx";

// Modal using the native <dialog>: focus trap and Esc to close come built in.
export default function ProductDetails({
  product,
  categoryLabel,
  interestType,
  onClose,
  eligibility,  // result from checkLoanEligibility for the selected user
  userName,     // selected user's name, for section heading
}) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, [product]);

  if (!product) return null;

  const isLoan = product.category === "loan";

  function CheckIcon({ pass }) {
    return pass ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="check-icon check-pass">
        <circle cx="8" cy="8" r="7" fill="var(--emerald)" />
        <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="check-icon check-fail">
        <circle cx="8" cy="8" r="7" fill="var(--crimson)" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="dialog-body">
        <div className="dialog-scroll">
          <p className="card-category">{categoryLabel} · {product.status}</p>
          <h2 id="dialog-title" className="dialog-title">{product.name}</h2>

          {interestType && (
            <div className={"rate-note rate-" + product.interestType}>
              <strong>{interestType.label}.</strong> {interestType.description}
            </div>
          )}

          <dl className="detail-list">
            {[...product.metrics, ...product.details].map((row) => (
              <div key={row.label} className="detail-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>

          {/* Eligibility section for loans */}
          {isLoan && eligibility && (
            <section className="dialog-eligibility" aria-labelledby="elig-heading">
              <h3 id="elig-heading" className="elig-section-heading">
                Eligibility for {userName}
              </h3>

              {eligibility.result === "already_holds" ? (
                <p className="elig-already">You already hold this product.</p>
              ) : (
                <>
                  <ul className="elig-checklist" role="list">
                    {(eligibility.checks || []).map((c) => (
                      <li key={c.id} className={"elig-item" + (c.pass ? "" : " elig-item-fail")}>
                        <CheckIcon pass={c.pass} />
                        <span className="elig-item-text">
                          <strong className="elig-item-label">{c.label}</strong>
                          <span className="elig-item-detail">{c.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {eligibility.result === "not_eligible" && (
                    <div className="elig-qualify" aria-labelledby="qualify-heading">
                      <h4 id="qualify-heading" className="elig-qualify-heading">How to qualify</h4>
                      <ul className="elig-qualify-list" role="list">
                        {(eligibility.checks || [])
                          .filter((c) => !c.pass && c.fix)
                          .map((c) => (
                            <li key={c.id} className="elig-qualify-item">
                              <span className="qualify-dot" aria-hidden="true" />
                              <span>{c.fix}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {eligibility.result === "eligible" && eligibility.maxAmount != null && (
                    <div className="elig-terms">
                      <p className="elig-terms-heading">Indicative terms</p>
                      <dl className="detail-list">
                        <div className="detail-row">
                          <dt>Maximum amount</dt>
                          <dd>{formatINR(eligibility.maxAmount)}</dd>
                        </div>
                        <div className="detail-row">
                          <dt>Indicative rate</dt>
                          <dd>{eligibility.indicativeRate.toFixed(2)}% p.a.</dd>
                        </div>
                        <div className="detail-row">
                          <dt>Estimated EMI</dt>
                          <dd>{formatINR(eligibility.estimatedEmi)}/month</dd>
                        </div>
                        <div className="detail-row">
                          <dt>Rate type</dt>
                          <dd>{interestType ? interestType.label : "—"}</dd>
                        </div>
                      </dl>
                      <p className="elig-disclaimer">
                        Rates are indicative only. Final terms are subject to credit assessment.
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {isLoan && (
            <LoanCalculator
              product={product}
              eligibility={eligibility}
            />
          )}
        </div>

        <div className="dialog-footer">
          <button type="button" className="cta cta-secondary" onClick={() => ref.current.close()}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
