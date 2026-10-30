// UserSwitcher: shows an initials avatar + name chip in the masthead.
// Clicking or focusing the chip toggles the profile popover / bottom sheet.
// Hover on non-touch also opens it. Esc closes it.
import { useEffect, useRef, useState } from "react";
import UserProfileCard from "./UserProfileCard.jsx";

function initials(name) {
  return name ? name.charAt(0).toUpperCase() : "";
}

export default function UserSwitcher({ users, selectedUser, onSelect }) {
  const [open, setOpen] = useState(false);
  const chipRef = useRef(null);
  const popoverRef = useRef(null);
  const hoverTimer = useRef(null);

  // Close on Esc anywhere, return focus to chip
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        chipRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        !chipRef.current?.contains(e.target) &&
        !popoverRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleMouseEnter() {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 120);
  }

  function handleMouseLeave(e) {
    const related = e.relatedTarget;
    if (popoverRef.current?.contains(related)) return;
    hoverTimer.current = setTimeout(() => setOpen(false), 200);
  }

  function handlePopoverMouseEnter() {
    clearTimeout(hoverTimer.current);
  }

  function handlePopoverMouseLeave() {
    hoverTimer.current = setTimeout(() => setOpen(false), 200);
  }

  const handleClose = () => {
    setOpen(false);
    chipRef.current?.focus();
  };

  if (!selectedUser) return null;

  return (
    <div className="user-switcher">
      {/* Chip */}
      <button
        ref={chipRef}
        type="button"
        className="user-chip"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={"Switch user, currently " + selectedUser.name}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!popoverRef.current?.contains(e.relatedTarget)) {
            setTimeout(() => setOpen(false), 150);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="user-avatar" aria-hidden="true">
          {initials(selectedUser.name)}
        </span>
        <span className="user-chip-name">{selectedUser.name}</span>
        <svg
          className={"user-chip-chevron" + (open ? " open" : "")}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Switcher native select */}
      <label className="visually-hidden" htmlFor="user-select">
        Switch user
      </label>
      <select
        id="user-select"
        className="user-select"
        value={selectedUser.id}
        onChange={(e) => {
          const u = users.find((u) => u.id === e.target.value);
          if (u) onSelect(u);
        }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      {/* Profile card popover / bottom sheet */}
      {open && (
        <>
          <div
            className="profile-backdrop"
            onClick={handleClose}
            aria-hidden="true"
          />
          <UserProfileCard
            ref={popoverRef}
            user={selectedUser}
            onClose={handleClose}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          />
        </>
      )}
    </div>
  );
}
