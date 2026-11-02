export default function SkeletonInfoBar() {
  return (
    <section className="user-info-bar skeleton-info-bar" aria-hidden="true">
      <div className="wrap info-bar-inner">
        <div className="info-tile skeleton-tile">
          <div className="skeleton-line skeleton-tile-title" />
          <div className="credit-tile-body">
            <div className="skeleton-circle" />
            <div className="skeleton-tile-meta">
              <div className="skeleton-line skeleton-val" />
              <div className="skeleton-line skeleton-label" />
            </div>
          </div>
        </div>

        <div className="info-tile skeleton-tile">
          <div className="skeleton-line skeleton-tile-title" />
          <div className="skeleton-line skeleton-bar" />
          <div className="skeleton-legend">
            <div className="skeleton-line skeleton-label" />
            <div className="skeleton-line skeleton-label" />
          </div>
        </div>

        <div className="info-tile skeleton-tile">
          <div className="skeleton-line skeleton-tile-title" />
          <div className="loan-tile-figures">
            <div className="skeleton-metric">
              <div className="skeleton-line skeleton-label" />
              <div className="skeleton-line skeleton-val" />
            </div>
            <div className="skeleton-metric">
              <div className="skeleton-line skeleton-label" />
              <div className="skeleton-line skeleton-val" />
            </div>
          </div>
          <div className="skeleton-line skeleton-thin-bar" />
        </div>
      </div>
    </section>
  );
}

