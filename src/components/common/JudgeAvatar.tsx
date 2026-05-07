interface JudgeAvatarProps {
  size?: number;
}

export function JudgeAvatar({ size = 56 }: JudgeAvatarProps) {
  return (
    <div
      className="relative rounded-full overflow-hidden border-2 border-ink sketchy-sm"
      style={{ width: size, height: size, background: 'var(--color-paper-deep)' }}
    >
      <svg viewBox="0 0 70 70" className="w-full h-full block">
        <circle
          cx="35"
          cy="28"
          r="13"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
        />
        <path
          d="M 18 65 Q 22 44 35 41 Q 48 44 52 65 Z"
          fill="var(--color-ink)"
        />
        <rect x="33" y="20" width="4" height="2" fill="var(--color-ink)" />
        <rect x="29" y="22" width="12" height="1.5" fill="var(--color-ink)" />
        <line
          x1="29"
          y1="32"
          x2="33"
          y2="32"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="37"
          y1="32"
          x2="41"
          y2="32"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <text
          x="35"
          y="58"
          textAnchor="middle"
          fontFamily="var(--font-hand)"
          fontSize="8"
          fontWeight="700"
          fill="var(--color-paper-light)"
        >
          AI
        </text>
      </svg>
    </div>
  );
}
