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
  return (
    <span
      className={`inline-block font-bold whitespace-nowrap border-2 border-ink sketchy-sm tracking-wider ${bg} ${tilt} ${sizeCls}`}
      style={{ fontFamily: 'var(--font-hand)' }}
    >
      {children}
    </span>
  );
}
