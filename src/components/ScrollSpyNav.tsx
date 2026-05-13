import { useEffect, useState } from 'react';

interface SpyItem {
  id: string;
  label: string;
}

/**
 * Fixed vertical TOC sidebar that highlights the current section as the
 * user scrolls. Lives on the right edge on md+ viewports; hidden under md
 * (the header's horizontal nav still works on small screens).
 *
 * Uses IntersectionObserver to detect which section is currently most
 * visible based on a rootMargin band near the top third of the viewport.
 */
export function ScrollSpyNav({ items }: { items: SpyItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const visibilityMap = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visibilityMap.set(e.target.id, e.intersectionRatio);
          } else {
            visibilityMap.delete(e.target.id);
          }
        }
        // Pick the section closest to the top of the viewport that's intersecting
        let bestId = '';
        let bestTop = Infinity;
        for (const item of items) {
          const el = document.getElementById(item.id);
          if (!el || !visibilityMap.has(item.id)) continue;
          const top = el.getBoundingClientRect().top;
          if (top < bestTop) {
            bestTop = top;
            bestId = item.id;
          }
        }
        if (bestId) setActive(bestId);
      },
      {
        // Trigger when section enters top 35% of viewport, leaves top 30%
        rootMargin: '-15% 0px -65% 0px',
        threshold: [0, 0.2, 0.5, 1],
      },
    );

    const observed: HTMLElement[] = [];
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
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
    const headerOffset = 88;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActive(id);
  };

  const activeIdx = items.findIndex((i) => i.id === active);
  const progressPct = items.length > 1 ? (activeIdx / (items.length - 1)) * 100 : 0;

  return (
    <aside className="spy-nav" aria-label="목차 사이드바">
      <div className="spy-nav__rail">
        <div
          className="spy-nav__rail-fill"
          style={{ height: `${progressPct}%` }}
        />
      </div>
      <ul className="spy-nav__list">
        {items.map((item, idx) => (
          <li
            key={item.id}
            className={`spy-nav__item ${item.id === active ? 'active' : ''} ${idx < activeIdx ? 'passed' : ''}`}
          >
            <button
              type="button"
              onClick={() => handleClick(item.id)}
              className="spy-nav__btn"
            >
              <span className="spy-nav__dot" aria-hidden="true" />
              <span className="spy-nav__label">{item.label}</span>
              <span className="spy-nav__num">
                {String(idx + 1).padStart(2, '0')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
