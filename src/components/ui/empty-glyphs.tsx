import * as React from "react";

const baseProps = {
  width: 56,
  height: 56,
  viewBox: "0 0 56 56",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function EmptyGlyphTeam() {
  return (
    <svg {...baseProps}>
      <circle cx="20" cy="20" r="6" />
      <circle cx="38" cy="22" r="5" />
      <path d="M8 42c0-6 5-10 12-10s12 4 12 10" />
      <path d="M28 44c0-5 4-9 10-9s10 3 10 8" />
    </svg>
  );
}

export function EmptyGlyphTasks() {
  return (
    <svg {...baseProps}>
      <rect x="10" y="14" width="28" height="6" rx="1.5" />
      <rect x="14" y="26" width="36" height="6" rx="1.5" />
      <rect x="10" y="38" width="24" height="6" rx="1.5" />
      <path d="M44 14l4-3M48 11l2 2" />
    </svg>
  );
}

export function EmptyGlyphNotifications() {
  return (
    <svg {...baseProps}>
      <path d="M16 36V24a12 12 0 0 1 24 0v12l4 4H12l4-4z" />
      <path d="M24 46a4 4 0 0 0 8 0" />
      <line x1="14" y1="10" x2="42" y2="10" strokeDasharray="2 3" />
    </svg>
  );
}

export function EmptyGlyphInbox() {
  return (
    <svg {...baseProps}>
      <path d="M8 28l6-16h28l6 16" />
      <path d="M8 28v14a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V28" />
      <path d="M8 28h12l2 4h12l2-4h12" />
    </svg>
  );
}
