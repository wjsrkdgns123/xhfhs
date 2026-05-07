type Side = 'pro' | 'con';
type Expression = 'calm' | 'angry' | 'shocked' | 'victory';

interface CharBustProps {
  side: Side;
  expression?: Expression;
  big?: boolean;
  dim?: boolean;
  speaking?: boolean;
}

export function CharBust({
  side,
  expression = 'calm',
  big = false,
  dim = false,
  speaking = false,
}: CharBustProps) {
  const accent = side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const stripeId = `stripe-${side}`;
  return (
    <svg
      viewBox="0 0 200 280"
      className="block w-full h-full transition-transform"
      style={{
        filter: dim ? 'opacity(0.4) saturate(0.6)' : undefined,
        transform: speaking ? 'translateY(-4px)' : undefined,
      }}
    >
      <defs>
        <pattern
          id={stripeId}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform={`rotate(${side === 'pro' ? 45 : -45})`}
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke={accent} strokeWidth="1" opacity="0.55" />
        </pattern>
      </defs>
      <path
        d="M 22 280 Q 30 180 100 160 Q 170 180 178 280 Z"
        fill={`url(#${stripeId})`}
        stroke="var(--color-ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M 70 175 Q 100 195 130 175 L 135 200 L 100 215 L 65 200 Z"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse
        cx="100"
        cy="92"
        rx="44"
        ry="52"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
      />
      <path
        d="M 60 80 Q 75 35 100 38 Q 130 38 140 80 Q 130 60 100 62 Q 75 65 60 80 Z"
        fill="var(--color-ink)"
      />
      <Face expression={expression} />
      {speaking && big && side === 'pro' && (
        <g>
          <path
            d="M 165 200 Q 200 170 230 140"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 220 145 L 232 138 L 224 152"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      {speaking && big && side === 'con' && (
        <g>
          <path
            d="M 35 200 Q 0 170 -30 140"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M -20 145 L -32 138 L -24 152"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      <text
        x="100"
        y="270"
        textAnchor="middle"
        fontFamily="var(--font-hand)"
        fontSize="9"
        fill="var(--color-ink-fade)"
        opacity="0.5"
      >
        [캐릭터 일러스트 자리]
      </text>
    </svg>
  );
}

function Face({ expression }: { expression: Expression }) {
  if (expression === 'angry') {
    return (
      <>
        <path d="M 76 85 L 92 90" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 124 90 L 108 85" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="84" cy="100" r="2.5" fill="var(--color-ink)" />
        <circle cx="116" cy="100" r="2.5" fill="var(--color-ink)" />
        <path
          d="M 86 122 Q 100 116 114 122"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    );
  }
  if (expression === 'shocked') {
    return (
      <>
        <path d="M 76 88 Q 84 84 92 88" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 108 88 Q 116 84 124 88" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="84" cy="98" r="3.5" fill="var(--color-ink)" />
        <circle cx="116" cy="98" r="3.5" fill="var(--color-ink)" />
        <ellipse cx="100" cy="125" rx="6" ry="9" fill="var(--color-ink)" />
      </>
    );
  }
  if (expression === 'victory') {
    return (
      <>
        <path d="M 78 88 Q 85 84 92 92" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 108 92 Q 115 84 122 88" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M 84 124 Q 100 134 116 124"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </>
    );
  }
  return (
    <>
      <line x1="78" y1="92" x2="92" y2="92" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      <line x1="108" y1="92" x2="122" y2="92" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="85" cy="102" r="2" fill="var(--color-ink)" />
      <circle cx="115" cy="102" r="2" fill="var(--color-ink)" />
      <path d="M 90 122 Q 100 127 110 122" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}
