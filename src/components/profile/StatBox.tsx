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
        border: 'var(--border-line)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-sm)',
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
