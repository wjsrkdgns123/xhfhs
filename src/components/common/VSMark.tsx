interface VSMarkProps {
  size?: number;
  variant?: 'circle' | 'badge';
}

export function VSMark({ size = 80, variant = 'circle' }: VSMarkProps) {
  if (variant === 'badge') {
    const fontSize = Math.round(size * 0.4);
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          background: 'var(--color-ink)',
          color: 'var(--color-paper-light)',
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.03em',
          transform: 'rotate(-4deg)',
          border: '2px solid var(--color-ink)',
          boxShadow: '3px 3px 0 var(--color-vermillion)',
        }}
      >
        VS
      </span>
    );
  }

  const fontSize = Math.round(size * 0.5);
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="var(--color-paper-light)"
          stroke="var(--color-ink)"
          strokeWidth="2.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="var(--color-vermillion)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      </svg>
      <span
        className="relative font-black -rotate-6"
        style={{
          fontFamily: 'var(--font-hand)',
          fontSize,
          color: 'var(--color-vermillion)',
          textShadow: '2px 2px 0 var(--color-ink)',
          letterSpacing: '-0.06em',
        }}
      >
        VS
      </span>
    </div>
  );
}
