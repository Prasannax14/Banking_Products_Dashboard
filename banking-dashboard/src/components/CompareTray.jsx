export default function CompareTray({
  selectedProducts,
  onOpenCompare,
  onClear,
}) {
  const count = selectedProducts.length;
  if (count === 0) return null;

  const names = selectedProducts.map((p) => p.name).join(", ");
  const canCompare = count >= 2;

  return (
    <aside
      className="compare-tray"
      aria-label="Product comparison tray"
      role="region"
    >
      <div className="wrap compare-tray-inner">
        <div className="compare-tray-info">
          <span className="compare-tray-badge">{count} / 3</span>
          <div className="compare-tray-text">
            <strong className="compare-tray-heading">
              Comparing {count} {count === 1 ? "product" : "products"}
            </strong>
            <span className="compare-tray-names" title={names}>
              {names}
            </span>
          </div>
        </div>

        <div className="compare-tray-actions">
          <button
            type="button"
            className="cta cta-primary compare-btn"
            onClick={onOpenCompare}
            disabled={!canCompare}
            title={!canCompare ? "Select at least 2 products to compare" : undefined}
            aria-label={
              canCompare
                ? `Compare ${count} selected products`
                : "Select at least 2 products to compare"
            }
          >
            Compare
          </button>
          <button
            type="button"
            className="cta cta-secondary compare-clear-btn"
            onClick={onClear}
            aria-label="Clear all compared products"
          >
            Clear
          </button>
        </div>
      </div>
    </aside>
  );
}

