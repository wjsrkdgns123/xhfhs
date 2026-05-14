interface CharacterAvatarProps {
  side: 'pro' | 'con';
  size?: number;
  /** Override the body fill. Defaults to side-appropriate brand color. */
  color?: string;
}

/**
 * Hand-drawn-style mascot for the two debate seats.
 * - PRO = fox (vermillion family) — pointed ears, narrow muzzle
 * - CON = bear (celadon family) — round ears, broad muzzle
 *
 * Designed in 24×24 viewBox so it scales cleanly inside the existing 44px
 * avatar frames. Stroke uses currentColor so dark/light mode inherits ink.
 */
export function CharacterAvatar({ side, size = 28, color }: CharacterAvatarProps) {
  if (side === 'pro') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        {/* Ears (pointed) */}
        <path
          d="M5.5 8 L4 3 L9 5.5 Z"
          fill={color ?? '#c84b1f'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 8 L20 3 L15 5.5 Z"
          fill={color ?? '#c84b1f'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Inner ear accents */}
        <path d="M5.7 6.6 L6.5 4.5 L7.6 5.6" fill="#fff" opacity="0.5" />
        <path d="M18.3 6.6 L17.5 4.5 L16.4 5.6" fill="#fff" opacity="0.5" />
        {/* Head + muzzle as a downward-pointing wedge */}
        <path
          d="M4 9.5 Q4 7 7 6.5 Q9.5 6 12 6 Q14.5 6 17 6.5 Q20 7 20 9.5 Q20 14 18 17 Q15 20.5 12 21 Q9 20.5 6 17 Q4 14 4 9.5 Z"
          fill={color ?? '#c84b1f'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* White muzzle patch */}
        <path
          d="M9 14 Q12 12.5 15 14 Q14 19 12 20 Q10 19 9 14 Z"
          fill="#fff"
          opacity="0.95"
        />
        {/* Eyes */}
        <circle cx="9.5" cy="11.5" r="1.1" fill="currentColor" />
        <circle cx="14.5" cy="11.5" r="1.1" fill="currentColor" />
        {/* Eye shine */}
        <circle cx="9.85" cy="11.15" r="0.3" fill="#fff" />
        <circle cx="14.85" cy="11.15" r="0.3" fill="#fff" />
        {/* Nose */}
        <path
          d="M11.2 14.3 Q12 13.8 12.8 14.3 Q12.8 15 12 15.2 Q11.2 15 11.2 14.3 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // CON — bear
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Round ears */}
      <circle
        cx="6.2"
        cy="6.2"
        r="2.6"
        fill={color ?? '#2d4a5a'}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle
        cx="17.8"
        cy="6.2"
        r="2.6"
        fill={color ?? '#2d4a5a'}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* Inner ear accents */}
      <circle cx="6.2" cy="6.2" r="1.1" fill="#fff" opacity="0.45" />
      <circle cx="17.8" cy="6.2" r="1.1" fill="#fff" opacity="0.45" />
      {/* Round head */}
      <path
        d="M4 12 Q4 7.5 8 6.5 Q10 6 12 6 Q14 6 16 6.5 Q20 7.5 20 12 Q20 17 16 19.5 Q14 21 12 21 Q10 21 8 19.5 Q4 17 4 12 Z"
        fill={color ?? '#2d4a5a'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Lighter muzzle area */}
      <ellipse cx="12" cy="15.5" rx="4" ry="3" fill="#fff" opacity="0.88" />
      {/* Eyes */}
      <circle cx="9.5" cy="11.5" r="1.15" fill="currentColor" />
      <circle cx="14.5" cy="11.5" r="1.15" fill="currentColor" />
      {/* Eye shine */}
      <circle cx="9.2" cy="11.15" r="0.32" fill="#fff" />
      <circle cx="14.2" cy="11.15" r="0.32" fill="#fff" />
      {/* Round nose */}
      <ellipse cx="12" cy="14.3" rx="1.1" ry="0.85" fill="currentColor" />
      {/* Small mouth */}
      <path
        d="M11 16.2 Q12 17 13 16.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
