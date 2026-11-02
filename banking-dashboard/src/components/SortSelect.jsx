export default function SortSelect({ value, onChange }) {
  return (
    <div className="sort-control">
      <label htmlFor="sort-select" className="sort-label">
        Sort by
      </label>
      <select
        id="sort-select"
        className="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort products"
      >
        <option value="recommended">Recommended (default)</option>
        <option value="name">Name A-Z</option>
        <option value="rate">Lowest rate</option>
        <option value="limit">Highest limit</option>
      </select>
    </div>
  );
}
