import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

interface PaperCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tilt?: number;
  shadow?: 'sm' | 'md' | 'lg';
  grain?: boolean;
}

export function PaperCard({
  children,
  tilt = 0,
  shadow = 'lg',
  grain = true,
  style,
  className = '',
  ...rest
}: PaperCardProps) {
  const shadowClass =
    shadow === 'sm' ? 'sketchy-sm' : shadow === 'md' ? 'sketchy-md' : '';
  const composed: CSSProperties = {
    transform: tilt ? `rotate(${tilt}deg)` : undefined,
    ...style,
  };
  return (
    <div
      className={`sketchy ${shadowClass} ${grain ? 'paper-grain' : ''} ${className}`.trim()}
      style={composed}
      {...rest}
    >
      {children}
    </div>
  );
}
