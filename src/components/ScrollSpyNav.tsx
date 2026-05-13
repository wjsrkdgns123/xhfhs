import { useEffect, useRef, useState } from 'react';

interface SpyItem {
  id: string;
  label: string;
}

/**
 * Minimal vertical scrollspy. While a click-initiated smooth scroll is in
 * progress, the active highlight is locked to the click target (the
 * IntersectionObserver's intermediate updates are ignored). Once the
 * scroll completes the observer takes over again.
 */
export function ScrollSpyNav({ items }: { items: SpyItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');
  // While truthy, the observer's "section in view" updates are suppressed
  // so the highlight stays on the click target instead of flickering
  // through every passing section during the smooth scroll.
  const lockToTarget = useRef<string | null>(null);
  const unlockTimer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Suppressed during programmatic scroll
        if (lockToTarget.current) return;
        let bestId = '';
        let bestTop = Infinity;
        for (const item of items) {
          if (!visible.has(item.id)) continue;
          const el = document.getElementById(item.id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top < bestTop) {
            bestTop = top;
            bestId = item.id;
          }
        }
        if (bestId) setActive(bestId);
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: 0 },
    );

    const observed: HTMLElement[] = [];
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        if (!el.style.scrollMarginTop) el.style.scrollMarginTop = '88px';
        observer.observe(el);
        observed.push(el);
      }
    });
    return () => {
      observed.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [items]);

  // Clean up the unlock timer on unmount
  useEffect(() => {
    return () => {
      if (unlockTimer.current) window.clearTimeout(unlockTimer.current);
    };
  }, []);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Lock the highlight to the click target and ignore observer noise
    lockToTarget.current = id;
    setActive(id);
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Smooth scroll typically completes in 400-800ms; release a bit after
    unlockTimer.current = window.setTimeout(() => {
      lockToTarget.current = null;
    }, 900);
  };

  return (
    <aside className="spy-nav" aria-label="목차 사이드바">
      <ul className="spy-nav__list">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li
              key={item.id}
              className={`spy-nav__item ${isActive ? 'active' : ''}`}
            >
              <button
                type="button"
                className="spy-nav__btn"
                onClick={() => handleClick(item.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="spy-nav__tick" aria-hidden="true" />
                <span className="spy-nav__label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
