import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showBadge?: boolean;
}

/**
 * Exam CAGO Official Brand Mark
 * Combines an open examination book silhouette with an integrated 'EC' monogram
 * and academic excellence crest.
 */
export function BrandLogo({ className = 'h-5 w-5', size, showBadge = false }: BrandLogoProps) {
  if (showBadge) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size || 36}
        height={size || 36}
        className={className}
        fill="none"
        aria-hidden="true"
      >
        {/* Rounded Badge Container in Maroon (#800000) */}
        <rect width="64" height="64" rx="15" fill="#800000" />
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="14.25"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.5"
        />

        {/* Academic Diamond Pinnacle (ICAB Academic Excellence) */}
        <path d="M31.5 8L36 12.5L31.5 17L27 12.5Z" fill="#FBBF24" />

        {/* Open Book & Monogram 'EC' (Exam CAGO) */}
        <g fill="#FFFFFF">
          {/* Left Wing / 'C' (Knowledge & Chartered Accountancy) */}
          <path d="M27.5 17.5C21 17 16.5 19.5 14 22.8C11.5 26 11 30.5 11 33C11 35.5 11.5 40 14 43.2C16.5 46.5 21 49 27.5 48.5V42.5C23.5 42.8 20.5 41.5 19 39.5C17.5 37.5 17 35 17 33C17 31 17.5 28.5 19 26.5C20.5 24.5 23.5 23.2 27.5 23.5V17.5Z" />

          {/* Right Wing / 'E' (EXAM / Assessment Question Lines) */}
          <rect x="32.5" y="17.5" width="6" height="31" rx="3" />
          <rect x="35.5" y="17.5" width="16" height="6" rx="3" />
          <rect x="35.5" y="30" width="12" height="6" rx="3" />
          <rect x="35.5" y="42.5" width="16" height="6" rx="3" />
        </g>
      </svg>
    );
  }

  // Pure emblem for use inside existing styled badge containers (e.g. Navbar)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size || 20}
      height={size || 20}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* Academic Diamond Pinnacle */}
      <path d="M31.5 8L36 12.5L31.5 17L27 12.5Z" fill="#FBBF24" />

      {/* Open Book & Monogram 'EC' */}
      <g fill="currentColor">
        {/* Left Wing / 'C' */}
        <path d="M27.5 17.5C21 17 16.5 19.5 14 22.8C11.5 26 11 30.5 11 33C11 35.5 11.5 40 14 43.2C16.5 46.5 21 49 27.5 48.5V42.5C23.5 42.8 20.5 41.5 19 39.5C17.5 37.5 17 35 17 33C17 31 17.5 28.5 19 26.5C20.5 24.5 23.5 23.2 27.5 23.5V17.5Z" />

        {/* Right Wing / 'E' */}
        <rect x="32.5" y="17.5" width="6" height="31" rx="3" />
        <rect x="35.5" y="17.5" width="16" height="6" rx="3" />
        <rect x="35.5" y="30" width="12" height="6" rx="3" />
        <rect x="35.5" y="42.5" width="16" height="6" rx="3" />
      </g>
    </svg>
  );
}
