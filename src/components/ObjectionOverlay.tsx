import { useEffect, useState } from 'react';

interface ObjectionOverlayProps {
  show: boolean;
  onDone?: () => void;
  side?: 'pro' | 'con';
}

export function ObjectionOverlay({ show, onDone, side = 'pro' }: ObjectionOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');

  useEffect(() => {
    if (!show) {
      setPhase('idle');
      return;
    }
    setPhase('in');
    const t1 = setTimeout(() => setPhase('hold'), 450);
    const t2 = setTimeout(() => setPhase('out'), 1700);
    const t3 = setTimeout(() => {
      setPhase('idle');
      onDone?.();
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [show, onDone]);

  if (!show || phase === 'idle') return null;

  const accent = side === 'pro' ? '#c84b1f' : '#2d4a5a';

  return (
    <div className={`objection-backdrop objection-${phase}`}>
      <svg
        viewBox="0 0 600 480"
        className={`objection-svg objection-svg-${phase}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="obj-shake" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>

        <BurstShape stroke="#1a0f08" strokeWidth="6" fill="#fcf6e8" />
        <BurstShape stroke="#1a0f08" strokeWidth="2" fill="none" transform="scale(0.92) translate(26 21)" />

        <g transform="translate(300 240) rotate(-6)">
          <text
            x="-4"
            y="14"
            textAnchor="middle"
            fontFamily="'Gaegu', sans-serif"
            fontSize="120"
            fontWeight="700"
            fill="#1a0f08"
            style={{ paintOrder: 'stroke', stroke: '#1a0f08', strokeWidth: 18, strokeLinejoin: 'round' }}
          >
            이의있음!
          </text>
          <text
            x="-8"
            y="10"
            textAnchor="middle"
            fontFamily="'Gaegu', sans-serif"
            fontSize="120"
            fontWeight="700"
            fill={accent}
            style={{ paintOrder: 'stroke', stroke: '#fcf6e8', strokeWidth: 4, strokeLinejoin: 'round' }}
          >
            이의있음!
          </text>
        </g>

        <text
          x="300"
          y="380"
          textAnchor="middle"
          fontFamily="'Gaegu', sans-serif"
          fontSize="28"
          fontWeight="700"
          fill="#1a0f08"
          opacity="0.7"
        >
          {side === 'pro' ? '— 찬성 측 반박 시작' : '— 반대 측 반박 시작'}
        </text>
      </svg>
    </div>
  );
}

function BurstShape({
  stroke,
  strokeWidth,
  fill,
  transform,
}: {
  stroke: string;
  strokeWidth: string;
  fill: string;
  transform?: string;
}) {
  // Jagged starburst with 16 points (alternating outer/inner radius)
  const cx = 300;
  const cy = 240;
  const points: string[] = [];
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const isOuter = i % 2 === 0;
    const baseR = isOuter ? 230 : 165;
    // jitter for hand-drawn feel
    const jitter = ((i * 37) % 13) - 6;
    const r = baseR + jitter;
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * 1.2;
    const y = cy + Math.sin(angle) * r * 0.95;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <polygon
      points={points.join(' ')}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill={fill}
      transform={transform}
    />
  );
}
