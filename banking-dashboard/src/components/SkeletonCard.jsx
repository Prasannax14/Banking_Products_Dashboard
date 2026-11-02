export default function SkeletonCard() {
  return (
    <article className="card skeleton-card" aria-hidden="true">
      <div className="card-head">
        <div className="skeleton-line skeleton-tag" />
        <div className="skeleton-line skeleton-status" />
      </div>
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-metrics">
        <div className="skeleton-metric">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-val" />
        </div>
        <div className="skeleton-metric">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-val" />
        </div>
      </div>
      <div className="skeleton-line skeleton-cta" />
    </article>
  );
}
