import type { ReactNode } from 'react';

type Variant = 'pro' | 'con' | 'judge';

interface NameplateProps {
  variant: Variant;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Nameplate({ variant, children, size = 'md' }: NameplateProps) {
  // pro/con keep their solid faction fill (브랜드 자산). The judge plate is the
  // neutral AI/심판 mark: paper surface + 2px gold frame so it never reads as a
  // faction, and so it stays readable in dark/dusk/ink where ink-on-paper flips.
  const bg =
    variant === 'pro'
      ? 'bg-vermillion text-paper-light'
      : variant === 'con'
        ? 'bg-celadon text-paper-light'
        : 'bg-paper-light text-ink-soft';
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
  // pro/con use a thin same-family dim edge; judge uses a 2px gold frame
  // (gold = AI/중립 포인트) so the paper-filled plate stays legible everywhere.
  const borderWidth = variant === 'judge' ? 2 : 1;
  const borderColor =
    variant === 'pro'
      ? 'var(--color-vermillion-dim)'
      : variant === 'con'
        ? 'var(--color-celadon-dim)'
        : 'var(--color-gold)';
  return (
    <span
      className={`inline-block font-bold whitespace-nowrap tracking-wider ${bg} ${tilt} ${sizeCls}`}
      style={{
        fontFamily: 'var(--font-hand)',
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </span>
  );
}
