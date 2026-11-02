import type { ReactNode } from 'react';

const ICON_PATHS: Record<string, ReactNode> = {
  // Two lines merging into one arrow: several debts becoming one.
  debt_consolidation: (
    <>
      <path d="M6 4c0 4 3 6 6 8" />
      <path d="M18 4c0 4-3 6-6 8" />
      <path d="M12 12v8" />
      <path d="m8.5 16.5 3.5 3.5 3.5-3.5" />
    </>
  ),
  // A house with a door.
  home_improvement: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10h13V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  // A graduation cap.
  education: (
    <>
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9v6" />
    </>
  ),
  // A cross in a circle.
  medical: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v9M7.5 12h9" />
    </>
  ),
};

/** Three dots in a circle, for "Other" and for any purpose without its own. */
const FALLBACK_ICON: ReactNode = (
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="16" cy="12" r="1" fill="currentColor" />
  </>
);

/**
 * A small outline icon for a loan purpose. It is decoration: the purpose's
 * name always sits beside it, so the icon carries no label of its own.
 */
export function LoanPurposeIcon({ purpose }: { purpose: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {ICON_PATHS[purpose] ?? FALLBACK_ICON}
    </svg>
  );
}
