import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleCopy = async () => {
    try {
      const url = window.location.href;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure or restricted environments
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setStatusMessage("Link copied");
      setTimeout(() => {
        setCopied(false);
        setStatusMessage("");
      }, 2500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="copy-link-container">
      <button
        type="button"
        className={"copy-link-btn" + (copied ? " copied" : "")}
        onClick={handleCopy}
        aria-label="Copy current dashboard link"
        title="Copy current dashboard link"
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6.5 9.5a3 3 0 004.24 0l2.5-2.5a3 3 0 00-4.24-4.24L7.8 3.96" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9.5 6.5a3 3 0 00-4.24 0l-2.5 2.5a3 3 0 004.24 4.24l1.2-1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
        <span>{copied ? "Link copied" : "Copy link"}</span>
      </button>

      {/* Screen-reader live region */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </div>
  );
}
