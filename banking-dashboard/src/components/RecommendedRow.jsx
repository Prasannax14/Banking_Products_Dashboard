import { formatINR } from "../utils/format.js";

export default function RecommendedRow({
  recommendations,
  products,
  userName,
  onSelectProduct,
  categoryLabels,
}) {
  const items = recommendations || [];
  const notice = recommendations?.notice;

  if (items.length === 0 && !notice) {
    return (
      <section className="recommendations-section" aria-labelledby="rec-heading">
        <h2 id="rec-heading" className="rec-section-title">
          Recommended for {userName}
        </h2>
        <p className="rec-empty-note">No recommendations right now.</p>
      </section>
    );
  }

  // Lookup full product objects
  const recProducts = items.map((rec) => {
    const prod = products.find((p) => p.id === rec.productId);
    return { ...prod, reason: rec.reason };
  }).filter((p) => Boolean(p.id));

  return (
    <section className="recommendations-section" aria-labelledby="rec-heading">
      <div className="rec-header">
        <div className="rec-badge-pill" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.1 3.4 12l.7-4L1.2 5.2l4-.6L7 1z" fill="var(--teal)" />
          </svg>
          <span>Curated for you</span>
        </div>
        <h2 id="rec-heading" className="rec-section-title">
          Recommended for {userName}
        </h2>
      </div>

      {notice && (
        <div className="rec-kyc-notice" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="var(--crimson)" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 11v.5" stroke="var(--crimson)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{notice}</span>
        </div>
      )}

      {recProducts.length > 0 ? (
        <div className="rec-grid">
          {recProducts.map((p) => {
            const catLabel = categoryLabels?.[p.category] || p.category;
            return (
              <button
                key={p.id}
                type="button"
                className="rec-card"
                onClick={() => onSelectProduct(p)}
                aria-label={`Recommended: ${p.name}, ${p.reason}. View details.`}
              >
                <div className="rec-card-top">
                  <span className="rec-category">{catLabel}</span>
                  {p.sortRate != null && (
                    <span className="rec-rate">{p.sortRate.toFixed(2)}% p.a.</span>
                  )}
                </div>
                <h3 className="rec-title">{p.name}</h3>
                <p className="rec-reason">{p.reason}</p>
                <span className="rec-action-link" aria-hidden="true">
                  View details
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rec-empty-note">No recommendations right now.</p>
      )}
    </section>
  );
}
