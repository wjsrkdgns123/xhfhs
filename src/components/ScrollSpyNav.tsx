import { useEffect, useState } from 'react';

interface SpyItem {
  id: string;
  label: string;
}

/**
 * Minimal vertical scrollspy: a thin rail of dots on the right edge with
 * the currently-active section labeled. Click dot → smooth-scroll to that
 * section using scrollIntoView (works regardless of which element is the
 * scroll container, unlike window.scrollTo).
 */
export function ScrollSpyNav({ items }: { items: SpyItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Pick the topmost visible item
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
        // Ensure scrollIntoView lands below the sticky header
        if (!el.style.scrollMarginTop) {
          el.style.scrollMarginTop = '88px';
        }
        observer.observe(el);
        observed.push(el);
      }
    });

    return () => {
      observed.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <aside className="spy-nav" aria-label="목차 사이드바">
      <ul className="spy-nav__list">
        {items.map((item) => {
          const isActive = item.id === active;
          const isHovered = hovered === item.id;
          return (
            <li
              key={item.id}
              className={`spy-nav__item ${isActive ? 'active' : ''}`}
            >
              <button
                type="button"
                className="spy-nav__btn"
                onClick={() => handleClick(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                aria-current={isActive ? 'true' : undefined}
                aria-label={item.label}
              >
                <span className="spy-nav__bar" aria-hidden="true" />
                <span
                  className="spy-nav__label"
                  data-show={isActive || isHovered ? 'true' : 'false'}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
