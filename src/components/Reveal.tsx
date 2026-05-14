import { type CSSProperties, type ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms. Used by parent to time sibling reveals. */
  delay?: number;
  /** Element to render. Default 'div'. */
  as?: 'div' | 'section' | 'li' | 'article';
  /** Direction the element travels from on enter. Default 'up'. */
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  style?: CSSProperties;
}

const TRANSFORM_MAP: Record<NonNullable<RevealProps['from']>, string> = {
  up: 'translateY(20px)',
  down: 'translateY(-20px)',
  left: 'translateX(20px)',
  right: 'translateX(-20px)',
  none: 'none',
};

/**
 * Scroll-triggered reveal wrapper. Fades + slides children into place when they
 * enter the viewport. Single-use by default (no replay on scroll-up).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  from = 'up',
  className,
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  const computedStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'none' : TRANSFORM_MAP[from],
    transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
    willChange: inView ? 'auto' : 'opacity, transform',
    ...style,
  };
  return (
    // @ts-expect-error — ref typing across tag union is intentionally loose
    <Tag ref={ref} className={className} style={computedStyle}>
      {children}
    </Tag>
  );
}
