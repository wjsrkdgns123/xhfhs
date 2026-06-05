import { useEffect, useState } from 'react';
import { commonStrings } from '../i18n/common';
import type { Lang } from '../i18n/landing';

export type OverlayKind = 'objection' | 'argument' | 'verdict';

interface ObjectionOverlayProps {
  show: boolean;
  onDone?: () => void;
  side?: 'pro' | 'con';
  kind?: OverlayKind;
  label?: string;
  sublabel?: string;
  lang?: Lang;
}

export function ObjectionOverlay({
  show,
  onDone,
  side = 'pro',
  kind = 'objection',
  label,
  sublabel,
  lang = 'ko',
}: ObjectionOverlayProps) {
  const tOverlay = commonStrings[lang].overlay;
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');

  useEffect(() => {
    if (!show) {
      setPhase('idle');
      return;
    }
    setPhase('in');
    const isArgument = kind === 'argument' || kind === 'verdict';
    const inTime = isArgument ? 280 : 450;
    const outTime = isArgument ? 980 : 1700;
    const doneTime = isArgument ? 1400 : 2100;
    const t1 = setTimeout(() => setPhase('hold'), inTime);
    const t2 = setTimeout(() => setPhase('out'), outTime);
    const t3 = setTimeout(() => {
      setPhase('idle');
      onDone?.();
    }, doneTime);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [show, onDone, kind]);

  if (!show || phase === 'idle') return null;

  const accent = side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';

  // Default labels per kind — resolved from i18n overlay keys
  const mainText = label ?? (kind === 'objection' ? tOverlay.objection : kind === 'verdict' ? tOverlay.verdict : tOverlay.argument);
  const subText =
    sublabel ??
    (kind === 'objection'
      ? side === 'pro'
        ? tOverlay.proRebut
        : tOverlay.conRebut
      : '');

  if (kind === 'objection') {
    return (
      <div className={`objection-backdrop objection-${phase}`}>
        <svg
          viewBox="0 0 600 480"
          className={`objection-svg objection-svg-${phase}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <BurstShape stroke="var(--color-ink)" strokeWidth="6" fill="var(--color-paper-light)" />
          <BurstShape stroke="var(--color-ink)" strokeWidth="2" fill="none" transform="scale(0.92) translate(26 21)" />

          <g transform="translate(300 240) rotate(-6)">
            <text
              x="-4"
              y="14"
              textAnchor="middle"
              fontFamily="'Gaegu', sans-serif"
              fontSize="120"
              fontWeight="700"
              fill="var(--color-ink)"
              style={{ paintOrder: 'stroke', stroke: 'var(--color-ink)', strokeWidth: 18, strokeLinejoin: 'round' }}
            >
              {mainText}
            </text>
            <text
              x="-8"
              y="10"
              textAnchor="middle"
              fontFamily="'Gaegu', sans-serif"
              fontSize="120"
              fontWeight="700"
              fill={accent}
              style={{ paintOrder: 'stroke', stroke: 'var(--color-paper-light)', strokeWidth: 4, strokeLinejoin: 'round' }}
            >
              {mainText}
            </text>
          </g>

          {subText && (
            <text
              x="300"
              y="380"
              textAnchor="middle"
              fontFamily="'Gaegu', sans-serif"
              fontSize="28"
              fontWeight="700"
              fill="var(--color-ink)"
              opacity="0.7"
            >
              {subText}
            </text>
          )}
        </svg>
      </div>
    );
  }

  // 'argument' / 'verdict' — smaller banner (ribbon stamp)
  return (
    <div className={`argbanner-backdrop argbanner-${phase}`}>
      <svg
        viewBox="0 0 480 200"
        className={`argbanner-svg argbanner-svg-${phase}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <RibbonShape fill={accent} stroke="var(--color-ink)" />
        <text
          x="240"
          y="115"
          textAnchor="middle"
          fontFamily="'Gaegu', sans-serif"
          fontSize="64"
          fontWeight="700"
          fill="var(--color-paper-light)"
          style={{ paintOrder: 'stroke', stroke: 'var(--color-ink)', strokeWidth: 6, strokeLinejoin: 'round' }}
        >
          {mainText}
        </text>
      </svg>
    </div>
  );
}

function RibbonShape({ fill, stroke }: { fill: string; stroke: string }) {
  // Trapezoid ribbon with notched ends
  return (
    <polygon
      points="20,60 60,40 420,40 460,60 460,140 420,160 60,160 20,140 50,100"
      fill={fill}
      stroke={stroke}
      strokeWidth="4"
      strokeLinejoin="round"
    />
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
