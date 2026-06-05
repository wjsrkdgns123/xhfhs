/**
 * DebateSeal — 3D 골드 討論 코인 씰
 * design-output/ds-handoff/.../redesign/hero-primitives.jsx DebateSeal 를
 * React/TypeScript 로 이식. hover 시 동전이 회전하는 CSS 애니메이션 내장.
 * 관련 CSS 키프레임(.tb-coin-scene 등)은 컴포넌트 내부 <style> 태그로 주입.
 */

interface DebateSealProps {
  /** 화면에 표시될 px 크기 (원본은 248px 기준 설계). 기본값 80. */
  display?: number;
}

export function DebateSeal({ display = 80 }: DebateSealProps) {
  const SIZE = 248;
  const f = display / SIZE;
  const TH = 11; // 동전 반두께(px)
  const STEP = 0.85;

  // 금속 테두리 — z축 적층
  const rim: React.ReactNode[] = [];
  for (let z = -TH; z <= TH; z += STEP) {
    const t = Math.abs(z) / TH;
    const L = 34 + (1 - t) * 30;
    rim.push(
      <div
        key={z}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `hsl(43 62% ${L}%)`,
          transform: `translateZ(${z}px)`,
        }}
      />,
    );
  }

  const faceBase: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at 38% 30%, #fbeec0 0%, #f3cf6a 30%, #e6bb50 62%, #d4a73f 85%, #c0922f 100%)',
    boxShadow:
      'inset 3px 3px 6px rgba(255,255,255,0.5), inset -5px -8px 16px rgba(120,82,16,0.3), inset 0 0 0 2px rgba(120,82,16,0.22)',
    overflow: 'hidden',
  };

  return (
    <div style={{ width: display, height: display, overflow: 'visible', flexShrink: 0 }}>
      <div
        style={{
          width: SIZE,
          height: SIZE,
          transformOrigin: 'top left',
          transform: `scale(${f})`,
          overflow: 'visible',
        }}
      >
        <div className="tb-coin-scene" aria-label="討論 인장" title="討論">
          {/* CSS 키프레임 — 동전 idle/flip 애니메이션 */}
          <style>{`
            .tb-coin-scene {
              position: relative; width: ${SIZE}px; height: ${SIZE}px;
              z-index: 3; perspective: 1200px; cursor: pointer; overflow: visible;
            }
            .tb-coin-cast {
              position: absolute; inset: 0; border-radius: 50%; z-index: 0; pointer-events: none;
              background: radial-gradient(circle at 56% 62%, rgba(18,38,28,0.5) 0%, rgba(18,38,28,0.3) 40%, rgba(18,38,28,0) 70%);
              transform: translate(8px, 12px); filter: blur(9px);
            }
            .tb-coin {
              position: absolute; inset: 0;
              transform-style: preserve-3d;
              animation: tb-coin-idle 7s ease-in-out infinite;
            }
            .tb-coin-scene:hover .tb-coin { animation: tb-coin-flip 1.4s infinite; }
            .tb-coin-scene:hover .tb-coin-cast { animation: tb-cast-flip 1.4s linear infinite; }
            @keyframes tb-cast-flip {
              0%   { transform: translate(8px,12px) scaleX(1); }
              15%  { transform: translate(8px,12px) scaleX(0.32); }
              20%  { transform: translate(8px,12px) scaleX(1); }
              26%  { transform: translate(8px,12px) scaleX(0.32); }
              55%  { transform: translate(8px,12px) scaleX(1); }
              100% { transform: translate(8px,12px) scaleX(1); }
            }
            @keyframes tb-coin-idle {
              0%,100% { transform: rotateX(7deg) rotateY(-4deg); }
              50%     { transform: rotateX(5deg) rotateY(4deg); }
            }
            @keyframes tb-coin-flip {
              0%   { transform: rotateX(6deg) rotateY(0deg); animation-timing-function: cubic-bezier(.42,0,.28,1.2); }
              55%  { transform: rotateX(6deg) rotateY(360deg); }
              100% { transform: rotateX(6deg) rotateY(360deg); }
            }
            .tb-coin-ring-hero { animation: tb-spin 60s linear infinite; }
            @keyframes tb-spin { to { transform: rotate(360deg); } }
            @media (prefers-reduced-motion: reduce) {
              .tb-coin, .tb-coin-ring-hero { animation: none !important; }
            }
          `}</style>

          {/* 그림자 */}
          <div className="tb-coin-cast" aria-hidden="true" />

          <div className="tb-coin">
            {/* 금속 테두리 */}
            {rim}

            {/* ===== 앞면 ===== */}
            <div style={{ ...faceBase, transform: `translateZ(${TH}px)` }}>
              <svg
                viewBox="0 0 248 248"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                className="tb-coin-ring-hero"
                aria-hidden="true"
              >
                <defs>
                  <path
                    id="seal-ring-hero"
                    d="M 124 124 m 0 -99 a 99 99 0 1 1 0 198 a 99 99 0 1 1 0 -198"
                  />
                </defs>
                <circle
                  cx="124" cy="124" r="118"
                  fill="none" stroke="rgba(120,82,16,0.55)" strokeWidth="1.5"
                />
                <circle
                  cx="124" cy="124" r="88"
                  fill="none" stroke="rgba(120,82,16,0.4)" strokeWidth="1"
                />
                <text
                  fill="#7a5210"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}
                >
                  <textPath
                    href="#seal-ring-hero"
                    startOffset="0"
                    textLength="622"
                    lengthAdjust="spacingAndGlyphs"
                  >
                    {'DEBATE · BATTLE · '.repeat(5)}
                  </textPath>
                </text>
              </svg>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 800,
                    fontSize: 50,
                    lineHeight: 0.9,
                    color: '#6f4a0e',
                    letterSpacing: '0.02em',
                    textShadow: '0 1px 0 rgba(255,247,210,0.7)',
                  }}
                >
                  討論
                </span>
                <span
                  style={{
                    width: 32,
                    height: 1.5,
                    background: 'rgba(111,74,14,0.5)',
                    margin: '7px 0',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 9.5,
                    letterSpacing: '0.18em',
                    color: 'rgba(111,74,14,0.85)',
                  }}
                >
                  EST. 2026
                </span>
              </div>
            </div>

            {/* ===== 뒷면 ===== */}
            <div style={{ ...faceBase, transform: `rotateY(180deg) translateZ(${TH}px)` }}>
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 14,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(120,82,16,0.4)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 800,
                  fontSize: 92,
                  lineHeight: 0.9,
                  color: '#6f4a0e',
                  textShadow: '0 1px 0 rgba(255,247,210,0.7)',
                }}
              >
                討
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 800,
                  fontSize: 19,
                  letterSpacing: '0.04em',
                  color: '#6f4a0e',
                  marginTop: 6,
                }}
              >
                토론배틀
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: 'rgba(111,74,14,0.8)',
                  marginTop: 6,
                }}
              >
                1:1 · AI 사회자
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
