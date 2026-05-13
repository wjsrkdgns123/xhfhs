import { useEffect, useState } from 'react';

interface SpyItem {
  id: string;
  label: string;
}

/**
 * Minimal vertical scrollspy: a fixed right-side TOC with always-visible
 * labels. The current section is highlighted in vermillion as the user
 * scrolls. Click jumps to that section via scrollIntoView (works on any
 * scroll container).
 */
export function ScrollSpyNav({ items }: { items: SpyItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
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
