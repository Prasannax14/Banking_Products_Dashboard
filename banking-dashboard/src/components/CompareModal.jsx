import { useEffect, useRef } from "react";
import { formatINR } from "../utils/format.js";

export default function CompareModal({
  isOpen,
  products,
  categoryLabels,
  interestTypes,
  onClose,
  onRemove,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="dialog compare-dialog"
      aria-labelledby="compare-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="dialog-body compare-dialog-body">
        <div className="dialog-scroll compare-dialog-scroll">
          <div className="compare-modal-header">
            <div>
              <p className="card-category">Side-by-side comparison</p>
              <h2 id="compare-dialog-title" className="dialog-title">
                Compare products ({products.length})
              </h2>
            </div>
            <button
              type="button"
              className="profile-close"
              aria-label="Close comparison"
              onClick={onClose}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="compare-table-wrap">
            <table className="compare-table">
              <caption className="visually-hidden">Comparison of selected products</caption>
              <thead>
                <tr>
                  <th scope="col" className="compare-col-feature">Product Feature</th>
                  {products.map((p) => (
                    <th key={p.id} scope="col" className="compare-col-prod">
                      <div className="compare-head-cell">
                        <span className="compare-head-title">{p.name}</span>
                        <button
                          type="button"
                          className="compare-item-remove"
                          onClick={() => onRemove(p.id)}
                          aria-label={`Remove ${p.name} from comparison`}
                          title="Remove from comparison"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Category</th>
                  {products.map((p) => (
                    <td key={p.id}>{categoryLabels?.[p.category] || p.category}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Status for you</th>
                  {products.map((p) => (
                    <td key={p.id}>
                      <span className={"status status-" + (p.status || "available").toLowerCase()}>
                        {p.status || "Available"}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Rate / Return</th>
                  {products.map((p) => (
                    <td key={p.id} className="compare-val-strong">
                      {typeof p.sortRate === "number" ? `${p.sortRate.toFixed(2)}% p.a.` : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Limit / Amount</th>
                  {products.map((p) => (
                    <td key={p.id}>
                      {typeof p.sortLimit === "number" ? formatINR(p.sortLimit) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Interest type</th>
                  {products.map((p) => (
                    <td key={p.id}>
                      {p.interestType ? (interestTypes?.[p.interestType]?.label || p.interestType) : "—"}
                    </td>
                  ))}
                </tr>

                {/* First 3 details */}
                {[0, 1, 2].map((idx) => (
                  <tr key={`detail-row-${idx}`}>
                    <th scope="row">Key Feature {idx + 1}</th>
                    {products.map((p) => {
                      const item = p.details?.[idx];
                      return (
                        <td key={p.id}>
                          {item ? (
                            <div>
                              <strong className="compare-detail-title">{item.label}:</strong>{" "}
                              <span>{item.value}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dialog-footer">
          <button type="button" className="cta cta-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

