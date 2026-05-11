import { useEffect, useMemo, useRef, useState } from 'react';
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
  Nameplate,
  ProfileAvatar,
  VSMark,
} from './components/common';
import { ObjectionOverlay, type OverlayKind } from './components/ObjectionOverlay';
import { ChatPanel } from './components/ChatPanel';
import { LearnView } from './components/LearnView';
import { LandingView } from './components/LandingView';
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
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
        currentView={
          showLanding
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
        }}
        onProfile={() => {
          setShowProfile(true);
          setShowLearn(false);
          setShowLanding(false);
          setActiveRoomId(null);
        }}
        onLearn={() => {
          setShowLearn(true);
          setShowProfile(false);
          setShowLanding(false);
          setActiveRoomId(null);
        }}
        onLanding={() => {
          setShowLanding(true);
          setShowLearn(false);
          setShowProfile(false);
          setActiveRoomId(null);
        }}
      />
      {showLanding ? (
        <main className="flex-1 w-full">
          <LandingView onStart={() => setShowLanding(false)} />
        </main>
      ) : showLearn ? (
        <main className="flex-1 w-full">
          <LearnView
            onBack={() => {
              setShowLearn(false);
            }}
          />
        </main>
      ) : (
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {showProfile && user ? (
          <ProfileView user={user} profile={profile} onBack={() => setShowProfile(false)} />
        ) : activeRoomId ? (
          <RoomView
            roomId={activeRoomId}
            user={user}
            profile={profile}
            onBack={() => setActiveRoomId(null)}
          />
        ) : (
          <Lobby
            user={user}
            profile={profile}
            onEnter={setActiveRoomId}
            onSignIn={() => auth && signInWithPopup(auth, googleProvider)}
          />
        )}
      </main>
      )}
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer
      className="mt-8"
      style={{
        borderTop: '1.5px solid var(--color-ink)',
        background: 'var(--color-paper-light)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div style={{ color: 'var(--color-ink-soft)' }}>
          <span className="brand mr-2" style={{ fontSize: 16 }}>
            <span className="brand__mark">토론</span>
            <span>배틀</span>
          </span>
          · 찬반 1:1 실시간 토론 · AI 사회자가 진행
        </div>
        <div className="flex items-center gap-3" style={{ color: 'var(--color-ink-fade)' }}>
          <span>© 2026 토론배틀</span>
          <span>·</span>
          <span>Powered by Claude AI</span>
        </div>
      </div>
    </footer>);
}

function Header({
  user,
  profile,
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
  currentView: 'lobby' | 'room' | 'profile' | 'learn' | 'landing';
  onSignIn: () => void;
  onSignOut: () => void;
  onHome: () => void;
  onProfile: () => void;
  onLearn: () => void;
  onLanding: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur"
      style={{
        borderBottom: '2px solid var(--color-ink)',
        background: 'rgba(250, 243, 226, 0.92)',
      }}
    >
      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 h-[64px] sm:h-[70px] flex items-center gap-2">
        <button onClick={onHome} className="brand flex-shrink-0">
          <span className="brand__mark">토론</span>
          <span>배틀</span>
        </button>
        <nav
          className="flex items-stretch gap-0 ml-2 sm:ml-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <NavTab active={currentView === 'landing'} onClick={onLanding} label="ℹ️ 소개" />
          <NavTab
            active={currentView === 'lobby' || currentView === 'room'}
            onClick={onHome}
            label="🎯 토론장"
          />
          <NavTab active={currentView === 'learn'} onClick={onLearn} label="📚 자료실" />
        </nav>
        {(currentView === 'landing' || currentView === 'lobby' || currentView === 'learn') && (
          <nav className="hidden md:flex items-center gap-0 text-sm ml-auto mr-2 overflow-x-auto"
               style={{ scrollbarWidth: 'none' }}>
            {(currentView === 'landing'
              ? [
                  { id: 'how', label: '진행 방식' },
                  { id: 'features', label: '기능' },
                  { id: 'demo', label: '미리보기' },
                  { id: 'topics', label: '주제' },
                  { id: 'faq', label: 'FAQ' },
                ]
              : currentView === 'lobby'
              ? [{ id: 'create', label: '방 만들기' }]
              : [
                  { id: 'ch1', label: '5대 원칙' },
                  { id: 'ch2', label: '토론 형식' },
                  { id: 'ch3', label: '논리 오류' },
                  { id: 'ch5', label: '토론 역사' },
                  { id: 'ch6', label: '실전 팁' },
                ]
            ).map((a) => (
              <a
                key={a.id}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(a.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                href={`#${a.id}`}
                className="px-3 py-1.5 cursor-pointer transition"
                style={{
                  color: 'var(--color-ink-soft)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--color-vermillion)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--color-ink-soft)')
                }
              >
                {a.label}
              </a>
            ))}
          </nav>
        )}
        <div
          className={`flex items-center gap-2 text-sm flex-shrink-0 ${
            currentView === 'landing' ||
            currentView === 'lobby' ||
            currentView === 'learn'
              ? ''
              : 'ml-auto'
          }`}
        >
          {user ? (
            <>
              <button
                onClick={onProfile}
                title="내 프로필"
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
                title="로그아웃"
              >
                <span className="hidden sm:inline">로그아웃</span>
                <span className="sm:hidden">↪</span>
              </button>
            </>
          ) : (
            <button onClick={onSignIn} className="btn btn-pri text-sm">
              Google 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="font-bold transition whitespace-nowrap"
      style={{
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--color-vermillion)' : 'transparent'}`,
        color: active ? 'var(--color-vermillion)' : 'var(--color-ink-soft)',
        fontSize: 13,
        cursor: 'pointer',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
    </button>
  );
}

function Lobby({
  user,
  profile,
  onEnter,
  onSignIn,
}: {
  user: User | null;
  profile: UserProfile | null;
  onEnter: (id: string) => void;
  onSignIn: () => void;
}) {
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
  const [filter, setFilter] = useState<'all' | 'live' | 'open' | 'ai' | 'human'>('all');
  const [search, setSearch] = useState('');

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
      alert('주제 추천 실패. 잠시 후 다시 시도하세요.');
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
      alert(`방 생성 실패 (${phase}): ${err.code ?? ''} ${err.message ?? '알 수 없는 오류'}`);
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
      alert(`삭제 실패: ${err.code ?? ''} ${err.message ?? ''}`);
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

  return (
    <div className="lobby-v2 space-y-10">
      <section>
        <div className="lb-eyebrow">OPEN STAGES · 열린 무대</div>
        <div className="lb-header">
          <div className="lb-controls">
            <input
              type="text"
              className="lb-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍  주제·이름으로 검색"
            />
            <div className="lb-filters">
              <button
                className={classNames('lb-filter', filter === 'all' && 'active')}
                onClick={() => setFilter('all')}
              >
                전체
              </button>
              <button
                className={classNames('lb-filter lb-filter--live', filter === 'live' && 'active')}
                onClick={() => setFilter('live')}
              >
                <span className="dot" /> LIVE
              </button>
              <button
                className={classNames('lb-filter lb-filter--open', filter === 'open' && 'active')}
                onClick={() => setFilter('open')}
              >
                <span className="dot" /> 모집중
              </button>
              <button
                className={classNames('lb-filter', filter === 'ai' && 'active')}
                onClick={() => setFilter('ai')}
              >
                🤖 AI전
              </button>
              <button
                className={classNames('lb-filter', filter === 'human' && 'active')}
                onClick={() => setFilter('human')}
              >
                👥 사람전
              </button>
            </div>
          </div>
        </div>

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
          <button
            type="button"
            className="lb-card lb-card--empty"
            onClick={() => {
              const el = document.getElementById('create');
              if (!el) return;
              // Scroll with offset so the "주제 던지기" title isn't hidden under the sticky header
              const headerOffset = 88;
              const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
              window.scrollTo({ top, behavior: 'smooth' });
              // Trigger attention pulse on the create card
              const card = el.querySelector('.lb-create') as HTMLElement | null;
              if (card) {
                card.classList.remove('lb-create--pulse');
                // Force reflow so re-adding the class restarts the animation
                void card.offsetWidth;
                card.classList.add('lb-create--pulse');
                window.setTimeout(() => card.classList.remove('lb-create--pulse'), 2400);
              }
            }}
            aria-label="새 토론방 만들기"
          >
            <div className="lb-card--empty__plus">+</div>
            <div className="lb-card--empty__title">
              {filteredRooms.length === 0
                ? rooms.length === 0
                  ? '첫 번째 주제를 던져보세요'
                  : '조건에 맞는 무대가 없어요'
                : '새 토론방 만들기'}
            </div>
          </button>
        </div>
      </section>

      <section id="create">
        <div className="lb-create">
            <h2 className="lb-create__title">
              <span className="stamp">주제</span>
              <span>던지기</span>
            </h2>

            {user ? (
              <>
                <label className="lb-create__label">토론 주제</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  placeholder="예: 인공지능은 결국 인간의 일자리를 빼앗을까?"
                  className="lb-create__textarea"
                />
                <button
                  onClick={fetchSuggestions}
                  disabled={loadingTopics}
                  className="lb-create__suggest-btn"
                >
                  {loadingTopics ? '추천 중…' : '🎲 AI에게 주제 추천 받기'}
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
                  <label className="lb-create__label">상대</label>
                  <div className="lb-create__chips">
                    <button
                      onClick={() => setMode('human')}
                      className={classNames('lb-cchip', mode === 'human' && 'active')}
                    >
                      👥 사람과 1:1
                    </button>
                    <button
                      onClick={() => setMode('ai')}
                      className={classNames('lb-cchip', mode === 'ai' && 'active')}
                    >
                      🤖 AI와 토론
                    </button>
                  </div>
                </div>

                {mode === 'ai' && (
                  <div className="lb-create__group">
                    <label className="lb-create__label">내 입장</label>
                    <div className="lb-create__chips">
                      <button
                        onClick={() => setMySide('pro')}
                        className={classNames('lb-cchip', mySide === 'pro' && 'active')}
                      >
                        찬성
                      </button>
                      <button
                        onClick={() => setMySide('con')}
                        className={classNames('lb-cchip', mySide === 'con' && 'active')}
                      >
                        반대
                      </button>
                    </div>
                  </div>
                )}

                <div className="lb-create__group">
                  <label className="lb-create__label">라운드</label>
                  <div className="lb-create__chips">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPlannedRounds(n)}
                        className={classNames('lb-cchip', plannedRounds === n && 'active')}
                      >
                        {n} 라운드
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lb-create__group">
                  <label className="lb-create__label">공개 설정</label>
                  <div className="lb-create__chips">
                    <button
                      onClick={() => setIsPrivate(false)}
                      className={classNames('lb-cchip', !isPrivate && 'active')}
                    >
                      🌐 공개방
                    </button>
                    <button
                      onClick={() => setIsPrivate(true)}
                      className={classNames('lb-cchip', isPrivate && 'active')}
                    >
                      🔒 비공개방
                    </button>
                  </div>
                  {isPrivate && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--color-ink-fade)' }}
                    >
                      목록에 노출 안 됩니다. 입장 후 초대 링크를 공유하세요.
                    </p>
                  )}
                </div>

                <button
                  onClick={create}
                  disabled={creating || !topic.trim()}
                  className="lb-create__open-btn"
                >
                  {creating ? '여는 중…' : '무대 열기 ▶'}
                </button>

                <div
                  className="pt-3 mt-3"
                  style={{ borderTop: '1.5px dashed var(--color-ink-fade)' }}
                >
                  <label className="lb-create__label">🔗 비공개방 초대 코드로 입장</label>
                  <div className="flex gap-2">
                    <input
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      placeholder="방 ID 붙여넣기"
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
                      입장
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="lb-create__login-hint">
                <span>방을 만들려면 Google 로그인이 필요합니다.</span>
                <button onClick={onSignIn} className="lb-create__open-btn" style={{ width: 'auto', padding: '8px 18px' }}>
                  Google 로그인
                </button>
              </div>
            )}
          </div>
        </section>


      {db && (
        <section>
          <ChatPanel
            title="💬 로비 전체 채팅"
            collectionRef={collection(db, 'lobby_messages')}
            user={user}
            myName={displayNameOf(profile, user)}
            myAvatarId={profile?.avatarId}
            myAvatarDataUrl={profile?.avatarDataUrl ?? null}
            canPost={!!user}
            emptyHint="로비에 인사를 남겨보세요!"
            height={240}
          />
        </section>
      )}
    </div>
  );
}

function LobbyRoomCard({
  room,
  onEnter,
  onDelete,
  isMine,
  isHot,
}: {
  room: Room;
  onEnter: (id: string) => void;
  onDelete: (id: string) => void;
  isMine: boolean;
  isHot: boolean;
}) {
  const isAiGame = room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
  const proPct = typeof room.finalProScore === 'number' ? room.finalProScore : 50;
  const conPct = 100 - proPct;
  const winner = room.winner;
  const phaseLabel = room.phase ? PHASE_LABEL[room.phase] : '';
  const round = (room.extendRound ?? 0) + 1;

  return (
    <div className="relative">
      <button className="lb-card" onClick={() => onEnter(room.id)}>
        {(isHot || isMine) && (
          <div className={classNames('lb-hot', isMine && 'lb-hot--mine')}>
            {isMine ? '내 방' : '🔥 HOT'}
          </div>
        )}
        <div className="lb-card__top">
          {room.status === 'live' && (
            <span className="lb-pill lb-pill--live">
              <span className="d" /> LIVE
            </span>
          )}
          {room.status === 'open' && <span className="lb-pill lb-pill--open">모집중</span>}
          {room.status === 'ended' && <span className="lb-pill lb-pill--end">종료</span>}
          {room.isPrivate && <span className="lb-pill lb-pill--private">PRIVATE</span>}
          {isAiGame && <span className="lb-pill lb-pill--ai">AI전</span>}
          {room.status === 'live' && phaseLabel && (
            <span style={{ color: 'var(--color-ink-fade)' }}>
              R{round} · {phaseLabel}
            </span>
          )}
          {room.status === 'open' && (
            <span style={{ color: 'var(--color-ink-fade)' }}>
              {room.proUid || room.conUid ? '도전자 1명 필요' : '대기 중'}
            </span>
          )}
        </div>

        <h3 className="lb-card__topic">{room.topic}</h3>

        <div className="lb-sides">
          {room.proUid ? (
            <div className="lb-side lb-side--pro">
              <div className="lb-side__av">
                {room.proAvatarDataUrl ? (
                  <img src={room.proAvatarDataUrl} alt="" />
                ) : (
                  <span>{room.proUid === AI_OPPONENT_UID ? '🤖' : '🦊'}</span>
                )}
              </div>
              <div className="lb-side__meta">
                <div className="lb-side__role">PRO · 찬성</div>
                <div className="lb-side__name">{room.proName ?? '?'}</div>
              </div>
            </div>
          ) : (
            <div className="lb-side lb-side--empty">
              <div className="lb-side__meta" style={{ textAlign: 'center' }}>
                <div className="lb-side__role">PRO · 찬성</div>
                <div className="lb-side__name" style={{ color: 'var(--color-ink-fade)' }}>
                  자리 비어있음
                </div>
              </div>
              <span className="lb-side__empty-mark">?</span>
            </div>
          )}
          <span className="lb-side__vs">VS</span>
          {room.conUid ? (
            <div className="lb-side lb-side--con">
              <div className="lb-side__av">
                {room.conAvatarDataUrl ? (
                  <img src={room.conAvatarDataUrl} alt="" />
                ) : (
                  <span>{room.conUid === AI_OPPONENT_UID ? '🤖' : '🐻'}</span>
                )}
              </div>
              <div className="lb-side__meta">
                <div className="lb-side__role">CON · 반대</div>
                <div className="lb-side__name">{room.conName ?? '?'}</div>
              </div>
            </div>
          ) : (
            <div className="lb-side lb-side--empty">
              <div className="lb-side__meta" style={{ textAlign: 'center' }}>
                <div className="lb-side__role">CON · 반대</div>
                <div className="lb-side__name" style={{ color: 'var(--color-ink-fade)' }}>
                  자리 비어있음
                </div>
              </div>
              <span className="lb-side__empty-mark">?</span>
            </div>
          )}
        </div>

        {room.status === 'ended' && typeof room.finalProScore === 'number' && (
          <div className="lb-votebar">
            <div className="lb-votebar__pro" style={{ width: `${proPct}%` }}>
              {proPct}%
            </div>
            <div className="lb-votebar__con" style={{ width: `${conPct}%` }}>
              {conPct}%
            </div>
          </div>
        )}

        <div className="lb-meta">
          {room.status === 'ended' && winner === 'pro' && (
            <span className="lb-winner-stamp">찬성 승</span>
          )}
          {room.status === 'ended' && winner === 'con' && (
            <span className="lb-winner-stamp lb-winner-stamp--con">반대 승</span>
          )}
          {room.status === 'ended' && winner === 'tie' && (
            <span style={{ color: 'var(--color-ink-soft)', fontWeight: 700 }}>무승부</span>
          )}
          {room.status === 'open' && !room.proUid && !room.conUid && (
            <span className="lb-card__hint">↳ 첫 도전자가 되어보세요</span>
          )}
        </div>
      </button>
      {isMine && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(room.id);
          }}
          className="lb-card__del"
          title="삭제"
        >
          🗑
        </button>
      )}
    </div>
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
}: {
  roomId: string;
  user: User | null;
  profile: UserProfile | null;
  onBack: () => void;
}) {
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
      alert('AI 사회자 호출 실패. 잠시 후 다시 시도해주세요.');
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
      <ObjectionOverlay
        key={objection?.key ?? 0}
        show={!!objection}
        side={objection?.side}
        kind={objection?.kind}
        label={objection?.label}
        onDone={() => setObjection(null)}
      />
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="btn btn-ghost text-sm"
          style={{ padding: '4px 10px' }}
        >
          ← 로비로
        </button>
        {room?.isPrivate && <InviteLinkButton roomId={roomId} />}
      </div>

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
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-vermillion)' }}>
                찬성 {proCount}표 ({proPct}%)
              </span>
              <span style={{ color: 'var(--color-celadon)' }}>
                반대 {conCount}표 ({conPct}%)
              </span>
            </div>
            <div
              className="h-3 flex overflow-hidden"
              style={{ border: '2px solid var(--color-ink)' }}
            >
              <div
                style={{
                  width: `${proPct}%`,
                  background: 'var(--color-vermillion)',
                }}
              />
              <div
                style={{
                  width: `${conPct}%`,
                  background: 'var(--color-celadon)',
                }}
              />
            </div>
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
            두 토론자가 모이면 AI 사회자가 토론을 엽니다.
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
          />
        )}
      </div>

      <div
        ref={scrollRef}
        className="sketchy paper-grain p-4 h-[480px] overflow-y-auto space-y-3"
        style={{ background: 'var(--color-paper-light)' }}
      >
        {messages.length === 0 ? (
          <p
            className="text-sm text-center py-10"
            style={{ color: 'var(--color-ink-fade)' }}
          >
            {room.status === 'open'
              ? '두 토론자가 모이면 AI 사회자가 토론을 시작합니다.'
              : aiBusy
                ? '🤖 AI 사회자가 발언을 준비하고 있습니다…'
                : '잠시만 기다려주세요.'}
          </p>
        ) : (
          messages.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              mine={m.uid === user?.uid && m.side !== 'moderator'}
            />
          ))
        )}
        {aiBusy && messages.length > 0 && (
          <p
            className="text-xs text-center pt-2 font-bold"
            style={{ color: 'var(--color-vermillion)' }}
          >
            🤖 AI 사회자 작성 중…
          </p>
        )}
        <div ref={bottomRef} aria-hidden="true" />
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
          현재는{' '}
          {currentSpeakerSide === 'pro'
            ? '찬성'
            : currentSpeakerSide === 'con'
              ? '반대'
              : '사회자'}{' '}
          차례입니다. 기다려주세요.
        </p>
      )}

      {room.status === 'live' && mySide === 'spectator' && (
        <p className="text-center text-xs" style={{ color: 'var(--color-ink-fade)' }}>
          관전자는 토론 발언은 못 하지만, 투표 + 아래 관전자 채팅으로 응원할 수 있습니다.
        </p>
      )}

      {db && (
        <ChatPanel
          title="💬 관전자 채팅"
          collectionRef={collection(db, 'rooms', roomId, 'spectator_messages')}
          user={user}
          myName={displayNameOf(profile, user)}
          myAvatarId={profile?.avatarId}
          myAvatarDataUrl={profile?.avatarDataUrl ?? null}
          canPost={!!user && mySide === 'spectator'}
          postDisabledHint="토론자는 관전자 채팅에 참여할 수 없습니다 (토론에 집중하세요)."
          emptyHint="관전자끼리 토론을 응원해보세요!"
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
                  border: '2px solid var(--color-ink)',
                  boxShadow: active ? '0 0 0 4px rgba(200, 75, 31, 0.3)' : undefined,
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
      <div
        className="p-4 flex flex-col items-center justify-center text-center min-h-[160px] paper-grain"
        style={{
          border: `1.5px dashed ${accent}`,
          background: 'var(--color-paper)',
        }}
      >
        <div
          className="rounded-full flex items-center justify-center mb-2 font-bold"
          style={{
            width: 56,
            height: 56,
            background: 'var(--color-paper-light)',
            border: `2px solid ${accent}`,
            color: accent,
            fontSize: 28,
          }}
        >
          ?
        </div>
        <Nameplate variant={variant} size="sm">
          {label} 도전자 모집
        </Nameplate>
        {canTake && (
          <button
            onClick={onTake}
            className="btn mt-3"
            style={{
              background: accent,
              color: 'var(--color-paper-light)',
              fontSize: 13,
              padding: '6px 12px',
            }}
          >
            {label}으로 입장하기 →
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-3 paper-grain transition"
      style={{
        border: speaking
          ? `2.5px solid ${accent}`
          : `2px solid ${accent}`,
        background: speaking
          ? 'linear-gradient(180deg, var(--color-paper-light) 0%, var(--color-paper) 100%)'
          : 'var(--color-paper-light)',
        boxShadow: speaking ? `0 0 0 4px ${accent}33, 3px 3px 0 var(--color-ink)` : '3px 3px 0 var(--color-ink)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <Nameplate variant={variant} size="sm">
          {label}
          {speaking && ' 🎤'}
        </Nameplate>
        {mine && (
          <span className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
            (나)
          </span>
        )}
      </div>
      <div className="flex items-center justify-center mb-2" style={{ height: 92 }}>
        <ProfileAvatar
          avatarId={avatarId as AvatarId | undefined}
          avatarDataUrl={avatarDataUrl}
          size={84}
          ring={variant}
          style={{
            transform: speaking ? 'translateY(-3px)' : 'none',
            transition: 'transform 0.25s',
            filter: !speaking ? 'saturate(0.9)' : undefined,
          }}
        />
      </div>
      <p
        className="text-center font-bold m-0"
        style={{ color: 'var(--color-ink)' }}
      >
        {name ?? '대기 중'}
      </p>
      {isAi && (
        <p
          className="text-center text-xs mt-0.5"
          style={{ color: 'var(--color-ink-fade)' }}
        >
          AI 토론자
        </p>
      )}
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
    <div
      className="px-3 py-2"
      style={{
        background: 'var(--color-paper)',
        border: '1.5px solid var(--color-ink-fade)',
        color: 'var(--color-ink-soft)',
        fontSize: 13,
        fontFamily: 'var(--font-serif)',
        lineHeight: 1.6,
      }}
    >
      <div
        className="font-bold mb-1"
        style={{
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-hand)',
          fontSize: 14,
        }}
      >
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

function InviteLinkButton({ roomId }: { roomId: string }) {
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
      // fallback: select+copy via deprecated execCommand if needed
      window.prompt('복사할 텍스트:', text);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs"
        style={{ color: 'var(--color-ink-fade)' }}
      >
        🔒 비공개방
      </span>
      <button
        onClick={() => copy('link')}
        className="btn"
        style={{ padding: '4px 10px', fontSize: 12 }}
      >
        {copied === 'link' ? '✓ 링크 복사됨' : '🔗 초대 링크'}
      </button>
      <button
        onClick={() => copy('id')}
        className="btn btn-ghost"
        style={{ padding: '4px 8px', fontSize: 12 }}
      >
        {copied === 'id' ? '✓ ID 복사됨' : 'ID 복사'}
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
}: {
  room: Room;
  proCount: number;
  conCount: number;
  proPct: number;
  conPct: number;
  mySide: Side | 'spectator' | null;
  aiBusy: boolean;
  onRequestExtend: () => void;
}) {
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
      ? '찬성 우세'
      : room.aiPick === 'con'
        ? '반대 우세'
        : '대등';
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
        className="card-sketch p-4"
        style={{
          background: 'var(--color-paper-light)',
          borderLeft: `8px solid ${headlineColor}`,
        }}
      >
        <div
          className="text-xs font-bold mb-1"
          style={{ color: 'var(--color-ink-fade)', letterSpacing: '0.25em' }}
        >
          VERDICT · 판결
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <h2
            className="m-0 font-bold accent-hand"
            style={{ fontSize: 32, color: headlineColor, letterSpacing: '-0.01em' }}
          >
            {winnerSide
              ? `${winnerSide === 'pro' ? '찬성' : '반대'} 측 승리`
              : '무승부'}
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
            🤖 AI: <strong style={{ color: aiPickColor }}>{aiPickLabel}</strong>
          </span>
          <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
          <span>
            👥 관중: <strong>{totalVotes}명</strong>
          </span>
          {typeof room.finalProScore === 'number' && (
            <>
              <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
              <span>
                종합{' '}
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
              <span>R{room.extendRound + 1}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="font-bold text-xs whitespace-nowrap"
            style={{ color: 'var(--color-vermillion)' }}
          >
            찬 {proCount}
          </span>
          <div
            className="flex-1 h-5 flex overflow-hidden"
            style={{ border: '1.5px solid var(--color-ink)' }}
          >
            <div
              className="flex items-center justify-end pr-1.5 font-bold text-[11px]"
              style={{
                width: `${proPct}%`,
                background: 'var(--color-vermillion)',
                color: 'var(--color-paper-light)',
              }}
            >
              {proPct >= 18 ? `${proPct}%` : ''}
            </div>
            <div
              className="flex items-center pl-1.5 font-bold text-[11px]"
              style={{
                width: `${conPct}%`,
                background: 'var(--color-celadon)',
                color: 'var(--color-paper-light)',
              }}
            >
              {conPct >= 18 ? `${conPct}%` : ''}
            </div>
          </div>
          <span
            className="font-bold text-xs whitespace-nowrap"
            style={{ color: 'var(--color-celadon)' }}
          >
            반 {conCount}
          </span>
        </div>
      </div>

      {(mySide === 'pro' || mySide === 'con') && (
        <div
          className="card p-2 flex items-center gap-2 flex-wrap text-sm"
          style={{ background: 'var(--color-paper-light)' }}
        >
          <span style={{ color: 'var(--color-ink-soft)' }}>🔁 추가 라운드</span>
          <span
            className="px-1.5"
            style={{
              color: room.extendRequestPro
                ? 'var(--color-vermillion)'
                : 'var(--color-ink-fade)',
              fontWeight: room.extendRequestPro ? 700 : 400,
            }}
          >
            찬 {room.extendRequestPro ? '✓' : '대기'}
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
            반 {room.extendRequestCon ? '✓' : '대기'}
          </span>
          <button
            onClick={onRequestExtend}
            disabled={aiBusy}
            className="btn ml-auto"
            style={{
              padding: '5px 12px',
              fontSize: 13,
              background: myAgreed ? 'var(--color-vermillion)' : 'var(--color-paper-light)',
              color: myAgreed ? '#fff' : 'var(--color-ink)',
            }}
          >
            {myAgreed ? '✓ 요청됨 (취소)' : '요청하기'}
          </button>
        </div>
      )}
    </div>
  );
}



function MessageRow({ m, mine }: { m: Message; mine: boolean }) {
  if (m.side === 'moderator') {
    return (
      <div
        className="mx-auto max-w-[92%] px-4 py-3 paper-grain float-in"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper-light)',
          border: '2px solid var(--color-vermillion)',
          boxShadow: '3px 3px 0 var(--color-ink)',
        }}
      >
        <div
          className="text-xs font-bold mb-1"
          style={{
            color: 'var(--color-vermillion)',
            letterSpacing: '0.15em',
            fontFamily: 'var(--font-hand)',
          }}
        >
          {AI_NAME}
        </div>
        <p
          className="whitespace-pre-wrap break-words m-0"
          style={{
            lineHeight: 1.8,
            fontSize: 15,
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.01em',
          }}
        >
          {m.text}
        </p>
      </div>
    );
  }
  const accent =
    m.side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const align = m.side === 'con' ? 'ml-auto' : '';
  return (
    <div
      className={classNames('max-w-[80%] px-3 py-2 paper-grain float-in', align)}
      style={{
        background: 'var(--color-paper-light)',
        border: `1.5px solid ${accent}`,
        boxShadow: `2px 2px 0 ${accent}`,
      }}
    >
      <div
        className="flex items-center gap-2 text-xs mb-1"
        style={{ color: 'var(--color-ink-fade)', fontFamily: 'var(--font-hand)' }}
      >
        <span className="font-bold" style={{ color: accent }}>
          {m.side === 'pro' ? '찬성' : m.side === 'con' ? '반대' : '관전'}
        </span>
        <span style={{ color: 'var(--color-ink)' }}>{m.name}</span>
        {mine && <span>· 나</span>}
      </div>
      <p
        className="whitespace-pre-wrap break-words m-0"
        style={{
          color: 'var(--color-ink)',
          lineHeight: 1.75,
          fontSize: 15,
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.01em',
        }}
      >
        {m.text}
      </p>
    </div>
  );
}

function ProfileView({
  user,
  profile,
  onBack,
}: {
  user: User;
  profile: UserProfile | null;
  onBack: () => void;
}) {
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
      alert(`아바타 변경 실패: ${err.code ?? ''} ${err.message ?? ''}`);
    } finally {
      setSavingAvatar(false);
    }
  };

  const onUploadFile = async (file: File) => {
    if (!db) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('파일이 너무 큽니다 (최대 8MB).');
      return;
    }
    setSavingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 240, 0.85);
      // Firestore doc field max ~1MB. JPEG 240x240 q0.85 typically ~30-80KB.
      if (dataUrl.length > 900_000) {
        alert('이미지 변환 결과가 너무 큽니다. 더 작은 이미지를 시도하세요.');
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        avatarDataUrl: dataUrl,
        avatarId: 'custom',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(`업로드 실패: ${err.message ?? ''}`);
    } finally {
      setSavingAvatar(false);
    }
  };

  const save = async () => {
    if (!db) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      alert('닉네임을 입력하세요.');
      return;
    }
    if (trimmed.length > 20) {
      alert('닉네임은 20자 이내로 입력하세요.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { nickname: trimmed });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      alert(`저장 실패: ${err.code ?? ''} ${err.message ?? ''}`);
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

      <section
        className="sketchy paper-grain p-3 sm:p-5 space-y-4"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--color-ink)' }}>
          내{' '}
          <span
            className="inline-block px-2 -rotate-1"
            style={{ background: 'var(--color-vermillion)', color: 'var(--color-paper-light)' }}
          >
            프로필
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
              Google 계정
            </label>
            <p className="text-sm m-0" style={{ color: 'var(--color-ink)' }}>
              {user.displayName ?? '익명'} · {user.email ?? '—'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
            기본 캐릭터
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
                    background: selected ? 'var(--color-paper-deep)' : 'var(--color-paper-light)',
                    borderColor: selected ? 'var(--color-vermillion)' : 'var(--color-ink)',
                    borderWidth: selected ? 2 : 1.5,
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
              border: '2px solid var(--color-celadon)',
              background: 'rgba(45, 74, 90, 0.08)',
              boxShadow: '2px 2px 0 var(--color-ink)',
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
              border: '2px solid var(--color-vermillion)',
              background: 'rgba(200, 75, 31, 0.08)',
              boxShadow: '2px 2px 0 var(--color-ink)',
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
        border: '2px solid var(--color-ink)',
        boxShadow: '2px 2px 0 var(--color-ink)',
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
