// Header — design-kit redesign (討 seal serif brand, text tabs with vermillion
// underline, premium 토론장 play-badge + ENTER kicker, logo-matched G-seal sign-in).
// Visual only: all production behavior, props and i18n are preserved.
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';
import type { Theme } from '../hooks/useTheme';
import { headerStrings } from '../i18n/header';
import { commonStrings } from '../i18n/common';
import { type AvatarId, ProfileAvatar } from './common';
import { displayNameOf } from '../lib/userText';

const THEME_GLYPH: Record<string, string> = { dark: '☾', dusk: '◑', dawn: '◐', light: '☀' };

export function Header({
  user,
  profile,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  currentView,
  onSignIn,
  onSignOut,
  onHome,
  onProfile,
  onLearn,
  onLanding,
}: {
  user: User | null;
  profile: UserProfile | null;
  lang: 'ko' | 'en';
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  currentView: 'lobby' | 'room' | 'profile' | 'learn' | 'landing';
  onSignIn: () => void;
  onSignOut: () => void;
  onHome: () => void;
  onProfile: () => void;
  onLearn: () => void;
  onLanding: () => void;
}) {
  const tHead = headerStrings[lang];
  const tCommon = commonStrings[lang];
  const inDebate = currentView === 'lobby' || currentView === 'room';
  return (
    <header className="hg">
      <div className="hg__inner">
        {/* LEFT: 討 seal serif brand + secondary tabs (소개 / 자료실). The 1fr auto 1fr
           grid floats the primary 토론장 tab dead-center. */}
        <div className="hg__left">
          <button className="brand-serif" onClick={onHome} aria-label={lang === 'en' ? 'DebateBattle home' : '토론배틀 홈'}>
            <span className="brand-serif__seal" aria-hidden="true">討</span>
            <span className="brand-serif__word">{tHead.header.brand}<span className="dot">.</span></span>
          </button>
          <nav className="hg__secondary" aria-label={lang === 'en' ? 'Secondary pages' : '보조 페이지'}>
            <button
              type="button"
              className={`hg__tab ${currentView === 'landing' ? 'is-active' : ''}`}
              onClick={onLanding}
            >
              <span className="hg__tablabel">{tHead.nav.intro}</span>
            </button>
            <button
              type="button"
              className={`hg__tab ${currentView === 'learn' ? 'is-active' : ''}`}
              onClick={onLearn}
            >
              <span className="hg__tablabel">{tHead.nav.learn}</span>
            </button>
          </nav>
        </div>

        {/* CENTER: premium primary action — cream play badge + ENTER kicker. */}
        <button
          type="button"
          className={`hg__tab hg__tab--primary ${inDebate ? 'is-active' : ''}`}
          onClick={onHome}
          aria-label={lang === 'en' ? 'Stadium — main action' : '토론장 — 메인 액션'}
        >
          <span className="hg__play" aria-hidden="true" />
          <span className="hg__primary-text">{tHead.nav.lobby}</span>
          <span className="hg__primary-kicker" aria-hidden="true">ENTER</span>
        </button>

        {/* RIGHT: auth + preference cluster. */}
        <div className="hg__actions">
          {user ? (
            <>
              <button
                onClick={onProfile}
                title={tHead.nav.profile}
                className="btn btn-ghost"
                style={{ padding: '3px 10px 3px 4px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ProfileAvatar
                  avatarId={profile?.avatarId as AvatarId | undefined}
                  avatarDataUrl={profile?.avatarDataUrl}
                  size={26}
                />
                <span>{displayNameOf(profile, user)}</span>
              </button>
              <button
                onClick={onSignOut}
                className="btn btn-ghost text-sm"
                style={{ padding: '4px 8px' }}
                title={tCommon.auth.signOut}
              >
                <span className="hidden sm:inline">{tCommon.auth.signOut}</span>
                <span className="sm:hidden">↪</span>
              </button>
            </>
          ) : (
            <button className="hg__signin" onClick={onSignIn}>
              <span className="hg__g" aria-hidden="true">G</span>
              <span>{tCommon.auth.signIn}</span>
            </button>
          )}

          <div className="hg__prefs" aria-label={lang === 'en' ? 'Preferences' : '환경 설정'}>
            <button
              type="button"
              className="hg__icon-btn"
              onClick={onToggleTheme}
              title={lang === 'en' ? 'Change theme' : '테마 변경'}
              aria-label={lang === 'en' ? 'Change theme' : '테마 변경'}
            >
              {THEME_GLYPH[theme] ?? '☀'}
            </button>
            <button type="button" className="hg__lang" onClick={onToggleLang} aria-label="KO / EN">
              <span style={{ color: lang === 'ko' ? 'var(--color-ink)' : 'var(--color-ink-fade)' }}>KO</span>
              <span className="hg__lang-sep">/</span>
              <span style={{ color: lang === 'en' ? 'var(--color-ink)' : 'var(--color-ink-fade)' }}>EN</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
