import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
}

// Feather-style line icons drawn with currentColor, so they pick up the surrounding text colour.
function Icon({ size = 16, filled = false, children }: IconProps & { filled?: boolean; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

// Side view of a single-deck bus: one level of windows over a row of wheels.
export function SingleDeckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="11" rx="2" />
      <path d="M3 11h18M8 6v5M14 6v5" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </Icon>
  );
}

// Side view of a double-deck bus: a tall body with a deck line and an upper row of windows.
export function DoubleDeckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="2" width="16" height="17" rx="2" />
      <path d="M4 10h16M9 2v8M15 2v8" />
      <circle cx="8" cy="20.5" r="1.5" />
      <circle cx="16" cy="20.5" r="1.5" />
    </Icon>
  );
}

export function WheelchairIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="4" r="2" />
      <path d="M10 8v5h5l2 4" />
      <path d="M8.5 13.5A5 5 0 1 0 15 19.5" />
    </Icon>
  );
}

export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props} filled={filled}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  );
}
