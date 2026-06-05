import { useEffect } from 'react';
import type { Lang } from '../../i18n/landing';
import { learnStrings } from '../../i18n/learn';
import { Ornament } from '../common';
import { Reveal } from '../Reveal';

/** Canonical 3-theme type. 'chronicle' and 'stage' are legacy aliases kept
 *  only at the CSS layer (content-themes.css). All new code uses 3 values. */
export type ContentTheme = 'arena' | 'caution' | 'library';

const THEME_ORNAMENT: Record<ContentTheme, 'asterisk' | 'dot3' | 'slash' | 'fleuron'> = {
  arena: 'asterisk',
  caution: 'slash',
  library: 'fleuron',
};

/** 7 content pages — order matches LearnView's CONTENT_HUB.
 *  KO labels are stored here; EN labels mirror them but are short. */
const HUB_PAGES: {
  id: string;
  labelKo: string;
  labelEn: string;
  cat: string;
  catEn: string;
}[] = [
  { id: 'topics',    labelKo: '토론 주제 100선',  labelEn: 'Topics',    cat: '주제',     catEn: 'Topic' },
  { id: 'formats',   labelKo: '토론 형식 도감',    labelEn: 'Formats',   cat: '양식',     catEn: 'Format' },
  { id: 'fallacies', labelKo: '논리 오류 백과',    labelEn: 'Fallacies', cat: '논증',     catEn: 'Argument' },
  { id: 'glossary',  labelKo: '용어 사전',         labelEn: 'Glossary',  cat: '레퍼런스', catEn: 'Reference' },
  { id: 'famous',    labelKo: '명토론 아카이브',   labelEn: 'Famous',    cat: '역사',     catEn: 'History' },
  { id: 'resources', labelKo: '자원 모음',         labelEn: 'Resources', cat: '바깥',     catEn: 'Beyond' },
  { id: 'samples',   labelKo: '샘플 토론',         labelEn: 'Samples',   cat: '실전',     catEn: 'Practice' },
];

/**
 * Shared layout for content/reference pages with per-page visual theme.
 * Each theme paints a distinct hero band, accent color, and motif so
 * clicking between pages feels like entering different rooms.
 *
 * NEW in P1:
 * - breadcrumb: "자료실 / {페이지명}" at top of hero
 * - bottom "다음 학습" navigation: prev/next page cards + back-to-learn + go-lobby CTA
 *
 * Props:
 *   onBackToLearn  — called when user clicks "자료실" breadcrumb or "기본기로 돌아가기"
 *   onNav          — called with a page id to navigate to another content page
 *   onGoLobby      — called for "토론장으로" CTA
 *   crumbLabel     — page title used in breadcrumb (reuses eyebrow/title when not provided)
 */
export function ContentLayout({
  theme = 'arena',
  eyebrow,
  title,
  subtitle,
  hint,
  children,
  lang = 'ko',
  onBackToLearn,
  onNav,
  onGoLobby,
  crumbLabel,
}: {
  theme?: ContentTheme;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  lang?: Lang;
  onBackToLearn?: () => void;
  onNav?: (page: string) => void;
  onGoLobby?: () => void;
  /** Short page name shown after "자료실 /" in the breadcrumb.
   *  Falls back to the eyebrow text if omitted. */
  crumbLabel?: string;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const t = learnStrings[lang];

  // --- prev / next ---
  const currentIdx = HUB_PAGES.findIndex((p) => {
    // Derive page id from the eyebrow or crumbLabel (best-effort match)
    if (crumbLabel) {
      return (
        p.labelKo === crumbLabel ||
        p.labelEn.toLowerCase() === crumbLabel.toLowerCase() ||
        crumbLabel.toLowerCase().includes(p.id)
      );
    }
    // fall back: match by theme+eyebrow substring
    return eyebrow.toLowerCase().includes(p.id);
  });

  const prevPage = currentIdx > 0 ? HUB_PAGES[currentIdx - 1] : HUB_PAGES[HUB_PAGES.length - 1];
  const nextPage = currentIdx < HUB_PAGES.length - 1 ? HUB_PAGES[currentIdx + 1] : HUB_PAGES[0];

  const pageLabel = (p: (typeof HUB_PAGES)[0]) =>
    lang === 'ko' ? p.labelKo : p.labelEn;
  const pageCat = (p: (typeof HUB_PAGES)[0]) =>
    lang === 'ko' ? p.cat : p.catEn;

  // Breadcrumb label: prefer explicit crumbLabel, then try to infer from currentIdx
  const displayCrumb =
    crumbLabel ??
    (currentIdx >= 0 ? pageLabel(HUB_PAGES[currentIdx]) : eyebrow);

  return (
    <div className={`landing-page content-theme content-theme--${theme}`}>
      {/* ── HERO ── */}
      <section className="content-hero">
        <div className="content-hero__motif" aria-hidden="true" />
        <div className="wrap" style={{ maxWidth: 1180 }}>
          <div className="content-hero__inner">
            {/* Breadcrumb */}
            <nav
              aria-label={lang === 'ko' ? '경로' : 'Breadcrumb'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 18,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.14em',
                color: 'var(--color-ink-fade)',
              }}
            >
              {onBackToLearn ? (
                <button
                  type="button"
                  onClick={onBackToLearn}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    letterSpacing: 'inherit',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  {t.breadcrumb.library}
                </button>
              ) : (
                <span>{t.breadcrumb.library}</span>
              )}
              <span aria-hidden="true" style={{ opacity: 0.5 }}>{t.breadcrumb.sep}</span>
              <span style={{ color: 'var(--color-ink-soft)', fontWeight: 700 }}>
                {displayCrumb}
              </span>
            </nav>

            <div className="content-hero__eyebrow">{eyebrow}</div>
            <h1 className="content-hero__title">{title}</h1>
            <div
              aria-hidden="true"
              style={{ display: 'flex', justifyContent: 'flex-start', margin: '6px 0 14px', opacity: 0.7 }}
            >
              <Ornament kind={THEME_ORNAMENT[theme]} size={20} color="var(--color-vermillion)" />
            </div>
            {subtitle && <p className="content-hero__sub">{subtitle}</p>}
            {hint && <div className="content-hero__hint">{hint}</div>}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <section style={{ padding: '40px 0 60px' }}>
        <div className="wrap" style={{ maxWidth: 1180 }}>
          {children}
        </div>
      </section>

      {/* ── 다음 학습 네비 ── */}
      <section
        style={{
          padding: '0 0 100px',
          borderTop: 'var(--border-line)',
        }}
      >
        <div className="wrap" style={{ maxWidth: 1180 }}>
          {/* Section eyebrow */}
          <Reveal>
            <div
              className="eyebrow"
              style={{ margin: '48px 0 24px', color: 'var(--color-ink-fade)' }}
            >
              <Ornament kind="dot3" size={14} color="var(--color-ink-fade)" />
              <span style={{ marginLeft: 8 }}>{t.contentNav.sectionLabel}</span>
            </div>
          </Reveal>

          {/* Prev / Next cards */}
          {onNav && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                marginBottom: 40,
              }}
            >
              {/* Prev */}
              <Reveal delay={0}>
                <button
                  type="button"
                  onClick={() => onNav(prevPage.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'var(--color-paper-light)',
                    border: 'var(--border-line)',
                    borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '20px 22px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = '';
                    el.style.boxShadow = 'var(--shadow-sm)';
                  }}
                  aria-label={`${t.contentNav.prev}: ${pageLabel(prevPage)}`}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      color: 'var(--color-ink-fade)',
                    }}
                  >
                    ← {t.contentNav.prev}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {pageLabel(prevPage)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-ink-fade)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {pageCat(prevPage)}
                  </span>
                </button>
              </Reveal>

              {/* Next */}
              <Reveal delay={80}>
                <button
                  type="button"
                  onClick={() => onNav(nextPage.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'var(--color-paper-light)',
                    border: 'var(--border-line)',
                    borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '20px 22px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = '';
                    el.style.boxShadow = 'var(--shadow-sm)';
                  }}
                  aria-label={`${t.contentNav.next}: ${pageLabel(nextPage)}`}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      color: 'var(--color-ink-fade)',
                    }}
                  >
                    {t.contentNav.next} →
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {pageLabel(nextPage)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-ink-fade)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {pageCat(nextPage)}
                  </span>
                </button>
              </Reveal>
            </div>
          )}

          {/* CTA row */}
          <Reveal delay={120}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {onBackToLearn && (
                <button
                  type="button"
                  className="btn--ghost"
                  onClick={onBackToLearn}
                  style={{ fontSize: 13, padding: '8px 18px' }}
                >
                  {t.contentNav.backToLearn}
                </button>
              )}
              {onGoLobby && (
                <button
                  type="button"
                  className="btn--pri"
                  onClick={onGoLobby}
                  style={{ fontSize: 13, padding: '8px 22px' }}
                >
                  {t.contentNav.goLobby}
                </button>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
