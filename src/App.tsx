import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
  AIModCard,
  DEFAULT_AVATARS,
  type AvatarId,
  Nameplate,
  Ornament,
  ProfileAvatar,
  RoundTimeline,
  VSMark,
  VoteBar,
} from './components/common';
// v2 lazy screens — full-bleed Verdict overlay, profile leaderboard etc.
const VerdictViewLazy = lazy(() =>
  import('./components/VerdictView').then((m) => ({ default: m.VerdictView })),
);
const ProfileViewV2Lazy = lazy(() =>
  import('./components/ProfileViewV2').then((m) => ({ default: m.ProfileViewV2 })),
);
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
import { verdictStrings } from './i18n/verdict';
import { profileStrings } from './i18n/profile';
import { useTheme, type Theme } from './hooks/useTheme';
import { useProfileStats } from './hooks/useProfileStats';
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

function LazyFallback() {
  return (
    <div
      style={{
        padding: '120px 20px',
        textAlign: 'center',
        color: 'var(--color-ink-fade)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.18em',
      }}
    >
      LOADING…
    </div>
  );
}
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

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

const AI_NAME = '🤖 AI 사회자';

function displayNameOf(profile: UserProfile | null, user: User | null) {
  return profile?.nickname?.trim() || user?.displayName || '익명';
}

function resizeImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 디코드 실패'));
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const scale = Math.min(1, maxSize / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 사용 불가'));
          return;
        }
        ctx.fillStyle = '#fcf6e8';
        ctx.fillRect(0, 0, tw, th);
        ctx.drawImage(img, 0, 0, tw, th);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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

/** v2 empty-state — "비어있지만 의도된 멋진 무대" 신문 1면 톤.
 *  회전 도장(stamp) + eyebrow + serif 헤드라인 + 손글씨 1줄 + 단일 골드 CTA.
 *  Mirrors the bottom "찾는 논제가 없는가?" block from `screen-lobby.jsx`. */
function LobbyEmptyCTA({ lang }: { lang: Lang }) {
  return (
    <div className="lb2-empty-stage" role="region" aria-label={lang === 'en' ? 'Empty lobby' : '빈 토론장'}>
      <span aria-hidden="true" className="lb2-empty-stage__corner lb2-empty-stage__corner--tl" />
      <span aria-hidden="true" className="lb2-empty-stage__corner lb2-empty-stage__corner--br" />

      <span className="stamp stamp--ink lb2-empty-stage__stamp" aria-hidden="true">
        {lang === 'en' ? 'OPEN STAGE' : '무대 개방'}
      </span>

      <div className="lb2-empty-stage__eyebrow">
        {lang === 'en' ? 'No live debates · Be the first' : '진행 중인 토론 없음 · 첫 무대'}
      </div>

      <h3 className="serif-display lb2-empty-stage__title">
        {lang === 'en' ? "Don't see your topic?" : '찾는 논제가 없는가?'}
      </h3>

      <span aria-hidden="true" className="lb2-empty-stage__rule" />

      <p className="lb2-empty-stage__sub hand" style={{ marginBottom: 0 }}>
        {lang === 'en'
          ? 'Open the stage now and be the first debater — use the “Create room” button above.'
          : '지금 무대를 열면 첫 토론자다. 위의 ‘토론방 만들기’ 버튼으로 무대를 열어보세요.'}
      </p>
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

  // 스크롤 투명도 페이드 제거 — 헤더를 히어로와 동일한 크림 그라데이션(--grad-paper)으로
  // 항상 불투명하게 고정한다. 지금 랜딩 상단에서 비쳐 보이던 "명암 추가된 크림"을 그대로
  // 헤더 배경으로 입힌 것. 경계선·블러 없이 히어로 톤과 한 면처럼 이어진다.
  return (
    <header
      className="sticky top-0 z-10 header-game"
      style={{ background: 'var(--grad-paper)' }}
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
      .lb2-hero{position:relative;overflow:hidden;color:#fcf6e8;
        background:radial-gradient(circle at 35% 50%,rgba(255,255,255,0.05),transparent 35%),
          linear-gradient(135deg,#35684f 0%,#173429 100%);
        padding:84px 80px 72px;min-height:700px;box-sizing:border-box;
        display:flex;align-items:center}
      .lb2-hero__glow{position:absolute;inset:0;pointer-events:none;
        background:radial-gradient(70% 60% at 14% -10%,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0) 60%)}
      .lb2-hero__inner{position:relative;width:100%;max-width:1360px;margin:0 auto;z-index:1;
        display:grid;grid-template-columns:0.9fr 1.1fr;gap:72px;align-items:center}
      .lb2-hero__left{position:relative;min-width:0}
      .lb2-hero__eyebrow{display:inline-flex;align-items:center;gap:12px;
        font-family:var(--font-mono);font-weight:700;font-size:15px;
        letter-spacing:0.14em;color:#f0cf7e;white-space:nowrap}
      .lb2-hero__eyebrow-line{width:26px;height:2px;background:#f0cf7e;display:inline-block;flex-shrink:0}
      .lb2-hero__title{margin:20px 0 0;line-height:0.9}
      .lb2-hero__wordmark{position:relative;display:inline-block;
        font-family:var(--font-serif);font-weight:800;
        font-size:clamp(72px,8vw,108px);letter-spacing:-0.05em;color:#fff7e8}
      .lb2-hero__chalk-wrap{position:relative;display:inline-block}
      .lb2-hero__chalk-line{position:absolute;left:-1%;bottom:-0.2em;width:102%;height:0.22em;overflow:visible}
      .lb2-hero__gold-dot{display:inline-block;width:0.3em;height:0.4em;
        margin-left:0.04em;vertical-align:baseline}
      .lb2-hero__lead{max-width:440px;margin:34px 0 0;font-size:20px;line-height:1.75;
        font-weight:700;color:rgba(255,247,232,0.88);word-break:keep-all}
      .lb2-hero__create-wrap{margin-top:40px}
      .lb2-hero__create{display:inline-flex;align-items:center;justify-content:center;gap:10px;
        height:64px;padding:0 36px;border-radius:999px;border:none;cursor:pointer;
        background:linear-gradient(180deg,#ffe49a 0%,#f0ce72 100%);
        color:#10291f;box-shadow:0 16px 34px -14px rgba(0,0,0,0.4);
        font-family:var(--font-body);font-weight:900;font-size:19px;white-space:nowrap}
      .lb2-hero__stats{margin-top:44px;padding-top:28px;border-top:1px solid rgba(255,255,255,0.18)}
      .lb2-hero__stats-row{display:flex;align-items:flex-start;gap:30px;flex-wrap:wrap}
      .lb2-hero__stat{display:flex;flex-direction:column;gap:7px}
      .lb2-hero__stat-n{font-family:var(--font-serif);font-weight:800;font-size:44px;
        line-height:1;letter-spacing:-0.02em}
      .lb2-hero__stat-l{font-family:var(--font-body);font-weight:700;font-size:15px;
        color:rgba(255,247,232,0.72);white-space:nowrap}
      .lb2-hero__stat-sep{align-self:stretch;width:1px;background:rgba(252,246,232,0.18)}
      .lb2-hero__pulse{display:inline-flex;align-items:center;gap:8px;margin-top:22px}
      .lb2-hero__pulse-dot{width:8px;height:8px;border-radius:50%;background:#7fae8a;
        box-shadow:0 0 8px 1px rgba(127,174,138,0.6);
        animation:tb-pulse-lobby 1.8s ease-in-out infinite}
      .lb2-hero__pulse-txt{font-family:var(--font-mono);font-weight:600;font-size:12px;
        letter-spacing:0.04em;color:rgba(252,246,232,0.5);white-space:nowrap}
      /* 우측 라이브 카드 */
      .lb2-hero__card{position:relative;justify-self:stretch;width:100%;max-width:720px;
        border-radius:28px;background:rgba(16,38,30,0.86);
        box-shadow:0 32px 80px -36px rgba(0,0,0,0.6);
        border:1px solid rgba(240,206,114,0.22);
        padding:32px 42px 34px;box-sizing:border-box}
      .lb2-hero__live-tag{display:flex;align-items:center;gap:13px;flex-wrap:wrap}
      .lb2-hero__live-pill{display:inline-flex;align-items:center;gap:8px;
        padding:8px 16px 8px 13px;border-radius:999px;
        font-family:var(--font-mono);font-weight:900;font-size:13.5px;
        letter-spacing:0.08em;background:#d94a22;color:#fff;
        box-shadow:0 8px 20px -8px rgba(200,75,31,0.85)}
      .lb2-hero__live-dot{width:8px;height:8px;border-radius:50%;background:#fff;
        box-shadow:0 0 9px 1px rgba(255,255,255,0.85);
        animation:tb-pulse-lobby 1.6s ease-in-out infinite}
      .lb2-hero__live-label{display:inline-flex;align-items:center;gap:8px;
        font-family:var(--font-mono);font-weight:700;font-size:14px;
        letter-spacing:0.12em;color:#f0cf7e;white-space:nowrap}
      .lb2-hero__card-topic{margin:24px 0 0;font-family:var(--font-serif);font-weight:800;
        font-size:clamp(28px,2.7vw,37px);line-height:1.25;letter-spacing:-0.03em;
        color:#fff7e8;word-break:keep-all}
      .lb2-hero__card-meta{margin:18px 0 0;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
      .lb2-hero__flag-chip{display:inline-flex;align-items:center;gap:6px;
        padding:8px 16px;border-radius:999px;background:rgba(232,99,45,0.18);color:#ff9d7a;
        font-family:var(--font-mono);font-weight:800;font-size:14px;
        box-shadow:inset 0 0 0 1px rgba(232,99,45,0.4);white-space:nowrap}
      .lb2-hero__round-meta{display:inline-flex;align-items:center;gap:7px;
        font-family:var(--font-mono);font-weight:600;font-size:15px;
        color:rgba(255,247,232,0.78);white-space:nowrap}
      .lb2-hero__round-dot{width:7px;height:7px;border-radius:50%;background:#ff7a52;
        animation:tb-pulse-lobby 1.6s ease-in-out infinite}
      .lb2-hero__votes-meta{font-family:var(--font-mono);font-weight:600;font-size:15px;
        color:rgba(255,247,232,0.72);white-space:nowrap}
      /* 우측 스코어보드 */
      .lb2-hero__board{position:relative;border-radius:22px;
        background:rgba(255,255,255,0.045);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.10);
        padding:26px 28px 24px;margin-top:26px}
      .lb2-hero__board-clock{text-align:center;margin-bottom:18px;
        font-family:var(--font-mono);font-weight:900;font-size:18px;
        letter-spacing:0.06em;color:#fcf6e8;line-height:1.1;font-variant-numeric:tabular-nums}
      .lb2-hero__board-phase{font-family:var(--font-mono);font-weight:600;font-size:11.5px;
        letter-spacing:0.12em;color:rgba(252,246,232,0.55);margin-top:3px}
      .lb2-hero__sides{display:flex;align-items:flex-start;justify-content:space-between;gap:4px}
      .lb2-hero__side{display:flex;flex-direction:column;align-items:center;gap:9px;min-width:0;flex:1}
      .lb2-hero__side-role{font-family:var(--font-mono);font-weight:700;font-size:13px;
        letter-spacing:0.12em;margin-top:2px}
      .lb2-hero__side-name{font-family:var(--font-serif);font-weight:800;font-size:16px;
        line-height:1.25;color:#fff7e8;text-align:center;max-width:120px;min-height:40px;
        display:flex;align-items:center;justify-content:center;word-break:keep-all}
      .lb2-hero__side-score{font-family:var(--font-serif);font-weight:800;font-size:40px;
        line-height:1}
      .lb2-hero__side-v{font-family:var(--font-mono);font-weight:600;font-size:13px;
        color:rgba(252,246,232,0.5);margin-left:3px}
      .lb2-hero__vs{font-family:var(--font-hand,cursive);font-weight:700;font-size:22px;
        color:rgba(252,246,232,0.6);padding-top:30px;flex-shrink:0}
      .lb2-hero__votebar{display:flex;height:10px;border-radius:999px;overflow:hidden;
        background:rgba(0,0,0,0.3);margin-top:18px}
      .lb2-hero__votebar-pro{background:linear-gradient(90deg,#c84b1f,#e8825e)}
      .lb2-hero__votebar-con{background:linear-gradient(90deg,#6a93a3,#2d4a5a)}
      .lb2-hero__cta{width:100%;height:58px;margin-top:20px;border-radius:16px;border:none;
        cursor:pointer;background:linear-gradient(180deg,#ffe49a,#f0ce72);
        color:#10291f;box-shadow:0 12px 26px -14px rgba(240,207,126,0.6);
        font-family:var(--font-body);font-weight:900;font-size:18px}
      /* 폴백 — live 없을 때 */
      .lb2-hero__fallback{position:relative;justify-self:stretch;width:100%;max-width:720px;
        border-radius:28px;border:2px dashed rgba(240,206,114,0.35);
        padding:48px 42px;box-sizing:border-box;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:16px;text-align:center}
      .lb2-hero__fallback-icon{font-family:var(--font-serif);font-weight:800;font-size:52px;
        color:rgba(240,206,114,0.45);line-height:1}
      .lb2-hero__fallback-title{font-family:var(--font-serif);font-weight:800;font-size:22px;
        color:rgba(255,247,232,0.7);letter-spacing:-0.02em;word-break:keep-all}
      .lb2-hero__fallback-sub{font-family:var(--font-body);font-size:14px;
        color:rgba(255,247,232,0.45);word-break:keep-all}
      .lb2-hero__fallback-btn{display:inline-flex;align-items:center;gap:9px;
        padding:14px 28px;border-radius:999px;border:none;cursor:pointer;
        background:rgba(240,206,114,0.18);color:#f0cf7e;
        box-shadow:inset 0 0 0 1px rgba(240,206,114,0.35);
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
      .lb2-bar{position:sticky;top:0;z-index:20;background:rgba(246,240,226,0.97);
        backdrop-filter:blur(8px);border-bottom:1px solid var(--color-line);
        box-shadow:0 1px 0 rgba(40,60,45,0.04);padding:14px 64px}
      .lb2-bar__inner{max-width:1216px;margin:0 auto;display:flex;align-items:center;
        gap:14px;flex-wrap:wrap}
      .lb2-bar__title{display:inline-flex;align-items:center;gap:8px;
        font-family:var(--font-serif);font-weight:800;font-size:17px;color:var(--color-ink);white-space:nowrap}
      .lb2-bar__title-icon{width:26px;height:26px;border-radius:8px;background:var(--color-celadon);color:#fff;
        display:inline-flex;align-items:center;justify-content:center;
        font-family:var(--font-serif);font-weight:800;font-size:14px;flex-shrink:0}
      .lb2-bar__search{flex:1;min-width:200px;max-width:460px;display:inline-flex;align-items:center;
        gap:9px;padding:10px 16px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1px #e3d9c2}
      .lb2-bar__search input{flex:1;border:none;outline:none;background:transparent;
        font-family:var(--font-body);font-size:14px;color:var(--color-ink)}
      .lb2-bar__clear{border:none;background:transparent;cursor:pointer;
        color:var(--color-ink-fade);font-size:16px;padding:0}
      .lb2-bar__chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .lb2-bar__chip{padding:7px 13px;border-radius:999px;border:none;cursor:pointer;white-space:nowrap;
        font-family:var(--font-mono);font-weight:700;font-size:12px;letter-spacing:0.02em;
        transition:all .14s ease}
      .lb2-bar__chip[aria-pressed="true"]{background:var(--color-ink);color:#fcf6e8;box-shadow:none}
      .lb2-bar__chip[aria-pressed="false"]{background:transparent;color:var(--color-ink-soft);
        box-shadow:inset 0 0 0 1px #d9cdb4}
      .lb2-bar__create{margin-left:auto;display:inline-flex;align-items:center;gap:8px;
        padding:10px 20px;border-radius:999px;border:none;cursor:pointer;
        background:var(--color-celadon);color:#fff;box-shadow:0 10px 22px -10px var(--color-celadon);
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
      .lb2-card{position:relative;background:#fff;border-radius:20px;overflow:hidden;
        display:flex;flex-direction:column;
        box-shadow:0 22px 46px -30px rgba(40,60,45,0.45),0 0 0 1px rgba(0,0,0,0.04);
        transition:transform .16s ease,box-shadow .16s ease;cursor:pointer;border:none;text-align:left;
        width:100%;padding:0}
      .lb2-card:hover{transform:translateY(-3px);
        box-shadow:0 30px 56px -28px rgba(40,60,45,0.5),0 0 0 1px rgba(0,0,0,0.05)}
      .lb2-card--live{border-top:3px solid var(--color-vermillion)}
      .lb2-card--open{border-top:3px solid var(--color-gold)}
      .lb2-card--ended{border-top:3px solid #cdbf9f}
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
      .lb2-cta--live{background:var(--color-vermillion);color:#fff;
        box-shadow:0 10px 22px -10px var(--color-vermillion)}
      .lb2-cta--open{background:var(--color-celadon);color:#fff;
        box-shadow:0 10px 22px -10px var(--color-celadon);
        width:calc(100% - 40px);margin:0 20px;justify-content:center;
        padding:11px 20px;font-size:14.5px}
      .lb2-cta--ended{background:#ece4d3;color:var(--color-ink-soft);padding:9px 16px}
      .lb2-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;
        font-family:var(--font-mono);font-weight:700;font-size:10.5px;letter-spacing:0.12em;white-space:nowrap}
      .lb2-pill--live{background:var(--color-vermillion);color:#fff;
        box-shadow:0 6px 14px -6px rgba(200,75,31,0.7)}
      .lb2-pill--open{background:var(--color-gold-tint,#fdf4e0);color:var(--color-gold);
        box-shadow:inset 0 0 0 1px rgba(184,132,42,0.4)}
      .lb2-pill--ended{background:#ece4d3;color:var(--color-ink-fade);
        box-shadow:inset 0 0 0 1px rgba(122,100,80,0.25)}
      .lb2-pill__dot{width:7px;height:7px;border-radius:50%;background:currentColor;
        animation:tb-pulse-lobby 1.6s ease-in-out infinite}
      .lb2-votebar{display:flex;align-items:center;gap:8px;padding:16px 20px 0}
      .lb2-votebar__bar{flex:1;position:relative;display:flex;height:24px;border-radius:999px;
        overflow:hidden;background:#f0ead9}
      .lb2-votebar__pro{background:var(--color-vermillion);display:flex;align-items:center;
        padding-left:9px;color:#fff;font-family:var(--font-mono);font-weight:700;font-size:10.5px}
      .lb2-votebar__con{background:var(--color-celadon);display:flex;align-items:center;
        justify-content:flex-end;padding-right:9px;color:#fff;
        font-family:var(--font-mono);font-weight:700;font-size:10.5px}
      .lb2-votebar__pro--win{box-shadow:inset 0 0 0 2px var(--color-gold)}
      .lb2-votebar__con--win{box-shadow:inset 0 0 0 2px var(--color-gold)}
      .lb2-votebar__tie{position:absolute;left:50%;top:0;bottom:0;width:2px;
        transform:translateX(-50%);background:var(--color-gold)}
      .lb2-open-seat{margin:16px 20px 0;display:flex;align-items:center;gap:10px;
        padding:11px 14px;border-radius:14px;background:var(--color-gold-tint,#fdf4e0)}
      .lb2-open-seat__plus{width:30px;height:30px;border-radius:50%;flex-shrink:0;
        display:inline-flex;align-items:center;justify-content:center;
        font-family:var(--font-serif);font-weight:800;font-size:17px}
      .lb2-open-seat__txt{font-family:var(--font-body);font-weight:700;font-size:13.5px;
        color:var(--color-ink-soft);line-height:1.35}
      .lb2-result-score{margin:14px 20px 0;display:flex;align-items:baseline;
        justify-content:center;gap:14px;padding:6px 0}
      .lb2-mine-badge{position:absolute;top:10px;right:44px;padding:3px 10px;border-radius:999px;
        font-family:var(--font-mono);font-weight:700;font-size:10px;letter-spacing:0.08em;
        background:var(--color-gold);color:#fff;z-index:2;pointer-events:none}
      .lb2-card__del{position:absolute;top:10px;right:8px;z-index:3;
        background:transparent;border:none;cursor:pointer;font-size:16px;
        padding:4px 7px;border-radius:6px;opacity:0.6;transition:opacity .14s}
      .lb2-card__del:hover{opacity:1}
      .lb2-empty-card{position:relative;background:transparent;border-radius:20px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        min-height:140px;cursor:pointer;border:2px dashed var(--color-paper-deep);
        transition:border-color .14s,background .14s;padding:20px;width:100%;box-sizing:border-box}
      .lb2-empty-card:hover{border-color:var(--color-celadon);background:rgba(45,74,90,0.04)}
      .lb2-empty-card__plus{font-size:28px;color:var(--color-ink-fade);line-height:1}
      .lb2-empty-card__label{font-family:var(--font-body);font-weight:700;font-size:14px;
        color:var(--color-ink-soft);text-align:center;word-break:keep-all}
      /* 방 0건 빈 상태 — 신문 1면 "빈 무대" 톤 */
      .lb2-empty-stage{position:relative;max-width:560px;margin:8px auto 0;
        padding:44px 32px 40px;text-align:center;
        background:color-mix(in srgb, var(--color-paper-light) 70%, transparent);
        border:1.5px dashed color-mix(in srgb, var(--color-ink) 22%, transparent);
        border-radius:4px}
      .lb2-empty-stage__corner{position:absolute;width:18px;height:18px;
        border:2px solid var(--color-ink-soft);opacity:0.55}
      .lb2-empty-stage__corner--tl{top:10px;left:10px;border-right:none;border-bottom:none}
      .lb2-empty-stage__corner--br{bottom:10px;right:10px;border-left:none;border-top:none}
      .lb2-empty-stage__stamp{margin-bottom:14px;font-size:13px;letter-spacing:0.14em}
      .lb2-empty-stage__eyebrow{font-family:var(--font-mono);font-weight:700;font-size:11px;
        letter-spacing:0.18em;text-transform:uppercase;color:var(--color-ink-fade);
        word-break:keep-all;margin-bottom:10px}
      .lb2-empty-stage__title{font-size:30px;font-weight:800;letter-spacing:-0.02em;
        color:var(--color-ink);margin:0;line-height:1.18;word-break:keep-all}
      .lb2-empty-stage__rule{display:block;width:48px;height:2px;margin:16px auto;
        background:var(--color-vermillion)}
      .lb2-empty-stage__sub{font-size:18px;color:var(--color-ink-soft);
        margin:0 0 24px;word-break:keep-all}
      .lb2-empty-stage__cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;
        min-height:48px;padding:0 26px;border:none;cursor:pointer;border-radius:999px;
        background:var(--color-vermillion);color:var(--color-paper-light);
        font-family:var(--font-body);font-weight:800;font-size:16px;white-space:nowrap;
        box-shadow:0 10px 26px -12px color-mix(in srgb, var(--color-vermillion) 80%, transparent);
        transition:transform .14s,box-shadow .14s}
      .lb2-empty-stage__cta:hover{transform:translateY(-1px);
        box-shadow:0 14px 30px -12px color-mix(in srgb, var(--color-vermillion) 90%, transparent)}
      @media(max-width:520px){
        .lb2-empty-stage{padding:36px 20px 34px}
        .lb2-empty-stage__title{font-size:24px}
        .lb2-empty-stage__sub{font-size:16px}
      }
      .lb2-clear-btn{display:block;margin:12px auto 0;padding:9px 20px;border-radius:999px;
        border:none;cursor:pointer;font-family:var(--font-mono);font-weight:700;font-size:12px;
        background:transparent;color:var(--color-ink-soft);box-shadow:inset 0 0 0 1.5px #d9cdb4;
        transition:all .14s}
      .lb2-clear-btn:hover{background:var(--color-ink);color:#fcf6e8}
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
      <section id="create" style={{ maxWidth: 1216, margin: '32px auto 0', padding: '0 64px' }}>
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

      {/* 가이드 마법사 모달 — 기능 100% 보존 */}
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
    </>
  );
}

/** 핸드오프 슬림 카드 — LiveCard / JoinCard / ResultCard 3종 통합
 *  실데이터 기반: proVotes/conVotes는 live 방 votes 구독값, finalProScore는 ended 방 실데이터.
 *  viewers/타이머 없음 — R{n}/{total}·phase 라벨로 대체. 관전급증 없음. */
function LobbyRoomCard({
  room,
  onEnter,
  onDelete,
  isMine,
  proVotes,
  conVotes,
}: {
  room: Room;
  onEnter: (id: string) => void;
  onDelete: (id: string) => void;
  isMine: boolean;
  isHot: boolean; // kept for prop compat — not used visually in slim design
  proVotes: number;
  conVotes: number;
}) {
  const isAiGame = room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
  const proPct = typeof room.finalProScore === 'number' ? room.finalProScore : 50;
  const conPct = 100 - proPct;
  const winner = room.winner;
  const phaseLabel = room.phase ? PHASE_LABEL[room.phase] : '';
  const round = (room.extendRound ?? 0) + 1;
  const totalRounds = room.plannedRounds ?? 1;

  // live 방 실득표 계산 (MiniVoteBar + FlagChip용)
  const liveTotalVotes = proVotes + conVotes;
  const liveProPct = liveTotalVotes > 0 ? Math.round((proVotes / liveTotalVotes) * 100) : 50;
  const liveConPct = 100 - liveProPct;
  // 플래그: 접전(차이 ≤10%p, 총표≥1), 마지막/종반 라운드. 관전급증 없음.
  const isClose = liveTotalVotes > 0 && Math.abs(liveProPct - 50) <= 10;
  const isLastRound = round >= totalRounds;
  const isNearEnd = round === totalRounds - 1;

  // 빈 자리 신호 (JoinCard용)
  const openSide = !room.proUid ? 'pro' : !room.conUid ? 'con' : null;
  const openLabel = openSide === 'pro' ? '찬성' : openSide === 'con' ? '반대' : '양측';
  const sideColor = openSide === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';

  // 승자 표시 (ResultCard용)
  const resultLabel = winner === 'pro' ? '찬성 승' : winner === 'con' ? '반대 승' : winner === 'tie' ? '무승부' : '';
  const winColor = winner === 'pro' ? 'var(--color-vermillion)' : winner === 'con' ? 'var(--color-celadon)' : 'var(--color-gold)';

  const cardClass = classNames(
    'lb2-card',
    room.status === 'live' && 'lb2-card--live',
    room.status === 'open' && 'lb2-card--open',
    room.status === 'ended' && 'lb2-card--ended',
  );

  return (
    <div style={{ position: 'relative' }}>
      {isMine && (
        <span className="lb2-mine-badge" aria-label="내 방">내 방</span>
      )}
      <article className={cardClass} style={{ cursor: 'pointer' }} onClick={() => onEnter(room.id)}>
        {/* 상단 상태 바 */}
        <div className="lb2-card__topbar">
          {room.status === 'live' && (
            <span className="lb2-pill lb2-pill--live">
              <span className="lb2-pill__dot" aria-hidden="true" />
              LIVE
            </span>
          )}
          {room.status === 'open' && (
            <span className="lb2-pill lb2-pill--open">참가 가능</span>
          )}
          {room.status === 'ended' && (
            <span className="lb2-pill lb2-pill--ended">종료</span>
          )}

          {/* 부가 정보 */}
          {room.status === 'live' && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5,
              color: 'var(--color-ink-fade)', whiteSpace: 'nowrap',
            }}>
              R{round}/{totalRounds}{phaseLabel ? ` · ${phaseLabel}` : ''}
            </span>
          )}
          {/* FlagChip — 실득표 기준 접전/마지막라운드. 관전급증 없음 */}
          {room.status === 'live' && isClose && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: '#fff1ea', color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
              boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.28)', whiteSpace: 'nowrap',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill="var(--color-vermillion)" /></svg>
              접전 {liveProPct}:{liveConPct}
            </span>
          )}
          {room.status === 'live' && !isClose && isLastRound && round > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: '#fff1ea', color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
              boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.28)', whiteSpace: 'nowrap',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 21V4M6 4.5c3-2 6 1 9-0.5v8c-3 1.5-6-1.5-9 0.5" stroke="var(--color-vermillion)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              마지막 라운드
            </span>
          )}
          {room.status === 'live' && !isClose && !isLastRound && isNearEnd && round > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: '#fff1ea', color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
              boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.28)', whiteSpace: 'nowrap',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 21V4M6 4.5c3-2 6 1 9-0.5v8c-3 1.5-6-1.5-9 0.5" stroke="var(--color-vermillion)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              종반 라운드
            </span>
          )}
          {room.status === 'open' && room.plannedRounds != null && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5,
              letterSpacing: '0.04em', color: 'var(--color-ink-fade)',
              padding: '5px 10px', borderRadius: 999,
              boxShadow: 'inset 0 0 0 1px #e3d9c2', whiteSpace: 'nowrap',
            }}>{room.plannedRounds}라운드</span>
          )}
          {room.status === 'ended' && resultLabel && (
            <span className="lb2-result-winner" style={{ color: winColor }}>
              {winner === 'tie'
                ? <span aria-hidden="true" style={{ width: 7, height: 7, background: winColor, transform: 'rotate(45deg)', display: 'inline-block' }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke={winColor} strokeWidth="2" strokeLinejoin="round"/><path d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9M10 13.5 9.5 17h5l-.5-3.5M8 20h8" stroke={winColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              {resultLabel}
            </span>
          )}

          {room.isPrivate && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, color: 'var(--color-ink-fade)', marginLeft: 'auto' }}>비공개</span>
          )}
          {isAiGame && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.1em', color: 'var(--color-celadon)',
              padding: '3px 8px', borderRadius: 999,
              boxShadow: 'inset 0 0 0 1px rgba(45,74,90,0.4)',
            }}>AI전</span>
          )}
        </div>

        {/* 논제 */}
        <h3 className="lb2-card__topic">
          <a
            className="lb2-card__link"
            href={`?room=${room.id}`}
            onClick={(e) => { e.preventDefault(); onEnter(room.id); }}
            aria-label={`${room.topic} ${room.status === 'live' ? '관전하기' : room.status === 'open' ? '참가하기' : '다시 보기'}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {room.topic}
          </a>
        </h3>

        {/* LiveCard: MiniVoteBar — 실득표 기반 */}
        {room.status === 'live' && (
          <div className="lb2-votebar">
            {/* 찬성 마스코트 */}
            {room.proAvatarDataUrl
              ? <img src={room.proAvatarDataUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{room.proUid === AI_OPPONENT_UID ? '🤖' : '🦊'}</span>
            }
            <div
              role="img"
              aria-label={`찬성 ${liveProPct}%, 반대 ${liveConPct}%`}
              className="lb2-votebar__bar"
            >
              <div className="lb2-votebar__pro" style={{ width: `${liveProPct}%` }}>{liveProPct}</div>
              <div className="lb2-votebar__con" style={{ width: `${liveConPct}%` }}>{liveConPct}</div>
            </div>
            {/* 반대 마스코트 */}
            {room.conAvatarDataUrl
              ? <img src={room.conAvatarDataUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{room.conUid === AI_OPPONENT_UID ? '🤖' : '🐻'}</span>
            }
          </div>
        )}

        {/* JoinCard: 빈 자리 신호 */}
        {room.status === 'open' && openSide != null && (
          <div className="lb2-open-seat">
            <span className="lb2-open-seat__plus" style={{ boxShadow: `inset 0 0 0 1.5px ${sideColor}`, color: sideColor }}>+</span>
            <span className="lb2-open-seat__txt">
              <b style={{ color: sideColor }}>{openLabel}</b> 자리 비어있음 · 바로 입장
            </span>
          </div>
        )}
        {room.status === 'open' && openSide == null && (
          <div className="lb2-open-seat">
            <span className="lb2-open-seat__plus" style={{ boxShadow: 'inset 0 0 0 1.5px var(--color-gold)', color: 'var(--color-gold)' }}>+</span>
            <span className="lb2-open-seat__txt">양측 모두 모집 중 · 먼저 선택</span>
          </div>
        )}

        {/* ResultCard: 최종 점수 */}
        {room.status === 'ended' && typeof room.finalProScore === 'number' && (
          <div className="lb2-result-score">
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 34, lineHeight: 1,
              color: 'var(--color-vermillion)', opacity: winner === 'con' ? 0.5 : 1,
            }}>{proPct}<span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>%</span></span>
            <span style={{ fontFamily: 'var(--font-hand,cursive)', fontWeight: 700, fontSize: 18, color: 'var(--color-ink-fade)' }}>:</span>
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 34, lineHeight: 1,
              color: 'var(--color-celadon)', opacity: winner === 'pro' ? 0.5 : 1,
            }}>{conPct}<span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>%</span></span>
          </div>
        )}

        {/* 득표바 — ended + finalProScore 있을 때만 (실데이터). live는 votes 서브컬렉션 구독 없어 집계 불가 → 표시 안 함 */}
        {room.status === 'ended' && typeof room.finalProScore === 'number' && (
          <div className="lb2-votebar">
            <div className="lb2-votebar__bar">
              <div
                className={classNames('lb2-votebar__pro', winner === 'pro' && 'lb2-votebar__pro--win')}
                style={{ width: `${proPct}%` }}
              >{proPct}</div>
              <div
                className={classNames('lb2-votebar__con', winner === 'con' && 'lb2-votebar__con--win')}
                style={{ width: `${conPct}%` }}
              >{conPct}</div>
              {winner === 'tie' && (
                <span className="lb2-votebar__tie" aria-hidden="true" />
              )}
            </div>
          </div>
        )}

        {/* CTA 푸터 */}
        <div className="lb2-card__footer">
          {room.status === 'live' && (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--color-ink-fade)', whiteSpace: 'nowrap' }}>
                {liveTotalVotes > 0
                  ? `${liveTotalVotes}표`
                  : `${room.proName ?? '?'} vs ${room.conName ?? '?'}`}
              </span>
              <span className="lb2-cta lb2-cta--live" style={{ marginLeft: 'auto' }}>관전하기 →</span>
            </>
          )}
          {room.status === 'open' && (
            <span className="lb2-cta lb2-cta--open">참가하기 →</span>
          )}
          {room.status === 'ended' && (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--color-ink-fade)', whiteSpace: 'nowrap' }}>
                {room.proName ?? '?'} vs {room.conName ?? '?'}
              </span>
              <span className="lb2-cta lb2-cta--ended" style={{ marginLeft: 'auto' }}>다시 보기</span>
            </>
          )}
        </div>
      </article>
      {/* 내 방 삭제 버튼 — 기존 동작 100% 보존 */}
      {isMine && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(room.id);
          }}
          className="lb2-card__del"
          title="삭제"
        >
          🗑
        </button>
      )}
    </div>
  );
}

/** HeaderSplit (시안 B 스플릿 스테이지) — 핸드오프 CombinedHeaders.jsx 1:1 이식.
 *  좌: 거대 "토론장" 타이틀 + 분필-골드 밑줄 + 리드 + 골드 CTA + BigStats(실카운트).
 *  우: live 방 있으면 다크 카드 + LiveTag + 논제 + 메타 + 스코어보드(실득표).
 *      없으면 폴백 플레이스홀더 카드(가짜 라이브 금지). */
function LobbyHeroSplit({
  featuredRoom,
  proVotes,
  conVotes,
  liveCount,
  openCount,
  endedCount,
  dateLabel,
  lang,
  onEnter,
  onCreate,
}: {
  featuredRoom: Room | null;
  proVotes: number;
  conVotes: number;
  liveCount: number;
  openCount: number;
  endedCount: number;
  dateLabel: string;
  lang: 'ko' | 'en';
  onEnter: (id: string) => void;
  onCreate: () => void;
}) {
  const room = featuredRoom;

  // --- 스코어보드 데이터 계산 ---
  const totalVotes = proVotes + conVotes;
  const proPct = totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 50;
  const conPct = 100 - proPct;

  // 플래그칩 (실득표 접전 ≤10%p, 총표≥1 + 라운드 접근) — 관전급증 금지
  let flagText: string | null = null;
  if (room) {
    const roundNum = (room.extendRound ?? 0) + 1;
    const totalRounds = room.plannedRounds ?? 1;
    const isClose = totalVotes > 0 && Math.abs(proPct - 50) <= 10;
    const isLastRound = roundNum >= totalRounds;
    const isNearEnd = roundNum === totalRounds - 1;
    if (isClose) {
      flagText = lang === 'en' ? `Close ${proPct}:${conPct}` : `접전 ${proPct}:${conPct}`;
    } else if (isLastRound && roundNum > 0) {
      flagText = lang === 'en' ? 'Final Round' : '마지막 라운드';
    } else if (isNearEnd && roundNum > 0) {
      flagText = lang === 'en' ? 'Near End' : '종반 라운드';
    }
  }

  const roundNum = room ? (room.extendRound ?? 0) + 1 : 1;
  const totalRounds = room?.plannedRounds ?? 1;
  const phaseLabel = room?.phase ? PHASE_LABEL[room.phase] : '';
  const proName = room?.proName ?? (lang === 'en' ? 'Pro' : '찬성');
  const conName = room?.conName ?? (lang === 'en' ? 'Con' : '반대');

  // 사이드 블록 (스코어보드 내 마스코트 + 역할 + 이름 + 득표수)
  const SideBlock = ({ side }: { side: 'pro' | 'con' }) => {
    if (!room) return null;
    const isPro = side === 'pro';
    const name = isPro ? proName : conName;
    const score = isPro ? proVotes : conVotes;
    const numColor = isPro ? '#e8825e' : '#8db8c8';
    const accent = isPro ? '#e8825e' : '#8db8c8';
    const role = isPro ? (lang === 'en' ? 'PRO' : '찬성') : (lang === 'en' ? 'CON' : '반대');
    const avatarDataUrl = isPro ? room.proAvatarDataUrl : room.conAvatarDataUrl;
    const uid = isPro ? room.proUid : room.conUid;
    const defaultEmoji = isPro ? '🦊' : '🐻';
    return (
      <div className="lb2-hero__side">
        {avatarDataUrl ? (
          <img src={avatarDataUrl} alt="" style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 0 0 2.5px ${accent}` }} />
        ) : (
          <span style={{ fontSize: 38, lineHeight: 1 }}>{uid === AI_OPPONENT_UID ? '🤖' : defaultEmoji}</span>
        )}
        <div className="lb2-hero__side-role" style={{ color: numColor }}>{role}</div>
        <div className="lb2-hero__side-name">{name}</div>
        <div className="lb2-hero__side-score" style={{ color: numColor }}>
          {score}
          <span className="lb2-hero__side-v">{lang === 'en' ? 'v' : '표'}</span>
        </div>
      </div>
    );
  };

  // BigStats 라벨
  const statItems: [number, string, string][] = [
    [liveCount, lang === 'en' ? 'Live Now' : '진행 중', 'var(--color-vermillion)'],
    [openCount, lang === 'en' ? 'Recruiting' : '참가 모집 중', '#f0cf7e'],
    [endedCount, lang === 'en' ? 'Ended' : '종료된 토론', '#8db8c8'],
  ];

  return (
    <section className="lb2-hero" aria-label={lang === 'en' ? 'Debate lobby hero' : '토론장 로비 히어로'}>
      {/* 배경 글로우 */}
      <div aria-hidden="true" className="lb2-hero__glow" />

      <div className="lb2-hero__inner">
        {/* ====== 좌측 — 페이지 타이틀 영역 ====== */}
        <div className="lb2-hero__left">
          {/* eyebrow: 골드 수평선 + 날짜 · 토론장 로비 */}
          <span className="lb2-hero__eyebrow">
            <span aria-hidden="true" className="lb2-hero__eyebrow-line" />
            {dateLabel}&nbsp;·&nbsp;{lang === 'en' ? 'Debate Lobby' : '토론장 로비'}
          </span>

          {/* 거대 "토론장" 헤드라인 + 분필-골드 밑줄 SVG */}
          <h1 className="lb2-hero__title">
            <span className="lb2-hero__wordmark">
              {/* feTurbulence 분필 필터 */}
              <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <filter id="tbChalkHero" x="-20%" y="-120%" width="140%" height="340%" primitiveUnits="userSpaceOnUse">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
                    <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="6" result="g" />
                    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0.45" result="ga" />
                    <feComposite in="d" in2="ga" operator="in" />
                  </filter>
                </defs>
              </svg>
              <span className="lb2-hero__chalk-wrap">
                {lang === 'en' ? 'Debate Arena' : '토론장'}
                {/* 골드 밑줄 */}
                <svg aria-hidden="true" viewBox="0 0 300 14" preserveAspectRatio="none" className="lb2-hero__chalk-line">
                  <rect x="2" y="4" width="296" height="6" fill="#f0cf7e" filter="url(#tbChalkHero)" />
                </svg>
              </span>
              {/* 골드 점 */}
              <span aria-hidden="true" className="lb2-hero__gold-dot">
                <svg viewBox="0 0 40 52" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <circle cx="20" cy="44" r="13" fill="#f0cf7e" filter="url(#tbChalkHero)" />
                </svg>
              </span>
            </span>
          </h1>

          {/* 리드 */}
          <p className="lb2-hero__lead">
            {lang === 'en'
              ? <>One topic, two stances.<br />AI moderates each round<br />while the crowd votes in real time.</>
              : <>하나의 주제, 두 사람의 입장.<br />AI 사회자가 라운드를 진행하고<br />관중은 실시간으로 승부에 참여합니다.</>}
          </p>

          {/* 골드 그라데이션 CTA */}
          <div className="lb2-hero__create-wrap">
            <button type="button" className="lb2-hero__create" onClick={onCreate}>
              <span style={{ fontSize: 22, lineHeight: 0 }}>+</span>
              {lang === 'en' ? 'Create a room' : '토론방 만들기'}
            </button>
          </div>

          {/* BigStats */}
          <div className="lb2-hero__stats">
            <div className="lb2-hero__stats-row">
              {statItems.map(([n, label, color], i) => (
                <Fragment key={label}>
                  {i > 0 && <span aria-hidden="true" className="lb2-hero__stat-sep" />}
                  <div className="lb2-hero__stat">
                    <span className="lb2-hero__stat-n" style={{ color }}>{String(n).padStart(2, '0')}</span>
                    <span className="lb2-hero__stat-l">{label}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div className="lb2-hero__pulse">
              <span aria-hidden="true" className="lb2-hero__pulse-dot" />
              <span className="lb2-hero__pulse-txt">
                {lang === 'en' ? 'Updated in real time' : '실시간으로 업데이트 됩니다'}
              </span>
            </div>
          </div>
        </div>

        {/* ====== 우측 — 라이브 카드 or 폴백 ====== */}
        {room ? (
          <div className="lb2-hero__card" aria-label={lang === 'en' ? 'Featured live debate' : '대표 라이브 토론'}>
            {/* LiveTag */}
            <div className="lb2-hero__live-tag">
              <span className="lb2-hero__live-pill">
                <span aria-hidden="true" className="lb2-hero__live-dot" />
                LIVE
              </span>
              <span className="lb2-hero__live-label">
                {/* 불꽃 아이콘 */}
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill="#f0cf7e" />
                </svg>
                {lang === 'en' ? 'Hottest debate right now' : '지금 가장 뜨거운 토론'}
              </span>
            </div>

            {/* 논제 */}
            <h2 className="lb2-hero__card-topic">
              <a
                href={`?room=${room.id}`}
                onClick={(e) => { e.preventDefault(); onEnter(room.id); }}
                aria-label={`${room.topic} ${lang === 'en' ? 'Watch live' : '관전하기'}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {room.topic}
              </a>
            </h2>

            {/* LiveMeta */}
            <div className="lb2-hero__card-meta">
              {/* 접전/라운드 플래그칩 — 실데이터 기준 */}
              {flagText && (
                <span className="lb2-hero__flag-chip">
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill="#ff9d7a" />
                  </svg>
                  {flagText}
                </span>
              )}
              {/* 라운드/페이즈 라벨 (가짜 카운트다운 금지 → 실제 라운드 표시) */}
              <span className="lb2-hero__round-meta">
                <span aria-hidden="true" className="lb2-hero__round-dot" />
                <b style={{ color: '#fcf6e8', fontWeight: 800 }}>
                  {lang === 'en' ? `Round ${roundNum}/${totalRounds}` : `${roundNum}/${totalRounds} 라운드`}
                </b>
                {phaseLabel && <span style={{ color: 'rgba(255,247,232,0.6)' }}>{' · '}{phaseLabel}</span>}
              </span>
              {/* 총 득표수 (관전자 수 없음 → 실득표로 대체) */}
              {totalVotes > 0 && (
                <span className="lb2-hero__votes-meta">
                  {lang === 'en' ? `${totalVotes} votes` : `관중 ${totalVotes}명 투표`}
                </span>
              )}
            </div>

            {/* 스코어보드 */}
            <div className="lb2-hero__board">
              {/* 카운트다운 자리 → ROUND N/T · 페이즈 큰 모노 텍스트 */}
              <div className="lb2-hero__board-clock">
                ROUND&nbsp;{roundNum}/{totalRounds}
                {phaseLabel && (
                  <div className="lb2-hero__board-phase">{phaseLabel}</div>
                )}
              </div>

              {/* 찬성 VS 반대 */}
              <div className="lb2-hero__sides">
                <SideBlock side="pro" />
                <span aria-hidden="true" className="lb2-hero__vs">VS</span>
                <SideBlock side="con" />
              </div>

              {/* 득표바 — 실득표 (총표 없으면 50:50) */}
              <div
                role="img"
                aria-label={lang === 'en' ? `Pro ${proPct}%, Con ${conPct}%` : `찬성 ${proPct}%, 반대 ${conPct}%`}
                className="lb2-hero__votebar"
              >
                <div className="lb2-hero__votebar-pro" style={{ width: `${proPct}%` }} />
                <div className="lb2-hero__votebar-con" style={{ width: `${conPct}%` }} />
              </div>

              {/* 골드 CTA */}
              <button
                type="button"
                className="lb2-hero__cta"
                onClick={() => onEnter(room.id)}
                aria-label={lang === 'en' ? `Watch: ${room.topic}` : `실시간 관전하기: ${room.topic}`}
              >
                {lang === 'en' ? 'Watch Live →' : '실시간 관전하기 →'}
              </button>
            </div>
          </div>
        ) : (
          /* 폴백 — live 방 없을 때. 가짜 라이브 카드 금지 */
          <div className="lb2-hero__fallback" aria-label={lang === 'en' ? 'No live debate yet' : '진행 중인 토론 없음'}>
            <div className="lb2-hero__fallback-icon" aria-hidden="true">討</div>
            <div className="lb2-hero__fallback-title">
              {lang === 'en' ? 'No live debates yet' : '아직 진행 중인 토론이 없어요'}
            </div>
            <div className="lb2-hero__fallback-sub" style={{ marginBottom: 0 }}>
              {lang === 'en'
                ? 'Be the first to open a stage — use the “Create a room” button on the left.'
                : '왼쪽 ‘토론방 만들기’ 버튼으로 첫 번째 토론 무대를 열어보세요.'}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({
  status,
  phase: _phase,
  extendRound: _extendRound,
}: {
  status: Room['status'];
  phase?: Phase;
  extendRound?: number;
}) {
  if (status === 'live') {
    return (
      <span className="status status-live">
        <span className="pulse-glow">●</span> LIVE
      </span>
    );
  }
  if (status === 'open') {
    return <span className="status status-open">모집중</span>;
  }
  return <span className="status status-end">종료</span>;
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
          background: linear-gradient(158deg,#3f6a55,#335844,#284835);
          color: #fcf6e8; border-radius: var(--r-xl);
          box-shadow: var(--shadow-lg), inset 0 0 0 1px rgba(240,207,126,.18);
          padding: 18px 24px; position: relative; overflow: hidden;
        }
        .rm2-hud::before {
          content: ""; position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(240,207,126,.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .rm2-hud__grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; }
        .rm2-hud__left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .rm2-hud__live-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.16em; color: #fcf6e8;
          background: var(--color-vermillion); border-radius: var(--r-pill); padding: 4px 10px; flex-shrink: 0;
        }
        .rm2-hud__live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fff; display: inline-block;
          animation: rm2-pulse 1.4s ease-in-out infinite;
        }
        @keyframes rm2-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(.8);} }
        @media (prefers-reduced-motion: reduce) { .rm2-hud__live-dot { animation: none; } }
        .rm2-hud__phase-info { min-width: 0; }
        .rm2-hud__phase-counter { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; color: rgba(252,246,232,.6); margin-bottom: 2px; }
        .rm2-hud__phase-name { font-family: var(--font-serif); font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rm2-hud__center { text-align: center; max-width: 520px; }
        .rm2-hud__eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(252,246,232,.6); margin-bottom: 4px; }
        .rm2-hud__topic { font-family: var(--font-serif); font-size: 16px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; color: #fcf6e8; word-break: keep-all; }
        .rm2-hud__right { display: flex; align-items: center; gap: 10px; justify-content: flex-end; min-width: 0; }
        .rm2-hud__audience { font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: rgba(252,246,232,.75); text-align: right; margin-bottom: 4px; }
        .rm2-hud__toggles { display: flex; flex-direction: column; gap: 3px; position: absolute; bottom: 6px; right: 10px; opacity: .45; transition: opacity 0.15s; }
        .rm2-hud__toggles:hover { opacity: 1; }
        .rm2-hud__toggle-btn { font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: rgba(252,246,232,.85); background: transparent; border: 1px solid rgba(252,246,232,.35); border-radius: var(--r-sm); padding: 2px 7px; cursor: pointer; }
        .rm2-hud__progress-track { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255,255,255,.18); border-radius: 0 0 var(--r-xl) var(--r-xl); overflow: hidden; }
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
        .rm2-sidecard__avatar-wrap--pro { border-radius: 50%; box-shadow: 0 0 0 3px #fff, var(--glow-pro); }
        .rm2-sidecard__avatar-wrap--con { border-radius: 50%; box-shadow: 0 0 0 3px #fff, var(--glow-con); }
        .rm2-sidecard__name { font-family: var(--font-serif); font-size: 16px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; margin: 8px 0 2px; word-break: keep-all; }
        .rm2-sidecard__ai-label { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; color: var(--color-ink-fade); }
        .rm2-sidecard__mine-badge { font-family: var(--font-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.1em; color: var(--color-ink-fade); }
        /* --- empty seat --- */
        .rm2-emptyseat { border-radius: var(--r-lg); padding: 20px 12px; display: flex; flex-direction: column; align-items: center; text-align: center; min-height: 160px; justify-content: center; }
        .rm2-emptyseat--pro { border: 2px dashed var(--color-vermillion); background: var(--color-tint-pro); }
        .rm2-emptyseat--con { border: 2px dashed var(--color-celadon); background: var(--color-tint-con); }
        .rm2-emptyseat__chip { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; margin-bottom: 10px; }
        .rm2-emptyseat__chip--pro { background: var(--color-paper-light); border: 2px solid var(--color-vermillion); color: var(--color-vermillion); }
        .rm2-emptyseat__chip--con { background: var(--color-paper-light); border: 2px solid var(--color-celadon); color: var(--color-celadon); }
        .rm2-take-btn { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; color: #fff; border: none; border-radius: var(--r-pill); padding: 8px 18px; cursor: pointer; margin-top: 10px; transition: opacity 0.15s, transform 0.1s; letter-spacing: -0.01em; }
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
        .rm2-vote-btn--pro-active { background: var(--color-vermillion); border-color: var(--color-vermillion); color: #fff; }
        .rm2-vote-btn--con-idle { background: var(--color-paper-light); border-color: var(--color-celadon); color: var(--color-celadon); }
        .rm2-vote-btn--con-idle:hover { background: var(--color-tint-con); }
        .rm2-vote-btn--con-active { background: var(--color-celadon); border-color: var(--color-celadon); color: #fff; }
        .rm2-open-note { margin-top: 14px; padding: 12px 16px; border: 2px dashed var(--color-line); border-radius: var(--r-md); font-family: var(--font-body); font-size: 13.5px; color: var(--color-ink-soft); text-align: center; }
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
        .rm2-bubble__chip { display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 9px; font-weight: 800; letter-spacing: 0.12em; color: #fff; border-radius: var(--r-sm); padding: 2px 7px; margin-right: 6px; }
        .rm2-bubble__chip--pro { background: var(--color-vermillion); }
        .rm2-bubble__chip--con { background: var(--color-celadon); }
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
        .rm2-composer__send { display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-body); font-size: 14px; font-weight: 700; color: #fff; background: var(--color-vermillion); border: none; border-radius: var(--r-pill); padding: 0 24px; cursor: pointer; align-self: stretch; transition: opacity 0.15s, transform 0.1s; letter-spacing: -0.01em; white-space: nowrap; }
        .rm2-composer__send:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .rm2-composer__send:disabled { opacity: .45; cursor: not-allowed; }
        .rm2-composer__send:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        .rm2-composer__tidy { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-ink-soft); cursor: pointer; user-select: none; }
        .rm2-composer__tidy-label { font-weight: 700; }
        .rm2-composer__tidy-hint { color: var(--color-ink-fade); }
        .rm2-wait { text-align: center; font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em; color: var(--color-ink-fade); padding: 6px; }
        /* --- responsive --- */
        @media (max-width: 760px) {
          .rm2-hud__grid { grid-template-columns: 1fr !important; gap: 10px; }
          .rm2-hud__right { justify-content: flex-start; }
          .rm2-hud__toggles { display: none; }
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
          phaseSide === 'pro' ? '#ff9d7a'
          : phaseSide === 'con' ? '#a8d4e8'
          : '#f0cf7e';
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
                    <VoteBar pro={proCount} con={conCount} variant={voteBarVariant} size="sm" showLabels={false} />
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
            <StatusBadge status={room.status} phase={room.phase} extendRound={room.extendRound} />
            {room.status === 'live' && room.phase && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-fade)', letterSpacing: '0.1em' }}>
                R{(room.extendRound ?? 0) + 1} · {PHASE_LABEL[room.phase]}
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
          />
        </div>

        {/* 투표 패널 (live) — only when room.status !== 'open' && !== 'ended' */}
        {room.status !== 'open' && room.status !== 'ended' && (
          <div className="rm2-votepanel">
            <div className="rm2-votepanel__eyebrow">{tRoom.voting.cta}</div>
            <VoteBar pro={proCount} con={conCount} variant="classic" size="md" />
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
            <div className="ai-progress" aria-live="polite">
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
          <PhaseGuide phase={room.phase} side={mySide as Side} />
          <div className="rm2-composer__row">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tRoom.statusLive.placeholder(PHASE_LABEL[room.phase])}
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
        />
      )}
    </div>
  );
}

function PhaseProgress({ phase }: { phase: Phase }) {
  const phases: Phase[] = ['opening', 'pro_arg', 'con_arg', 'pro_rebut', 'con_rebut'];
  const currentIdx = phases.indexOf(phase);
  return (
    <div className="flex items-center gap-2 mb-4 px-2 py-2 overflow-x-auto">
      {phases.map((p, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={p} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={classNames(
                  'rounded-full transition-all',
                  active && 'pulse-glow',
                )}
                style={{
                  width: active ? 16 : 12,
                  height: active ? 16 : 12,
                  background: done
                    ? 'var(--color-ink)'
                    : active
                      ? 'var(--color-vermillion)'
                      : 'var(--color-paper-light)',
                  border: '1.5px solid var(--color-line)',
                  boxShadow: active ? 'var(--glow-pro)' : undefined,
                }}
              />
              <span
                className="text-[10px] whitespace-nowrap font-bold"
                style={{
                  color: active
                    ? 'var(--color-vermillion)'
                    : done
                      ? 'var(--color-ink)'
                      : 'var(--color-ink-fade)',
                }}
              >
                {PHASE_LABEL[p]}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div
                className="h-0.5 w-6"
                style={{
                  background: i < currentIdx ? 'var(--color-ink)' : 'var(--color-ink-fade)',
                  opacity: i < currentIdx ? 1 : 0.4,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SideCard({
  variant,
  name,
  mine,
  speaking,
  empty,
  canTake,
  onTake,
  avatarId,
  avatarDataUrl,
  isAi,
}: {
  variant: 'pro' | 'con';
  name: string | null;
  mine: boolean;
  speaking: boolean;
  empty: boolean;
  canTake: boolean;
  onTake: () => void;
  avatarId?: string | null;
  avatarDataUrl?: string | null;
  isAi?: boolean;
}) {
  const accent =
    variant === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const label = variant === 'pro' ? '찬성' : '반대';

  if (empty) {
    return (
      <div className={`rm2-emptyseat rm2-emptyseat--${variant}`}>
        <div className={`rm2-emptyseat__chip rm2-emptyseat__chip--${variant}`}>?</div>
        <Nameplate variant={variant} size="sm">
          {label} 도전자 모집
        </Nameplate>
        {canTake && (
          <button
            type="button"
            onClick={onTake}
            className={`rm2-take-btn rm2-take-btn--${variant}`}
          >
            {label}으로 입장하기 →
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rm2-sidecard rm2-sidecard--${variant}${
        speaking ? ` rm2-sidecard--speaking-${variant}` : ''
      }`}
    >
      <Nameplate variant={variant} size="sm">
        {label}
        {speaking && ' 🎤'}
      </Nameplate>
      <span
        className={`rm2-sidecard__avatar-wrap--${variant}`}
        style={{ display: 'inline-flex', overflow: 'hidden', margin: '10px 0 2px' }}
      >
        <ProfileAvatar
          avatarId={avatarId as AvatarId | undefined}
          avatarDataUrl={avatarDataUrl}
          size={76}
          style={{ filter: !speaking ? 'saturate(0.9)' : undefined }}
        />
      </span>
      <p className="rm2-sidecard__name">
        {speaking ? (
          <span className="brush-under" style={{ color: accent }}>
            {name ?? '대기 중'}
          </span>
        ) : (
          name ?? '대기 중'
        )}
      </p>
      {isAi && <span className="rm2-sidecard__ai-label">AI 토론자</span>}
      {mine && <span className="rm2-sidecard__mine-badge">(나)</span>}
    </div>
  );
}

function PhaseGuide({ phase, side }: { phase: Phase; side: Side }) {
  const isRebuttal = phase === 'pro_rebut' || phase === 'con_rebut';
  const isPro = side === 'pro';
  const tips: string[] = isRebuttal
    ? [
        '✗ 새 논거 도입 금지 — 입론에서 안 나온 논점은 꺼내지 마세요',
        '✓ 상대 발언을 직접 짚어 반박 (clash)',
        '✓ 자기 입장의 핵심을 다시 강조',
      ]
    : [
        isPro
          ? '✓ 입증책임은 찬성에 있습니다 — 명제를 적극 입증하세요'
          : '✓ 찬성 입증의 약점 짚기 또는 반대 측 자체 논거 제시',
        '✓ 핵심 논거 2-3개 + 각각 근거(자료·사례·논리)',
        '✓ 한 번의 메시지로 한 라운드를 끝내세요',
      ];
  return (
    <div className="rm2-composer__guide">
      <div className="rm2-composer__guide-title">
        {PHASE_LABEL[phase]} 가이드
      </div>
      <ul className="space-y-0.5 m-0 pl-0 list-none">
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
function InviteLinkButton({ roomId, lang }: { roomId: string; lang: Lang }) {
  const [copied, setCopied] = useState<'link' | 'id' | null>(null);
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
      : '';

  const copy = async (what: 'link' | 'id') => {
    const text = what === 'link' ? url : roomId;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt(lang === 'en' ? 'Copy this text:' : '복사할 텍스트:', text);
    }
  };

  const labels = lang === 'en'
    ? { private: '🔒 Private', link: '🔗 Invite link', linkCopied: '✓ Link copied', id: 'Copy ID', idCopied: '✓ ID copied' }
    : { private: '🔒 비공개방', link: '🔗 초대 링크', linkCopied: '✓ 링크 복사됨', id: 'ID 복사', idCopied: '✓ ID 복사됨' };

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs"
        style={{ color: 'var(--color-ink-fade)' }}
      >
        {labels.private}
      </span>
      <button
        type="button"
        onClick={() => copy('link')}
        style={{
          padding: '5px 13px',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          borderRadius: 'var(--r-pill)',
          background: 'var(--color-paper-deep)',
          border: '1px solid var(--color-line)',
          color: 'var(--color-ink-soft)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied === 'link' ? labels.linkCopied : labels.link}
      </button>
      <button
        type="button"
        onClick={() => copy('id')}
        style={{
          padding: '5px 12px',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          borderRadius: 'var(--r-pill)',
          background: 'transparent',
          border: '1px solid var(--color-line)',
          color: 'var(--color-ink-fade)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied === 'id' ? labels.idCopied : labels.id}
      </button>
    </div>
  );
}

function VerdictBlock({
  room,
  proCount,
  conCount,
  proPct,
  conPct,
  mySide,
  aiBusy,
  onRequestExtend,
  lang,
}: {
  room: Room;
  proCount: number;
  conCount: number;
  proPct: number;
  conPct: number;
  mySide: Side | 'spectator' | null;
  aiBusy: boolean;
  onRequestExtend: () => void;
  lang: Lang;
}) {
  const tV = verdictStrings[lang];
  // unused-but-kept-for-future: proPct/conPct still used inline for backwards compat
  void proPct;
  void conPct;
  const [showV2Verdict, setShowV2Verdict] = useState(false);
  const winner = room.winner;
  const winnerSide: Side | null = winner === 'pro' || winner === 'con' ? winner : null;
  const winnerName =
    winnerSide === 'pro' ? room.proName : winnerSide === 'con' ? room.conName : null;
  const headlineColor = winnerSide
    ? winnerSide === 'pro'
      ? 'var(--color-vermillion)'
      : 'var(--color-celadon)'
    : 'var(--color-ink)';
  const totalVotes = proCount + conCount;
  const aiPickLabel =
    room.aiPick === 'pro'
      ? tV.aiPick.pro
      : room.aiPick === 'con'
        ? tV.aiPick.con
        : tV.aiPick.tie;
  const aiPickColor =
    room.aiPick === 'pro'
      ? 'var(--color-vermillion)'
      : room.aiPick === 'con'
        ? 'var(--color-celadon)'
        : 'var(--color-ink-soft)';
  const myAgreed =
    mySide === 'pro'
      ? !!room.extendRequestPro
      : mySide === 'con'
        ? !!room.extendRequestCon
        : false;

  return (
    <div className="mt-4 space-y-3">
      <div
        style={{
          background: 'var(--color-paper-light)',
          borderLeft: `6px solid ${headlineColor}`,
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '16px',
        }}
      >
        <div
          className="text-xs font-bold mb-1"
          style={{ color: 'var(--color-ink-fade)', letterSpacing: '0.25em' }}
        >
          {tV.label}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <h2
            className="m-0 font-bold accent-hand"
            style={{ fontSize: 32, color: headlineColor, letterSpacing: '-0.01em' }}
          >
            {winnerSide === 'pro' ? tV.winnerPro : winnerSide === 'con' ? tV.winnerCon : tV.tie}
          </h2>
          {winnerSide && winnerName && (
            <span className="text-base font-bold" style={{ color: 'var(--color-ink)' }}>
              — {winnerName}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2 flex-wrap text-sm mt-2 mb-3"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          <span>
            {tV.breakdown.ai}: <strong style={{ color: aiPickColor }}>{aiPickLabel}</strong>
          </span>
          <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
          <span>
            {tV.breakdown.crowd}: <strong>{tV.breakdown.crowdCount(totalVotes)}</strong>
          </span>
          {typeof room.finalProScore === 'number' && (
            <>
              <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
              <span>
                {tV.breakdown.total}{' '}
                <strong style={{ color: 'var(--color-vermillion)' }}>{room.finalProScore}</strong>
                {' : '}
                <strong style={{ color: 'var(--color-celadon)' }}>
                  {100 - room.finalProScore}
                </strong>
              </span>
            </>
          )}
          {!!room.extendRound && room.extendRound > 0 && (
            <>
              <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
              <span>{tV.breakdown.round(room.extendRound + 1)}</span>
            </>
          )}
        </div>

        {/* v2: VoteBar component handles the pro/con split bar */}
        <VoteBar pro={proCount} con={conCount} variant="classic" showLabels={false} />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowV2Verdict(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              color: 'var(--color-ink-soft)',
              background: 'var(--color-paper-deep)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--r-pill)', padding: '7px 16px',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              transition: 'background 0.15s',
            }}
          >
            {tV.fullView}
          </button>
        </div>
      </div>

      {(mySide === 'pro' || mySide === 'con') && (
        <div
          style={{
            background: 'var(--color-paper-light)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--color-line)',
            boxShadow: 'var(--shadow-sm)',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--color-ink-soft)' }}>{tV.extend.title}</span>
          <span
            className="px-1.5"
            style={{
              color: room.extendRequestPro
                ? 'var(--color-vermillion)'
                : 'var(--color-ink-fade)',
              fontWeight: room.extendRequestPro ? 700 : 400,
            }}
          >
            {tV.extend.pro} {room.extendRequestPro ? tV.extend.check : tV.extend.waiting}
          </span>
          <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
          <span
            className="px-1.5"
            style={{
              color: room.extendRequestCon
                ? 'var(--color-celadon)'
                : 'var(--color-ink-fade)',
              fontWeight: room.extendRequestCon ? 700 : 400,
            }}
          >
            {tV.extend.con} {room.extendRequestCon ? tV.extend.check : tV.extend.waiting}
          </span>
          <button
            type="button"
            onClick={onRequestExtend}
            disabled={aiBusy}
            style={{
              display: 'inline-flex', alignItems: 'center',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              background: myAgreed ? 'var(--color-vermillion)' : 'var(--color-paper-light)',
              color: myAgreed ? '#fff' : 'var(--color-ink)',
              border: myAgreed ? 'none' : '1px solid var(--color-line)',
              borderRadius: 'var(--r-pill)', padding: '7px 16px',
              cursor: 'pointer', marginLeft: 'auto',
              opacity: aiBusy ? 0.45 : 1,
              transition: 'background 0.15s',
            }}
          >
            {myAgreed ? tV.extend.requestedCancel : tV.extend.request}
          </button>
        </div>
      )}

      {showV2Verdict && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="토론 판정문"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowV2Verdict(false);
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
          <div style={{ position: 'sticky', top: 12, zIndex: 1, display: 'flex', justifyContent: 'flex-end', maxWidth: 1180, margin: '0 auto' }}>
            <button
              type="button"
              onClick={() => setShowV2Verdict(false)}
              aria-label={lang === 'en' ? 'Close verdict' : '판정문 닫기'}
              style={{
                display: 'inline-flex', alignItems: 'center',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                color: 'var(--color-ink)',
                background: 'var(--color-paper-light)',
                border: '1px solid var(--color-line)',
                borderRadius: 'var(--r-pill)', padding: '8px 18px',
                cursor: 'pointer', boxShadow: 'var(--shadow-md)',
                transition: 'background 0.15s',
              }}
            >
              {tV.closeOverlay}
            </button>
          </div>
          <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', padding: 48 }}>{tV.loading}</div>}>
            <VerdictViewLazy
              topic={room.topic}
              proName={room.proName ?? (lang === 'en' ? 'Pro' : '찬성')}
              conName={room.conName ?? (lang === 'en' ? 'Con' : '반대')}
              audVotes={{ pro: proCount, con: conCount }}
              aiPick={room.aiPick ?? 'tie'}
              finalWinner={room.winner ?? 'tie'}
              startedAt={room.createdAt}
              endedAt={Date.now()}
              rounds={(room.extendRound ?? 0) + 1}
              voteBarVariant="classic"
              onBack={() => setShowV2Verdict(false)}
              lang={lang}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}



function MessageRow({
  m,
  mine,
  phase,
  aiModVariant = 'scroll',
}: {
  m: Message;
  mine: boolean;
  phase?: Phase;
  aiModVariant?: 'scroll' | 'avatar' | 'minimal';
}) {
  if (m.side === 'moderator') {
    return (
      <div className="mx-auto max-w-[92%] msg--mod">
        <AIModCard variant={aiModVariant} message={m.text} phase={phase ?? 'opening'} />
      </div>
    );
  }
  const sideClass = m.side === 'pro' ? 'rm2-bubble--pro' : 'rm2-bubble--con';
  const chipClass = m.side === 'pro' ? 'rm2-bubble__chip--pro' : 'rm2-bubble__chip--con';
  const slideClass = m.side === 'pro' ? 'msg--pro' : m.side === 'con' ? 'msg--con' : '';
  const sideLabel = m.side === 'pro' ? 'PRO' : 'CON';
  return (
    <div className={`rm2-bubble ${sideClass} ${slideClass}`}>
      <div className="rm2-bubble__header">
        <span className={`rm2-bubble__chip ${chipClass}`}>{sideLabel}</span>
        <span className="rm2-bubble__name">{m.name}</span>
        {mine && <span className="rm2-bubble__mine">· 나</span>}
      </div>
      <p className="rm2-bubble__text">{m.text}</p>
    </div>
  );
}


/** Wrapper around ProfileViewV2Lazy that fetches live Firestore data
 *  (history / ranking) via useProfileStats and derives badges + streak. */
function ProfileV2Stats({
  uid,
  profile,
  totalDebates,
}: {
  uid: string;
  profile: UserProfile;
  totalDebates: number;
}) {
  const { history, badges, ranking, winStreak, last7 } = useProfileStats({
    uid,
    profile,
    historyLimit: 10,
    rankingLimit: 10,
  });
  return (
    <ProfileViewV2Lazy
      profile={profile}
      voice={profile.nickname ? `${profile.nickname}의 토론장` : '본질을 짚는 사람'}
      totalDebates={totalDebates}
      history={history}
      badges={badges}
      ranking={ranking}
      winStreak={winStreak}
      last7={last7}
    />
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
      showToast(`아바타 변경 실패: ${err.code ?? ''} ${err.message ?? ''}`, 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const onUploadFile = async (file: File) => {
    if (!db) return;
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 업로드 가능합니다.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('파일이 너무 큽니다 (최대 8MB).', 'error');
      return;
    }
    setSavingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 240, 0.85);
      // Firestore doc field max ~1MB. JPEG 240x240 q0.85 typically ~30-80KB.
      if (dataUrl.length > 900_000) {
        showToast('이미지 변환 결과가 너무 큽니다. 더 작은 이미지를 시도하세요.', 'error');
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        avatarDataUrl: dataUrl,
        avatarId: 'custom',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      showToast(`업로드 실패: ${err.message ?? ''}`, 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const save = async () => {
    if (!db) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      showToast('닉네임을 입력하세요.', 'error');
      return;
    }
    if (trimmed.length > 20) {
      showToast('닉네임은 20자 이내로 입력하세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { nickname: trimmed });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      showToast(`저장 실패: ${err.code ?? ''} ${err.message ?? ''}`, 'error');
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
        ← 로비로
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
              📷 사진 업로드
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
                기본 캐릭터로 되돌리기
              </button>
            )}
            <span className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
              자동 240px 정사각형 변환
            </span>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-bold mb-1"
            style={{ color: 'var(--color-ink)' }}
          >
            닉네임 (토론에서 표시되는 이름)
          </label>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder="닉네임"
              className="input-paper flex-1"
            />
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="btn btn-pri"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
            최대 20자. 다음 토론부터 적용됩니다.
          </p>
        </div>
      </section>

      <section
        className="sketchy paper-grain p-3 sm:p-5"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <h2 className="text-2xl font-bold mb-4 m-0" style={{ color: 'var(--color-ink)' }}>
          전적
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="총 토론" value={total} />
          <StatBox label="승률" value={`${winRate}%`} />
          <StatBox label="승" value={wins} accent="pro" />
          <StatBox label="패" value={losses} accent="con" />
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
              👥 사람과 토론
            </div>
            <div style={{ color: 'var(--color-ink)' }}>
              {winsHuman}승 {lossesHuman}패{tiesHuman > 0 ? ` ${tiesHuman}무` : ''}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
              승률 {winRateHuman}% · 총 {totalHuman}회
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
              🤖 AI와 토론
            </div>
            <div style={{ color: 'var(--color-ink)' }}>
              {winsAi}승 {lossesAi}패{tiesAi > 0 ? ` ${tiesAi}무` : ''}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
              승률 {winRateAi}% · 총 {totalAi}회
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: 'pro' | 'con';
}) {
  const color =
    accent === 'pro'
      ? 'var(--color-vermillion)'
      : accent === 'con'
        ? 'var(--color-celadon)'
        : 'var(--color-ink)';
  return (
    <div
      className="p-3 text-center paper-grain"
      style={{
        background: 'var(--color-paper)',
        border: 'var(--border-line)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
        {label}
      </div>
      <div className="text-3xl font-bold mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ color: 'var(--color-ink-fade)' }}
    >
      {children}
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
