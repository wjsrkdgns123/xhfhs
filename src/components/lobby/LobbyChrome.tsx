// #25 (incremental step 9): lobby empty-state CTA + site footer extracted from App.tsx.
import type { Lang } from '../../i18n/landing';
import type { StaticPage } from '../../types';
import { headerStrings } from '../../i18n/header';
import { Ornament } from '../common';

export function LobbyEmptyCTA({ lang, onCreate }: { lang: Lang; onCreate: () => void }) {
  return (
    <div
      className="card card--shadow"
      style={{
        marginTop: 36,
        padding: 28,
        textAlign: 'center',
        background: 'var(--color-paper-deep)',
      }}
    >
      <div aria-hidden="true" style={{ fontSize: 32, lineHeight: 1, marginBottom: 4 }}>🔥</div>
      <h3
        className="serif-display"
        style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 6px', letterSpacing: '-0.02em' }}
      >
        {lang === 'en' ? "Don't see your topic?" : '찾는 논제가 없는가?'}
      </h3>
      <p className="text-soft" style={{ margin: '0 0 16px', fontSize: 14 }}>
        <span
          className="hand"
          style={{ color: 'var(--color-vermillion)', fontSize: 17 }}
        >
          {lang === 'en'
            ? 'Open the stage now and be the first debater.'
            : '지금 무대를 열면 첫 토론자다.'}
        </span>
      </p>
      <button
        type="button"
        className="btn btn--pri btn--lg btn--shadow"
        onClick={onCreate}
      >
        + {lang === 'en' ? 'Open a new room' : '새 토론방 만들기'}
      </button>
    </div>
  );
}

export function SiteFooter({ onNav, lang }: { onNav: (page: Exclude<StaticPage, 'notfound'>) => void; lang: Lang }) {
  const t = headerStrings[lang];
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="brand">
              <span className="brand__mark">{t.header.brand}</span>
              <span>{t.header.brandSub}</span>
            </span>
            <span className="site-footer__tag">{t.footer.tag}</span>
          </div>
          <nav className="site-footer__nav" aria-label={lang === 'en' ? 'Site menu' : '사이트 메뉴'}>
            <button type="button" onClick={() => onNav('about')}>{t.footer.about}</button>
            <button type="button" onClick={() => onNav('contact')}>{t.footer.contact}</button>
            <button type="button" onClick={() => onNav('privacy')}>{t.footer.privacy}</button>
            <button type="button" onClick={() => onNav('terms')}>{t.footer.terms}</button>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <span>{t.footer.copyright(year)}</span>
          <span aria-hidden="true" style={{ display: 'inline-flex', opacity: 0.5 }}>
            <Ornament kind="dot3" size={14} color="var(--color-ink-fade)" />
          </span>
          <span>{t.footer.poweredBy}</span>
        </div>
      </div>
    </footer>
  );
}
