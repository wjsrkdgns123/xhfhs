import { useEffect } from 'react';
import type { Lang } from '../../i18n/landing';
import { Ornament } from '../common';

export type ContentTheme = 'arena' | 'caution' | 'library' | 'chronicle' | 'stage';

const THEME_ORNAMENT: Record<ContentTheme, 'asterisk' | 'dot3' | 'slash' | 'fleuron'> = {
  arena: 'asterisk',
  caution: 'slash',
  library: 'fleuron',
  chronicle: 'dot3',
  stage: 'asterisk',
};

/**
 * Shared layout for content/reference pages with per-page visual theme.
 * Each theme paints a distinct hero band, accent color, and motif so
 * clicking between pages feels like entering different rooms.
 * Accepts an optional `lang` prop so callers can pass i18n context through.
 */
export function ContentLayout({
  theme = 'arena',
  eyebrow,
  title,
  subtitle,
  hint,
  children,
  lang: _lang,
}: {
  theme?: ContentTheme;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  lang?: Lang;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className={`landing-page content-theme content-theme--${theme}`}>
      <section className="content-hero">
        <div className="content-hero__motif" aria-hidden="true" />
        <div className="wrap" style={{ maxWidth: 1180 }}>
          <div className="content-hero__inner">
            <div className="content-hero__eyebrow">{eyebrow}</div>
            <h1 className="content-hero__title">{title}</h1>
            <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'flex-start', margin: '6px 0 14px', opacity: 0.7 }}>
              <Ornament kind={THEME_ORNAMENT[theme]} size={20} color="var(--color-vermillion)" />
            </div>
            {subtitle && <p className="content-hero__sub">{subtitle}</p>}
            {hint && <div className="content-hero__hint">{hint}</div>}
          </div>
        </div>
      </section>
      <section style={{ padding: '40px 0 100px' }}>
        <div className="wrap" style={{ maxWidth: 1180 }}>
          {children}
        </div>
      </section>
    </div>
  );
}
