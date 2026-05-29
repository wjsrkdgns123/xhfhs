// #25 (incremental step 10): top app header (game-launcher tab bar) extracted from App.tsx.
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';
import type { Theme } from '../hooks/useTheme';
import { headerStrings } from '../i18n/header';
import { commonStrings } from '../i18n/common';
import { type AvatarId, ProfileAvatar } from './common';
import { displayNameOf } from '../lib/userText';
import { LangToggle } from './LangToggle';
import { ThemeToggle } from './ThemeToggle';

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
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur header-game"
      style={{
        borderBottom: '2px solid var(--color-ink)',
        background: 'rgba(250, 243, 226, 0.92)',
      }}
    >
      <div className="header-game__inner">
        {/* LEFT: brand + secondary tabs (소개 / 자료실) so the primary tab
           floats dead-center via the 1fr auto 1fr grid below. */}
        <div className="header-game__left">
          <button onClick={onHome} className="brand brand--compact flex-shrink-0" aria-label={lang === 'en' ? 'DebateBattle home' : '토론배틀 홈'}>
            <span className="brand__mark">{tHead.header.brand}</span>
          </button>
          <nav className="header-game__secondary" aria-label={lang === 'en' ? 'Secondary pages' : '보조 페이지'}>
            <button
              type="button"
              className={`header-game__tab ${currentView === 'landing' ? 'is-active' : ''}`}
              onClick={onLanding}
            >
              <span className="header-game__tab-icon" aria-hidden="true">ℹ️</span>
              <span>{tHead.nav.intro}</span>
            </button>
            <button
              type="button"
              className={`header-game__tab ${currentView === 'learn' ? 'is-active' : ''}`}
              onClick={onLearn}
            >
              <span className="header-game__tab-icon" aria-hidden="true">📚</span>
              <span>{tHead.nav.learn}</span>
            </button>
          </nav>
        </div>

        {/* CENTER: primary action — sits in the dead center of the page
           because the surrounding grid columns are 1fr each. */}
        <button
          type="button"
          className={`header-game__tab header-game__tab--primary ${
            currentView === 'lobby' || currentView === 'room' ? 'is-active' : ''
          }`}
          onClick={onHome}
          aria-label={lang === 'en' ? 'Stadium — main action' : '토론장 — 메인 액션'}
        >
          <span className="header-game__tab-chev" aria-hidden="true">▶</span>
          <span>{tHead.nav.lobby}</span>
        </button>

        <div className="header-game__actions">
          {user ? (
            <>
              <button
                onClick={onProfile}
                title={tHead.nav.profile}
                className="btn btn-ghost"
                style={{
                  padding: '3px 10px 3px 4px',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ProfileAvatar
                  avatarId={profile?.avatarId as AvatarId | undefined}
                  avatarDataUrl={profile?.avatarDataUrl}
                  size={28}
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
            <button onClick={onSignIn} className="btn btn-pri text-sm">
              {tCommon.auth.signIn}
            </button>
          )}

          {/* Preference toggles — separated from auth controls by a vertical
             divider and extra gap so they read as a distinct cluster. */}
          <div className="header-game__prefs" aria-label="환경 설정">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <LangToggle lang={lang} onToggle={onToggleLang} />
          </div>
        </div>
      </div>
    </header>
  );
}
