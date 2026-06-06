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
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, firebaseConfigured, googleProvider } from './firebase';
import {
  DEFAULT_AVATARS,
  type AvatarId,
  Ornament,
  ProfileAvatar,
  RoundTimeline,
  VSMark,
  VoteBar,
} from './components/common';
// v2 lazy screens — full-bleed Verdict overlay, profile leaderboard etc.
const OnboardingViewLazy = lazy(() =>
  import('./components/OnboardingView').then((m) => ({ default: m.OnboardingView })),
);
// LobbyMastheadLazy and LobbyRoomRowLazy removed — replaced by inline lb2 design
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
import { profileStrings } from './i18n/profile';
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

const KNOWN_PATHS = new Set(['/', '/learn', ...Object.keys(STATIC_PATH_MAP)]);

import {
  AI_OPPONENT_NAME,
  AI_OPPONENT_UID,
  EMPTY_PROFILE,
  NEXT_PHASE,
  PHASE_SPEAKER,
  type Message,
  type Phase,
  type Room,
  type Side,
  type UserProfile,
} from './types';
import { AI_NAME, classNames, displayNameOf, resizeImageToDataUrl } from './lib/ui';
import { CenterMsg, LazyFallback } from './components/CenterMsg';
import { StatBox } from './components/profile/StatBox';
import { LobbyEmptyCTA } from './components/lobby/LobbyEmptyCTA';
import { StatusBadge } from './components/room/StatusBadge';
import { InviteLinkButton } from './components/room/InviteLinkButton';
import { MessageRow } from './components/room/MessageRow';
import { PhaseProgress } from './components/room/PhaseProgress';
import { PhaseGuide } from './components/room/PhaseGuide';
import { SideCard } from './components/room/SideCard';
import { ProfileV2Stats } from './components/profile/ProfileV2Stats';
import { LobbyRoomCard } from './components/lobby/LobbyRoomCard';
import { LobbyHeroSplit } from './components/lobby/LobbyHeroSplit';
import { VerdictBlock } from './components/room/VerdictBlock';

async function polishText(raw: string): Promise<string> {
  try {
    const r = await fetch('/api/ai/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: raw }),
    });
    if (!r.ok) throw new Error('polish failed');
    const { text } = await r.json();
    return typeof text === 'string' && text.length > 0 ? text : raw;
  } catch (e) {
    console.error('[polish] fallback to raw', e);
    return raw;
  }
}

const TIDY_KEY = 'debateBattle:autoTidy';
const STATS_KEY = 'debateBattle:statsRecorded';

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
  const [showLearn, setShowLearn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === '/learn';
  });
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
      if (p === '/learn') {
        setStaticPage(null);
        setShowLearn(true);
        setShowProfile(false);
        setShowLanding(false);
      } else if (STATIC_PATH_MAP[p]) {
        setShowLearn(false);
        setStaticPage(STATIC_PATH_MAP[p]);
      } else if (p !== '/' && !KNOWN_PATHS.has(p)) {
        const hasRoom = new URLSearchParams(window.location.search).get('room');
        setShowLearn(false);
        setStaticPage(hasRoom ? null : 'notfound');
      } else {
        setShowLearn(false);
        setStaticPage(null);
      }
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
  if (!authReady) return <CenterMsg>{commonStrings[lang].loading.app}</CenterMsg>;

  return (
    <div className="min-h-full flex flex-col">
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
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/learn');
            window.scrollTo({ top: 0 });
          }
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
        <main className="flex-1 w-full">
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
        <main className="flex-1 w-full">
          <Suspense fallback={<LazyFallback />}>
            <LandingView lang={lang} onStart={() => setShowLanding(false)} />
          </Suspense>
        </main>
      ) : showLearn ? (
        <main className="flex-1 w-full">
          <Suspense fallback={<LazyFallback />}>
            <LearnView
              lang={lang}
              onBack={() => {
                setShowLearn(false);
                if (typeof window !== 'undefined' && window.location.pathname === '/learn') {
                  window.history.pushState({}, '', '/');
                }
              }}
              onOpenContent={(page) => {
                setShowLearn(false);
                openStaticPage(page);
              }}
            />
          </Suspense>
        </main>
      ) : (
      <>
        {(showProfile || activeRoomId) ? (
          <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
            ) : null}
          </main>
        ) : (
          <main className="flex-1 w-full">
            <Lobby
              user={user}
              profile={profile}
              onEnter={setActiveRoomId}
              onSignIn={() => auth && signInWithPopup(auth, googleProvider)}
              lang={lang}
            />
          </main>
        )}
      </>
      )}
      <SiteFooter
        onNav={openStaticPage}
        lang={lang}
        onSection={(id) => {
          closeStaticPage();
          setActiveRoomId(null);
          setShowProfile(false);
          setShowLearn(false);
          setShowLanding(true);
          requestAnimationFrame(() =>
            window.setTimeout(
              () =>
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              80,
            ),
          );
        }}
      />
      <CookieBanner />
      <ToastHost />
      {/* Floating CTA — '토론하기' on landing/learn/content (jumps to
          lobby). Hidden inside the lobby itself (the hero/search-bar already
          carry the '토론방 만들기' buttons), and in room/profile views. */}
      {(() => {
        if (activeRoomId || showProfile) return null;
        const inLobbyView = !showLanding && !showLearn && !staticPage;
        // 로비에서는 히어로/검색바에 '토론방 만들기'가 이미 있으므로 플로팅 버튼 숨김
        if (inLobbyView) return null;
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

function SiteFooter({
  onNav,
  onSection,
  lang,
}: {
  onNav: (page: Exclude<StaticPage, 'notfound'>) => void;
  onSection: (id: string) => void;
  lang: Lang;
}) {
  const t = headerStrings[lang];
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          {/* Col 1 — brand + tagline */}
          <div className="site-footer__brand">
            <button type="button" className="footer-brand" onClick={() => onSection('hero')} aria-label={lang === 'en' ? 'DebateBattle home' : '토론배틀 홈'}>
              <span className="hdr-brand__seal">討</span>
              <span className="hdr-brand__word">{t.header.brand}{t.header.brandSub}</span>
            </button>
            <p className="site-footer__tag">{t.footer.tag}</p>
          </div>

          {/* Cols 2–4 wrapped in display:contents so they sit in the grid */}
          <div className="site-footer__cols">
            {/* Col 2 — 소개 TOC */}
            <div className="site-footer__col">
              <span className="site-footer__col-heading">{t.footer.tocCol.heading}</span>
              <button type="button" onClick={() => onSection('how')}>{t.footer.tocCol.how}</button>
              <button type="button" onClick={() => onSection('why')}>{t.footer.tocCol.why}</button>
              <button type="button" onClick={() => onSection('motions')}>{t.footer.tocCol.motions}</button>
              <button type="button" onClick={() => onSection('join')}>{t.footer.tocCol.join}</button>
            </div>

            {/* Col 3 — 자료실 */}
            <div className="site-footer__col">
              <span className="site-footer__col-heading">{lang === 'en' ? 'Library' : '자료실'}</span>
              <button type="button" onClick={() => onNav('topics')}>{lang === 'en' ? 'Topics' : '토론 주제'}</button>
              <button type="button" onClick={() => onNav('fallacies')}>{lang === 'en' ? 'Fallacies' : '논리 오류'}</button>
              <button type="button" onClick={() => onNav('glossary')}>{lang === 'en' ? 'Glossary' : '용어 사전'}</button>
              <button type="button" onClick={() => onNav('famous')}>{lang === 'en' ? 'Famous debates' : '명토론'}</button>
            </div>

            {/* Col 4 — 정보 */}
            <div className="site-footer__col">
              <span className="site-footer__col-heading">{lang === 'en' ? 'Info' : '정보'}</span>
              <button type="button" onClick={() => onNav('contact')}>{t.footer.contact}</button>
              <button type="button" onClick={() => onNav('privacy')}>{t.footer.privacy}</button>
              <button type="button" onClick={() => onNav('terms')}>{t.footer.terms}</button>
            </div>
          </div>
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

  // 헤더 투명도 — 랜딩 맨 위에선 0%(완전 투명) → 히어로 크림이 그대로 비쳐 경계 없음.
  // 스크롤 한 번(약 100px)에 걸쳐 빠르게 100%(불투명 크림)로 차오른다.
  const [headerP, setHeaderP] = useState(0);
  useEffect(() => {
    let rafId = 0;
    const read = () =>
      Math.max(
        window.scrollY || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
      );
    const update = () => {
      const y = read();
      const p = y <= 2 ? 0 : Math.min(1, y / 100); // 약 100px(스크롤 한 번)에 불투명
      setHeaderP((prev) => (prev === p ? prev : p));
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const isLanding = currentView === 'landing';
  const pct = Math.round(headerP * 100); // 0 → 100 (스크롤에 따라)
  const blurPx = (headerP * 8).toFixed(1);

  return (
    <header
      className="sticky top-0 z-10 header-game"
      style={{
        // 랜딩: 투명 → 불투명 크림 스크롤 페이드. 그 외 페이지: 항상 불투명 크림(고정).
        borderBottom: isLanding
          ? `1px solid color-mix(in srgb, var(--color-line, var(--color-ink-fade)) ${pct}%, transparent)`
          : 'none',
        background: isLanding
          ? `color-mix(in srgb, var(--color-paper-light) ${pct}%, transparent)`
          : 'var(--grad-paper)',
        backdropFilter: isLanding ? `blur(${blurPx}px)` : 'none',
        WebkitBackdropFilter: isLanding ? `blur(${blurPx}px)` : 'none',
      }}
    >
      <div className="header-game__inner">
        {/* LEFT: brand seal + secondary tabs (소개 / 자료실) */}
        <div className="header-game__left">
          <button
            type="button"
            onClick={onHome}
            className="hdr-brand"
            aria-label={lang === 'en' ? 'DebateBattle home' : '토론배틀 홈'}
          >
            <span className="hdr-brand__seal">討</span>
            <span className="hdr-brand__word">{tHead.header.brand}{tHead.header.brandSub}</span>
          </button>
          <nav className="header-game__secondary" aria-label={lang === 'en' ? 'Secondary pages' : '보조 페이지'}>
            {/* Hairline that splits the brand group from the nav group so the
                two read as separate clusters (not one block). Lives inside the
                nav so it collapses together with the tabs at ≤540px. Tokenized
                ink-fade keeps contrast across the 4 themes + dark. */}
            <span
              aria-hidden="true"
              style={{
                width: '1px',
                alignSelf: 'center',
                height: '18px',
                flex: '0 0 auto',
                marginRight: '6px',
                background: 'color-mix(in srgb, var(--color-ink-fade) 36%, transparent)',
              }}
            />
            <button
              type="button"
              className={`header-game__tab${currentView === 'landing' ? ' is-active' : ''}`}
              onClick={onLanding}
            >
              {tHead.nav.intro}
            </button>
            <button
              type="button"
              className={`header-game__tab${currentView === 'learn' ? ' is-active' : ''}`}
              onClick={onLearn}
            >
              {tHead.nav.learn}
            </button>
          </nav>
        </div>

        {/* CENTER: primary "토론장" button — dead-center via 1fr auto 1fr grid */}
        <button
          type="button"
          className={`header-game__tab header-game__tab--primary${
            currentView === 'lobby' || currentView === 'room' ? ' is-active' : ''
          }`}
          onClick={onHome}
          aria-label={lang === 'en' ? 'Stadium — main action' : '토론장 — 메인 액션'}
        >
          <span className="header-game__tab-kicker">ENTER</span>
          <span>{tHead.nav.lobby}</span>
        </button>

        {/* RIGHT: auth + prefs */}
        <div className="header-game__actions">
          {/* Mobile-only "소개" link — restores the intro page entry point that
              .header-game__secondary hides at ≤540px (CSS shows this only there) */}
          <button
            type="button"
            className={`header-game__mobile-intro${currentView === 'landing' ? ' is-active' : ''}`}
            onClick={onLanding}
          >
            {tHead.nav.intro}
          </button>
          {user ? (
            <>
              <button
                type="button"
                onClick={onProfile}
                title={tHead.nav.profile}
                className="header-game__user"
              >
                <ProfileAvatar
                  avatarId={profile?.avatarId as AvatarId | undefined}
                  avatarDataUrl={profile?.avatarDataUrl}
                  size={24}
                />
                <span className="header-game__user-name">{displayNameOf(profile, user)}</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="header-game__signout"
                title={tCommon.auth.signOut}
                aria-label={tCommon.auth.signOut}
              >
                <span className="header-game__signout-label">{tCommon.auth.signOut}</span>
                <span className="header-game__signout-icon" aria-hidden="true">⏻</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="header-game__signin"
            >
              <span className="header-game__g" aria-hidden="true">G</span>
              <span>{lang === 'en' ? 'Sign in' : 'Google 로그인'}</span>
            </button>
          )}

          {/* Preference toggles — separated by a thin vertical divider */}
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
  const tCommon = commonStrings[lang];
  const [rooms, setRooms] = useState<Room[]>([]);
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<'human' | 'ai'>('human');
  const [mySide, setMySide] = useState<Side>('pro');
  const [isPrivate, setIsPrivate] = useState(false);
  const [plannedRounds, setPlannedRounds] = useState<number>(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'open' | 'ended' | 'ai' | 'human'>('all');
  const [search, setSearch] = useState('');
  // 방 만들기 섹션은 사용자가 명시적으로 열 때만 노출 (빈 자리 카드 클릭 또는 헤더의 "방 만들기" 앵커)
  const [showCreate, setShowCreate] = useState(false);
  // v2: guided onboarding wizard modal — fills topic/side/rounds and submits
  const [showWizard, setShowWizard] = useState(false);

  // Esc 키로 가이드 마법사 모달 닫기 (접근성 — WCAG 2.1.2)
  useEffect(() => {
    if (!showWizard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowWizard(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showWizard]);

  // ---- live 방 votes 서브컬렉션 실시간 구독 ----
  // useLandingRooms 방식을 그대로 따름: live 방 id 집합이 바뀔 때만 재구독
  const [votesByRoom, setVotesByRoom] = useState<Record<string, { pro: number; con: number }>>({});
  const liveIdsKey = useMemo(
    () => rooms.filter((r) => r.status === 'live').map((r) => r.id).join(','),
    [rooms],
  );
  const liveRoomIds = useMemo(() => liveIdsKey ? liveIdsKey.split(',') : [], [liveIdsKey]);
  useEffect(() => {
    if (!db || liveRoomIds.length === 0) {
      setVotesByRoom({});
      return;
    }
    const unsubs = liveRoomIds.map((roomId) =>
      onSnapshot(
        collection(db!, 'rooms', roomId, 'votes'),
        (snap) => {
          let pro = 0;
          let con = 0;
          snap.forEach((d) => {
            const side = (d.data() as { side?: Side }).side;
            if (side === 'pro') pro += 1;
            else if (side === 'con') con += 1;
          });
          setVotesByRoom((prev) => ({ ...prev, [roomId]: { pro, con } }));
        },
        () => {},
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIdsKey]);

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
    const q = query(collection(firestore, 'rooms'), orderBy('createdAt', 'desc'));
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
      const r = await fetch('/api/ai/topics', { method: 'POST' });
      if (!r.ok) throw new Error();
      const { topics } = await r.json();
      setSuggestions(topics);
    } catch {
      showToast(tCommon.toast.topicFetchFail, 'error');
    } finally {
      setLoadingTopics(false);
    }
  };

  const create = async (override?: { topic?: string; side?: Side; rounds?: number }) => {
    // 마법사처럼 같은 틱에 state를 막 바꾼 직후 호출되는 경우, React 배치 때문에
    // 클로저가 옛 state를 볼 수 있다. 그래서 호출자가 값을 직접 넘기면 그 값을 우선 사용한다.
    const useTopic = (override?.topic ?? topic).trim();
    const useSide = override?.side ?? mySide;
    const useRounds = override?.rounds ?? plannedRounds;
    if (!db || !user || !useTopic) return;
    setCreating(true);
    let phase = 'init';
    try {
      const myName = displayNameOf(profile, user);
      const base = {
        topic: useTopic,
        createdAt: Date.now(),
        createdBy: user.uid,
        isPrivate,
        plannedRounds: useRounds,
        proUid: null as string | null,
        proName: null as string | null,
        conUid: null as string | null,
        conName: null as string | null,
        status: 'open' as Room['status'],
      };
      const myAvatarId = (profile?.avatarId ?? 'char1') as string;
      const myAvatarDataUrl = profile?.avatarDataUrl ?? null;
      if (mode === 'ai') {
        if (useSide === 'pro') {
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
          useSide === 'pro'
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
      showToast(tCommon.toast.roomCreateFail(phase, `${err.code ?? ''} ${err.message ?? '—'}`), 'error');
    } finally {
      setCreating(false);
    }
  };

  const removeRoom = async (roomId: string) => {
    if (!db || !user) return;
    if (!confirm(tCommon.confirm.deleteRoom)) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('[delete room failed]', err);
      showToast(tCommon.toast.roomDeleteFail(`${err.code ?? ''} ${err.message ?? ''}`), 'error');
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'live' && r.status !== 'live') return false;
    if (filter === 'open' && r.status !== 'open') return false;
    if (filter === 'ended' && r.status !== 'ended') return false;
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

  // 첫 번째 live 방을 FeaturedMatch 스테이지에 사용
  const featuredRoom = rooms.find((r) => r.status === 'live') ?? null;

  const handleOpenCreate = () => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#create') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    window.location.hash = '#create';
  };

  const handleScrollToCreate = () => {
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
  };

  const dateLabel = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <>
    <style>{`
      @keyframes tb-pulse-lobby{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.62);opacity:0.65}}
      /* ====== HeaderSplit hero ====== */
      .lb2-hero{position:relative;overflow:hidden;
        /* always-dark deep-green hero island sitting on --grad-lobby (no dark-mode
           override). theme tokens FLIP at dusk/dawn/ink and cannot drive this panel:
           --color-paper-light #fcf6e8 -> #241c16, --color-ink #1a0f08 -> #f0e6d2,
           --color-celadon #2d4a5a -> #7aa3b8. referencing them here would darken the
           inverse text or lighten the card surface and collapse contrast on the green.
           so foreground + card surface are pinned to fixed values via the local custom
           props below — intentional, scoped to this panel, deliberately NOT tokenized.
           (a theme-invariant primitive token would be the cleaner long-term home, but
           that lives in the token files and is out of this single-file fix's scope.) */
        /* intentional fixed inverse text — the always-light paper value pinned so
           on-green text stays bright in every theme (theme paper-light flips dark). */
        --lb2-hero-on-grad:rgb(252,246,232);
        /* intentional fixed always-dark card surface — the original deep-green panel
           value, pinned so the live card reads as a distinct dark surface against
           --grad-lobby in every theme (ink/celadon tokens flip light in dark modes
           and would lose the surface contrast). */
        --lb2-hero-card-bg:rgba(16,38,30,0.86);
        color:var(--lb2-hero-on-grad);
        background:radial-gradient(circle at 35% 50%,color-mix(in srgb, var(--lb2-hero-on-grad) 5%, transparent),transparent 35%),
          var(--grad-lobby);
        padding:84px 80px 72px;min-height:700px;box-sizing:border-box;
        display:flex;align-items:center}
      .lb2-hero__glow{position:absolute;inset:0;pointer-events:none;
        background:radial-gradient(70% 60% at 14% -10%,color-mix(in srgb, var(--lb2-hero-on-grad) 10%, transparent) 0%,transparent 60%)}
      .lb2-hero__inner{position:relative;width:100%;max-width:1360px;margin:0 auto;z-index:1;
        display:grid;grid-template-columns:0.9fr 1.1fr;gap:72px;align-items:center}
      .lb2-hero__left{position:relative;min-width:0}
      .lb2-hero__eyebrow{display:inline-flex;align-items:center;gap:12px;
        font-family:var(--font-mono);font-weight:700;font-size:15px;
        letter-spacing:0.14em;color:var(--color-sun);white-space:nowrap}
      .lb2-hero__eyebrow-line{width:26px;height:2px;background:var(--color-sun);display:inline-block;flex-shrink:0}
      .lb2-hero__title{margin:20px 0 0;line-height:0.9}
      .lb2-hero__wordmark{position:relative;display:inline-block;
        font-family:var(--font-serif);font-weight:800;
        font-size:clamp(72px,8vw,108px);letter-spacing:-0.05em;color:var(--lb2-hero-on-grad)}
      .lb2-hero__chalk-wrap{position:relative;display:inline-block}
      .lb2-hero__chalk-line{position:absolute;left:-1%;bottom:-0.2em;width:102%;height:0.22em;overflow:visible}
      .lb2-hero__gold-dot{display:inline-block;width:0.3em;height:0.4em;
        margin-left:0.04em;vertical-align:baseline}
      .lb2-hero__lead{max-width:440px;margin:34px 0 0;font-size:20px;line-height:1.75;
        font-weight:700;color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);word-break:keep-all}
      .lb2-hero__create-wrap{margin-top:40px}
      .lb2-hero__create{display:inline-flex;align-items:center;justify-content:center;gap:10px;
        height:64px;padding:0 36px;border-radius:999px;border:none;cursor:pointer;
        background:var(--grad-gold);
        /* intentional: dark drop-shadow on dark-on-dark-green CTA, not tokenized
           (ink token would flip to cream in dark themes and lose the shadow) */
        color:var(--color-forest);box-shadow:0 16px 34px -14px rgba(0,0,0,0.4);
        font-family:var(--font-body);font-weight:900;font-size:19px;white-space:nowrap}
      .lb2-hero__stats{margin-top:44px;padding-top:28px;border-top:1px solid color-mix(in srgb, var(--lb2-hero-on-grad) 18%, transparent)}
      .lb2-hero__stats-row{display:flex;align-items:flex-start;gap:30px;flex-wrap:wrap}
      .lb2-hero__stat{display:flex;flex-direction:column;gap:7px}
      .lb2-hero__stat-n{font-family:var(--font-serif);font-weight:800;font-size:44px;
        line-height:1;letter-spacing:-0.02em}
      .lb2-hero__stat-l{font-family:var(--font-body);font-weight:700;font-size:15px;
        /* informational label on the dark green: raised to 88% for WCAG AA (≈4.8:1) */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);white-space:nowrap}
      .lb2-hero__stat-sep{align-self:stretch;width:1px;background:color-mix(in srgb, var(--lb2-hero-on-grad) 18%, transparent)}
      .lb2-hero__pulse{display:inline-flex;align-items:center;gap:8px;margin-top:22px}
      .lb2-hero__pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--color-sage-light);
        box-shadow:0 0 8px 1px color-mix(in srgb, var(--color-sage-light) 60%, transparent);
        animation:tb-pulse-lobby 1.8s ease-in-out infinite}
      .lb2-hero__pulse-txt{font-family:var(--font-mono);font-weight:600;font-size:12px;
        /* informational live status on the dark green: raised to 88% for WCAG AA */
        letter-spacing:0.04em;color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);white-space:nowrap}
      /* 우측 라이브 카드 */
      .lb2-hero__card{position:relative;justify-self:stretch;width:100%;max-width:720px;
        /* always-dark card surface on the green hero. NOT --color-forest: that token
           is itself green AND flips darker in ink theme, so the card sank into the
           --grad-lobby background. uses --lb2-hero-card-bg (a fixed deep-green rgba,
           see the intentional note in .lb2-hero) so it reads as a distinct dark
           surface against the green in every theme. */
        border-radius:28px;background:var(--lb2-hero-card-bg);
        /* intentional: black drop-shadow on dark panel — not tokenized
           (ink token would flip to cream in dark themes and lose the shadow) */
        box-shadow:0 32px 80px -36px rgba(0,0,0,0.6);
        border:1px solid color-mix(in srgb, var(--color-gold) 22%, transparent);
        padding:32px 42px 34px;box-sizing:border-box}
      .lb2-hero__live-tag{display:flex;align-items:center;gap:13px;flex-wrap:wrap}
      .lb2-hero__live-pill{display:inline-flex;align-items:center;gap:8px;
        padding:8px 16px 8px 13px;border-radius:999px;
        font-family:var(--font-mono);font-weight:900;font-size:13.5px;
        letter-spacing:0.08em;background:var(--color-vermillion);color:var(--color-on-accent);
        box-shadow:var(--glow-pro)}
      .lb2-hero__live-dot{width:8px;height:8px;border-radius:50%;background:var(--color-on-accent);
        /* white glow on dark live indicator — on-accent stays white in every
           theme (paper-light would darken to ink in dark themes) */
        box-shadow:0 0 9px 1px color-mix(in srgb, var(--color-on-accent) 85%, transparent);
        animation:tb-pulse-lobby 1.6s ease-in-out infinite}
      .lb2-hero__live-label{display:inline-flex;align-items:center;gap:8px;
        font-family:var(--font-mono);font-weight:700;font-size:14px;
        letter-spacing:0.12em;color:var(--color-sun);white-space:nowrap}
      .lb2-hero__card-topic{margin:24px 0 0;font-family:var(--font-serif);font-weight:800;
        font-size:clamp(28px,2.7vw,37px);line-height:1.25;letter-spacing:-0.03em;
        color:var(--lb2-hero-on-grad);word-break:keep-all}
      .lb2-hero__card-meta{margin:18px 0 0;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
      .lb2-hero__flag-chip{display:inline-flex;align-items:center;gap:6px;
        padding:8px 16px;border-radius:999px;background:color-mix(in srgb, var(--color-coral) 18%, transparent);color:var(--color-coral);
        font-family:var(--font-mono);font-weight:800;font-size:14px;
        box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--color-coral) 40%, transparent);white-space:nowrap}
      .lb2-hero__round-meta{display:inline-flex;align-items:center;gap:7px;
        font-family:var(--font-mono);font-weight:600;font-size:15px;
        /* informational meta on dark card: raised to 88% for WCAG AA */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);white-space:nowrap}
      .lb2-hero__round-dot{width:7px;height:7px;border-radius:50%;background:var(--color-coral);
        animation:tb-pulse-lobby 1.6s ease-in-out infinite}
      .lb2-hero__votes-meta{font-family:var(--font-mono);font-weight:600;font-size:15px;
        /* informational vote count on dark card: raised to 88% for WCAG AA */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);white-space:nowrap}
      /* 우측 스코어보드 */
      .lb2-hero__board{position:relative;border-radius:22px;
        background:color-mix(in srgb, var(--lb2-hero-on-grad) 4%, transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--lb2-hero-on-grad) 10%, transparent);
        padding:26px 28px 24px;margin-top:26px}
      .lb2-hero__board-clock{text-align:center;margin-bottom:18px;
        font-family:var(--font-mono);font-weight:900;font-size:18px;
        letter-spacing:0.06em;color:var(--lb2-hero-on-grad);line-height:1.1;font-variant-numeric:tabular-nums}
      .lb2-hero__board-phase{font-family:var(--font-mono);font-weight:600;font-size:11.5px;
        /* informational phase label on dark card: raised to 88% for WCAG AA */
        letter-spacing:0.12em;color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);margin-top:3px}
      .lb2-hero__sides{display:flex;align-items:flex-start;justify-content:space-between;gap:4px}
      .lb2-hero__side{display:flex;flex-direction:column;align-items:center;gap:9px;min-width:0;flex:1}
      .lb2-hero__side-role{font-family:var(--font-mono);font-weight:700;font-size:13px;
        letter-spacing:0.12em;margin-top:2px}
      .lb2-hero__side-name{font-family:var(--font-serif);font-weight:800;font-size:16px;
        line-height:1.25;color:var(--lb2-hero-on-grad);text-align:center;max-width:120px;min-height:40px;
        display:flex;align-items:center;justify-content:center;word-break:keep-all}
      .lb2-hero__side-score{font-family:var(--font-serif);font-weight:800;font-size:40px;
        line-height:1}
      .lb2-hero__side-v{font-family:var(--font-mono);font-weight:600;font-size:13px;
        /* small informational unit on dark card: raised to 88% for WCAG AA */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);margin-left:3px}
      .lb2-hero__vs{font-family:var(--font-hand,cursive);font-weight:700;font-size:22px;
        /* meaningful VS marker: raised to 88% for WCAG AA */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);padding-top:30px;flex-shrink:0}
      .lb2-hero__votebar{display:flex;height:10px;border-radius:999px;overflow:hidden;
        /* intentional: black optical shade for the votebar track — on a deep-green
           panel a forest tint would blend into the surface and bury the track */
        background:rgba(0,0,0,0.3);margin-top:18px}
      .lb2-hero__votebar-pro{background:linear-gradient(90deg,var(--color-vermillion),var(--color-coral))}
      .lb2-hero__votebar-con{background:linear-gradient(90deg,var(--color-sky),var(--color-celadon))}
      .lb2-hero__cta{width:100%;height:58px;margin-top:20px;border-radius:16px;border:none;
        cursor:pointer;background:var(--grad-gold);
        color:var(--color-forest);box-shadow:var(--glow-gold);
        font-family:var(--font-body);font-weight:900;font-size:18px}
      /* 폴백 — live 없을 때 */
      .lb2-hero__fallback{position:relative;justify-self:stretch;width:100%;max-width:720px;
        border-radius:28px;border:1px solid color-mix(in srgb, var(--color-gold) 35%, transparent);
        padding:48px 42px;box-sizing:border-box;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:16px;text-align:center}
      .lb2-hero__fallback-icon{font-family:var(--font-serif);font-weight:800;font-size:52px;
        color:color-mix(in srgb, var(--color-gold) 45%, transparent);line-height:1}
      .lb2-hero__fallback-title{font-family:var(--font-serif);font-weight:800;font-size:22px;
        /* title on the green hero: raised to 92% for WCAG AA */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 92%, transparent);letter-spacing:-0.02em;word-break:keep-all}
      .lb2-hero__fallback-sub{font-family:var(--font-body);font-size:14px;
        /* informational subtext on the green hero: raised to 88% for WCAG AA */
        color:color-mix(in srgb, var(--lb2-hero-on-grad) 88%, transparent);word-break:keep-all}
      .lb2-hero__fallback-btn{display:inline-flex;align-items:center;gap:9px;
        padding:14px 28px;border-radius:999px;border:none;cursor:pointer;
        background:color-mix(in srgb, var(--color-gold) 18%, transparent);color:var(--color-sun);
        box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 35%, transparent);
        font-family:var(--font-body);font-weight:800;font-size:15px;white-space:nowrap}
      /* 반응형 */
      @media(max-width:1100px){
        .lb2-hero{padding-left:32px!important;padding-right:32px!important}
        .lb2-hero__inner{grid-template-columns:1fr!important;gap:36px!important}
        .lb2-hero{min-height:0!important}
      }
      @media(max-width:760px){
        .lb2-hero{padding:48px 20px!important;min-height:0!important}
        .lb2-hero__wordmark{font-size:clamp(52px,12vw,80px)!important}
        .lb2-hero__card{padding:24px 22px!important}
      }
      /* top:0 + z-index above the global header (.header-game is sticky z-10)
         so on page load the header and search bar sit stacked in document
         flow, but as the user scrolls the search bar slides up and OVER the
         header, replacing it. */
      .lb2-bar{position:sticky;top:0;z-index:20;background:color-mix(in srgb, var(--color-paper) 97%, transparent);
        backdrop-filter:blur(8px);border-bottom:1px solid var(--color-line);
        box-shadow:0 1px 0 color-mix(in srgb, var(--color-forest) 4%, transparent);padding:14px 64px}
      .lb2-bar__inner{max-width:1216px;margin:0 auto;display:flex;align-items:center;
        gap:14px;flex-wrap:wrap}
      .lb2-bar__title{display:inline-flex;align-items:center;gap:8px;
        font-family:var(--font-serif);font-weight:800;font-size:17px;color:var(--color-ink);white-space:nowrap}
      .lb2-bar__title-icon{width:26px;height:26px;border-radius:8px;background:var(--color-celadon);color:var(--color-on-accent);
        display:inline-flex;align-items:center;justify-content:center;
        font-family:var(--font-serif);font-weight:800;font-size:14px;flex-shrink:0}
      .lb2-bar__search{flex:1;min-width:200px;max-width:460px;display:inline-flex;align-items:center;
        gap:9px;padding:10px 16px;border-radius:999px;background:var(--color-paper-light);box-shadow:inset 0 0 0 1px var(--color-line)}
      .lb2-bar__search input{flex:1;border:none;outline:none;background:transparent;
        font-family:var(--font-body);font-size:14px;color:var(--color-ink)}
      .lb2-bar__clear{border:none;background:transparent;cursor:pointer;
        color:var(--color-ink-fade);font-size:16px;padding:0}
      .lb2-bar__chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .lb2-bar__chip{padding:7px 13px;border-radius:999px;border:none;cursor:pointer;white-space:nowrap;
        font-family:var(--font-mono);font-weight:700;font-size:12px;letter-spacing:0.02em;
        transition:all .14s ease}
      .lb2-bar__chip[aria-pressed="true"]{background:var(--color-ink);color:var(--color-paper-light);box-shadow:none}
      .lb2-bar__chip[aria-pressed="false"]{background:transparent;color:var(--color-ink-soft);
        box-shadow:inset 0 0 0 1px var(--color-line)}
      .lb2-bar__create{margin-left:auto;display:inline-flex;align-items:center;gap:8px;
        padding:10px 20px;border-radius:999px;border:none;cursor:pointer;
        background:var(--color-celadon);color:var(--color-on-accent);box-shadow:0 10px 22px -10px var(--color-celadon);
        font-family:var(--font-body);font-weight:800;font-size:14px;white-space:nowrap}
      .lb2-section{max-width:1216px;margin:0 auto;padding:0 64px}
      .lb2-section-head{display:flex;align-items:flex-end;justify-content:space-between;
        gap:16px;margin-bottom:20px;flex-wrap:wrap}
      .lb2-section-head__eyebrow{display:inline-flex;align-items:center;gap:9px;
        font-family:var(--font-mono);font-weight:700;font-size:11px;letter-spacing:0.16em;white-space:nowrap}
      .lb2-section-head__eyebrow-line{height:1.5px}
      .lb2-section-head__title{margin:10px 0 0;font-family:var(--font-serif);font-weight:800;
        font-size:27px;letter-spacing:-0.025em;color:var(--color-ink);white-space:nowrap}
      .lb2-section-head__count{font-family:var(--font-mono);font-weight:600;font-size:15px;
        color:var(--color-ink-fade);margin-left:11px;letter-spacing:0}
      .lb2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-items:stretch}
      .lb2-card{position:relative;background:var(--color-paper-light);border-radius:20px;overflow:hidden;
        display:flex;flex-direction:column;
        box-shadow:0 22px 46px -30px color-mix(in srgb, var(--color-forest) 45%, transparent),0 0 0 1px color-mix(in srgb, var(--color-ink) 4%, transparent);
        transition:transform .16s ease,box-shadow .16s ease;cursor:pointer;border:none;text-align:left;
        width:100%;padding:0}
      .lb2-card:hover{transform:translateY(-3px);
        box-shadow:0 30px 56px -28px color-mix(in srgb, var(--color-forest) 50%, transparent),0 0 0 1px color-mix(in srgb, var(--color-ink) 5%, transparent)}
      .lb2-card--live{border-top:3px solid var(--color-vermillion)}
      .lb2-card--open{border-top:3px solid var(--color-gold)}
      .lb2-card--ended{border-top:3px solid var(--color-paper-darker)}
      .lb2-card__topbar{display:flex;align-items:center;gap:8px;padding:15px 20px 0}
      .lb2-card__topic{margin:0;padding:13px 20px 0;font-family:var(--font-serif);font-weight:800;
        font-size:21px;line-height:1.32;letter-spacing:-0.02em;color:var(--color-ink);word-break:keep-all;
        min-height:2.64em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .lb2-card__footer{margin-top:auto;display:flex;align-items:center;gap:10px;
        padding:14px 20px 18px}
      .lb2-cta{display:inline-flex;box-sizing:border-box;align-items:center;justify-content:center;
        gap:7px;padding:9px 16px;border-radius:999px;
        font-family:var(--font-body);font-weight:800;font-size:13.5px;white-space:nowrap;
        text-decoration:none}
      .lb2-cta--live{background:var(--color-vermillion);color:var(--color-on-accent);
        box-shadow:0 10px 22px -10px var(--color-vermillion)}
      .lb2-cta--open{background:var(--color-celadon);color:var(--color-on-accent);
        box-shadow:0 10px 22px -10px var(--color-celadon);
        width:calc(100% - 40px);margin:0 20px;justify-content:center;
        padding:11px 20px;font-size:14.5px}
      .lb2-cta--ended{background:var(--color-paper-deep);color:var(--color-ink-soft);padding:9px 16px}
      .lb2-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;
        font-family:var(--font-mono);font-weight:700;font-size:10.5px;letter-spacing:0.12em;white-space:nowrap}
      .lb2-pill--live{background:var(--color-vermillion);color:var(--color-on-accent);
        box-shadow:0 6px 14px -6px color-mix(in srgb, var(--color-vermillion) 70%, transparent)}
      .lb2-pill--open{background:var(--color-gold-tint);color:var(--color-gold);
        box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 40%, transparent)}
      .lb2-pill--ended{background:var(--color-paper-deep);color:var(--color-ink-fade);
        box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--color-ink-fade) 25%, transparent)}
      .lb2-pill__dot{width:7px;height:7px;border-radius:50%;background:currentColor;
        animation:tb-pulse-lobby 1.6s ease-in-out infinite}
      .lb2-votebar{display:flex;align-items:center;gap:8px;padding:16px 20px 0}
      .lb2-votebar__bar{flex:1;position:relative;display:flex;height:24px;border-radius:999px;
        overflow:hidden;background:var(--color-paper-deep)}
      .lb2-votebar__pro{background:var(--color-vermillion);display:flex;align-items:center;
        padding-left:9px;color:var(--color-on-accent);font-family:var(--font-mono);font-weight:700;font-size:10.5px}
      .lb2-votebar__con{background:var(--color-celadon);display:flex;align-items:center;
        justify-content:flex-end;padding-right:9px;color:var(--color-on-accent);
        font-family:var(--font-mono);font-weight:700;font-size:10.5px}
      .lb2-votebar__pro--win{box-shadow:inset 0 0 0 2px var(--color-gold)}
      .lb2-votebar__con--win{box-shadow:inset 0 0 0 2px var(--color-gold)}
      .lb2-votebar__tie{position:absolute;left:50%;top:0;bottom:0;width:2px;
        transform:translateX(-50%);background:var(--color-gold)}
      .lb2-open-seat{margin:16px 20px 0;display:flex;align-items:center;gap:10px;
        padding:11px 14px;border-radius:14px;background:var(--color-gold-tint)}
      .lb2-open-seat__plus{width:30px;height:30px;border-radius:50%;flex-shrink:0;
        display:inline-flex;align-items:center;justify-content:center;
        font-family:var(--font-serif);font-weight:800;font-size:17px}
      .lb2-open-seat__txt{font-family:var(--font-body);font-weight:700;font-size:13.5px;
        color:var(--color-ink-soft);line-height:1.35}
      .lb2-result-score{margin:14px 20px 0;display:flex;align-items:baseline;
        justify-content:center;gap:14px;padding:6px 0}
      .lb2-mine-badge{position:absolute;top:10px;right:44px;padding:3px 10px;border-radius:999px;
        font-family:var(--font-mono);font-weight:700;font-size:10px;letter-spacing:0.08em;
        background:var(--color-gold);color:var(--color-on-accent);z-index:2;pointer-events:none}
      .lb2-card__del{position:absolute;top:10px;right:8px;z-index:3;
        background:transparent;border:none;cursor:pointer;font-size:16px;
        padding:4px 7px;border-radius:6px;opacity:0.6;transition:opacity .14s}
      .lb2-card__del:hover{opacity:1}
      .lb2-empty-card{position:relative;background:transparent;border-radius:20px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        min-height:140px;cursor:pointer;border:1px solid var(--color-line);
        transition:border-color .14s,background .14s;padding:20px;width:100%;box-sizing:border-box}
      .lb2-empty-card:hover{border-color:var(--color-celadon);background:color-mix(in srgb, var(--color-celadon) 4%, transparent)}
      .lb2-empty-card__plus{font-size:28px;color:var(--color-ink-fade);line-height:1}
      .lb2-empty-card__label{font-family:var(--font-body);font-weight:700;font-size:14px;
        color:var(--color-ink-soft);text-align:center;word-break:keep-all}
      /* 방 0건 빈 상태 — 신문 1면 "의도된 빈 무대" 톤 (정본 어휘, 강조 절제판)
         표본: src/learn-hub.css .learn-mode__tab + DESIGN-SYSTEM.md §4.
         빈 상태이므로 하드오프셋·도장 같은 무거운 강조는 덜고: 부드러운 hairline 프레임
         + soft 그림자 + 큰 한자(開) 워터마크로 '의도된 여백'을 표현. 좌측 leading bar로
         신문 칼럼 톤. 위계는 eyebrow → serif 제목 → 잉크 밑줄 → 손글씨 본문 한 줄기로.
         버튼 미사용(히어로/검색바에 '토론방 만들기'가 1차 행동) — 단일 accent vermillion만. */
      .lb2-empty-stage{position:relative;isolation:isolate;overflow:hidden;
        max-width:600px;margin:8px auto 0;padding:40px 40px 40px 44px;
        background:var(--color-paper-light);
        border:1px solid var(--color-line, color-mix(in srgb, var(--color-ink) 16%, transparent));
        border-radius:18px;
        box-shadow:0 18px 40px -28px color-mix(in srgb, var(--color-ink) 55%, transparent)}
      /* 좌측 신문 칼럼 룰(leading bar) — accent를 선 하나로 절제 */
      .lb2-empty-stage::before{content:'';position:absolute;left:0;top:18px;bottom:18px;
        width:3px;border-radius:0 3px 3px 0;
        background:color-mix(in srgb, var(--color-vermillion) 70%, transparent)}
      .lb2-empty-stage__glyph{position:absolute;z-index:-1;right:-22px;bottom:-54px;
        font-family:var(--font-serif);font-weight:900;font-size:210px;line-height:1;
        color:var(--color-vermillion);opacity:0.07;pointer-events:none;user-select:none}
      .lb2-empty-stage__body{position:relative;max-width:38ch}
      .lb2-empty-stage__eyebrow{display:flex;align-items:center;gap:8px;
        font-family:var(--font-mono);font-weight:700;font-size:11px;
        letter-spacing:0.16em;text-transform:uppercase;color:var(--color-ink-fade);
        word-break:keep-all;margin-bottom:14px}
      .lb2-empty-stage__dot{flex:none;width:7px;height:7px;border-radius:999px;
        background:var(--color-vermillion);
        box-shadow:0 0 0 4px color-mix(in srgb, var(--color-vermillion) 16%, transparent)}
      .lb2-empty-stage__title{font-size:31px;font-weight:800;letter-spacing:-0.02em;
        color:var(--color-ink);margin:0;line-height:1.16;word-break:keep-all}
      .lb2-empty-stage__rule{display:block;width:44px;height:2px;margin:16px 0;
        background:color-mix(in srgb, var(--color-vermillion) 80%, transparent)}
      .lb2-empty-stage__sub{font-size:18px;color:var(--color-ink-soft);
        margin:0;line-height:1.6;word-break:keep-all}
      @media(prefers-reduced-motion:no-preference){
        .lb2-empty-stage__dot{animation:lb2-empty-pulse 2.6s ease-in-out infinite}
      }
      @keyframes lb2-empty-pulse{
        0%,100%{box-shadow:0 0 0 4px color-mix(in srgb, var(--color-vermillion) 16%, transparent)}
        50%{box-shadow:0 0 0 7px color-mix(in srgb, var(--color-vermillion) 7%, transparent)}
      }
      @media(max-width:520px){
        .lb2-empty-stage{padding:32px 24px 32px 26px}
        .lb2-empty-stage__glyph{font-size:150px;right:-16px;bottom:-40px;opacity:0.06}
        .lb2-empty-stage__title{font-size:25px}
        .lb2-empty-stage__sub{font-size:16px}
      }
      .lb2-clear-btn{display:block;margin:12px auto 0;padding:9px 20px;border-radius:999px;
        border:none;cursor:pointer;font-family:var(--font-mono);font-weight:700;font-size:12px;
        background:transparent;color:var(--color-ink-soft);box-shadow:inset 0 0 0 1.5px var(--color-paper-darker);
        transition:all .14s}
      .lb2-clear-btn:hover{background:var(--color-ink);color:var(--color-paper-light)}
      @media(max-width:1100px){
        .lb2-bar,.lb2-section{
          padding-left:32px!important;padding-right:32px!important}
        .lb2-grid{grid-template-columns:repeat(2,1fr)!important}
      }
      @media(max-width:760px){
        .lb2-bar,.lb2-section{
          padding-left:20px!important;padding-right:20px!important}
        .lb2-grid{grid-template-columns:1fr!important}
      }
      @media(max-width:520px){
        .lb2-bar__create{display:none!important}
        .lb2-card__topic{font-size:18px!important}
        .lb2-bar{padding-left:14px!important;padding-right:14px!important}
      }
    `}</style>

    <div style={{ background: 'var(--color-paper-light)', minHeight: '100vh' }}>

      {/* ====== HeaderSplit 히어로 (스플릿 스테이지) ====== */}
      <LobbyHeroSplit
        featuredRoom={featuredRoom}
        proVotes={featuredRoom ? (votesByRoom[featuredRoom.id]?.pro ?? 0) : 0}
        conVotes={featuredRoom ? (votesByRoom[featuredRoom.id]?.con ?? 0) : 0}
        liveCount={liveCount}
        openCount={openCount}
        endedCount={endedCount}
        dateLabel={dateLabel}
        lang={lang}
        onEnter={onEnter}
        onCreate={handleOpenCreate}
      />

      {/* ====== 슬림 스티키 검색/필터 바 ====== */}
      <div className="lb2-bar" style={{ marginTop: 0 }}>
        <div className="lb2-bar__inner">
          <span className="lb2-bar__title">
            <span className="lb2-bar__title-icon" aria-hidden="true">討</span>
            {lang === 'en' ? 'Find a debate' : '토론 찾기'}
          </span>
          <div className="lb2-bar__search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="var(--color-ink-fade)" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="var(--color-ink-fade)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAriaLabel}
            />
            {search && (
              <button type="button" className="lb2-bar__clear" onClick={() => setSearch('')} aria-label={lang === 'en' ? 'Clear search' : '검색어 지우기'}>✕</button>
            )}
          </div>
          <div role="group" aria-label={lang === 'en' ? 'Status filter' : '토론 상태 필터'} className="lb2-bar__chips">
            {([
              ['all', t.filters.all],
              ['live', t.filters.live],
              ['open', t.filters.open],
              ['ended', t.filters.ended],
              ['ai', t.filters.ai],
              ['human', t.filters.human],
            ] as [typeof filter, string][]).map(([key, lbl]) => (
              <button
                key={key}
                type="button"
                className="lb2-bar__chip"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >{lbl}</button>
            ))}
          </div>
          <button type="button" className="lb2-bar__create" onClick={handleOpenCreate}>
            <span style={{ fontSize: 17, lineHeight: 0 }}>+</span>
            {lang === 'en' ? 'Create room' : '토론방 만들기'}
          </button>
        </div>
      </div>

      {/* ====== 3-섹션 큐레이션 그리드 ====== */}
      {(() => {
        // 히어로 스코어보드에 올라간 대표 라이브 방은 LIVE 그리드에서 제외(중복 노출 방지)
        const liveRooms = filteredRooms.filter((r) => r.status === 'live' && r.id !== featuredRoom?.id);
        const openRooms = filteredRooms.filter((r) => r.status === 'open');
        const endedRooms = filteredRooms.filter((r) => r.status === 'ended');
        // 히어로에 올라간 featured 방이 현재 필터/검색을 통과할 때만 "콘텐츠 있음"으로 카운트
        // (핸드오프 totalMatches와 동일). 없으면 featured 1개뿐일 때 빈 상태가 잘못 뜸.
        const featuredShown = !!featuredRoom && filteredRooms.some((r) => r.id === featuredRoom?.id);
        const hasAny = featuredShown || liveRooms.length > 0 || openRooms.length > 0 || endedRooms.length > 0;

        return (
          <>
            {/* LIVE NOW 섹션 */}
            {liveRooms.length > 0 && (
              <div className="lb2-section" style={{ marginTop: 32 }}>
                <div className="lb2-section-head">
                  <div>
                    <span className="lb2-section-head__eyebrow" style={{ color: 'var(--color-vermillion)' }}>
                      <span className="lb2-section-head__eyebrow-line" style={{ width: 20, background: 'var(--color-vermillion)', display: 'inline-block' }} />
                      {lang === 'en' ? 'LIVE NOW' : 'LIVE NOW · 지금 진행 중'}
                    </span>
                    <h2 className="lb2-section-head__title">
                      {lang === 'en' ? 'Live Debates' : '진행 중인 토론'}
                      <span className="lb2-section-head__count">{liveRooms.length}</span>
                    </h2>
                  </div>
                </div>
                <div className="lb2-grid">
                  {liveRooms.map((r) => (
                    <LobbyRoomCard
                      key={r.id}
                      room={r}
                      onEnter={onEnter}
                      onDelete={removeRoom}
                      isMine={!!user && r.createdBy === user.uid}
                      isHot={false}
                      proVotes={votesByRoom[r.id]?.pro ?? 0}
                      conVotes={votesByRoom[r.id]?.con ?? 0}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* OPEN 섹션 */}
            {openRooms.length > 0 && (
              <div className="lb2-section" style={{ marginTop: liveRooms.length > 0 ? 44 : 32 }}>
                <div className="lb2-section-head">
                  <div>
                    <span className="lb2-section-head__eyebrow" style={{ color: 'var(--color-gold)' }}>
                      <span className="lb2-section-head__eyebrow-line" style={{ width: 20, background: 'var(--color-gold)', display: 'inline-block' }} />
                      {lang === 'en' ? 'OPEN · Recruiting' : 'OPEN · 상대 모집 중'}
                    </span>
                    <h2 className="lb2-section-head__title">
                      {lang === 'en' ? 'Join a Debate' : '참가 가능한 토론'}
                      <span className="lb2-section-head__count">{openRooms.length}</span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="tb-hide-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: 'var(--color-ink)',
                      boxShadow: 'inset 0 0 0 1.5px var(--color-ink)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 800,
                      fontSize: 13.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 0 }}>+</span>{' '}
                    {lang === 'en' ? 'Open my room' : '내 방 열기'}
                  </button>
                </div>
                <div className="lb2-grid">
                  {openRooms.map((r) => (
                    <LobbyRoomCard
                      key={r.id}
                      room={r}
                      onEnter={onEnter}
                      onDelete={removeRoom}
                      isMine={!!user && r.createdBy === user.uid}
                      isHot={false}
                      proVotes={0}
                      conVotes={0}
                      lang={lang}
                    />
                  ))}
                  {/* 빈 자리 카드 — 마지막 OPEN 섹션에만 표시 */}
                  {endedRooms.length === 0 && (
                    <button
                      type="button"
                      className="lb2-empty-card"
                      onClick={handleScrollToCreate}
                      aria-label={lang === 'en' ? 'Create new room' : '새 토론방 만들기'}
                    >
                      <div className="lb2-empty-card__plus">+</div>
                      <div className="lb2-empty-card__label">{t.empty.newRoom}</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* REPLAY 섹션 */}
            {endedRooms.length > 0 && (
              <div className="lb2-section" style={{ marginTop: (liveRooms.length > 0 || openRooms.length > 0) ? 44 : 32 }}>
                <div className="lb2-section-head">
                  <div>
                    <span className="lb2-section-head__eyebrow" style={{ color: 'var(--color-celadon)' }}>
                      <span className="lb2-section-head__eyebrow-line" style={{ width: 20, background: 'var(--color-celadon)', display: 'inline-block' }} />
                      {lang === 'en' ? 'REPLAY · Recent' : 'REPLAY · 최근 종료'}
                    </span>
                    <h2 className="lb2-section-head__title">
                      {lang === 'en' ? 'Replay' : '종료된 토론'}
                      <span className="lb2-section-head__count">{endedRooms.length}</span>
                    </h2>
                  </div>
                </div>
                <div className="lb2-grid">
                  {endedRooms.map((r) => (
                    <LobbyRoomCard
                      key={r.id}
                      room={r}
                      onEnter={onEnter}
                      onDelete={removeRoom}
                      isMine={!!user && r.createdBy === user.uid}
                      isHot={false}
                      proVotes={0}
                      conVotes={0}
                      lang={lang}
                    />
                  ))}
                  {/* 빈 자리 카드 — REPLAY가 마지막 섹션일 때 */}
                  <button
                    type="button"
                    className="lb2-empty-card"
                    onClick={handleScrollToCreate}
                    aria-label={lang === 'en' ? 'Create new room' : '새 토론방 만들기'}
                  >
                    <div className="lb2-empty-card__plus">+</div>
                    <div className="lb2-empty-card__label">{t.empty.newRoom}</div>
                  </button>
                </div>
              </div>
            )}

            {/* 검색/필터 결과 0건 (방은 있지만 조건 불일치) */}
            {!hasAny && rooms.length > 0 && (
              <div className="lb2-section" style={{ marginTop: 32 }}>
                <div className="lb2-grid">
                  <button
                    type="button"
                    className="lb2-empty-card"
                    onClick={handleScrollToCreate}
                    aria-label={lang === 'en' ? 'Create new room' : '새 토론방 만들기'}
                  >
                    <div className="lb2-empty-card__plus">+</div>
                    <div className="lb2-empty-card__label">{t.empty.noMatch}</div>
                  </button>
                </div>
                <button
                  type="button"
                  className="lb2-clear-btn"
                  onClick={() => { setFilter('all'); setSearch(''); }}
                >
                  {t.empty.clearFilters}
                </button>
              </div>
            )}

            {/* 방 0건 빈 상태 */}
            {rooms.length === 0 && (
              <div className="lb2-section" style={{ marginTop: 32 }}>
                <LobbyEmptyCTA lang={lang} />
              </div>
            )}
          </>
        );
      })()}

      {/* ====== 방 만들기 폼 ====== */}
      {showCreate && (
      <section id="create" className="lb2-section" style={{ marginTop: 32 }}>
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
                  onClick={() => void create()}
                  disabled={creating || !topic.trim()}
                  className="lb-create__open-btn"
                >
                  {creating ? t.create.submitting : (lang === 'en' ? 'Open the stage ▶' : '무대 열기 ▶')}
                </button>

                <div
                  className="pt-3 mt-3"
                  style={{ borderTop: '1px solid var(--color-line)' }}
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

      {/* 가이드 마법사 모달 — 기능 100% 보존 */}
      {showWizard && user && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tCommon.wizard.ariaLabel}
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
              aria-label={tCommon.wizard.closeAriaLabel}
              className="btn"
              style={{
                background: 'var(--color-paper-light)',
                padding: '8px 14px',
              }}
            >
              {tCommon.wizard.closeBtn}
            </button>
          </div>
          <Suspense fallback={<div style={{ color: 'var(--color-on-accent)', textAlign: 'center', padding: 48 }}>{tCommon.wizard.loading}</div>}>
            <OnboardingViewLazy
              lang={lang}
              onCancel={() => setShowWizard(false)}
              onStart={(result) => {
                setTopic(result.topic);
                setMySide(result.side);
                setPlannedRounds(result.rounds);
                setShowWizard(false);
                // state 반영을 기다리지 않고 마법사 결과값을 create에 직접 전달한다.
                // (setTimeout(…,0) + 클로저로 옛 state를 읽어 빈 주제로 방이 생기던 버그 방지)
                void create({ topic: result.topic, side: result.side, rounds: result.rounds });
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
    </>
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
        const r = await fetch('/api/ai/argue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: room.topic,
            side: aiSide,
            phase: room.phase,
            priorMessages,
            opponentName,
          }),
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
        showToast(tCommon.toast.aiArgueFail, 'error');
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
        const r = await fetch('/api/ai/opening', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: room.topic, proName: room.proName, conName: room.conName }),
        });
        if (!r.ok) throw new Error('opening failed');
        const { text } = await r.json();
        await postModerator(text);
        if (db) await updateDoc(doc(db, 'rooms', roomId), { phase: 'pro_arg', openingPosted: true });
      } catch (e) {
        console.error(e);
        openingTriggered.current = false;
        showToast(tCommon.toast.aiOpeningFail, 'error');
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
      setObjection({ side: 'pro', key: now, kind: 'argument', label: tRoom.phases.pro_arg + '!' });
    } else if (curr === 'con_arg') {
      setObjection({ side: 'con', key: now, kind: 'argument', label: tRoom.phases.con_arg + '!' });
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
        label: tCommon.overlay.verdict,
      });
    }
  }, [room?.status, room?.winner]);

  // Record stats once when debate ends — deduped per (room, user).
  // localStorage = 같은 기기 빠른 스킵. Firestore 마커(rooms/{id}/statsRecorded/{uid})
  // = 다른 기기·시크릿창에서 같은 방을 다시 열었을 때의 전적 중복 가산을 막는다.
  // 마커 쓰기가 막혀도(규칙 미배포 등) increment는 진행 → 오늘보다 나빠지지 않음.
  useEffect(() => {
    if (!db || !user || !room) return;
    if (room.status !== 'ended') return;
    if (mySide !== 'pro' && mySide !== 'con') return;
    if (typeof window === 'undefined') return;
    const database = db;
    const uid = user.uid;
    const readLocal = (): string[] => {
      try {
        return JSON.parse(window.localStorage.getItem(STATS_KEY) ?? '[]');
      } catch {
        return [];
      }
    };
    if (readLocal().includes(roomId)) return;
    const markLocal = () => {
      const next = readLocal();
      if (!next.includes(roomId)) {
        window.localStorage.setItem(STATS_KEY, JSON.stringify([...next, roomId].slice(-200)));
      }
    };
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
    let cancelled = false;
    (async () => {
      const markerRef = doc(database, 'rooms', roomId, 'statsRecorded', uid);
      try {
        const marker = await getDoc(markerRef);
        if (cancelled) return;
        if (marker.exists()) {
          markLocal(); // 다른 기기에서 이미 집계됨 — 이 기기도 다시 세지 않도록 표시
          return;
        }
      } catch (e) {
        // 마커 조회 실패 시엔 옛 동작(localStorage 기반)으로 폴백 — 누락보다 안전
        console.warn('[stats] marker read failed, falling back', e);
      }
      try {
        await updateDoc(doc(database, 'users', uid), updates);
        if (cancelled) return;
        markLocal();
        // 마커는 best-effort: 규칙 미배포 시 막혀도 무시(오늘 동작 유지)
        void setDoc(markerRef, { at: Date.now() }).catch(() => {});
      } catch (e) {
        console.error('[stats] failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          `이전 발언에서 다 다루지 못한 핵심 논점을 기대하겠습니다. ` +
          `${room.proName ?? '찬성 측'}님, 찬성 입론부터 부탁드립니다.`;
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
            // 합의 연장도 자동 연장과 동일하게 '찬성 입론'부터 새 라운드를 시작한다.
            // (이전엔 pro_rebut으로 시작해 입론을 건너뛰고 "새 논거 금지"인 반박부터 열리는 버그)
            phase: 'pro_arg',
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
        const all = messages
          .filter((m) => m.side === 'pro' || m.side === 'con')
          .map((m) => ({ name: m.name, side: m.side, text: m.text }));
        const r = await fetch('/api/ai/closing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: room.topic,
            allMessages: all,
            proName: room.proName,
            conName: room.conName,
          }),
        });
        if (!r.ok) throw new Error(`closing HTTP ${r.status}`);
        const closingPayload = (await r.json()) as {
          text?: string;
          aiPick?: 'pro' | 'con' | 'tie';
        };
        const aiText = (closingPayload.text ?? '').trim();
        const aiPick = closingPayload.aiPick ?? 'tie';
        if (aiText) await postModerator(aiText);

        // Combine: audience 50% + AI judge 50%
        const totalVotes = proCount + conCount;
        const audienceProShare = totalVotes > 0 ? proCount / totalVotes : 0.5;
        const aiProShare = aiPick === 'pro' ? 1 : aiPick === 'con' ? 0 : 0.5;
        const proScore = audienceProShare * 0.5 + aiProShare * 0.5;
        const epsilon = 0.01;
        const winner: Side | 'tie' =
          proScore > 0.5 + epsilon ? 'pro' : proScore < 0.5 - epsilon ? 'con' : 'tie';
        await updateDoc(doc(db, 'rooms', roomId), {
          status: 'ended',
          winner,
          aiPick,
          finalProScore: Math.round(proScore * 100),
        });
      } else {
        const nextSpeakerSide = PHASE_SPEAKER[next];
        const nextSpeakerName =
          (nextSpeakerSide === 'pro' ? room.proName : nextSpeakerSide === 'con' ? room.conName : '') ?? '';
        const r = await fetch('/api/ai/transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: room.topic,
            currentPhase: room.phase,
            nextPhase: next,
            recentMessages,
            nextSpeakerName,
            nextSpeakerSide,
          }),
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
      showToast(tCommon.toast.aiTransitionFail, 'error');
    } finally {
      setAiBusy(false);
    }
  };

  if (!room) return <CenterMsg>{tCommon.loading.room}</CenterMsg>;

  const total = proCount + conCount;
  const proPct = total ? Math.round((proCount / total) * 100) : 50;
  const conPct = 100 - proPct;
  const currentSpeakerSide = room.phase ? PHASE_SPEAKER[room.phase] : null;
  const isMyTurn =
    room.status === 'live' && currentSpeakerSide && mySide === currentSpeakerSide;

  return (
    <div className="rm2-shell">
      <style>{`
        /* ===== rm2-* RoomView 소프트-라운드 스킨 ===== */
        .rm2-shell { display: flex; flex-direction: column; gap: 16px; }
        .rm2-topbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .rm2-pill-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; color: var(--color-ink-soft);
          background: var(--color-paper-light); border: 1px solid var(--color-line);
          border-radius: var(--r-pill); padding: 7px 16px; box-shadow: var(--shadow-sm);
          cursor: pointer; transition: background 0.15s, box-shadow 0.15s;
        }
        .rm2-pill-back:hover { background: var(--color-paper-deep); box-shadow: var(--shadow-md); }
        .rm2-pill-back:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        /* --- HUD --- */
        .rm2-hud {
          background: var(--grad-lobby);
          color: var(--color-paper-light); border-radius: var(--r-xl);
          box-shadow: var(--shadow-lg), inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 18%, transparent);
          padding: 18px 24px; position: relative; overflow: hidden;
        }
        .rm2-hud::before {
          content: ""; position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, color-mix(in srgb, color-mix(in srgb, var(--color-gold) 55%, var(--color-paper-light) 45%) 12%, transparent) 0%, transparent 70%);
          pointer-events: none;
        }
        .rm2-hud__grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; }
        .rm2-hud__left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .rm2-hud__live-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.16em; color: var(--color-on-accent);
          background: var(--color-vermillion); border-radius: var(--r-pill); padding: 4px 10px; flex-shrink: 0;
        }
        .rm2-hud__live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--color-on-accent); display: inline-block;
          animation: rm2-pulse 1.4s ease-in-out infinite;
        }
        @keyframes rm2-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(.8);} }
        @media (prefers-reduced-motion: reduce) { .rm2-hud__live-dot { animation: none; } }
        .rm2-hud__phase-info { min-width: 0; }
        .rm2-hud__phase-counter { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; color: color-mix(in srgb, var(--color-paper-light) 72%, transparent); margin-bottom: 2px; }
        .rm2-hud__phase-name { font-family: var(--font-serif); font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rm2-hud__center { text-align: center; max-width: 520px; }
        .rm2-hud__eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: color-mix(in srgb, var(--color-paper-light) 72%, transparent); margin-bottom: 4px; }
        .rm2-hud__topic { font-family: var(--font-serif); font-size: 16px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; color: var(--color-paper-light); word-break: keep-all; }
        .rm2-hud__right { display: flex; align-items: center; gap: 10px; justify-content: flex-end; min-width: 0; }
        .rm2-hud__audience { font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: color-mix(in srgb, var(--color-paper-light) 82%, transparent); text-align: right; margin-bottom: 4px; }
        .rm2-hud__toggles { display: flex; flex-direction: column; gap: 3px; position: absolute; bottom: 6px; right: 10px; opacity: .45; transition: opacity 0.15s; }
        .rm2-hud__toggles:hover { opacity: 1; }
        .rm2-hud__toggle-btn { font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: color-mix(in srgb, var(--color-paper-light) 90%, transparent); background: transparent; border: 1px solid color-mix(in srgb, var(--color-paper-light) 44%, transparent); border-radius: var(--r-sm); padding: 2px 7px; cursor: pointer; }
        .rm2-hud__progress-track { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: color-mix(in srgb, var(--color-paper-light) 18%, transparent); /* 비텍스트 트랙 — 모바일에서 옅으면 22%로 올릴 것 */ border-radius: 0 0 var(--r-xl) var(--r-xl); overflow: hidden; }
        .rm2-hud__progress-fill { height: 100%; background: var(--color-vermillion); transition: width 0.5s; }
        /* --- stage --- */
        .rm2-stage { background: var(--color-paper-light); border-radius: var(--r-xl); box-shadow: var(--shadow-md); border-top: 3px solid var(--color-vermillion); padding: 22px; }
        .rm2-stage--open { border-top-color: var(--color-gold); }
        .rm2-stage--ended { border-top-color: var(--color-line); }
        .rm2-stage__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .rm2-stage__topic { font-family: var(--font-serif); font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.3; margin: 0; word-break: keep-all; color: var(--color-ink); }
        /* --- faceoff --- */
        .rm2-faceoff { display: grid; grid-template-columns: 1fr 70px 1fr; align-items: stretch; gap: 10px; }
        @media (max-width: 480px) { .rm2-faceoff { grid-template-columns: 1fr 48px 1fr; gap: 6px; } }
        .rm2-faceoff__vs { display: flex; align-items: center; justify-content: center; }
        /* --- side card --- */
        .rm2-sidecard { border-radius: var(--r-lg); box-shadow: var(--shadow-sm); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: box-shadow 0.25s, transform 0.25s; position: relative; overflow: hidden; }
        .rm2-sidecard--pro { background: var(--color-tint-pro); }
        .rm2-sidecard--con { background: var(--color-tint-con); }
        .rm2-sidecard--speaking-pro { box-shadow: var(--glow-pro), inset 0 0 0 2px var(--color-vermillion); transform: translateY(-3px); }
        .rm2-sidecard--speaking-con { box-shadow: var(--glow-con), inset 0 0 0 2px var(--color-celadon); transform: translateY(-3px); }
        .rm2-sidecard__avatar-wrap--pro { border-radius: 50%; box-shadow: 0 0 0 3px var(--color-paper-light), var(--glow-pro); }
        .rm2-sidecard__avatar-wrap--con { border-radius: 50%; box-shadow: 0 0 0 3px var(--color-paper-light), var(--glow-con); }
        .rm2-sidecard__name { font-family: var(--font-serif); font-size: 16px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; margin: 8px 0 2px; word-break: keep-all; }
        .rm2-sidecard__ai-label { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; color: var(--color-ink-fade); }
        .rm2-sidecard__mine-badge { font-family: var(--font-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.1em; color: var(--color-ink-fade); }
        /* --- empty seat --- */
        .rm2-emptyseat { border-radius: var(--r-lg); padding: 20px 12px; display: flex; flex-direction: column; align-items: center; text-align: center; min-height: 160px; justify-content: center; }
        .rm2-emptyseat--pro { border: 2px solid var(--color-vermillion); background: var(--color-tint-pro); }
        .rm2-emptyseat--con { border: 2px solid var(--color-celadon); background: var(--color-tint-con); }
        .rm2-emptyseat__chip { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; margin-bottom: 10px; }
        .rm2-emptyseat__chip--pro { background: var(--color-paper-light); border: 2px solid var(--color-vermillion); color: var(--color-vermillion); }
        .rm2-emptyseat__chip--con { background: var(--color-paper-light); border: 2px solid var(--color-celadon); color: var(--color-celadon); }
        .rm2-take-btn { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; color: var(--color-on-accent); border: none; border-radius: var(--r-pill); padding: 8px 18px; cursor: pointer; margin-top: 10px; transition: opacity 0.15s, transform 0.1s; letter-spacing: -0.01em; }
        .rm2-take-btn:hover { opacity: .88; transform: translateY(-1px); }
        .rm2-take-btn:active { transform: translateY(1px); }
        .rm2-take-btn:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        .rm2-take-btn--pro { background: var(--color-vermillion); }
        .rm2-take-btn--con { background: var(--color-celadon); }
        /* --- vote panel --- */
        .rm2-votepanel { margin-top: 14px; background: var(--color-paper-light); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-line); padding: 14px 16px; }
        .rm2-votepanel__eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-ink-fade); margin-bottom: 10px; }
        .rm2-vote-btns { display: flex; gap: 10px; margin-top: 10px; }
        .rm2-vote-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--font-body); font-size: 14px; font-weight: 700; border: 2px solid transparent; border-radius: var(--r-pill); padding: 10px 14px; cursor: pointer; transition: all 0.15s; letter-spacing: -0.01em; }
        .rm2-vote-btn:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        .rm2-vote-btn--pro-idle { background: var(--color-paper-light); border-color: var(--color-vermillion); color: var(--color-vermillion); }
        .rm2-vote-btn--pro-idle:hover { background: var(--color-tint-pro); }
        .rm2-vote-btn--pro-active { background: var(--color-vermillion); border-color: var(--color-vermillion); color: var(--color-on-accent); }
        .rm2-vote-btn--con-idle { background: var(--color-paper-light); border-color: var(--color-celadon); color: var(--color-celadon); }
        .rm2-vote-btn--con-idle:hover { background: var(--color-tint-con); }
        .rm2-vote-btn--con-active { background: var(--color-celadon); border-color: var(--color-celadon); color: var(--color-on-accent); }
        .rm2-open-note { margin-top: 14px; padding: 12px 16px; border: 1px solid var(--color-line); border-radius: var(--r-md); font-family: var(--font-body); font-size: 13.5px; color: var(--color-ink-soft); text-align: center; }
        .rm2-ai-busy { margin-top: 12px; padding: 10px 16px; background: var(--color-tint-pro); border-radius: var(--r-md); color: var(--color-vermillion); font-size: 13.5px; font-weight: 700; text-align: center; }
        /* --- floor --- */
        .rm2-floor { border-radius: var(--r-lg); box-shadow: var(--shadow-md); border: 1px solid var(--color-line); overflow: hidden; position: relative; }
        .rm2-floor__header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--color-paper-deep); border-bottom: 1px solid var(--color-line); }
        .rm2-floor__title { font-family: var(--font-hand); font-size: 15px; font-weight: 700; color: var(--color-ink-soft); }
        .rm2-floor__id { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; color: var(--color-ink-fade); }
        .rm2-floor__body { padding: 14px; background: var(--color-paper-light); overflow-y: auto; display: flex; flex-direction: column; gap: 10px; height: clamp(360px,55vh,480px); }
        .rm2-floor__empty { font-size: 13px; text-align: center; padding: 40px 16px; color: var(--color-ink-fade); }
        /* --- message bubbles --- */
        .rm2-bubble { max-width: 82%; padding: 10px 14px; position: relative; box-shadow: var(--shadow-sm); }
        .rm2-bubble--pro { background: var(--color-tint-pro); border: 1.5px solid var(--color-vermillion); border-radius: 14px 14px 14px 4px; align-self: flex-start; }
        .rm2-bubble--con { background: var(--color-tint-con); border: 1.5px solid var(--color-celadon); border-radius: 14px 14px 4px 14px; align-self: flex-end; margin-left: auto; }
        .rm2-bubble__chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 20px;
          box-sizing: border-box;
          margin-right: 6px;
          padding: 3px 8px;
          border-radius: var(--r-sm);
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.12em;
          color: var(--color-on-accent);
          word-break: keep-all;
        }
        .rm2-bubble__chip--pro {
          background: var(--color-vermillion);
          box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--color-on-accent) 30%, transparent),
            1.5px 1.5px 0 color-mix(in srgb, var(--color-vermillion) 60%, var(--color-ink) 40%);
        }
        .rm2-bubble__chip--con {
          background: var(--color-celadon);
          box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--color-on-accent) 30%, transparent),
            1.5px 1.5px 0 color-mix(in srgb, var(--color-celadon) 60%, var(--color-ink) 40%);
        }
        .rm2-bubble__header { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
        .rm2-bubble__name { font-family: var(--font-hand); font-size: 12px; color: var(--color-ink-soft); }
        .rm2-bubble__mine { font-family: var(--font-mono); font-size: 10px; color: var(--color-ink-fade); letter-spacing: 0.08em; }
        .rm2-bubble__text { font-family: var(--font-body); font-size: 14.5px; line-height: 1.75; white-space: pre-wrap; word-break: keep-all; color: var(--color-ink); margin: 0; }
        /* --- composer --- */
        .rm2-composer { display: flex; flex-direction: column; gap: 10px; }
        .rm2-composer__guide { border-radius: var(--r-md); background: var(--color-paper-deep); border: 1px solid var(--color-line); padding: 10px 14px; font-size: 13px; font-family: var(--font-serif); color: var(--color-ink-soft); line-height: 1.6; }
        .rm2-composer__guide-title { font-family: var(--font-hand); font-size: 14px; font-weight: 700; color: var(--color-ink); margin-bottom: 6px; }
        .rm2-composer__row { display: flex; gap: 10px; align-items: stretch; }
        .rm2-composer__textarea { flex: 1; border-radius: var(--r-md); border: 1.5px solid var(--color-line); background: var(--color-paper-light); font-family: var(--font-body); font-size: 14px; color: var(--color-ink); padding: 12px 14px; resize: vertical; min-height: 96px; transition: border-color 0.15s; outline: none; }
        .rm2-composer__textarea:focus { border-color: var(--color-vermillion); }
        .rm2-composer__send { display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-body); font-size: 14px; font-weight: 700; color: var(--color-on-accent); background: var(--color-vermillion); border: none; border-radius: var(--r-pill); padding: 0 24px; cursor: pointer; align-self: stretch; transition: opacity 0.15s, transform 0.1s; letter-spacing: -0.01em; white-space: nowrap; }
        .rm2-composer__send:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .rm2-composer__send:disabled { opacity: .45; cursor: not-allowed; }
        .rm2-composer__send:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        .rm2-composer__tidy { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-ink-soft); cursor: pointer; user-select: none; }
        .rm2-composer__tidy-label { font-weight: 700; }
        .rm2-composer__tidy-hint { color: var(--color-ink-fade); }
        .rm2-wait { text-align: center; font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em; color: var(--color-ink-fade); padding: 6px; }
        /* --- responsive --- */
        @media (max-width: 760px) {
          .rm2-hud {
            padding: 12px 16px;
          }

          .rm2-hud__grid {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-areas:
              "left left right"
              "topic topic topic";
            align-items: center;
            gap: 6px 10px;
          }

          .rm2-hud__left {
            grid-area: left;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .rm2-hud__live-chip {
            flex-shrink: 0;
            min-height: 22px;
            padding: 3px 8px;
            font-size: 9.5px;
            line-height: 1;
            white-space: nowrap;
          }

          .rm2-hud__phase-info {
            display: flex;
            align-items: baseline;
            gap: 6px;
            min-width: 0;
          }

          .rm2-hud__phase-counter {
            flex-shrink: 0;
            margin-bottom: 0;
            font-size: 9.5px;
            line-height: 1;
            letter-spacing: 0.08em;
            color: color-mix(in srgb, var(--color-paper-light) 72%, transparent);
            white-space: nowrap;
            word-break: keep-all;
          }

          .rm2-hud__phase-counter::after {
            content: "·";
            margin-left: 6px;
            color: color-mix(in srgb, var(--color-paper-light) 48%, transparent);
          }

          .rm2-hud__phase-name {
            min-width: 0;
            font-size: 15px;
            line-height: 1.12;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: keep-all;
          }

          .rm2-hud__center {
            grid-area: topic;
            max-width: none;
            min-width: 0;
            text-align: center;
          }

          .rm2-hud__eyebrow {
            display: none;
          }

          .rm2-hud__topic {
            font-size: 14px;
            line-height: 1.32;
            word-break: keep-all;
            overflow-wrap: break-word;
          }

          .rm2-hud__right {
            grid-area: right;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            justify-self: end;
            min-width: 0;
            max-width: 34vw;
          }

          .rm2-hud__audience {
            margin-bottom: 0;
            font-size: 10.5px;
            line-height: 1;
            letter-spacing: 0.08em;
            color: color-mix(in srgb, var(--color-paper-light) 82%, transparent);
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: keep-all;
          }

          .rm2-hud__toggles {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .rm2-composer__row { flex-wrap: wrap; }
          .rm2-composer__send { width: 100%; padding: 12px; border-radius: var(--r-md); }
        }
      `}</style>

      {/* ① topbar */}
      <div className="rm2-topbar">
        <button
          type="button"
          onClick={onBack}
          className="rm2-pill-back"
        >
          {tCommon.actions.back}
        </button>
        {room?.isPrivate && <InviteLinkButton roomId={roomId} lang={lang} />}
      </div>

      {/* ② RoomHUD — 딥그린 스테이지 바 (live only) */}
      {room.status === 'live' && (() => {
        const phaseOrder: Array<typeof room.phase> = ['opening', 'pro_arg', 'con_arg', 'pro_rebut', 'con_rebut'];
        const phaseIdx = room.phase ? Math.max(0, phaseOrder.indexOf(room.phase)) : 0;
        const phaseTotal = phaseOrder.length;
        const phaseSide = room.phase ? PHASE_SPEAKER[room.phase] : null;
        const phaseColor =
          phaseSide === 'pro' ? 'var(--color-coral)'
          : phaseSide === 'con' ? 'var(--color-sky)'
          : 'var(--color-sun)';
        return (
          <div className="rm2-hud">
            <div className="rm2-hud__grid">
              {/* 좌: LIVE + 라운드 + 페이즈 */}
              <div className="rm2-hud__left">
                <span className="rm2-hud__live-chip">
                  <span className="rm2-hud__live-dot" />
                  {tRoom.hud.round} R{(room.extendRound ?? 0) + 1}
                </span>
                <div className="rm2-hud__phase-info">
                  <div className="rm2-hud__phase-counter">
                    {phaseIdx + 1} / {phaseTotal}
                  </div>
                  <div className="rm2-hud__phase-name" style={{ color: phaseColor }}>
                    {room.phase ? tRoom.phases[room.phase] : '—'}
                  </div>
                </div>
              </div>

              {/* 중앙: 논제 */}
              <div className="rm2-hud__center">
                <div className="rm2-hud__eyebrow">
                  {lang === 'en' ? "TODAY'S RESOLUTION" : '오늘의 논제'}
                </div>
                <div className="rm2-hud__topic">
                  「{room.topic}」
                </div>
              </div>

              {/* 우: 관중 수 + 투표바 */}
              <div className="rm2-hud__right">
                <div>
                  <div className="rm2-hud__audience">
                    {tRoom.hud.audience(proCount + conCount)}
                  </div>
                  <div className="hidden sm:block">
                    <VoteBar pro={proCount} con={conCount} variant={voteBarVariant} size="sm" showLabels={false} lang={lang} />
                  </div>
                </div>
              </div>
            </div>

            {/* dev 토글: 우하단 작은 캡슐 */}
            <div className="rm2-hud__toggles">
              <button
                type="button"
                className="rm2-hud__toggle-btn"
                onClick={cycleVoteBar}
                aria-label={`vote bar variant: ${voteBarVariant} — 다음으로 전환`}
                title={`투표 바 스타일 (${voteBarVariant}) — 클릭해서 전환`}
              >
                {voteBarVariant}
              </button>
              <button
                type="button"
                className="rm2-hud__toggle-btn"
                onClick={cycleAiMod}
                aria-label={`AI moderator card variant: ${aiModVariant} — 다음으로 전환`}
                title={`AI 사회자 카드 (${aiModVariant}) — 클릭해서 전환`}
              >
                🤖 {aiModVariant}
              </button>
            </div>

            {/* 진행 하이라인 */}
            <div className="rm2-hud__progress-track" aria-hidden="true">
              <div
                className="rm2-hud__progress-fill"
                style={{ width: `${((phaseIdx + 1) / phaseTotal) * 100}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* ③ Stage — faceoff + 투표 + VerdictBlock */}
      <div className={`rm2-stage${room.status === 'open' ? ' rm2-stage--open' : room.status === 'ended' ? ' rm2-stage--ended' : ''}`}>
        {/* 논제 헤더 */}
        <div className="rm2-stage__header">
          <h1 className="rm2-stage__topic">
            {room.topic}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <StatusBadge status={room.status} phase={room.phase} extendRound={room.extendRound} lang={lang} />
            {room.status === 'live' && room.phase && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-fade)', letterSpacing: '0.1em' }}>
                R{(room.extendRound ?? 0) + 1} · {tRoom.phases[room.phase]}
              </span>
            )}
          </div>
        </div>

        {/* RoundTimeline */}
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

        {/* Faceoff */}
        <div className="rm2-faceoff">
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
            lang={lang}
          />
          <div className="rm2-faceoff__vs">
            <span className="hidden sm:inline"><VSMark size={70} /></span>
            <span className="sm:hidden"><VSMark size={48} /></span>
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
            lang={lang}
          />
        </div>

        {/* 투표 패널 (live) — only when room.status !== 'open' && !== 'ended' */}
        {room.status !== 'open' && room.status !== 'ended' && (
          <div className="rm2-votepanel">
            <div className="rm2-votepanel__eyebrow">{tRoom.voting.cta}</div>
            <VoteBar pro={proCount} con={conCount} variant="classic" size="md" lang={lang} />
          </div>
        )}

        {/* 관전자 투표 버튼 */}
        {room.status === 'live' && mySide === 'spectator' && user && (
          <div className="rm2-vote-btns">
            <button
              type="button"
              className={`rm2-vote-btn ${votes[user.uid] === 'pro' ? 'rm2-vote-btn--pro-active' : 'rm2-vote-btn--pro-idle'}`}
              onClick={() => vote('pro')}
            >
              {tRoom.voting.pro}
            </button>
            <button
              type="button"
              className={`rm2-vote-btn ${votes[user.uid] === 'con' ? 'rm2-vote-btn--con-active' : 'rm2-vote-btn--con-idle'}`}
              onClick={() => vote('con')}
            >
              {tRoom.voting.con}
            </button>
          </div>
        )}

        {/* open 안내 */}
        {room.status === 'open' && (
          <div className="rm2-open-note">
            {tRoom.statusOpen.waiting}
          </div>
        )}

        {/* AI 작성 중 알림 */}
        {room.status === 'live' && room.phase && aiBusy && (
          <div className="rm2-ai-busy">
            {tRoom.statusLive.aiThinking}
          </div>
        )}

        {/* 판정 블록 (ended) */}
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

      {/* ④ rm2-floor — 발언석 */}
      <div className="rm2-floor">
        <ObjectionOverlay
          key={objection?.key ?? 0}
          show={!!objection}
          side={objection?.side}
          kind={objection?.kind}
          label={objection?.label}
          onDone={() => setObjection(null)}
          lang={lang}
        />
        <div className="rm2-floor__header">
          <span className="rm2-floor__title">
            {lang === 'en' ? '💬 Debate Floor' : '💬 발언석'}
          </span>
          <span className="rm2-floor__id">#{roomId.slice(0, 8)}</span>
        </div>
        <div
          ref={scrollRef}
          className="rm2-floor__body"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={lang === 'en' ? 'Debate transcript' : '발언 기록'}
        >
          {messages.length === 0 ? (
            <p className="rm2-floor__empty">
              {room.status === 'open'
                ? (lang === 'en' ? 'When both debaters join, the AI moderator opens the debate.' : '두 토론자가 모이면 AI 사회자가 토론을 시작합니다.')
                : aiBusy
                  ? (lang === 'en' ? '🤖 AI moderator is preparing…' : '🤖 AI 사회자가 발언을 준비하고 있습니다…')
                  : (lang === 'en' ? 'Please wait a moment.' : '잠시만 기다려주세요.')}
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
            <div className="ai-progress">
              <div className="ai-progress__row">
                <span className="ai-progress__icon" aria-hidden="true">🤖</span>
                <span className="ai-progress__text">
                  {tRoom.statusLive.aiThinking}
                  <span className="ai-progress__sub">{tRoom.statusLive.aiThinkingHint}</span>
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

      {/* ⑤ rm2-composer — 입력 */}
      {room.status === 'live' && isMyTurn && room.phase && (
        <div className="rm2-composer">
          <PhaseGuide phase={room.phase} side={mySide as Side} lang={lang} />
          <div className="rm2-composer__row">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tRoom.statusLive.placeholder(tRoom.phases[room.phase])}
              aria-label={tRoom.statusLive.composerAriaLabel(tRoom.phases[room.phase])}
              rows={4}
              className="rm2-composer__textarea"
            />
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || polishing}
              className="rm2-composer__send"
            >
              {polishing ? tCommon.actions.polishing : tCommon.actions.send}
            </button>
          </div>
          <label className="rm2-composer__tidy">
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
            <span className="rm2-composer__tidy-label">{tRoom.statusLive.autoTidy}</span>
            <span className="rm2-composer__tidy-hint">— {tRoom.statusLive.autoTidyHelp}</span>
          </label>
        </div>
      )}

      {room.status === 'live' && (mySide === 'pro' || mySide === 'con') && !isMyTurn && (
        <p className="rm2-wait">
          {tRoom.statusLive.waitYourTurn(
            currentSpeakerSide === 'pro'
              ? tRoom.statusLive.proTurn
              : currentSpeakerSide === 'con'
                ? tRoom.statusLive.conTurn
                : tRoom.statusLive.modTurn,
          )}
        </p>
      )}

      {room.status === 'live' && mySide === 'spectator' && (
        <p className="rm2-wait">{tRoom.statusLive.spectatorNote}</p>
      )}

      {/* ⑥ ChatPanel — 관전자 채팅 */}
      {db && (
        <ChatPanel
          title={tRoom.spectator.chatTitle}
          collectionRef={collection(db, 'rooms', roomId, 'spectator_messages')}
          user={user}
          myName={displayNameOf(profile, user)}
          myAvatarId={profile?.avatarId}
          myAvatarDataUrl={profile?.avatarDataUrl ?? null}
          canPost={!!user && mySide === 'spectator'}
          postDisabledHint={tRoom.spectator.postDisabledHint}
          emptyHint={tRoom.spectator.emptyHint}
          height={200}
          lang={lang}
        />
      )}
    </div>
  );
}

function ProfileView({
  user,
  profile,
  onBack,
  lang,
}: {
  user: User;
  profile: UserProfile | null;
  onBack: () => void;
  lang: Lang;
}) {
  const tProf = profileStrings[lang];
  const tCommon = commonStrings[lang];
  const [nickname, setNickname] = useState(profile?.nickname ?? user.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    setNickname(profile?.nickname ?? user.displayName ?? '');
  }, [profile?.nickname, user.displayName]);

  const setAvatarPreset = async (id: AvatarId) => {
    if (!db) return;
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatarId: id,
        avatarDataUrl: null,
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      showToast(tProf.avatar.changeFail(`${err.code ?? ''} ${err.message ?? ''}`), 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const onUploadFile = async (file: File) => {
    if (!db) return;
    if (!file.type.startsWith('image/')) {
      showToast(tProf.avatar.onlyImage, 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast(tProf.avatar.tooBig, 'error');
      return;
    }
    setSavingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 240, 0.85);
      // Firestore doc field max ~1MB. JPEG 240x240 q0.85 typically ~30-80KB.
      if (dataUrl.length > 900_000) {
        showToast(tProf.avatar.tooLargeAfter, 'error');
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        avatarDataUrl: dataUrl,
        avatarId: 'custom',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      showToast(tProf.avatar.uploadFail(err.message ?? ''), 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const save = async () => {
    if (!db) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      showToast(tProf.nicknameRequired, 'error');
      return;
    }
    if (trimmed.length > 20) {
      showToast(tProf.nicknameTooLong, 'error');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { nickname: trimmed });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      showToast(tCommon.toast.nicknameSaveFail(`${err.code ?? ''} ${err.message ?? ''}`), 'error');
    } finally {
      setSaving(false);
    }
  };

  const winsHuman = profile?.winsVsHuman ?? 0;
  const lossesHuman = profile?.lossesVsHuman ?? 0;
  const tiesHuman = profile?.tiesVsHuman ?? 0;
  const winsAi = profile?.winsVsAi ?? 0;
  const lossesAi = profile?.lossesVsAi ?? 0;
  const tiesAi = profile?.tiesVsAi ?? 0;
  const wins = winsHuman + winsAi;
  const losses = lossesHuman + lossesAi;
  const ties = tiesHuman + tiesAi;
  const total = profile?.totalDebates ?? wins + losses + ties;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const totalHuman = winsHuman + lossesHuman + tiesHuman;
  const winRateHuman = totalHuman > 0 ? Math.round((winsHuman / totalHuman) * 100) : 0;
  const totalAi = winsAi + lossesAi + tiesAi;
  const winRateAi = totalAi > 0 ? Math.round((winsAi / totalAi) * 100) : 0;
  const dirty = (profile?.nickname ?? '') !== nickname.trim();

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="btn btn-ghost text-sm"
        style={{ padding: '4px 10px' }}
      >
        {tCommon.actions.back}
      </button>

      {/* v2: editorial profile header + tabs (내 기록 / 뱃지 / 리그 순위).
          Live history/badges/ranking from Firestore via useProfileStats hook. */}
      {profile && (
        <Suspense fallback={<LazyFallback />}>
          <ProfileV2Stats profile={profile} uid={user.uid} totalDebates={total} />
        </Suspense>
      )}

      <section
        className="sketchy paper-grain p-3 sm:p-5 space-y-4"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--color-ink)' }}>
          <span
            className="inline-block px-2 -rotate-1"
            style={{ background: 'var(--color-vermillion)', color: 'var(--color-paper-light)' }}
          >
            {tProf.title}
          </span>
        </h2>

        <div className="flex items-center gap-4">
          <ProfileAvatar
            avatarId={profile?.avatarId as AvatarId | undefined}
            avatarDataUrl={profile?.avatarDataUrl}
            size={84}
          />
          <div className="flex-1">
            <label
              className="block text-xs mb-1"
              style={{ color: 'var(--color-ink-fade)' }}
            >
              {tProf.googleAccount}
            </label>
            <p className="text-sm m-0" style={{ color: 'var(--color-ink)' }}>
              {user.displayName ?? tCommon.common.anonymous} · {user.email ?? '—'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
            {tProf.avatar.preset}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEFAULT_AVATARS.map((a) => {
              const selected =
                !profile?.avatarDataUrl &&
                ((profile?.avatarId as AvatarId | undefined) ?? 'char1') === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAvatarPreset(a.id)}
                  disabled={savingAvatar}
                  className="card p-2 flex flex-col items-center gap-1"
                  style={{
                    background: selected
                      ? 'var(--color-vermillion-tint)'
                      : 'var(--color-paper-light)',
                    border: selected
                      ? '1px solid var(--color-vermillion)'
                      : 'var(--border-line)',
                    borderRadius: 'var(--r-md)',
                    boxShadow: selected ? 'var(--glow-pro)' : 'var(--shadow-sm)',
                    cursor: savingAvatar ? 'wait' : 'pointer',
                  }}
                >
                  <ProfileAvatar avatarId={a.id} size={56} />
                  <div
                    className="font-bold"
                    style={{
                      fontSize: 12,
                      color: selected ? 'var(--color-vermillion)' : 'var(--color-ink)',
                    }}
                  >
                    {a.name}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-ink-fade)' }}>
                    {a.tagline}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <label
              className={savingAvatar ? 'btn opacity-50' : 'btn'}
              style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}
            >
              {tProf.avatar.uploadPhoto}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={savingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            {profile?.avatarDataUrl && (
              <button
                onClick={() => setAvatarPreset('char1')}
                disabled={savingAvatar}
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: 12 }}
              >
                {tProf.avatar.resetToDefault}
              </button>
            )}
            <span className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
              {tProf.avatar.autoResize}
            </span>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-bold mb-1"
            style={{ color: 'var(--color-ink)' }}
          >
            {tProf.nicknameLabel}
          </label>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder={tProf.nicknamePlaceholder}
              className="input-paper flex-1"
            />
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="btn btn-pri"
            >
              {saving ? tProf.nicknameSaving : tProf.nicknameSave}
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
            {tProf.nicknameHint}
          </p>
        </div>
      </section>

      <section
        className="sketchy paper-grain p-3 sm:p-5"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <h2 className="text-2xl font-bold mb-4 m-0" style={{ color: 'var(--color-ink)' }}>
          {tProf.stats.summary}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label={tProf.stats.total(total)} value={total} />
          <StatBox label={tProf.stats.winRate} value={`${winRate}%`} />
          <StatBox label={tProf.stats.wins} value={wins} accent="pro" />
          <StatBox label={tProf.stats.losses} value={losses} accent="con" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div
            className="p-3"
            style={{
              border: '1px solid var(--color-celadon)',
              background: 'var(--color-celadon-tint)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--glow-con)',
            }}
          >
            <div className="font-bold mb-1" style={{ color: 'var(--color-celadon)' }}>
              {tProf.stats.vsHumanFull}
            </div>
            <div style={{ color: 'var(--color-ink)' }}>
              {winsHuman}{tProf.stats.wins} {lossesHuman}{tProf.stats.losses}{tiesHuman > 0 ? ` ${tiesHuman}${tProf.stats.ties}` : ''}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
              {tProf.stats.winRateShort(winRateHuman)} · {tProf.stats.totalShort(totalHuman)}
            </div>
          </div>
          <div
            className="p-3"
            style={{
              border: '1px solid var(--color-vermillion)',
              background: 'var(--color-vermillion-tint)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--glow-pro)',
            }}
          >
            <div className="font-bold mb-1" style={{ color: 'var(--color-vermillion)' }}>
              {tProf.stats.vsAiFull}
            </div>
            <div style={{ color: 'var(--color-ink)' }}>
              {winsAi}{tProf.stats.wins} {lossesAi}{tProf.stats.losses}{tiesAi > 0 ? ` ${tiesAi}${tProf.stats.ties}` : ''}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
              {tProf.stats.winRateShort(winRateAi)} · {tProf.stats.totalShort(totalAi)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h1 className="text-xl font-bold">🔥 토론배틀 — 설정 필요</h1>
        <p className="text-sm text-zinc-400">
          Firebase 설정이 없습니다. <code className="text-emerald-400">.env</code>에 키를 채워주세요.
        </p>
      </div>
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
