import type { Lang } from '../i18n/landing';

interface LangToggleProps {
  lang: Lang;
  onToggle: () => void;
}

export function LangToggle({ lang, onToggle }: LangToggleProps) {
  const next = lang === 'ko' ? 'EN' : 'KO';
  const label =
    lang === 'ko' ? 'Switch to English' : '한국어로 보기';
  return (
    <button
      type="button"
      onClick={onToggle}
      className="lang-toggle"
      aria-label={label}
      title={label}
    >
      <span className="lang-toggle__current">{lang === 'ko' ? 'KO' : 'EN'}</span>
      <span className="lang-toggle__sep">/</span>
      <span className="lang-toggle__alt">{next}</span>
    </button>
  );
}
