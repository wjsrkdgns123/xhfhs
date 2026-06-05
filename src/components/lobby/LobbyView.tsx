// 토론배틀 로비 — redesign (Claude Design handoff: redesign/토론배틀 토론장 로비).
// Deep-green academic masthead → featured live stage → slim sticky search/filter →
// curated rails (live / open / ended) → AI-validated create modal. Wired to the
// real Firestore rooms snapshot + create flow; the lobby lounge chat is preserved.
import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AI_OPPONENT_NAME, AI_OPPONENT_UID, type Room, type UserProfile } from '../../types';
import type { Lang } from '../../i18n/landing';
import { displayNameOf } from '../../lib/userText';
import { showToast } from '../Toast';
import { ChatPanel } from '../ChatPanel';
import '../../redesign.css';
import { LobbyMasthead, LobbySearchBar, SectionHead, type LobbyFilter } from './redesign/LobbyMast';
import { JoinCard, LiveCard, ResultCard, toCardRoom } from './redesign/LobbyCards';
import { CreateModal, type CreateParams } from './redesign/CreateModal';

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
  const en = lang === 'en';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LobbyFilter>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Open the create modal from the floating CTA / header anchor (#create).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => {
      if (window.location.hash !== '#create') return;
      setShowCreate(true);
      window.history.replaceState({}, '', window.location.pathname);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  useEffect(() => {
    if (!db) return;
    const firestore = db;
    const q = query(collection(firestore, 'rooms'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Room, 'id'>) }));
      const TTL = 2 * 60 * 60 * 1000; // 2 hours
      const now = Date.now();
      setRooms(all.filter((r) => now - r.createdAt <= TTL && (!r.isPrivate || r.createdBy === user?.uid)));
    });
  }, [user]);

  const createRoom = async ({ topic, mode, side, rounds, isPrivate }: CreateParams) => {
    if (!db || !user || !topic.trim()) return;
    let phase = 'init';
    try {
      const myName = displayNameOf(profile, user);
      const base = {
        topic: topic.trim(),
        createdAt: Date.now(),
        createdBy: user.uid,
        isPrivate,
        plannedRounds: rounds,
        proUid: null as string | null,
        proName: null as string | null,
        conUid: null as string | null,
        conName: null as string | null,
        status: 'open' as Room['status'],
      };
      const myAvatarId = (profile?.avatarId ?? 'char1') as string;
      const myAvatarDataUrl = profile?.avatarDataUrl ?? null;
      if (mode === 'ai') {
        if (side === 'pro') {
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
          side === 'pro'
            ? { conUid: AI_OPPONENT_UID, conName: AI_OPPONENT_NAME, conAvatarId: 'char3', conAvatarDataUrl: null as string | null, status: 'live' as const }
            : { proUid: AI_OPPONENT_UID, proName: AI_OPPONENT_NAME, proAvatarId: 'char3', proAvatarDataUrl: null as string | null, status: 'live' as const };
        await updateDoc(doc(db, 'rooms', ref.id), aiFields);
      }
      setShowCreate(false);
      onEnter(ref.id);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('[create room failed]', phase, err);
      showToast(`방 생성 실패 (${phase}): ${err.code ?? ''} ${err.message ?? '알 수 없는 오류'}`, 'error');
      throw e; // let the modal reset its busy state
    }
  };

  const counts = useMemo(
    () => ({
      live: rooms.filter((r) => r.status === 'live').length,
      open: rooms.filter((r) => r.status === 'open').length,
      ended: rooms.filter((r) => r.status === 'ended').length,
    }),
    [rooms],
  );

  const q = search.trim().toLowerCase();
  const matchSearch = (r: Room) => !q || `${r.topic} ${r.proName ?? ''} ${r.conName ?? ''}`.toLowerCase().includes(q);
  const isAi = (r: Room) => r.proUid === AI_OPPONENT_UID || r.conUid === AI_OPPONENT_UID;
  const passFilter = (r: Room) =>
    filter === 'live' ? r.status === 'live' : filter === 'open' ? r.status === 'open' : filter === 'ended' ? r.status === 'ended' : filter === 'ai' ? isAi(r) : true;
  const keep = (r: Room) => matchSearch(r) && passFilter(r);

  // Featured = the first (most recent) live room; null-safe when none are live.
  const featured = useMemo(() => rooms.find((r) => r.status === 'live') ?? null, [rooms]);
  const live = rooms.filter((r) => r.status === 'live' && (!featured || r.id !== featured.id) && keep(r));
  const open = rooms.filter((r) => r.status === 'open' && keep(r));
  const ended = rooms.filter((r) => r.status === 'ended' && keep(r));
  const featuredVisible = !!featured && keep(featured);
  const totalMatches = (featuredVisible ? 1 : 0) + live.length + open.length + ended.length;

  const dateLabel = new Date().toLocaleDateString(en ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const openCreate = () => setShowCreate(true);

  return (
    <div className="tb-root tb-lobby">
      <LobbyMasthead
        live={counts.live}
        open={counts.open}
        ended={counts.ended}
        dateLabel={dateLabel}
        onCreate={openCreate}
        featured={featuredVisible && featured ? toCardRoom(featured, lang) : null}
        onEnter={onEnter}
        lang={lang}
      />

      <div style={{ height: 28 }} />
      <LobbySearchBar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} onCreate={openCreate} lang={lang} />

      <main className="tb-pad" style={{ padding: '40px 64px 64px', maxWidth: 1280, margin: '0 auto' }}>
        {rooms.length === 0 && <EmptyState lang={lang} onCreate={openCreate} />}
        {rooms.length > 0 && totalMatches === 0 && (
          <NoResult lang={lang} q={search.trim()} onClear={() => { setSearch(''); setFilter('all'); }} />
        )}

        {live.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <SectionHead eyebrow={en ? 'LIVE NOW' : 'LIVE NOW'} title={en ? 'Live right now' : '지금 진행 중'} count={live.length} accent="var(--vermillion)" />
            <div className="tb-grid">
              {live.map((r) => (
                <LiveCard key={r.id} room={toCardRoom(r, lang)} onEnter={onEnter} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {open.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <SectionHead
              eyebrow={en ? 'OPEN · RECRUITING' : 'OPEN · 상대 모집 중'}
              title={en ? 'Open to join' : '지금 참가 가능'}
              count={open.length}
              accent="var(--gold)"
              action={
                <button type="button" onClick={openCreate} className="tb-hide-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1.5px var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 13.5, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 16, lineHeight: 0 }}>+</span> {en ? 'Open mine' : '내 방 열기'}
                </button>
              }
            />
            <div className="tb-grid">
              {open.map((r) => (
                <JoinCard key={r.id} room={toCardRoom(r, lang)} onEnter={onEnter} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {ended.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <SectionHead eyebrow={en ? 'REPLAY · RECENT' : 'REPLAY · 최근 종료'} title={en ? 'Recent verdicts' : '최근 종료된 명경기'} count={ended.length} accent="var(--celadon)" />
            <div className="tb-grid">
              {ended.map((r) => (
                <ResultCard key={r.id} room={toCardRoom(r, lang)} onEnter={onEnter} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {/* lobby lounge — a light chat before opening / between spectating */}
        {db && (
          <section style={{ marginTop: 8 }}>
            <SectionHead eyebrow={en ? 'LOUNGE' : 'LOUNGE · 로비'} title={en ? 'A quick word' : '잠깐, 한 마디'} accent="var(--ink-fade)" />
            <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--paper-light)', boxShadow: '0 22px 46px -30px rgba(40,60,45,0.4), 0 0 0 1px rgba(0,0,0,0.04)', padding: 16 }}>
              <ChatPanel
                title={en ? '💬 Lobby chat' : '💬 로비 전체 채팅'}
                lang={lang}
                collectionRef={collection(db, 'lobby_messages')}
                user={user}
                myName={displayNameOf(profile, user)}
                myAvatarId={profile?.avatarId}
                myAvatarDataUrl={profile?.avatarDataUrl ?? null}
                canPost={!!user}
                emptyHint={en ? 'Say hi in the lobby!' : '로비에 인사를 남겨보세요!'}
                height={240}
              />
            </div>
          </section>
        )}
      </main>

      {showCreate && <CreateModal lang={lang} user={user} onClose={() => setShowCreate(false)} onSignIn={onSignIn} onCreate={createRoom} />}
    </div>
  );
}

/* ===== empty / no-result states ===== */
function EmptyState({ lang, onCreate }: { lang: Lang; onCreate: () => void }) {
  const en = lang === 'en';
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', borderRadius: 24, background: 'linear-gradient(158deg, #f3ecd9, #ece3cd)', boxShadow: 'inset 0 0 0 1px #e3d9c2' }}>
      <div aria-hidden="true" style={{ fontSize: 34, lineHeight: 1, marginBottom: 8 }}>🔥</div>
      <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 27, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
        {en ? 'No debates open yet' : '아직 열린 토론이 없어요'}
      </h3>
      <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--ink-soft)' }}>
        <span style={{ fontFamily: 'var(--font-hand)', color: 'var(--vermillion)', fontSize: 18 }}>
          {en ? 'Open the stage now and be the first debater.' : '지금 무대를 열면 첫 토론자다.'}
        </span>
      </p>
      <button type="button" onClick={onCreate} style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--celadon)', color: '#fff', boxShadow: '0 16px 32px -14px var(--celadon)', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15.5 }}>
        <span style={{ fontSize: 18, lineHeight: 0 }}>+</span> {en ? 'Create the first room' : '첫 토론방 만들기'}
      </button>
    </div>
  );
}

function NoResult({ lang, q, onClear }: { lang: Lang; q: string; onClear: () => void }) {
  const en = lang === 'en';
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', borderRadius: 24, background: 'linear-gradient(158deg, #f3ecd9, #ece3cd)', boxShadow: 'inset 0 0 0 1px #e3d9c2', marginBottom: 8 }}>
      <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 24, color: 'var(--ink)' }}>
        {q ? (en ? `No results for “${q}”` : `「${q}」 검색 결과가 없습니다`) : en ? 'No debates match' : '조건에 맞는 토론이 없습니다'}
      </h3>
      <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--ink-soft)' }}>{en ? 'Try another keyword or filter — or open your own room.' : '다른 키워드나 필터로 찾거나 직접 토론방을 열어보세요.'}</p>
      <button type="button" onClick={onClear} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--ink)', color: '#fcf6e8', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14.5 }}>
        {en ? 'Show all' : '전체 보기'}
      </button>
    </div>
  );
}
