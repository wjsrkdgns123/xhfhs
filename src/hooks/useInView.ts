import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  /** Once true, stays true. Default behavior — reveal animations don't replay. */
  once?: boolean;
}

/**
 * Watches an element with IntersectionObserver and flips `inView` to true when
 * the element crosses the threshold. Designed for scroll-triggered reveals
 * without adding a runtime animation library.
 *
 * Respects prefers-reduced-motion by short-circuiting to inView=true on mount
 * so reduced-motion users see content immediately without a transition.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const noObserver =
      typeof window === 'undefined' || !('IntersectionObserver' in window);
    if (prefersReduced || noObserver) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    // Safety fallback — if the observer hasn't fired for any reason (broken
    // IO in unusual scroll-container setups, ad iframes, etc.) reveal the
    // element after a delay so content is never permanently hidden.
    const fallback = window.setTimeout(() => setInView(true), 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
