export default function UserInfoSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-controls={checked ? "user-info-bar" : undefined}
      className={"user-info-switch" + (checked ? " on" : "")}
      onClick={() => onChange(!checked)}
      aria-label="Toggle user account overview bar"
      title={checked ? "Hide account overview" : "Show account overview"}
    >
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <span className="switch-label">Overview</span>
    </button>
  );
}
