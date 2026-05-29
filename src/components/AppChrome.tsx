// #25 (incremental step 3): small presentational chrome components from App.tsx.
import { type ReactNode } from 'react';

/** Suspense fallback for lazily-loaded screens. */
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

/** Stat tile (profile records). */
export function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: 'pro' | 'con';
}) {
  const color =
    accent === 'pro'
      ? 'var(--color-vermillion)'
      : accent === 'con'
        ? 'var(--color-celadon)'
        : 'var(--color-ink)';
  return (
    <div
      className="p-3 text-center paper-grain"
      style={{
        background: 'var(--color-paper)',
        border: '2px solid var(--color-ink)',
        boxShadow: '2px 2px 0 var(--color-ink)',
      }}
    >
      <div className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
        {label}
      </div>
      <div className="text-3xl font-bold mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/** Full-height centered message (loading / empty states). */
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

/** Shown when Firebase env keys are missing. */
export function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h1 className="text-xl font-bold">🔥 토론배틀 — 설정 필요</h1>
        <p className="text-sm text-zinc-400">
          Firebase 설정이 없습니다. <code className="text-emerald-400">.env</code>에 키를 채워주세요.
        </p>
      </div>
    </div>
  );
}
