export default function SearchBox({ value, onChange }) {
  return (
    <div className="search">
      <label htmlFor="search" className="visually-hidden">Search products</label>
      <input
        id="search"
        type="search"
        placeholder="Search by name, category or status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
