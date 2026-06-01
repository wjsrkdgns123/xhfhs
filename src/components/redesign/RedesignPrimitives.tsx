// 토론배틀 redesign — shared primitives (ported from the Claude Design handoff
// bundle: redesign/hero-primitives.jsx). Soft, rounded, premium tone — the gold
// 討論 seal coin, mascot chips, pill buttons, the live chip, and inline icons.
import type { CSSProperties, ReactNode } from 'react';
import { CharacterAvatar } from '../CharacterAvatar';

/* ---- mascot wrapped in a soft tinted round chip (fox=PRO / bear=CON) ---- */
export function MascotChip({
  side,
  size = 56,
  ring = true,
}: {
  side: 'pro' | 'con';
  size?: number;
  ring?: boolean;
}) {
  const tint = side === 'pro' ? 'var(--tint-pro)' : 'var(--tint-con)';
  const accent = side === 'pro' ? 'var(--vermillion)' : 'var(--celadon)';
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tint,
        flexShrink: 0,
        // ink stroke (CharacterAvatar uses currentColor for its outline)
        color: 'var(--ink)',
        boxShadow: ring ? `0 0 0 3px #fff, 0 8px 20px -6px ${accent}66` : 'none',
      }}
    >
      <CharacterAvatar side={side} size={Math.round(size * 0.62)} />
    </span>
  );
}

/* ---- rounded pill button ---- */
export function Pill({
  children,
  variant = 'solid',
  accent = 'var(--vermillion)',
  size = 'lg',
  style,
  onClick,
  type = 'button',
}: {
  children: ReactNode;
  variant?: 'solid' | 'cream' | 'ghost' | 'ghostInk';
  accent?: string;
  size?: 'lg' | 'sm';
  style?: CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const pad = size === 'lg' ? '15px 30px' : '11px 22px';
  const fs = size === 'lg' ? 17 : 15;
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: pad,
    borderRadius: 999,
    fontFamily: 'var(--font-body)',
    fontWeight: 800,
    fontSize: fs,
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    border: 'none',
    transition: 'transform .14s ease, box-shadow .14s ease',
    whiteSpace: 'nowrap',
  };
  const variants: Record<string, CSSProperties> = {
    solid: { background: accent, color: '#fff', boxShadow: `0 10px 24px -8px ${accent}aa` },
    cream: { background: 'var(--paper-light)', color: 'var(--ink)', boxShadow: '0 10px 24px -10px rgba(0,0,0,0.35)' },
    ghost: { background: 'transparent', color: '#fff', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.55)' },
    ghostInk: { background: 'transparent', color: 'var(--ink)', boxShadow: 'inset 0 0 0 2px var(--ink)' },
  };
  return (
    <button type={type} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

/* ---- small live chip ---- */
export function LiveChip({ tone = 'light', label = 'LIVE' }: { tone?: 'light' | 'solid'; label?: string }) {
  const washed = tone === 'light';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 13px 6px 11px',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.14em',
        background: washed ? 'rgba(255,255,255,0.16)' : 'var(--vermillion)',
        color: '#fff',
        boxShadow: washed ? 'inset 0 0 0 1px rgba(255,255,255,0.35)' : 'none',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 0 0 3px rgba(255,255,255,0.25)',
          animation: 'tb-pulse 1.6s ease-in-out infinite',
        }}
      />
      {label}
    </span>
  );
}

/* ---- inline icons (stroked, rounded ~2px — matches the product's SVG style) ---- */
export function FlameIcon({ c = 'currentColor', s = 13 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z"
        fill={c}
      />
    </svg>
  );
}
export function RiseIcon({ c = 'currentColor', s = 13 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M4 16l5-5 3 3 7-7" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function FlagIcon({ c = 'currentColor', s = 13 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M6 21V4M6 4.5c3-2 6 1 9-0.5v8c-3 1.5-6-1.5-9 0.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function EyeIcon({ c = 'currentColor', s = 13 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" stroke={c} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke={c} strokeWidth="2" />
    </svg>
  );
}
export function TrophyIcon({ c = 'currentColor', s = 13 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke={c} strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9M10 13.5 9.5 17h5l-.5-3.5M8 20h8"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---- gold 討論 seal — 3D coin (front 討論 / back 討), flips on hover ---- */
export function DebateSeal({ display = 248 }: { display?: number }) {
  const SIZE = 248;
  const f = display / SIZE;
  const TH = 11; // half-thickness in px
  const STEP = 0.85;
  const rim: ReactNode[] = [];
  for (let z = -TH; z <= TH; z += STEP) {
    const t = Math.abs(z) / TH;
    const L = 34 + (1 - t) * 30;
    rim.push(
      <div
        key={z}
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `hsl(43 62% ${L}%)`, transform: `translateZ(${z}px)` }}
      />,
    );
  }
  const faceBase: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    backfaceVisibility: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 38% 30%, #fbeec0 0%, #f3cf6a 30%, #e6bb50 62%, #d4a73f 85%, #c0922f 100%)',
    boxShadow:
      'inset 3px 3px 6px rgba(255,255,255,0.5), inset -5px -8px 16px rgba(120,82,16,0.3), inset 0 0 0 2px rgba(120,82,16,0.22)',
    overflow: 'hidden',
  };
  return (
    <div style={{ width: display, height: display, overflow: 'visible' }}>
      <div style={{ width: SIZE, height: SIZE, transformOrigin: 'top left', transform: `scale(${f})`, overflow: 'visible' }}>
        <div className="tb-coin-scene" aria-label="討論 인장" title="討論">
          <style>{`
            .tb-coin-scene { position: relative; width: ${SIZE}px; height: ${SIZE}px; z-index: 3; perspective: 1200px; cursor: pointer; overflow: visible; }
            .tb-coin-cast { position: absolute; inset: 0; border-radius: 50%; z-index: 0; pointer-events: none;
              background: radial-gradient(circle at 56% 62%, rgba(18,38,28,0.5) 0%, rgba(18,38,28,0.3) 40%, rgba(18,38,28,0) 70%);
              transform: translate(8px, 12px); filter: blur(9px); }
            .tb-coin { position: absolute; inset: 0; transform-style: preserve-3d; animation: tb-coin-idle 7s ease-in-out infinite; }
            .tb-coin-scene:hover .tb-coin { animation: tb-coin-flip 1.4s infinite; }
            .tb-coin-scene:hover .tb-coin-cast { animation: tb-cast-flip 1.4s linear infinite; }
            @keyframes tb-cast-flip {
              0% { transform: translate(8px,12px) scaleX(1); }
              15% { transform: translate(8px,12px) scaleX(0.32); }
              20% { transform: translate(8px,12px) scaleX(1); }
              26% { transform: translate(8px,12px) scaleX(0.32); }
              55% { transform: translate(8px,12px) scaleX(1); }
              100% { transform: translate(8px,12px) scaleX(1); }
            }
            @keyframes tb-coin-idle { 0%,100% { transform: rotateX(7deg) rotateY(-4deg); } 50% { transform: rotateX(5deg) rotateY(4deg); } }
            @keyframes tb-coin-flip {
              0% { transform: rotateX(6deg) rotateY(0deg); animation-timing-function: cubic-bezier(.42,0,.28,1.2); }
              55% { transform: rotateX(6deg) rotateY(360deg); }
              100% { transform: rotateX(6deg) rotateY(360deg); }
            }
            .tb-coin-ring { animation: tb-spin 60s linear infinite; }
            @media (prefers-reduced-motion: reduce) { .tb-coin, .tb-coin-ring { animation: none !important; } }
          `}</style>
          <div className="tb-coin-cast" aria-hidden="true" />
          <div className="tb-coin">
            {rim}
            {/* front */}
            <div style={{ ...faceBase, transform: `translateZ(${TH}px)` }}>
              <svg viewBox="0 0 248 248" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} className="tb-coin-ring" aria-hidden="true">
                <defs>
                  <path id="tb-seal-ring" d="M 124 124 m 0 -99 a 99 99 0 1 1 0 198 a 99 99 0 1 1 0 -198" />
                </defs>
                <circle cx="124" cy="124" r="118" fill="none" stroke="rgba(120,82,16,0.55)" strokeWidth="1.5" />
                <circle cx="124" cy="124" r="88" fill="none" stroke="rgba(120,82,16,0.4)" strokeWidth="1" />
                <text fill="#7a5210" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>
                  <textPath href="#tb-seal-ring" startOffset="0" textLength="622" lengthAdjust="spacingAndGlyphs">
                    {'DEBATE · BATTLE · '.repeat(5)}
                  </textPath>
                </text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 50, lineHeight: 0.9, color: '#6f4a0e', letterSpacing: '0.02em', textShadow: '0 1px 0 rgba(255,247,210,0.7)' }}>討論</span>
                <span style={{ width: 32, height: 1.5, background: 'rgba(111,74,14,0.5)', margin: '7px 0' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.18em', color: 'rgba(111,74,14,0.85)' }}>EST. 2026</span>
              </div>
            </div>
            {/* back */}
            <div style={{ ...faceBase, transform: `rotateY(180deg) translateZ(${TH}px)` }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: '1.5px solid rgba(120,82,16,0.4)' }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 92, lineHeight: 0.9, color: '#6f4a0e', textShadow: '0 1px 0 rgba(255,247,210,0.7)' }}>討</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 19, letterSpacing: '0.04em', color: '#6f4a0e', marginTop: 6 }}>토론배틀</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.22em', color: 'rgba(111,74,14,0.8)', marginTop: 6 }}>1:1 · AI 사회자</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
