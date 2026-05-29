import { Suspense, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { auth, db, firebaseConfigured, googleProvider } from './firebase';
import { CenterMsg, LazyFallback, SetupScreen } from './components/AppChrome';
import { ProfileView } from './components/profile/ProfilePanel';
import { SiteFooter } from './components/lobby/LobbyChrome';
import { Header } from './components/Header';
import { Lobby } from './components/lobby/LobbyView';
import { RoomView } from './components/room/RoomView';
import type { StaticPage } from './types';
import { CookieBanner } from './components/CookieBanner';
import { FloatingLobbyBtn } from './components/FloatingLobbyBtn';
import { ToastHost } from './components/Toast';
import { useLocale } from './hooks/useLocale';
import { useTheme } from './hooks/useTheme';
import {
  ContentPages,
  KNOWN_PATHS,
  LandingView,
  LearnView,
  LegalPages,
  NotFoundView,
  STATIC_PATH_MAP,
} from './routes';

import './lobby.css';
import { EMPTY_PROFILE, type UserProfile } from './types';




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


/* Note: the old HeaderMegaMenu (with DropdownItem / DropdownGroup /
   MegaColumn interfaces) was removed when the header switched to a
   game-launcher tab bar. Sub-page links (e.g. "방 만들기", "5대 원칙")
   now live inside each destination page rather than in a header dropdown.
   If we want hover dropdowns again in the future, restore from git history
   at commit before the game-launcher refactor. */














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
