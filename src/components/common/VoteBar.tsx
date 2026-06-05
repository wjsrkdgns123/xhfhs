interface VoteBarProps {
  pro: number;
  con: number;
  variant?: 'classic' | 'split' | 'tug' | 'beans';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

/** Pro/Con vote bar with four visual variants.
 *  Lifted from debate-battle-v2 design package — Tweaks-driven.
 *  - classic: single bar, vermillion/celadon fills meet at the boundary
 *  - split: two adjacent rectangles with gap, each labelled with %
 *  - tug: tug-of-war rope, knot indicator slides toward winning side
 *  - beans: discrete tick-mark counter (useful for small total vote counts) */
export function VoteBar({ pro, con, variant = 'classic', size = 'md', showLabels = true }: VoteBarProps) {
  const total = pro + con || 1;
  const proPct = Math.round((pro / total) * 100);
  const conPct = 100 - proPct;
  const isLg = size === 'lg';
  const isSm = size === 'sm';
  const barHeight = isLg ? 30 : isSm ? 16 : 22;

  const Labels = () =>
    showLabels ? (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: 'var(--color-vermillion)' }}>찬성 · {pro}표</span>
        <span style={{ color: 'var(--color-celadon)' }}>{con}표 · 반대</span>
      </div>
    ) : null;

  if (variant === 'split') {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, height: barHeight }}>
          <div
            style={{
              flex: Math.max(pro, 0.05),
              background: 'var(--color-vermillion)',
              border: 'var(--border-line)',
              borderRadius: 'var(--r-pill)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '0 10px',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: isLg ? 13 : 11,
              letterSpacing: '0.1em',
              minWidth: 36,
              transition: 'flex 0.6s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {proPct}%
          </div>
          <div
            style={{
              flex: Math.max(con, 0.05),
              background: 'var(--color-celadon)',
              border: 'var(--border-line)',
              borderRadius: 'var(--r-pill)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 10px',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: isLg ? 13 : 11,
              letterSpacing: '0.1em',
              minWidth: 36,
              transition: 'flex 0.6s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {conPct}%
          </div>
        </div>
        <Labels />
      </div>
    );
  }

  if (variant === 'tug') {
    const offset = (proPct - 50) * 0.8;
    return (
      <div style={{ width: '100%' }}>
        <div
          style={{
            position: 'relative',
            height: barHeight,
            display: 'flex',
            alignItems: 'center',
            border: 'var(--border-line)',
            borderRadius: 'var(--r-pill)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            background: 'var(--color-paper)',
          }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', display: 'flex' }}>
            <div style={{ flex: 1, background: 'var(--color-tint-pro)' }} />
            <div style={{ flex: 1, background: 'var(--color-tint-con)' }} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 1.5,
              background: 'var(--color-ink-fade)',
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(50% + ${offset}%)`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: isLg ? 24 : 16,
              height: isLg ? 24 : 16,
              background: 'var(--color-ink)',
              color: 'var(--color-paper-light)',
              borderRadius: 'var(--r-pill)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isLg ? 13 : 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              transition: 'left 0.6s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 2,
            }}
          >
            ●
          </div>
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-serif-display)',
              fontWeight: 800,
              fontSize: isLg ? 16 : 13,
              letterSpacing: '-0.02em',
            }}
          >
            찬
          </div>
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-celadon)',
              fontFamily: 'var(--font-serif-display)',
              fontWeight: 800,
              fontSize: isLg ? 16 : 13,
              letterSpacing: '-0.02em',
            }}
          >
            반
          </div>
        </div>
        {showLabels && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--color-vermillion)' }}>
              {pro}표 · {proPct}%
            </span>
            <span style={{ color: 'var(--color-celadon)' }}>
              {conPct}% · {con}표
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'beans') {
    const beans = Math.min(40, Math.max(8, Math.round(total / 3)));
    const proBeans = Math.round((proPct / 100) * beans);
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 2, height: barHeight }}>
          {Array.from({ length: beans }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: i < proBeans ? 'var(--color-vermillion)' : 'var(--color-celadon)',
                border: 'var(--border-line)',
                borderRadius: 'var(--r-sm)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        {showLabels && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--color-vermillion)' }}>찬 · {pro}</span>
            <span style={{ color: 'var(--color-celadon)' }}>{con} · 반</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: barHeight,
          border: 'var(--border-line)',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--shadow-sm)',
          background: 'var(--color-paper-light)',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${proPct}%`,
            background: 'var(--color-vermillion)',
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: isLg ? 12 : 10,
            letterSpacing: '0.08em',
          }}
        >
          {proPct >= 12 && `${proPct}%`}
        </div>
        <div
          style={{
            width: `${conPct}%`,
            background: 'var(--color-celadon)',
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 8,
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: isLg ? 12 : 10,
            letterSpacing: '0.08em',
          }}
        >
          {conPct >= 12 && `${conPct}%`}
        </div>
      </div>
      <Labels />
    </div>
  );
}
