import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, firebaseConfigured, googleProvider } from './firebase';
import { computeOutcome } from './lib/verdict';
import { aiFetch, closeDebateFn, polishText } from './lib/aiClient';
import { displayNameOf } from './lib/userText';
import { CenterMsg, LazyFallback, SetupScreen } from './components/AppChrome';
import { AI_NAME, STATS_KEY, TIDY_KEY } from './lib/constants';
import { classNames } from './lib/cn';
import { InviteLinkButton, PhaseGuide, PhaseProgress, StatusBadge } from './components/room/RoomParts';
import { MessageRow, SideCard, VerdictBlock } from './components/room/RoomPanels';
import { ProfileView } from './components/profile/ProfilePanel';
import { LobbyRoomCard } from './components/lobby/LobbyRoomCard';
import {
  type AvatarId,
  Ornament,
  ProfileAvatar,
  RoundTimeline,
  VSMark,
  VoteBar,
} from './components/common';
// v2 lazy screens.
const OnboardingViewLazy = lazy(() =>
  import('./components/OnboardingView').then((m) => ({ default: m.OnboardingView })),
);
const LobbyMastheadLazy = lazy(() =>
  import('./components/LobbyMasthead').then((m) => ({ default: m.LobbyMasthead })),
);
const LobbyRoomRowLazy = lazy(() =>
  import('./components/LobbyRoomRow').then((m) => ({ default: m.LobbyRoomRow })),
);
import { ObjectionOverlay, type OverlayKind } from './components/ObjectionOverlay';
import { ChatPanel } from './components/ChatPanel';
import { CookieBanner } from './components/CookieBanner';
import { FloatingLobbyBtn } from './components/FloatingLobbyBtn';
import { LangToggle } from './components/LangToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastHost, showToast } from './components/Toast';
import { useLocale } from './hooks/useLocale';
import type { Lang } from './i18n/landing';
import { lobbyStrings } from './i18n/lobby';
import { headerStrings } from './i18n/header';
import { commonStrings } from './i18n/common';
import { roomStrings } from './i18n/room';
import { useTheme, type Theme } from './hooks/useTheme';
import { useRoomPrefs } from './hooks/useRoomPrefs';
// Lazy-load heavy views — keeps initial bundle small for first paint
const LegalPages = {
  Privacy: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.PrivacyView })),
  ),
  Terms: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.TermsView })),
  ),
  About: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.AboutView })),
  ),
  Contact: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.ContactView })),
  ),
};
const ContentPages = {
  Topics: lazy(() =>
    import('./components/content/TopicsView').then((m) => ({ default: m.TopicsView })),
  ),
  Fallacies: lazy(() =>
    import('./components/content/FallaciesView').then((m) => ({ default: m.FallaciesView })),
  ),
  Glossary: lazy(() =>
    import('./components/content/GlossaryView').then((m) => ({ default: m.GlossaryView })),
  ),
  Famous: lazy(() =>
    import('./components/content/FamousDebatesView').then((m) => ({ default: m.FamousDebatesView })),
  ),
  Samples: lazy(() =>
    import('./components/content/SamplesView').then((m) => ({ default: m.SamplesView })),
  ),
  Formats: lazy(() =>
    import('./components/content/FormatsView').then((m) => ({ default: m.FormatsView })),
  ),
  Resources: lazy(() =>
    import('./components/content/ResourcesView').then((m) => ({ default: m.ResourcesView })),
  ),
};
const NotFoundView = lazy(() =>
  import('./components/NotFoundView').then((m) => ({ default: m.NotFoundView })),
);
const LearnView = lazy(() =>
  import('./components/LearnView').then((m) => ({ default: m.LearnView })),
);
const LandingView = lazy(() =>
  import('./components/LandingView').then((m) => ({ default: m.LandingView })),
);

type StaticPage =
  | 'privacy'
  | 'terms'
  | 'about'
  | 'contact'
  | 'topics'
  | 'fallacies'
  | 'glossary'
  | 'famous'
  | 'samples'
  | 'formats'
  | 'resources'
  | 'notfound';

const STATIC_PATH_MAP: Record<string, StaticPage> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/about': 'about',
  '/contact': 'contact',
  '/topics': 'topics',
  '/fallacies': 'fallacies',
  '/glossary': 'glossary',
  '/famous': 'famous',
  '/samples': 'samples',
  '/formats': 'formats',
  '/resources': 'resources',
};

const KNOWN_PATHS = new Set(['/', ...Object.keys(STATIC_PATH_MAP)]);

import './lobby.css';
import {
  AI_OPPONENT_NAME,
  AI_OPPONENT_UID,
  EMPTY_PROFILE,
  NEXT_PHASE,
  PHASE_LABEL,
  PHASE_SPEAKER,
  type Message,
  type Phase,
  type Room,
  type Side,
  type UserProfile,
} from './types';




export default function App() {
  const { lang, toggle: toggleLang } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  // First-time visitors land on the marketing page (so they see the value
  // proposition before the lobby). Returning visitors and logged-in users
  // skip straight to the lobby.
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Skip on deep links — private invite room, content pages, 404
    const p = window.location.pathname;
    const hasRoom = new URLSearchParams(window.location.search).get('room');
    if (hasRoom || (p !== '/' && p !== '/landing')) return false;
    try {
      return localStorage.getItem('debateBattle:visited') !== 'yes';
    } catch {
      return true;
    }
  });

  // Mark visited so subsequent loads go straight to the lobby
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('debateBattle:visited', 'yes');
    } catch {
      /* private mode etc. */
    }
  }, []);
  const [staticPage, setStaticPage] = useState<StaticPage | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = window.location.pathname;
    if (STATIC_PATH_MAP[p]) return STATIC_PATH_MAP[p];
    // Unknown path + no ?room= param = 404
    const hasRoom = new URLSearchParams(window.location.search).get('room');
    if (p !== '/' && !KNOWN_PATHS.has(p) && !hasRoom) return 'notfound';
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Sync static page state ↔ URL (clean URLs for AdSense + SEO crawlability)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = () => {
      const p = window.location.pathname;
      if (STATIC_PATH_MAP[p]) setStaticPage(STATIC_PATH_MAP[p]);
      else if (p !== '/' && !KNOWN_PATHS.has(p)) {
        const hasRoom = new URLSearchParams(window.location.search).get('room');
        setStaticPage(hasRoom ? null : 'notfound');
      } else setStaticPage(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openStaticPage = (page: Exclude<StaticPage, 'notfound'>) => {
    setStaticPage(page);
    setShowProfile(false);
    setShowLearn(false);
    setShowLanding(false);
    setActiveRoomId(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${page}`);
      window.scrollTo({ top: 0 });
    }
  };

  const closeStaticPage = () => {
    setStaticPage(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  // Sync activeRoomId with URL ?room= param so private invite links work
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeRoomId) {
      url.searchParams.set('room', activeRoomId);
    } else {
      url.searchParams.delete('room');
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeRoomId]);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // Subscribe to user's profile doc; create default if missing
  useEffect(() => {
    if (!db || !user) {
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    let cancelled = false;
    (async () => {
      const snap = await getDoc(ref);
      if (cancelled) return;
      if (!snap.exists()) {
        const initial: UserProfile = {
          uid: user.uid,
          nickname: user.displayName ?? '익명',
          ...EMPTY_PROFILE,
        };
        await setDoc(ref, initial);
      }
    })();
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setProfile({ uid: user.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) });
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  if (!firebaseConfigured) return <SetupScreen />;
  if (!authReady) return <CenterMsg>로딩 중…</CenterMsg>;

  return (
    <div className="min-h-full flex flex-col">
      <a href="#main-content" className="skip-to-content">
        {lang === 'en' ? 'Skip to content' : '본문 바로가기'}
      </a>
      <Header
        user={user}
        profile={profile}
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentView={
          staticPage
            ? 'landing'
            : showLanding
              ? 'landing'
              : showProfile
                ? 'profile'
                : showLearn
                  ? 'learn'
                  : activeRoomId
                    ? 'room'
                    : 'lobby'
        }
        onSignIn={() => auth && signInWithPopup(auth, googleProvider)}
        onSignOut={() => auth && signOut(auth)}
        onHome={() => {
          setActiveRoomId(null);
          setShowProfile(false);
          setShowLearn(false);
          setShowLanding(false);
          closeStaticPage();
        }}
        onProfile={() => {
          setShowProfile(true);
          setShowLearn(false);
          setShowLanding(false);
          setActiveRoomId(null);
          closeStaticPage();
        }}
        onLearn={() => {
          setShowLearn(true);
          setShowProfile(false);
          setShowLanding(false);
          setActiveRoomId(null);
          closeStaticPage();
        }}
        onLanding={() => {
          setShowLanding(true);
          setShowLearn(false);
          setShowProfile(false);
          setActiveRoomId(null);
          closeStaticPage();
        }}
      />
      {staticPage ? (
        <main id="main-content" className="flex-1 w-full">
          <Suspense fallback={<LazyFallback />}>
            {staticPage === 'privacy' && <LegalPages.Privacy lang={lang} />}
            {staticPage === 'terms' && <LegalPages.Terms lang={lang} />}
            {staticPage === 'about' && <LegalPages.About lang={lang} />}
            {staticPage === 'contact' && <LegalPages.Contact lang={lang} />}
            {staticPage === 'topics' && <ContentPages.Topics lang={lang} />}
            {staticPage === 'fallacies' && <ContentPages.Fallacies lang={lang} />}
            {staticPage === 'glossary' && <ContentPages.Glossary lang={lang} />}
            {staticPage === 'famous' && <ContentPages.Famous lang={lang} />}
            {staticPage === 'samples' && <ContentPages.Samples lang={lang} />}
            {staticPage === 'formats' && <ContentPages.Formats lang={lang} />}
            {staticPage === 'resources' && <ContentPages.Resources lang={lang} />}
            {staticPage === 'notfound' && (
              <NotFoundView
                onHome={() => {
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/');
                  }
                  closeStaticPage();
                }}
              />
            )}
          </Suspense>
        </main>
      ) : showLanding ? (
        <main id="main-content" className="flex-1 w-full">
          <Suspense fallback={<LazyFallback />}>
            <LandingView lang={lang} onStart={() => setShowLanding(false)} />
          </Suspense>
        </main>
      ) : showLearn ? (
        <main id="main-content" className="flex-1 w-full">
          <Suspense fallback={<LazyFallback />}>
            <LearnView
              lang={lang}
              onBack={() => {
                setShowLearn(false);
              }}
              onOpenContent={(page) => {
                setShowLearn(false);
                openStaticPage(page);
              }}
            />
          </Suspense>
        </main>
      ) : (
      <main id="main-content" className="safe-b flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {showProfile && user ? (
          <ProfileView user={user} profile={profile} onBack={() => setShowProfile(false)} lang={lang} />
        ) : activeRoomId ? (
          <RoomView
            roomId={activeRoomId}
            user={user}
            profile={profile}
            onBack={() => setActiveRoomId(null)}
            lang={lang}
          />
        ) : (
          <Lobby
            user={user}
            profile={profile}
            onEnter={setActiveRoomId}
            onSignIn={() => auth && signInWithPopup(auth, googleProvider)}
            lang={lang}
          />
        )}
      </main>
      )}
      <SiteFooter onNav={openStaticPage} lang={lang} />
      <CookieBanner />
      <ToastHost />
      {/* Floating CTA — '토론하기' on landing/learn/content (jumps to
          lobby); '방 만들기' inside the lobby (opens the create form via
          hash). Hidden in room/profile views. */}
      {(() => {
        if (activeRoomId || showProfile) return null;
        const inLobbyView = !showLanding && !showLearn && !staticPage;
        if (inLobbyView) {
          return (
            <FloatingLobbyBtn
              variant="open-create"
              lang={lang}
              onClick={() => {
                if (typeof window === 'undefined') return;
                if (window.location.hash === '#create') {
                  window.history.replaceState(
                    {},
                    '',
                    window.location.pathname + window.location.search,
                  );
                }
                window.location.hash = '#create';
              }}
            />
          );
        }
        return (
          <FloatingLobbyBtn
            variant="go-lobby"
            lang={lang}
            onClick={() => {
              setActiveRoomId(null);
              setShowProfile(false);
              setShowLearn(false);
              setShowLanding(false);
              closeStaticPage();
            }}
          />
        );
      })()}
    </div>
  );
}

/** v2 empty-state CTA — paper-deep card with flame icon, serif heading,
 *  handwritten subline, and a primary CTA button. Mirrors the bottom
 *  "찾는 논제가 없는가?" block from `screen-lobby.jsx`. */
function LobbyEmptyCTA({ lang, onCreate }: { lang: Lang; onCreate: () => void }) {
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

function SiteFooter({ onNav, lang }: { onNav: (page: Exclude<StaticPage, 'notfound'>) => void; lang: Lang }) {
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

function Header({
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

/* Note: the old HeaderMegaMenu (with DropdownItem / DropdownGroup /
   MegaColumn interfaces) was removed when the header switched to a
   game-launcher tab bar. Sub-page links (e.g. "방 만들기", "5대 원칙")
   now live inside each destination page rather than in a header dropdown.
   If we want hover dropdowns again in the future, restore from git history
   at commit before the game-launcher refactor. */

function Lobby({
  user,
  profile,
  onEnter,
  onSignIn,
  lang,
}: {
  user: User | null;
  profile: UserProfile | null;
  onEnter: (id: string) => void;
  onSignIn: () => void;
  lang: Lang;
}) {
  // v2: i18n strings for the most-visible Lobby labels
  const t = lobbyStrings[lang];
  const [rooms, setRooms] = useState<Room[]>([]);
  // v2: grid (existing cards) | list (LobbyRoomRow newspaper-style rows)
  const [layout, setLayout] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    const stored = window.localStorage.getItem('debateBattle:lobbyLayout');
    return stored === 'list' ? 'list' : 'grid';
  });
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<'human' | 'ai'>('human');
  const [mySide, setMySide] = useState<Side>('pro');
  const [isPrivate, setIsPrivate] = useState(false);
  const [plannedRounds, setPlannedRounds] = useState<number>(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'open' | 'ai' | 'human'>('all');
  const [search, setSearch] = useState('');
  // 방 만들기 섹션은 사용자가 명시적으로 열 때만 노출 (빈 자리 카드 클릭 또는 헤더의 "방 만들기" 앵커)
  const [showCreate, setShowCreate] = useState(false);
  // v2: guided onboarding wizard modal — fills topic/side/rounds and submits
  const [showWizard, setShowWizard] = useState(false);

  // Header anchor "방 만들기" (#create) 또는 플로팅 버튼·외부 hash 변경 시 자동 노출
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkHash = () => {
      if (window.location.hash !== '#create') return;
      setShowCreate(true);
      // 다음 paint에서 스크롤 + 펄스
      window.setTimeout(() => {
        const el = document.getElementById('create');
        if (!el) return;
        const headerOffset = 88;
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        const card = el.querySelector('.lb-create') as HTMLElement | null;
        if (card) {
          card.classList.remove('lb-create--pulse');
          void card.offsetWidth;
          card.classList.add('lb-create--pulse');
          window.setTimeout(() => card.classList.remove('lb-create--pulse'), 600);
        }
      }, 40);
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (!db) return;
    const firestore = db;
    const q = query(collection(firestore, 'rooms'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Room, 'id'>) }));
      const TTL = 2 * 60 * 60 * 1000; // 2 hours
      const now = Date.now();
      // Best-effort: clean up my own expired rooms (rules allow owner delete)
      all
        .filter((r) => r.createdBy === user?.uid && now - r.createdAt > TTL)
        .forEach((r) => {
          deleteDoc(doc(firestore, 'rooms', r.id)).catch(() => {});
        });
      // Hide private rooms from public list; hide rooms older than TTL from everyone
      setRooms(
        all.filter(
          (r) =>
            now - r.createdAt <= TTL &&
            (!r.isPrivate || r.createdBy === user?.uid),
        ),
      );
    });
  }, [user]);

  const fetchSuggestions = async () => {
    setLoadingTopics(true);
    try {
      const r = await aiFetch('/api/ai/topics');
      if (!r.ok) throw new Error();
      const { topics } = await r.json();
      setSuggestions(topics);
    } catch {
      showToast('주제 추천 실패. 잠시 후 다시 시도하세요.', 'error');
    } finally {
      setLoadingTopics(false);
    }
  };

  const create = async () => {
    if (!db || !user || !topic.trim()) return;
    setCreating(true);
    let phase = 'init';
    try {
      const myName = displayNameOf(profile, user);
      const base = {
        topic: topic.trim(),
        createdAt: Date.now(),
        createdBy: user.uid,
        isPrivate,
        plannedRounds,
        proUid: null as string | null,
        proName: null as string | null,
        conUid: null as string | null,
        conName: null as string | null,
        status: 'open' as Room['status'],
      };
      const myAvatarId = (profile?.avatarId ?? 'char1') as string;
      const myAvatarDataUrl = profile?.avatarDataUrl ?? null;
      if (mode === 'ai') {
        if (mySide === 'pro') {
          base.proUid = user.uid;
          base.proName = myName;
          (base as Record<string, unknown>).proAvatarId = myAvatarId;
          (base as Record<string, unknown>).proAvatarDataUrl = myAvatarDataUrl;
        } else {
          base.conUid = user.uid;
          base.conName = myName;
          (base as Record<string, unknown>).conAvatarId = myAvatarId;
          (base as Record<string, unknown>).conAvatarDataUrl = myAvatarDataUrl;
        }
      }
      phase = 'addDoc';
      const ref = await addDoc(collection(db, 'rooms'), base);
      if (mode === 'ai') {
        phase = 'updateDoc(ai)';
        const aiFields =
          mySide === 'pro'
            ? {
                conUid: AI_OPPONENT_UID,
                conName: AI_OPPONENT_NAME,
                conAvatarId: 'char3',
                conAvatarDataUrl: null as string | null,
                status: 'live' as const,
              }
            : {
                proUid: AI_OPPONENT_UID,
                proName: AI_OPPONENT_NAME,
                proAvatarId: 'char3',
                proAvatarDataUrl: null as string | null,
                status: 'live' as const,
              };
        await updateDoc(doc(db, 'rooms', ref.id), aiFields);
      }
      setTopic('');
      setSuggestions([]);
      onEnter(ref.id);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('[create room failed]', phase, err);
      showToast(`방 생성 실패 (${phase}): ${err.code ?? ''} ${err.message ?? '알 수 없는 오류'}`, 'error');
    } finally {
      setCreating(false);
    }
  };

  const removeRoom = async (roomId: string) => {
    if (!db || !user) return;
    if (!confirm('이 토론방을 삭제하시겠습니까? 모든 발언과 투표 기록이 사라집니다.')) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('[delete room failed]', err);
      showToast(`삭제 실패: ${err.code ?? ''} ${err.message ?? ''}`, 'error');
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'live' && r.status !== 'live') return false;
    if (filter === 'open' && r.status !== 'open') return false;
    if (
      filter === 'ai' &&
      r.proUid !== AI_OPPONENT_UID &&
      r.conUid !== AI_OPPONENT_UID
    )
      return false;
    if (
      filter === 'human' &&
      (r.proUid === AI_OPPONENT_UID || r.conUid === AI_OPPONENT_UID)
    )
      return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${r.topic} ${r.proName ?? ''} ${r.conName ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const liveCount = rooms.filter((r) => r.status === 'live').length;
  const openCount = rooms.filter((r) => r.status === 'open').length;
  const endedCount = rooms.filter((r) => r.status === 'ended').length;

  return (
    <div className="lobby-v2 lobby-v3 space-y-12">
      {/* === EDITORIAL MASTHEAD ===
          v2 LobbyMasthead — dark grid-pattern banner. Date, open/ended
          counts, and tagline are passed in as props so the legacy
          `lb3-mast` block can be removed without losing info. */}
      <Suspense fallback={<div style={{ height: 220 }} />}>
        <LobbyMastheadLazy
          liveCount={liveCount}
          openCount={openCount}
          endedCount={endedCount}
          dateLabel={new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
          tagline={
            lang === 'en' ? (
              <>One topic, <span className="marker">two stances.</span> AI moderates while spectators vote.</>
            ) : (
              <>하나의 주제, <span className="marker">두 사람의 입장.</span> AI 사회자가 진행하고 관전자가 투표합니다.</>
            )
          }
          lang={lang}
          onCreate={() => {
            if (typeof window === 'undefined') return;
            if (window.location.hash === '#create') {
              window.history.replaceState({}, '', window.location.pathname);
            }
            window.location.hash = '#create';
          }}
        />
      </Suspense>

      <section>
        {/* === FILTER / SEARCH BAR === */}
        <div className="lb3-toolbar">
          <div className="lb3-tabs">
            {[
              { id: 'all' as const, label: t.filters.all },
              { id: 'live' as const, label: t.filters.live },
              { id: 'open' as const, label: t.filters.open },
              { id: 'ai' as const, label: t.filters.ai },
              { id: 'human' as const, label: t.filters.human },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={classNames('lb3-tab', filter === tab.id && 'active')}
                onClick={() => setFilter(tab.id)}
              >
                {tab.id === 'live' && <span className="lb3-tab__dot" />}
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="lb3-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
          />
          {/* v2: layout toggle — grid (existing cards) or list (newspaper rows) */}
          <div
            style={{
              display: 'inline-flex',
              border: '1.5px solid var(--color-ink)',
              marginLeft: 8,
              flexShrink: 0,
            }}
            role="group"
            aria-label="레이아웃 전환"
          >
            {(['grid', 'list'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setLayout(m);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('debateBattle:lobbyLayout', m);
                  }
                }}
                aria-pressed={layout === m}
                style={{
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  background: layout === m ? 'var(--color-ink)' : 'transparent',
                  color: layout === m ? 'var(--color-paper-light)' : 'var(--color-ink)',
                  border: 'none',
                  borderRight: m === 'grid' ? '1.5px solid var(--color-ink)' : 'none',
                  cursor: 'pointer',
                }}
                title={m === 'grid' ? t.layout.gridTitle : t.layout.listTitle}
              >
                {m === 'grid' ? t.layout.grid : t.layout.list}
              </button>
            ))}
          </div>
        </div>

        {layout === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredRooms.map((r, idx) => (
              <Suspense key={r.id} fallback={<div style={{ height: 140, background: 'var(--color-paper)' }} />}>
                <LobbyRoomRowLazy
                  room={r}
                  votes={{ pro: 0, con: 0 }}
                  isHot={idx === 0 && r.status === 'live'}
                  onEnter={onEnter}
                />
              </Suspense>
            ))}
            {rooms.length === 0 ? (
              <LobbyEmptyCTA lang={lang} onCreate={() => setShowCreate(true)} />
            ) : (
              <button
                type="button"
                className="lb-card lb-card--empty"
                style={{ minHeight: 100 }}
                onClick={() => {
                  setShowCreate(true);
                  window.setTimeout(() => {
                    const el = document.getElementById('create');
                    if (!el) return;
                    const headerOffset = 88;
                    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }, 30);
                }}
                aria-label={lang === 'en' ? 'Create new room' : '새 토론방 만들기'}
              >
                <div className="lb-card--empty__plus">+</div>
                <div className="lb-card--empty__title">
                  {filteredRooms.length === 0
                    ? (lang === 'en' ? 'No rooms match — open one' : '검색에 맞는 방 없음 — 직접 열기')
                    : (lang === 'en' ? 'Create new room' : '새 토론방 만들기')}
                </div>
              </button>
            )}
          </div>
        ) : (
        <div className="lb-roomgrid">
          {filteredRooms.map((r, idx) => (
            <LobbyRoomCard
              key={r.id}
              room={r}
              onEnter={onEnter}
              onDelete={removeRoom}
              isMine={!!user && r.createdBy === user.uid}
              isHot={idx === 0 && r.status === 'live'}
            />
          ))}
          {rooms.length > 0 && (
            <button
              type="button"
              className="lb-card lb-card--empty"
              onClick={() => {
                setShowCreate(true);
                window.setTimeout(() => {
                  const el = document.getElementById('create');
                  if (!el) return;
                  const headerOffset = 88;
                  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
                  window.scrollTo({ top, behavior: 'smooth' });
                  const card = el.querySelector('.lb-create') as HTMLElement | null;
                  if (card) {
                    card.classList.remove('lb-create--pulse');
                    void card.offsetWidth;
                    card.classList.add('lb-create--pulse');
                    window.setTimeout(() => card.classList.remove('lb-create--pulse'), 600);
                  }
                }, 30);
              }}
              aria-label="새 토론방 만들기"
            >
              <div className="lb-card--empty__plus">+</div>
              <div className="lb-card--empty__title">
                {filteredRooms.length === 0 ? t.empty.noMatch : t.empty.newRoom}
              </div>
            </button>
          )}
          {filteredRooms.length === 0 && rooms.length > 0 && (
            <button
              type="button"
              className="lb-clear-filters"
              onClick={(e) => {
                e.stopPropagation();
                setFilter('all');
                setSearch('');
              }}
            >
              {t.empty.clearFilters}
            </button>
          )}
        </div>
        )}
        {/* v2 empty-state CTA card (per screen-lobby.jsx) — replaces the
            previous lb3-mast firstcall block when the lobby has zero rooms. */}
        {rooms.length === 0 && (
          <LobbyEmptyCTA lang={lang} onCreate={() => setShowCreate(true)} />
        )}
      </section>

      {showCreate && (
      <section id="create">
        <div className="lb-create">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              aria-label={t.create.close}
              className="lb-create__close"
            >
              ×
            </button>
            <h2 className="lb-create__title">
              <span className="stamp">{t.create.titleStamp}</span>
              <span>{t.create.titleRest}</span>
            </h2>

            {user && (
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="btn"
                style={{
                  marginBottom: 16,
                  boxShadow: '2px 2px 0 var(--color-ink)',
                  padding: '8px 14px',
                  fontSize: 13,
                }}
              >
                {t.create.wizardBtn}
              </button>
            )}

            {user ? (
              <>
                <label className="lb-create__label">{t.create.topicLabel}</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  placeholder={t.create.topicPlaceholder}
                  className="lb-create__textarea"
                />
                <button
                  onClick={fetchSuggestions}
                  disabled={loadingTopics}
                  className="lb-create__suggest-btn"
                >
                  {loadingTopics ? t.create.suggesting : t.create.suggest}
                </button>

                {suggestions.length > 0 && (
                  <ul className="lb-suggestions list-none p-0 m-0">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          onClick={() => {
                            setTopic(s);
                            setSuggestions([]);
                          }}
                          className="lb-suggestion"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="lb-create__group">
                  <label className="lb-create__label">{t.create.opponentLabel}</label>
                  <div className="lb-create__chips">
                    <button
                      onClick={() => setMode('human')}
                      className={classNames('lb-cchip', mode === 'human' && 'active')}
                    >
                      👥 {t.create.opponentHuman}
                    </button>
                    <button
                      onClick={() => setMode('ai')}
                      className={classNames('lb-cchip', mode === 'ai' && 'active')}
                    >
                      🤖 {t.create.opponentAi}
                    </button>
                  </div>
                </div>

                {mode === 'ai' && (
                  <div className="lb-create__group">
                    <label className="lb-create__label">{t.create.sideLabel}</label>
                    <div className="lb-create__chips">
                      <button
                        onClick={() => setMySide('pro')}
                        className={classNames('lb-cchip', mySide === 'pro' && 'active')}
                      >
                        {t.create.sidePro}
                      </button>
                      <button
                        onClick={() => setMySide('con')}
                        className={classNames('lb-cchip', mySide === 'con' && 'active')}
                      >
                        {t.create.sideCon}
                      </button>
                    </div>
                  </div>
                )}

                <div className="lb-create__group">
                  <label className="lb-create__label">{t.create.roundsLabel}</label>
                  <div className="lb-create__chips">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPlannedRounds(n)}
                        className={classNames('lb-cchip', plannedRounds === n && 'active')}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lb-create__group">
                  <label className="lb-create__label">{lang === 'en' ? 'Visibility' : '공개 설정'}</label>
                  <div className="lb-create__chips">
                    <button
                      onClick={() => setIsPrivate(false)}
                      className={classNames('lb-cchip', !isPrivate && 'active')}
                    >
                      🌐 {lang === 'en' ? 'Public' : '공개방'}
                    </button>
                    <button
                      onClick={() => setIsPrivate(true)}
                      className={classNames('lb-cchip', isPrivate && 'active')}
                    >
                      🔒 {lang === 'en' ? 'Private' : '비공개방'}
                    </button>
                  </div>
                  {isPrivate && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--color-ink-fade)' }}
                    >
                      {lang === 'en' ? 'Not listed publicly. Share the invite link after entering.' : '목록에 노출 안 됩니다. 입장 후 초대 링크를 공유하세요.'}
                    </p>
                  )}
                </div>

                <button
                  onClick={create}
                  disabled={creating || !topic.trim()}
                  className="lb-create__open-btn"
                >
                  {creating ? t.create.submitting : (lang === 'en' ? 'Open the stage ▶' : '무대 열기 ▶')}
                </button>

                <div
                  className="pt-3 mt-3"
                  style={{ borderTop: '1.5px dashed var(--color-ink-fade)' }}
                >
                  <label className="lb-create__label">🔗 {lang === 'en' ? 'Join private room by code' : '비공개방 초대 코드로 입장'}</label>
                  <div className="flex gap-2">
                    <input
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      placeholder={lang === 'en' ? 'Paste room ID' : '방 ID 붙여넣기'}
                      className="lb-create__textarea"
                      style={{ fontSize: 13, padding: '6px 10px' }}
                    />
                    <button
                      onClick={() => {
                        const id = joinId.trim();
                        if (!id) return;
                        setJoinId('');
                        onEnter(id);
                      }}
                      disabled={!joinId.trim()}
                      className="lb-cchip"
                      style={{ flex: 'none', padding: '6px 14px' }}
                    >
                      {lang === 'en' ? 'Enter' : '입장'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="lb-create__login-hint">
                <span>{lang === 'en' ? 'Google sign-in required to create a room.' : '방을 만들려면 Google 로그인이 필요합니다.'}</span>
                <button onClick={onSignIn} className="lb-create__open-btn" style={{ width: 'auto', padding: '8px 18px' }}>
                  {lang === 'en' ? 'Sign in with Google' : 'Google 로그인'}
                </button>
              </div>
            )}
          </div>
        </section>
      )}


      {db && (
        <section className="lb3-lounge">
          <header className="lb3-lounge__head">
            <div className="lb3-lounge__eyebrow">{lang === 'en' ? 'LOUNGE' : 'LOUNGE · 로비'}</div>
            <h2 className="lb3-lounge__title">{lang === 'en' ? 'A quick word' : '잠깐, 한 마디'}</h2>
            <p className="lb3-lounge__sub">
              {lang === 'en'
                ? 'A light chat before opening a room or while spectating. Debate speech stays inside the room.'
                : '방 만들기 전·관전 사이에 가볍게. 발언은 토론방 안에서.'}
            </p>
          </header>
          <div className="lb3-lounge__panel">
            <ChatPanel
              title={lang === 'en' ? '💬 Lobby chat' : '💬 로비 전체 채팅'}
              lang={lang}
              collectionRef={collection(db, 'lobby_messages')}
              user={user}
              myName={displayNameOf(profile, user)}
              myAvatarId={profile?.avatarId}
              myAvatarDataUrl={profile?.avatarDataUrl ?? null}
              canPost={!!user}
              emptyHint={lang === 'en' ? 'Say hi in the lobby!' : '로비에 인사를 남겨보세요!'}
              height={240}
            />
          </div>
        </section>
      )}

      {/* v2: guided onboarding wizard modal — sets state, then triggers create.
          Wraps the standalone OnboardingView component as a focus-trapped modal. */}
      {showWizard && user && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="가이드 마법사"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWizard(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.55)',
            overflowY: 'auto',
            padding: '24px 12px',
          }}
        >
          <div style={{ position: 'sticky', top: 12, zIndex: 1, display: 'flex', justifyContent: 'flex-end', maxWidth: 880, margin: '0 auto' }}>
            <button
              type="button"
              onClick={() => setShowWizard(false)}
              aria-label="마법사 닫기"
              className="btn"
              style={{
                background: 'var(--color-paper-light)',
                padding: '8px 14px',
                boxShadow: '2px 2px 0 var(--color-ink)',
              }}
            >
              ✕ 닫기
            </button>
          </div>
          <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', padding: 48 }}>{lang === 'en' ? 'Loading wizard…' : '마법사 불러오는 중…'}</div>}>
            <OnboardingViewLazy
              lang={lang}
              onCancel={() => setShowWizard(false)}
              onStart={(result) => {
                setTopic(result.topic);
                setMySide(result.side);
                setPlannedRounds(result.rounds);
                setShowWizard(false);
                window.setTimeout(() => {
                  void create();
                }, 0);
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}



function RoomView({
  roomId,
  user,
  profile,
  onBack,
  lang,
}: {
  roomId: string;
  user: User | null;
  profile: UserProfile | null;
  onBack: () => void;
  lang: Lang;
}) {
  const tRoom = roomStrings[lang];
  const tCommon = commonStrings[lang];
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [votes, setVotes] = useState<Record<string, Side>>({});
  const [text, setText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [autoTidy, setAutoTidy] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem(TIDY_KEY);
    return v === null ? true : v === '1';
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openingTriggered = useRef(false);
  const argueTriggeredFor = useRef<string | null>(null);
  const advancingFor = useRef<string | null>(null);
  const extendingFor = useRef<number | null>(null);
  const prevPhaseRef = useRef<Phase | undefined>(undefined);
  // v2: per-room display prefs (AIModCard + VoteBar variants), persisted
  const { aiModVariant, voteBarVariant, cycleAiMod, cycleVoteBar } = useRoomPrefs();
  const [objection, setObjection] = useState<{
    side: Side;
    key: number;
    kind: OverlayKind;
    label?: string;
  } | null>(null);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) setRoom({ id: snap.id, ...(snap.data() as Omit<Room, 'id'>) });
    });
  }, [roomId]);

  useEffect(() => {
    if (!db) return;
    // Order by server timestamp (_ts) for consistent ordering across clients
    // (client clocks may differ, causing newer messages to appear at top when ordered by createdAt)
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('_ts', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })));
    });
  }, [roomId]);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, 'rooms', roomId, 'votes'), (snap) => {
      const m: Record<string, Side> = {};
      snap.forEach((d) => {
        m[d.id] = (d.data() as { side: Side }).side;
      });
      setVotes(m);
    });
  }, [roomId]);

  useEffect(() => {
    if (!bottomRef.current) return;
    // Defer one frame so DOM heights are settled before scrolling
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  const mySide: Side | 'spectator' | null = useMemo(() => {
    if (!user || !room) return null;
    if (room.proUid === user.uid) return 'pro';
    if (room.conUid === user.uid) return 'con';
    return 'spectator';
  }, [user, room]);

  const isCreator = !!user && !!room && room.createdBy === user.uid;
  const proCount = Object.values(votes).filter((s) => s === 'pro').length;
  const conCount = Object.values(votes).filter((s) => s === 'con').length;

  const aiSide: Side | null = useMemo(() => {
    if (!room) return null;
    if (room.proUid === AI_OPPONENT_UID) return 'pro';
    if (room.conUid === AI_OPPONENT_UID) return 'con';
    return null;
  }, [room]);

  const postModerator = async (message: string) => {
    if (!db || !user) return;
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      uid: user.uid,
      name: AI_NAME,
      side: 'moderator',
      text: message,
      createdAt: Date.now(),
      _ts: serverTimestamp(),
    });
  };

  // Auto-trigger AI debater argument when it's AI's turn
  useEffect(() => {
    if (!room || !user || !isCreator || !aiSide) return;
    if (room.status !== 'live' || !room.phase) return;
    if (room.phase === 'opening') return;
    const currentSpeaker = PHASE_SPEAKER[room.phase];
    if (currentSpeaker !== aiSide) return;
    const phaseKey = `${room.id}:${room.phase}`;
    if (argueTriggeredFor.current === phaseKey) return;
    argueTriggeredFor.current = phaseKey;
    (async () => {
      setAiBusy(true);
      try {
        const opponentName =
          aiSide === 'pro' ? room.conName ?? '상대' : room.proName ?? '상대';
        const priorMessages = messages
          .filter((m) => m.side === 'pro' || m.side === 'con')
          .map((m) => ({ name: m.name, side: m.side, text: m.text }));
        const r = await aiFetch('/api/ai/argue', {
          topic: room.topic,
          side: aiSide,
          phase: room.phase,
          priorMessages,
          opponentName,
        });
        if (!r.ok) throw new Error('argue failed');
        const { text: aiText } = await r.json();
        if (!db || !user) return;
        await addDoc(collection(db, 'rooms', roomId, 'messages'), {
          uid: user.uid,
          name: AI_OPPONENT_NAME,
          side: aiSide,
          text: aiText,
          createdAt: Date.now(),
          _ts: serverTimestamp(),
        });
        setAiBusy(false);
        void advancePhase();
        return;
      } catch (e) {
        console.error(e);
        argueTriggeredFor.current = null;
      } finally {
        setAiBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.phase, room?.status, aiSide, isCreator, messages.length]);

  // Auto-trigger AI opening when both seats filled
  useEffect(() => {
    if (!room || !user || !isCreator) return;
    if (room.status !== 'live') return;
    if (room.openingPosted) return;
    if (openingTriggered.current) return;
    if (!room.proName || !room.conName) return;
    openingTriggered.current = true;
    (async () => {
      setAiBusy(true);
      try {
        const r = await aiFetch('/api/ai/opening', {
          topic: room.topic,
          proName: room.proName,
          conName: room.conName,
        });
        if (!r.ok) throw new Error('opening failed');
        const { text } = await r.json();
        await postModerator(text);
        if (db) await updateDoc(doc(db, 'rooms', roomId), { phase: 'pro_arg', openingPosted: true });
      } catch (e) {
        console.error(e);
        openingTriggered.current = false;
      } finally {
        setAiBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.openingPosted, room?.proName, room?.conName, isCreator]);

  const takeSide = async (side: Side) => {
    if (!db || !user || !room) return;
    const myName = displayNameOf(profile, user);
    const myAvatarId = (profile?.avatarId ?? 'char1') as string;
    const myAvatarDataUrl = profile?.avatarDataUrl ?? null;
    const field =
      side === 'pro'
        ? {
            proUid: user.uid,
            proName: myName,
            proAvatarId: myAvatarId,
            proAvatarDataUrl: myAvatarDataUrl,
          }
        : {
            conUid: user.uid,
            conName: myName,
            conAvatarId: myAvatarId,
            conAvatarDataUrl: myAvatarDataUrl,
          };
    const willBeBothFilled = side === 'pro' ? Boolean(room.conUid) : Boolean(room.proUid);
    await updateDoc(doc(db, 'rooms', roomId), {
      ...field,
      ...(willBeBothFilled ? { status: 'live' } : {}),
    });
  };

  const send = async () => {
    if (!db || !user || !room || !text.trim() || !mySide) return;
    if (room.status !== 'live') return;
    if (mySide === 'spectator') return;
    const speaker = room.phase ? PHASE_SPEAKER[room.phase] : null;
    if (speaker !== mySide) return;
    const raw = text.trim();
    let finalText = raw;
    if (autoTidy) {
      setPolishing(true);
      try {
        finalText = await polishText(raw);
      } finally {
        setPolishing(false);
      }
    }
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      uid: user.uid,
      name: displayNameOf(profile, user),
      side: mySide,
      text: finalText,
      createdAt: Date.now(),
      _ts: serverTimestamp(),
    });
    setText('');
    void advancePhase();
  };

  const vote = async (side: Side) => {
    if (!db || !user || !room || mySide !== 'spectator' || room.status !== 'live') return;
    await setDoc(doc(db, 'rooms', roomId, 'votes', user.uid), { side, uid: user.uid });
  };

  const requestExtend = async () => {
    if (!db || !user || !room) return;
    if (room.status !== 'ended') return;
    if (mySide !== 'pro' && mySide !== 'con') return;
    const field = mySide === 'pro' ? 'extendRequestPro' : 'extendRequestCon';
    const current = mySide === 'pro' ? !!room.extendRequestPro : !!room.extendRequestCon;
    await updateDoc(doc(db, 'rooms', roomId), { [field]: !current });
  };

  // Show banner overlay on every phase transition
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = room?.phase;
    prevPhaseRef.current = curr;
    if (!curr) return;
    if (prev === undefined) return; // initial mount, don't trigger
    if (prev === curr) return;

    const now = Date.now();
    if (curr === 'pro_arg') {
      setObjection({ side: 'pro', key: now, kind: 'argument', label: '찬성 입론!' });
    } else if (curr === 'con_arg') {
      setObjection({ side: 'con', key: now, kind: 'argument', label: '반대 입론!' });
    } else if (curr === 'pro_rebut') {
      setObjection({ side: 'pro', key: now, kind: 'objection' });
    } else if (curr === 'con_rebut') {
      setObjection({ side: 'con', key: now, kind: 'objection' });
    }
  }, [room?.phase]);

  // Show 판결 banner when status flips to 'ended'
  const prevStatusRef = useRef<Room['status'] | undefined>(undefined);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = room?.status;
    prevStatusRef.current = curr;
    if (prev !== undefined && prev !== 'ended' && curr === 'ended') {
      setObjection({
        side: room?.winner === 'con' ? 'con' : 'pro',
        key: Date.now(),
        kind: 'verdict',
        label: '판결!',
      });
    }
  }, [room?.status, room?.winner]);

  // Record stats once when debate ends (only first 'ended' per roomId)
  useEffect(() => {
    if (!db || !user || !room) return;
    if (room.status !== 'ended') return;
    if (room.statsRecorded) return; // 서버(closeDebate)가 이미 양측 전적 기록 — 클라 중복 집계 금지
    if (mySide !== 'pro' && mySide !== 'con') return;
    if (typeof window === 'undefined') return;
    const recorded: string[] = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(STATS_KEY) ?? '[]');
      } catch {
        return [];
      }
    })();
    if (recorded.includes(roomId)) return;
    const winner = room.winner;
    const opponentIsAi =
      room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
    const suffix = opponentIsAi ? 'VsAi' : 'VsHuman';
    const updates: Record<string, ReturnType<typeof increment>> = {
      totalDebates: increment(1),
    };
    if (winner === 'tie' || !winner) {
      updates[`ties${suffix}`] = increment(1);
    } else if (winner === mySide) {
      updates[`wins${suffix}`] = increment(1);
    } else {
      updates[`losses${suffix}`] = increment(1);
    }
    updateDoc(doc(db, 'users', user.uid), updates)
      .then(() => {
        recorded.push(roomId);
        window.localStorage.setItem(STATS_KEY, JSON.stringify(recorded.slice(-200)));
      })
      .catch((e) => console.error('[stats] failed', e));
  }, [room?.status, room?.winner, mySide, user, roomId]);

  // AI opponent auto-accepts extension requests
  useEffect(() => {
    if (!db || !room || !isCreator || !aiSide) return;
    if (room.status !== 'ended') return;
    const humanRequested = aiSide === 'pro' ? room.extendRequestCon : room.extendRequestPro;
    const aiAlreadyAgreed = aiSide === 'pro' ? room.extendRequestPro : room.extendRequestCon;
    if (humanRequested && !aiAlreadyAgreed) {
      const aiField = aiSide === 'pro' ? 'extendRequestPro' : 'extendRequestCon';
      updateDoc(doc(db, 'rooms', roomId), { [aiField]: true }).catch(console.error);
    }
  }, [room?.status, room?.extendRequestPro, room?.extendRequestCon, aiSide, isCreator, roomId]);

  // Auto-trigger extension when both sides agree (creator only)
  useEffect(() => {
    if (!db || !user || !room || !isCreator) return;
    if (room.status !== 'ended') return;
    if (!room.extendRequestPro || !room.extendRequestCon) return;
    const nextRound = (room.extendRound ?? 0) + 1;
    if (extendingFor.current === nextRound) return;
    extendingFor.current = nextRound;
    (async () => {
      setAiBusy(true);
      try {
        const text =
          `양측 모두 추가 토론에 동의하셨습니다. 이제 ${nextRound}차 추가 라운드를 시작합니다. ` +
          `이전 발언에서 다 다루지 못한 핵심 논점이나 강력한 반박을 기대하겠습니다. ` +
          `${room.proName ?? '찬성 측'}님부터 발언해주세요.`;
        await addDoc(collection(db, 'rooms', roomId, 'messages'), {
          uid: user.uid,
          name: AI_NAME,
          side: 'moderator',
          text,
          createdAt: Date.now(),
          _ts: serverTimestamp(),
        });
        if (db) {
          await updateDoc(doc(db, 'rooms', roomId), {
            status: 'live',
            phase: 'pro_rebut',
            extendRequestPro: false,
            extendRequestCon: false,
            extendRound: nextRound,
          });
        }
        // unlock other refs so they retrigger for new phase
        argueTriggeredFor.current = null;
        advancingFor.current = null;
      } catch (e) {
        console.error(e);
        extendingFor.current = null;
      } finally {
        setAiBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.extendRequestPro, room?.extendRequestCon, isCreator]);

  const advancePhase = async () => {
    if (!db || !user || !room) return;
    if (room.status !== 'live' || !room.phase) return;
    const lockKey = `${room.id}:${room.phase}`;
    if (advancingFor.current === lockKey) return;
    advancingFor.current = lockKey;
    const next = NEXT_PHASE[room.phase];
    setAiBusy(true);
    try {
      const phaseSpeaker = PHASE_SPEAKER[room.phase];
      const recentMessages = messages
        .filter((m) => m.side === phaseSpeaker)
        .slice(-10)
        .map((m) => ({ name: m.name, side: m.side, text: m.text }));

      if (next === 'closing') {
        // Auto-extend if plannedRounds not reached yet
        const planned = Math.max(1, room.plannedRounds ?? 1);
        const currentRound = (room.extendRound ?? 0) + 1;
        if (currentRound < planned) {
          const nextRoundNum = currentRound + 1;
          await postModerator(
            `${currentRound}라운드를 마칩니다. 곧이어 ${nextRoundNum}라운드 — ${room.proName ?? '찬성 측'}님, 찬성 입론부터 부탁드립니다.`,
          );
          await updateDoc(doc(db, 'rooms', roomId), {
            phase: 'pro_arg',
            extendRound: (room.extendRound ?? 0) + 1,
            extendRequestPro: false,
            extendRequestCon: false,
          });
          return;
        }
        // STEP2: 서버 권위 종료 우선 (#4 #5 #9 #12). 미구성/실패 시 아래 클라 폴백.
        try {
          if (closeDebateFn) {
            await closeDebateFn({ roomId });
            return; // 서버가 마무리 메시지·승부·전적까지 모두 처리
          }
        } catch (serverErr) {
          console.warn('[closeDebate] 서버 종료 실패 — 클라이언트 폴백으로 진행', serverErr);
        }
        // ---- 폴백: 기존 클라이언트 종료 로직 ----
        const all = messages
          .filter((m) => m.side === 'pro' || m.side === 'con')
          .map((m) => ({ name: m.name, side: m.side, text: m.text }));
        const r = await aiFetch('/api/ai/closing', {
          topic: room.topic,
          allMessages: all,
          proName: room.proName,
          conName: room.conName,
          audienceCount: proCount + conCount, // #33/#34
        });
        if (!r.ok) throw new Error(`closing HTTP ${r.status}`);
        const closingPayload = (await r.json()) as {
          text?: string;
          aiPick?: 'pro' | 'con' | 'tie';
        };
        const aiText = (closingPayload.text ?? '').trim();
        const aiPick = closingPayload.aiPick ?? 'tie';
        if (aiText) await postModerator(aiText);

        // 관전자 50% + AI 50% 합산 (서버 closeDebate 와 동일 로직 — lib/verdict)
        const { winner, finalProScore } = computeOutcome(proCount, conCount, aiPick);
        await updateDoc(doc(db, 'rooms', roomId), {
          status: 'ended',
          winner,
          aiPick,
          finalProScore,
        });
      } else {
        const nextSpeakerSide = PHASE_SPEAKER[next];
        const nextSpeakerName =
          (nextSpeakerSide === 'pro' ? room.proName : nextSpeakerSide === 'con' ? room.conName : '') ?? '';
        const r = await aiFetch('/api/ai/transition', {
          topic: room.topic,
          currentPhase: room.phase,
          nextPhase: next,
          recentMessages,
          nextSpeakerName,
          nextSpeakerSide,
        });
        if (!r.ok) throw new Error(`transition HTTP ${r.status}`);
        const { text: aiText } = (await r.json()) as { text?: string };
        if (aiText && aiText.trim()) await postModerator(aiText.trim());
        await updateDoc(doc(db, 'rooms', roomId), { phase: next });
      }
    } catch (e) {
      console.error('[advancePhase failed]', e);
      // Release lock so the user (or a retry) can try again on the same phase
      advancingFor.current = null;
      showToast('AI 사회자 호출 실패. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      setAiBusy(false);
    }
  };

  if (!room) return <CenterMsg>방을 불러오는 중…</CenterMsg>;

  const total = proCount + conCount;
  const proPct = total ? Math.round((proCount / total) * 100) : 50;
  const conPct = 100 - proPct;
  const currentSpeakerSide = room.phase ? PHASE_SPEAKER[room.phase] : null;
  const isMyTurn =
    room.status === 'live' && currentSpeakerSide && mySide === currentSpeakerSide;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="btn btn-ghost text-sm"
          style={{ padding: '4px 10px' }}
        >
          {tCommon.actions.back}
        </button>
        {room?.isPrivate && <InviteLinkButton roomId={roomId} lang={lang} />}
      </div>

      {/* === v2 DebateHUD (per screen-room.jsx) ===
          Dark editorial bar: 3-col grid (phase badge | topic | vote summary +
          finish CTA), with a vermillion progress hairline at the bottom.
          Shown only while live so open/ended states stay clean. */}
      {room.status === 'live' && (() => {
        const phaseOrder: Array<typeof room.phase> = ['opening', 'pro_arg', 'con_arg', 'pro_rebut', 'con_rebut'];
        const phaseIdx = room.phase ? Math.max(0, phaseOrder.indexOf(room.phase)) : 0;
        const phaseTotal = phaseOrder.length;
        const phaseSide = room.phase ? PHASE_SPEAKER[room.phase] : null;
        const phaseColor =
          phaseSide === 'pro' ? 'var(--color-vermillion)'
          : phaseSide === 'con' ? '#a8d4e8'
          : 'var(--color-gold)';
        return (
          <div
            className="room-hud-v2"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-paper-light)',
              padding: '16px 22px',
              border: '1.5px solid var(--color-ink)',
              boxShadow: '3px 3px 0 var(--color-vermillion)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 24,
              }}
            >
              {/* Left: status + phase badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span className="status status--live"><span className="status-dot" />{tRoom.hud.round} R{(room.extendRound ?? 0) + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="label-mono" style={{ color: 'var(--color-paper-darker)' }}>
                    {tCommon.common.pending && (phaseIdx + 1)} / {phaseTotal}
                  </div>
                  <div
                    className="serif-display"
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: phaseColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {room.phase ? tRoom.phases[room.phase] : tCommon.common.pending}
                  </div>
                </div>
              </div>

              {/* Center: topic */}
              <div style={{ textAlign: 'center', maxWidth: 520 }}>
                <div className="label-mono" style={{ color: 'var(--color-paper-darker)', marginBottom: 4 }}>
                  {lang === 'en' ? "TODAY'S RESOLUTION" : '오늘의 논제'}
                </div>
                <div
                  className="serif-display kr-wrap"
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    color: 'var(--color-paper-light)',
                  }}
                >
                  「{room.topic}」
                </div>
              </div>

              {/* Right: vote summary + variant toggles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', minWidth: 0 }}>
                <div style={{ minWidth: 160, flex: '0 1 200px' }}>
                  <div className="label-mono" style={{ color: 'var(--color-paper-darker)', textAlign: 'right', marginBottom: 4 }}>
                    👁 {tRoom.hud.audience(proCount + conCount)}
                  </div>
                  <div className="hidden sm:block">
                    <VoteBar
                      pro={proCount}
                      con={conCount}
                      variant={voteBarVariant}
                      size="sm"
                      showLabels={false}
                    />
                  </div>
                </div>
                {/* Dev toggles: vote bar + AI mod card variant cycle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    onClick={cycleVoteBar}
                    aria-label={`vote bar variant: ${voteBarVariant} — 다음으로 전환`}
                    title={`투표 바 스타일 (${voteBarVariant}) — 클릭해서 전환`}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-paper-darker)',
                      border: '1.5px solid var(--color-paper-darker)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      padding: '2px 6px',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                    }}
                  >
                    {voteBarVariant}
                  </button>
                  <button
                    type="button"
                    onClick={cycleAiMod}
                    aria-label={`AI moderator card variant: ${aiModVariant} — 다음으로 전환`}
                    title={`AI 사회자 카드 (${aiModVariant}) — 클릭해서 전환`}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-paper-darker)',
                      border: '1.5px solid var(--color-paper-darker)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      padding: '2px 6px',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                    }}
                  >
                    🤖 {aiModVariant}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress hairline (vermillion) */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: 'var(--color-ink-soft)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((phaseIdx + 1) / phaseTotal) * 100}%`,
                  background: 'var(--color-vermillion)',
                  transition: 'width 0.5s',
                }}
              />
            </div>
          </div>
        );
      })()}

      <div
        className="sketchy paper-grain p-3 sm:p-5"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1
            className="text-xl font-bold m-0"
            style={{
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '-0.01em',
            }}
          >
            {room.topic}
          </h1>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={room.status} phase={room.phase} extendRound={room.extendRound} />
            {room.status === 'live' && room.phase && (
              <span className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
                R{(room.extendRound ?? 0) + 1} · {PHASE_LABEL[room.phase]}
              </span>
            )}
          </div>
        </div>

        {room.status === 'live' && (room.plannedRounds ?? 1) > 1 && (
          <RoundTimeline
            current={room.extendRound ?? 0}
            planned={room.plannedRounds ?? 1}
            lang={lang}
          />
        )}
        {room.status === 'live' && room.phase && (
          <PhaseProgress phase={room.phase} />
        )}

        <div className="grid grid-cols-[1fr_60px_1fr] sm:grid-cols-[1fr_80px_1fr] gap-2 sm:gap-3 items-stretch">
          <SideCard
            variant="pro"
            name={room.proName}
            mine={mySide === 'pro'}
            speaking={currentSpeakerSide === 'pro' && room.status === 'live'}
            empty={!room.proUid}
            canTake={!!user && !room.proUid && room.status === 'open' && mySide !== 'con'}
            onTake={() => takeSide('pro')}
            avatarId={room.proAvatarId}
            avatarDataUrl={room.proAvatarDataUrl}
            isAi={room.proUid === AI_OPPONENT_UID}
          />
          <div className="flex items-center justify-center">
            <span className="hidden sm:inline">
              <VSMark size={70} />
            </span>
            <span className="sm:hidden">
              <VSMark size={48} />
            </span>
          </div>
          <SideCard
            variant="con"
            name={room.conName}
            mine={mySide === 'con'}
            speaking={currentSpeakerSide === 'con' && room.status === 'live'}
            empty={!room.conUid}
            canTake={!!user && !room.conUid && room.status === 'open' && mySide !== 'pro'}
            onTake={() => takeSide('con')}
            avatarId={room.conAvatarId}
            avatarDataUrl={room.conAvatarDataUrl}
            isAi={room.conUid === AI_OPPONENT_UID}
          />
        </div>

        {room.status !== 'open' && room.status !== 'ended' && (
          <div className="mt-4">
            {/* #31: 토론 중에는 진영별 득표를 가려 편승(밴드왜건) 투표 방지 — 참여 수만 노출,
                결과는 종료 후 일괄 공개. */}
            <div
              className="flex items-center justify-center gap-2 text-xs py-2 px-3"
              style={{
                border: '1.5px dashed var(--color-ink-fade)',
                color: 'var(--color-ink-soft)',
                background: 'var(--color-paper)',
              }}
            >
              <span aria-hidden="true">🗳️</span>
              <span>
                {lang === 'en' ? (
                  <><b>{total}</b> voted so far · results shown <b>after the debate</b></>
                ) : (
                  <>지금까지 <b>{total}</b>명 투표 · 결과는 <b>토론 종료 후</b> 공개됩니다</>
                )}
              </span>
            </div>
            {/* #32: 승부 가중치(관전자 50% + AI 50%) 고지 */}
            <p
              className="text-[11px] text-center mt-1.5"
              style={{ color: 'var(--color-ink-fade)' }}
            >
              {lang === 'en'
                ? 'Final verdict = 50% audience vote + 50% AI judge'
                : '최종 판정 = 관전자 투표 50% + AI 심판 50%'}
            </p>
          </div>
        )}

        {room.status === 'open' && (
          <div
            className="mt-4 p-3 text-sm text-center sketchy-sm"
            style={{
              background: 'var(--color-paper)',
              border: '1.5px dashed var(--color-ink-fade)',
              color: 'var(--color-ink-soft)',
            }}
          >
            {lang === 'en'
              ? 'Once both debaters arrive, the AI moderator opens the debate.'
              : '두 토론자가 모이면 AI 사회자가 토론을 엽니다.'}
          </div>
        )}

        {room.status === 'live' && mySide === 'spectator' && user && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => vote('pro')}
              className="btn flex-1"
              style={{
                background:
                  votes[user.uid] === 'pro'
                    ? 'var(--color-vermillion)'
                    : 'var(--color-paper-light)',
                color:
                  votes[user.uid] === 'pro'
                    ? 'var(--color-paper-light)'
                    : 'var(--color-vermillion)',
              }}
            >
              찬성에 투표
            </button>
            <button
              onClick={() => vote('con')}
              className="btn flex-1"
              style={{
                background:
                  votes[user.uid] === 'con'
                    ? 'var(--color-celadon)'
                    : 'var(--color-paper-light)',
                color:
                  votes[user.uid] === 'con'
                    ? 'var(--color-paper-light)'
                    : 'var(--color-celadon)',
              }}
            >
              반대에 투표
            </button>
          </div>
        )}

        {room.status === 'live' && room.phase && aiBusy && (
          <div
            className="mt-3 w-full py-2 text-center text-sm font-bold"
            style={{
              background: 'rgba(200, 75, 31, 0.1)',
              border: '1.5px solid var(--color-vermillion)',
              color: 'var(--color-vermillion)',
            }}
          >
            🤖 AI 사회자 작성 중…
          </div>
        )}

        {room.status === 'ended' && (
          <VerdictBlock
            room={room}
            proCount={proCount}
            conCount={conCount}
            proPct={proPct}
            conPct={conPct}
            mySide={mySide}
            aiBusy={aiBusy}
            onRequestExtend={requestExtend}
            lang={lang}
          />
        )}
      </div>

      <div
        className="relative"
        style={{ overflow: 'hidden' }}
      >
        <ObjectionOverlay
          key={objection?.key ?? 0}
          show={!!objection}
          side={objection?.side}
          kind={objection?.kind}
          label={objection?.label}
          onDone={() => setObjection(null)}
        />
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="토론 발언"
          className="sketchy paper-grain p-4 h-[480px] overflow-y-auto space-y-3"
          style={{ background: 'var(--color-paper-light)' }}
        >
        {messages.length === 0 ? (
          <p
            className="text-sm text-center py-10"
            style={{ color: 'var(--color-ink-fade)' }}
          >
            {room.status === 'open'
              ? (lang === 'en' ? 'Once both debaters arrive, the AI moderator starts the debate.' : '두 토론자가 모이면 AI 사회자가 토론을 시작합니다.')
              : aiBusy
                ? (lang === 'en' ? '🤖 The AI moderator is preparing…' : '🤖 AI 사회자가 발언을 준비하고 있습니다…')
                : (lang === 'en' ? 'Just a moment…' : '잠시만 기다려주세요.')}
          </p>
        ) : (
          messages.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              mine={m.uid === user?.uid && m.side !== 'moderator'}
              phase={room.phase}
              aiModVariant={aiModVariant}
            />
          ))
        )}
        {aiBusy && messages.length > 0 && (
          <div className="ai-progress" aria-live="polite">
            <div className="ai-progress__row">
              <span className="ai-progress__icon" aria-hidden="true">🤖</span>
              <span className="ai-progress__text">
                {lang === 'en' ? 'AI moderator is writing…' : 'AI 사회자 작성 중…'}
                <span className="ai-progress__sub">{lang === 'en' ? 'usually 5–15s' : '보통 5~15초 걸립니다'}</span>
              </span>
            </div>
            <div className="ai-progress__bar" aria-hidden="true">
              <div className="ai-progress__fill" />
            </div>
          </div>
        )}
        <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {room.status === 'live' && isMyTurn && room.phase && (
        <div className="space-y-2">
          <PhaseGuide phase={room.phase} side={mySide as Side} />
          <div className="flex gap-2 items-stretch">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${PHASE_LABEL[room.phase]} 발언…`}
              rows={4}
              className="input-paper resize-y min-h-[96px]"
            />
            <button
              onClick={send}
              disabled={!text.trim() || polishing}
              className="btn btn-pri self-stretch px-5"
            >
              {polishing ? '정리 중…' : '전송'}
            </button>
          </div>
          <label
            className="flex items-center gap-2 text-xs select-none cursor-pointer"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            <input
              type="checkbox"
              checked={autoTidy}
              onChange={(e) => {
                const next = e.target.checked;
                setAutoTidy(next);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem(TIDY_KEY, next ? '1' : '0');
                }
              }}
              style={{ accentColor: 'var(--color-vermillion)' }}
            />
            <span className="font-bold">자동 문단 정리</span>
            <span style={{ color: 'var(--color-ink-fade)' }}>
              — 전송 시 AI가 띄어쓰기·오타·문장 분리·문단을 다듬음 (논거는 그대로)
            </span>
          </label>
        </div>
      )}

      {room.status === 'live' && (mySide === 'pro' || mySide === 'con') && !isMyTurn && (
        <p className="text-center text-xs" style={{ color: 'var(--color-ink-fade)' }}>
          {lang === 'en' ? (
            <>
              It&apos;s{' '}
              {currentSpeakerSide === 'pro' ? 'Pro' : currentSpeakerSide === 'con' ? 'Con' : 'the moderator'}
              {' '}turn now. Please wait.
            </>
          ) : (
            <>
              현재는{' '}
              {currentSpeakerSide === 'pro' ? '찬성' : currentSpeakerSide === 'con' ? '반대' : '사회자'}{' '}
              차례입니다. 기다려주세요.
            </>
          )}
        </p>
      )}

      {room.status === 'live' && mySide === 'spectator' && (
        <p className="text-center text-xs" style={{ color: 'var(--color-ink-fade)' }}>
          {lang === 'en'
            ? "Spectators can't speak in the debate, but can vote and cheer in the spectator chat below."
            : '관전자는 토론 발언은 못 하지만, 투표 + 아래 관전자 채팅으로 응원할 수 있습니다.'}
        </p>
      )}

      {db && (
        <ChatPanel
          title={lang === 'en' ? '💬 Spectator chat' : '💬 관전자 채팅'}
          lang={lang}
          collectionRef={collection(db, 'rooms', roomId, 'spectator_messages')}
          user={user}
          myName={displayNameOf(profile, user)}
          myAvatarId={profile?.avatarId}
          myAvatarDataUrl={profile?.avatarDataUrl ?? null}
          canPost={!!user && mySide === 'spectator'}
          postDisabledHint={lang === 'en' ? "Debaters can't join the spectator chat (focus on the debate)." : '토론자는 관전자 채팅에 참여할 수 없습니다 (토론에 집중하세요).'}
          emptyHint={lang === 'en' ? 'Cheer on the debate with other spectators!' : '관전자끼리 토론을 응원해보세요!'}
          height={200}
        />
      )}
    </div>
  );
}










declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
