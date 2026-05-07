interface VSMarkProps {
  size?: number;
}

export function VSMark({ size = 80 }: VSMarkProps) {
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
