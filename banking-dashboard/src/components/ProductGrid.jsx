import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({
  products,
  categoryLabels,
  interestTypes,
  onAction,
  onReset,
  eligibilityMap, // { [productId]: eligibility result } — only for loan products
  isLoanTab,
}) {
  if (products.length === 0) {
    return (
      <div className="empty">
        <p className="empty-title">No products match your filters.</p>
        <p>Try a different search term or choose another category.</p>
        <button type="button" className="cta cta-secondary" onClick={onReset}>
          Clear filters
        </button>
      </div>
    );
  }

  // On the Loans tab only, group into three states in order:
  // 1. "Your active loans" (already_holds)
  // 2. "You can apply for" (eligible)
  // 3. "Not available right now" (not_eligible)
  // Hide empty groups.
  if (isLoanTab) {
    const activeLoans = [];
    const eligibleLoans = [];
    const notEligibleLoans = [];

    products.forEach((p) => {
      const res = eligibilityMap?.[p.id]?.result;
      if (res === "already_holds") {
        activeLoans.push(p);
      } else if (res === "eligible") {
        eligibleLoans.push(p);
      } else {
        notEligibleLoans.push(p);
      }
    });

    const groups = [
      { id: "active", title: "Your active loans", items: activeLoans },
      { id: "eligible", title: "You can apply for", items: eligibleLoans },
      { id: "not-eligible", title: "Not available right now", items: notEligibleLoans },
    ].filter((g) => g.items.length > 0);

    return (
      <div className="loan-groups">
        {groups.map((group) => (
          <section key={group.id} className="loan-group" aria-labelledby={"heading-" + group.id}>
            <h2 id={"heading-" + group.id} className="loan-group-title">
              {group.title} <span className="loan-group-count">({group.items.length})</span>
            </h2>
            <div className="grid">
              {group.items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryLabel={categoryLabels[p.category]}
                  interestType={interestTypes[p.interestType]}
                  onAction={onAction}
                  eligibility={eligibilityMap ? eligibilityMap[p.id] : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Flat grid for "All", "Savings", "Credit cards", "Wealth"
  return (
    <div className="grid">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          categoryLabel={categoryLabels[p.category]}
          interestType={interestTypes[p.interestType]}
          onAction={onAction}
          eligibility={eligibilityMap ? eligibilityMap[p.id] : undefined}
        />
      ))}
    </div>
  );
}
