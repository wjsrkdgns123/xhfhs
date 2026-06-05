interface RoundTimelineProps {
  current: number;
  planned: number;
  lang?: 'ko' | 'en';
}

export function RoundTimeline({ current, planned, lang = 'ko' }: RoundTimelineProps) {
  if (planned <= 1) return null;
  const total = Math.max(1, Math.min(planned, 12));
  const safeCurrent = Math.min(Math.max(0, current), total - 1);

  return (
    <div
      role="group"
      aria-label={lang === 'en' ? `Round ${safeCurrent + 1} of ${total}` : `${total}라운드 중 ${safeCurrent + 1}라운드`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        marginTop: 8,
        background: 'var(--color-paper-light)',
        border: 'var(--border-line)',
        borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--color-ink-fade)',
          textTransform: 'uppercase',
          flex: '0 0 auto',
        }}
      >
        {lang === 'en' ? 'Rounds' : '라운드'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto', overflowX: 'auto' }}>
        {Array.from({ length: total }, (_, i) => {
          const done = i < safeCurrent;
          const active = i === safeCurrent;
          return (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-current={active ? 'step' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 22,
                  height: 22,
                  padding: '0 6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: active
                    ? 'var(--color-paper-light)'
                    : done
                      ? 'var(--color-paper-light)'
                      : 'var(--color-ink-fade)',
                  background: active
                    ? 'var(--color-vermillion)'
                    : done
                      ? 'var(--color-ink)'
                      : 'transparent',
                  borderRadius: 'var(--r-pill)',
                  border: `1px solid ${active ? 'var(--color-vermillion)' : 'var(--color-ink-fade)'}`,
                  boxShadow: active ? 'var(--glow-pro)' : undefined,
                }}
              >
                R{i + 1}
              </span>
              {i < total - 1 && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 2,
                    background: i < safeCurrent ? 'var(--color-ink)' : 'var(--color-ink-fade)',
                    opacity: i < safeCurrent ? 1 : 0.45,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--color-ink-fade)',
          flex: '0 0 auto',
        }}
      >
        {safeCurrent + 1}/{total}
      </span>
    </div>
  );
}
