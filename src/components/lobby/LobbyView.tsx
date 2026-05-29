// #25 (incremental step 11): lobby screen extracted from App.tsx.
import { lazy, Suspense, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AI_OPPONENT_NAME, AI_OPPONENT_UID, type Room, type Side, type UserProfile } from '../../types';
import type { Lang } from '../../i18n/landing';
import { lobbyStrings } from '../../i18n/lobby';
import { classNames } from '../../lib/cn';
import { aiFetch } from '../../lib/aiClient';
import { displayNameOf } from '../../lib/userText';
import { showToast } from '../Toast';
import { ChatPanel } from '../ChatPanel';
import { LobbyRoomCard } from './LobbyRoomCard';
import { LobbyEmptyCTA } from './LobbyChrome';

// v2 lazy screens (lobby-only).
const OnboardingViewLazy = lazy(() =>
  import('../OnboardingView').then((m) => ({ default: m.OnboardingView })),
);
const LobbyMastheadLazy = lazy(() =>
  import('../LobbyMasthead').then((m) => ({ default: m.LobbyMasthead })),
);
const LobbyRoomRowLazy = lazy(() =>
  import('../LobbyRoomRow').then((m) => ({ default: m.LobbyRoomRow })),
);

export function Lobby({
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
