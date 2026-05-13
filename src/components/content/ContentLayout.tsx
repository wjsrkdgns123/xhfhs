import { useEffect } from 'react';

/**
 * Shared layout for content/reference pages (topics, famous, fallacies,
 * glossary, samples). Mirrors LegalLayout but allows wider content.
 */
export function ContentLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="landing-page">
      <section style={{ padding: '60px 0 30px' }}>
        <div className="wrap" style={{ maxWidth: 1180 }}>
          <div className="section-eyebrow">{eyebrow}</div>
          <h1
            className="section-title"
            style={{ fontSize: 'clamp(36px, 6vw, 56px)', marginBottom: 16 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="section-lead"
              style={{ maxWidth: 720, marginBottom: 0 }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </section>
      <section style={{ padding: '20px 0 100px' }}>
        <div className="wrap" style={{ maxWidth: 1180 }}>
          {children}
        </div>
      </section>
    </div>
  );
}
