// 토론배틀 소개(Intro) — redesign (Claude Design handoff: redesign/토론배틀 소개 페이지).
// Academic split hero + 5-step "how" + 3 "why" + live motions + CTA band. Slots under
// the global Header/Footer. SEO meta + real live-presence count are preserved.
import '../redesign.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLivePresence } from '../hooks/useLivePresence';
import type { Lang } from '../i18n/landing';
import { landingStrings } from '../i18n/landing';
import { HeroEDU, SectionCTA, SectionHow, SectionMotions, SectionWhy } from './landing/IntroSections';

export function LandingView({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const t = landingStrings[lang];
  useDocumentMeta(t.meta.title, t.meta.description);
  const { liveCount } = useLivePresence();

  const scrollTo = (id: string) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="tb-root tb-intro">
      <div id="top" className="tb-hero-band">
        <HeroEDU lang={lang} liveCount={liveCount} onStart={onStart} onSamples={() => scrollTo('motions')} />
      </div>
      <SectionHow lang={lang} />
      <SectionWhy lang={lang} />
      <SectionMotions lang={lang} onStart={onStart} />
      <SectionCTA lang={lang} onStart={onStart} />
    </div>
  );
}
