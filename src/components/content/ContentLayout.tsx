import { useEffect } from 'react';

export type ContentTheme = 'arena' | 'caution' | 'library' | 'chronicle' | 'stage';

/**
 * Shared layout for content/reference pages with per-page visual theme.
 * Each theme paints a distinct hero band, accent color, and motif so
 * clicking between pages feels like entering different rooms.
 */
export function ContentLayout({
  theme = 'arena',
  eyebrow,
  title,
  subtitle,
  hint,
  children,
}: {
  theme?: ContentTheme;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
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
