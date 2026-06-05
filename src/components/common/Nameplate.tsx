import type { ReactNode } from 'react';

type Variant = 'pro' | 'con' | 'judge';

interface NameplateProps {
  variant: Variant;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Nameplate({ variant, children, size = 'md' }: NameplateProps) {
  const bg =
    variant === 'pro'
      ? 'bg-vermillion text-paper-light'
      : variant === 'con'
        ? 'bg-celadon text-paper-light'
        : 'bg-ink text-paper-light';
  const tilt =
    variant === 'pro'
      ? '-rotate-[1.5deg]'
      : variant === 'con'
        ? 'rotate-[1.5deg]'
        : '-rotate-[1deg]';
  const sizeCls =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-sm'
      : size === 'lg'
        ? 'px-5 py-1.5 text-xl'
        : 'px-3.5 py-1 text-lg';
  // Accent border keeps each plate crisp on its solid fill; the soft shadow +
  // rounded corner replace the old 2px ink border + hard sketch shadow.
  const borderColor =
    variant === 'pro'
      ? 'var(--color-vermillion-dim)'
      : variant === 'con'
        ? 'var(--color-celadon-dim)'
        : 'var(--color-ink)';
  return (
    <span
      className={`inline-block font-bold whitespace-nowrap tracking-wider ${bg} ${tilt} ${sizeCls}`}
      style={{
        fontFamily: 'var(--font-hand)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </span>
  );
}
