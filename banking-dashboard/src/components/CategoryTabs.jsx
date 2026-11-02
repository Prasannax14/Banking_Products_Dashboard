import { useEffect, useRef } from "react";

export default function CategoryTabs({ categories, counts, active, onChange }) {
  const tabs = [{ id: "all", label: "All" }, ...categories];
  const activeTabRef = useRef(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [active]);

  return (
    <div className="tabs" role="tablist" aria-label="Filter by product category">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            ref={isActive ? activeTabRef : null}
            type="button"
            role="tab"
            className="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            <span className="tab-count">{counts[t.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
