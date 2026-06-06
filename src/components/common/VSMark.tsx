interface VSMarkProps {
  size?: number;
  variant?: 'circle' | 'badge';
  /** Hard-offset accent for the badge variant. The default is vermillion
   *  (faction tension) — the newspaper "VS" carries the heat of the matchup.
   *  Pass 'gold' for neutral/reward contexts, or a faction tone when the mark
   *  belongs to a side. */
  accent?: 'gold' | 'vermillion' | 'celadon';
}

export function VSMark({ size = 80, variant = 'circle', accent = 'vermillion' }: VSMarkProps) {
  if (variant === 'badge') {
    const fontSize = Math.round(size * 0.4);
    const accentVar = `var(--color-${accent})`;
    // Paper-filled stamp with an ink frame and a faction/neutral hard offset.
    // ink↔paper-light flip with theme tokens so contrast holds in dark/dusk/ink.
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          background: 'var(--color-paper-light)',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.03em',
          transform: 'rotate(-4deg)',
          border: '2px solid var(--color-ink)',
          boxShadow: `3px 3px 0 ${accentVar}`,
        }}
      >
        VS
      </span>
    );
  }

  // Default circle faceoff mark. The serif-display "VS" matches the badge
  // variant for one consistent matchup type; vermillion carries the documented
  // faction heat of the head-to-head. Stroke inset keeps the 2px ink ring from
  // clipping the viewBox edge.
  const fontSize = Math.round(size * 0.46);
  const r = size / 2 - 3;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="var(--color-paper-light)"
          stroke="var(--color-ink)"
          strokeWidth="2"
        />
      </svg>
      <span
        className="relative font-black -rotate-[5deg]"
        style={{
          fontFamily: 'var(--font-serif-display)',
          fontSize,
          color: 'var(--color-vermillion)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        VS
      </span>
    </div>
  );
}
