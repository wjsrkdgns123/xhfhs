import type { ReactNode } from 'react';

export function CenterMsg({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ color: 'var(--color-ink-fade)' }}
    >
      {children}
    </div>
  );
}

export function LazyFallback() {
  return (
    <div
      style={{
        padding: '120px 20px',
        textAlign: 'center',
        color: 'var(--color-ink-fade)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.18em',
      }}
    >
      LOADING…
    </div>
  );
}
