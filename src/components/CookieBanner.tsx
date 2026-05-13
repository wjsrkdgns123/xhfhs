import { useEffect, useState } from 'react';

const STORAGE_KEY = 'debateBattle:cookieConsent';

/**
 * Minimal cookie consent banner. Shows once per device until accepted.
 * Stores acceptance in localStorage so AdSense / analytics know to load.
 * (Currently informational — no scripts are gated on this yet, but the
 * banner is here for AdSense review compliance.)
 */
export function CookieBanner() {
  const [accepted, setAccepted] = useState<boolean>(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setAccepted(v === 'accepted');
    } catch {
      setAccepted(true); // safari private mode etc.
    }
  }, []);

  if (accepted) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      /* ignore */
    }
    setAccepted(true);
  };

  return (
    <div
      role="dialog"
      aria-label="쿠키 사용 동의"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: 'var(--color-paper-light)',
        border: '1.5px solid var(--color-ink)',
        boxShadow: '4px 4px 0 var(--color-ink)',
        padding: '14px 16px',
        maxWidth: 760,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        lineHeight: 1.55,
        color: 'var(--color-ink-soft)',
      }}
    >
      <span style={{ flex: 1, minWidth: 220 }}>
        🍪 토론배틀은 로그인 유지·화면 설정·서비스 분석 목적의 쿠키를 사용합니다.
        자세한 내용은{' '}
        <a
          href="/privacy"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/privacy');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          style={{
            color: 'var(--color-vermillion)',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          개인정보처리방침
        </a>
        을 참고하세요.
      </span>
      <button
        type="button"
        onClick={accept}
        style={{
          background: 'var(--color-vermillion)',
          color: '#fff',
          border: '1.5px solid var(--color-ink)',
          padding: '8px 16px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        동의
      </button>
    </div>
  );
}
