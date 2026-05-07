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
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
        onSignIn={() => auth && signInWithPopup(auth, googleProvider)}
        onSignOut={() => auth && signOut(auth)}
        onHome={() => {
          setActiveRoomId(null);
          setShowProfile(false);
        }}
        onProfile={() => {
          setShowProfile(true);
          setActiveRoomId(null);
        }}
      />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
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
          <Lobby user={user} profile={profile} onEnter={setActiveRoomId} />
        )}
      </main>
      <footer className="py-6 text-center text-xs text-zinc-500">맞짱토론 · AI 사회자 진행</footer>
    </div>
  );
}

function Header({
  user,
  profile,
  onSignIn,
  onSignOut,
  onHome,
  onProfile,
}: {
  user: User | null;
  profile: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onHome: () => void;
  onProfile: () => void;
}) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={onHome} className="text-lg font-bold tracking-tight">
          🔥 <span className="text-emerald-400">맞짱</span>토론
        </button>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <button
                onClick={onProfile}
                title="내 프로필"
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                {displayNameOf(profile, user)}
              </button>
              <button onClick={onSignOut} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium"
            >
              Google 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Lobby({
  user,
  profile,
  onEnter,
}: {
  user: User | null;
  profile: UserProfile | null;
  onEnter: (id: string) => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<'human' | 'ai'>('human');
  const [mySide, setMySide] = useState<Side>('pro');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Room, 'id'>) })));
    });
  }, []);

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
        proUid: null as string | null,
        proName: null as string | null,
        conUid: null as string | null,
        conName: null as string | null,
        status: 'open' as Room['status'],
      };
      if (mode === 'ai') {
        if (mySide === 'pro') {
          base.proUid = user.uid;
          base.proName = myName;
        } else {
          base.conUid = user.uid;
          base.conName = myName;
        }
      }
      phase = 'addDoc';
      const ref = await addDoc(collection(db, 'rooms'), base);
      if (mode === 'ai') {
        phase = 'updateDoc(ai)';
        const aiFields =
          mySide === 'pro'
            ? { conUid: AI_OPPONENT_UID, conName: AI_OPPONENT_NAME, status: 'live' as const }
            : { proUid: AI_OPPONENT_UID, proName: AI_OPPONENT_NAME, status: 'live' as const };
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

  return (
    <div className="space-y-8">
      <section className="text-center py-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          토론으로 <span className="text-emerald-400">승부</span>하라
        </h1>
        <p className="mt-3 text-zinc-400">찬반 1:1 실시간 토론 · AI 사회자가 진행 · 관전자 투표로 승자 결정</p>
      </section>

      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">새 토론방 만들기</h2>
        {user ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                placeholder="예: 인공지능은 인간을 대체할 것인가?"
                className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={fetchSuggestions}
                disabled={loadingTopics}
                title="AI 주제 추천"
                className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-sm"
              >
                {loadingTopics ? '…' : '🎲 추천'}
              </button>
            </div>

            {suggestions.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        setTopic(s);
                        setSuggestions([]);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-full bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-300 border border-zinc-700"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setMode('human')}
                className={classNames(
                  'flex-1 py-2 rounded text-sm font-medium border',
                  mode === 'human'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600',
                )}
              >
                👥 사람과 1:1
              </button>
              <button
                onClick={() => setMode('ai')}
                className={classNames(
                  'flex-1 py-2 rounded text-sm font-medium border',
                  mode === 'ai'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600',
                )}
              >
                🤖 AI와 토론
              </button>
            </div>

            {mode === 'ai' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setMySide('pro')}
                  className={classNames(
                    'flex-1 py-1.5 rounded text-sm border',
                    mySide === 'pro'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400',
                  )}
                >
                  내가 찬성
                </button>
                <button
                  onClick={() => setMySide('con')}
                  className={classNames(
                    'flex-1 py-1.5 rounded text-sm border',
                    mySide === 'con'
                      ? 'bg-rose-500/15 border-rose-500 text-rose-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400',
                  )}
                >
                  내가 반대
                </button>
              </div>
            )}

            <button
              onClick={create}
              disabled={creating || !topic.trim()}
              className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold"
            >
              {creating ? '생성 중…' : mode === 'ai' ? 'AI와 토론 시작' : '방 만들기'}
            </button>
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">방을 만들려면 Google 로그인이 필요합니다.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">진행 중인 토론 ({rooms.length})</h2>
        {rooms.length === 0 ? (
          <p className="text-zinc-500 text-sm">아직 토론방이 없습니다. 첫 번째 주제를 던져보세요!</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {rooms.map((r) => {
              const mine = !!user && r.createdBy === user.uid;
              return (
                <li key={r.id} className="relative">
                  <button
                    onClick={() => onEnter(r.id)}
                    className={classNames(
                      'w-full text-left bg-zinc-900/60 border rounded-lg p-4 transition',
                      mine ? 'border-emerald-500/30 hover:border-emerald-500' : 'border-zinc-800 hover:border-emerald-500/60',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={r.status} phase={r.phase} extendRound={r.extendRound} />
                        {mine && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300">
                            내 방
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(r.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="font-medium line-clamp-2 pr-8">{r.topic}</p>
                    <div className="mt-3 flex gap-3 text-xs">
                      <span className={r.proUid ? 'text-emerald-400' : 'text-zinc-500'}>
                        찬성: {r.proName ?? '대기 중'}
                      </span>
                      <span className={r.conUid ? 'text-rose-400' : 'text-zinc-500'}>
                        반대: {r.conName ?? '대기 중'}
                      </span>
                    </div>
                  </button>
                  {mine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRoom(r.id);
                      }}
                      title="삭제"
                      className="absolute top-2 right-2 w-7 h-7 rounded text-zinc-500 hover:text-rose-300 hover:bg-rose-500/15 flex items-center justify-center text-sm"
                    >
                      🗑
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({
  status,
  phase,
  extendRound,
}: {
  status: Room['status'];
  phase?: Phase;
  extendRound?: number;
}) {
  if (status === 'live' && phase) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300">
        ▶ {PHASE_LABEL[phase]}
        {extendRound && extendRound > 0 ? ` · R${extendRound + 1}` : ''}
      </span>
    );
  }
  const map = {
    open: ['모집중', 'bg-amber-500/20 text-amber-300'],
    live: ['LIVE', 'bg-emerald-500/20 text-emerald-300'],
    ended: ['종료', 'bg-zinc-700/50 text-zinc-400'],
  } as const;
  const [label, cls] = map[status];
  return <span className={classNames('px-2 py-0.5 rounded text-xs font-medium', cls)}>{label}</span>;
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
  const openingTriggered = useRef(false);
  const argueTriggeredFor = useRef<string | null>(null);
  const advancingFor = useRef<string | null>(null);
  const extendingFor = useRef<number | null>(null);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) setRoom({ id: snap.id, ...(snap.data() as Omit<Room, 'id'>) });
    });
  }, [roomId]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
    const field =
      side === 'pro'
        ? { proUid: user.uid, proName: myName }
        : { conUid: user.uid, conName: myName };
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
    const updates: Record<string, ReturnType<typeof increment>> = {
      totalDebates: increment(1),
    };
    if (winner === 'tie' || !winner) {
      updates.ties = increment(1);
    } else if (winner === mySide) {
      updates[mySide === 'pro' ? 'winsAsPro' : 'winsAsCon'] = increment(1);
    } else {
      updates[mySide === 'pro' ? 'lossesAsPro' : 'lossesAsCon'] = increment(1);
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
        if (!r.ok) throw new Error('closing failed');
        const { text: aiText } = await r.json();
        await postModerator(aiText);
        const winner: Side | 'tie' =
          proCount > conCount ? 'pro' : conCount > proCount ? 'con' : 'tie';
        await updateDoc(doc(db, 'rooms', roomId), { status: 'ended', winner });
      } else {
        const nextSpeakerSide = PHASE_SPEAKER[next];
        const nextSpeakerName =
          nextSpeakerSide === 'pro' ? room.proName : nextSpeakerSide === 'con' ? room.conName : '';
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
        if (!r.ok) throw new Error('transition failed');
        const { text: aiText } = await r.json();
        await postModerator(aiText);
        await updateDoc(doc(db, 'rooms', roomId), { phase: next });
      }
    } catch (e) {
      console.error(e);
      advancingFor.current = null;
      alert('AI 사회자 호출 실패. 서버 로그를 확인하세요.');
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
      <button onClick={onBack} className="text-sm text-zinc-400 hover:text-zinc-200">
        ← 로비로
      </button>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-bold">{room.topic}</h1>
          <StatusBadge status={room.status} phase={room.phase} extendRound={room.extendRound} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <SideCard
            label="찬성"
            color="emerald"
            name={room.proName}
            mine={mySide === 'pro'}
            speaking={currentSpeakerSide === 'pro'}
            canTake={!!user && !room.proUid && room.status === 'open' && mySide !== 'con'}
            onTake={() => takeSide('pro')}
          />
          <SideCard
            label="반대"
            color="rose"
            name={room.conName}
            mine={mySide === 'con'}
            speaking={currentSpeakerSide === 'con'}
            canTake={!!user && !room.conUid && room.status === 'open' && mySide !== 'pro'}
            onTake={() => takeSide('con')}
          />
        </div>

        {room.status !== 'open' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-400">찬성 {proCount}표 ({proPct}%)</span>
              <span className="text-rose-400">반대 {conCount}표 ({conPct}%)</span>
            </div>
            <div className="h-2 rounded overflow-hidden bg-zinc-800 flex">
              <div className="bg-emerald-500" style={{ width: `${proPct}%` }} />
              <div className="bg-rose-500" style={{ width: `${conPct}%` }} />
            </div>
          </div>
        )}

        {room.status === 'live' && mySide === 'spectator' && user && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => vote('pro')}
              className={classNames(
                'flex-1 py-2 rounded font-medium',
                votes[user.uid] === 'pro'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30',
              )}
            >
              찬성에 투표
            </button>
            <button
              onClick={() => vote('con')}
              className={classNames(
                'flex-1 py-2 rounded font-medium',
                votes[user.uid] === 'con'
                  ? 'bg-rose-500 text-zinc-950'
                  : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30',
              )}
            >
              반대에 투표
            </button>
          </div>
        )}

        {room.status === 'live' && room.phase && aiBusy && (
          <div className="mt-3 w-full py-2 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-center text-sm font-medium">
            🤖 AI 사회자 작성 중…
          </div>
        )}

        {room.status === 'ended' && (
          <>
            <div className="mt-4 p-3 rounded bg-zinc-950 border border-zinc-800 text-center">
              <p className="text-sm text-zinc-400">관전자 투표 결과</p>
              <p className="text-lg font-bold mt-1">
                {room.winner === 'pro' && <span className="text-emerald-400">찬성 측 승리 🏆</span>}
                {room.winner === 'con' && <span className="text-rose-400">반대 측 승리 🏆</span>}
                {room.winner === 'tie' && <span className="text-zinc-300">무승부</span>}
              </p>
            </div>

            <div className="mt-3 p-3 rounded bg-zinc-950 border border-zinc-800 space-y-2">
              <p className="text-xs text-zinc-400 text-center">
                양측 모두 동의하면 추가 라운드로 토론을 이어갈 수 있습니다.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <ConsentChip
                  label="찬성"
                  name={room.proName}
                  agreed={!!room.extendRequestPro}
                  color="emerald"
                />
                <ConsentChip
                  label="반대"
                  name={room.conName}
                  agreed={!!room.extendRequestCon}
                  color="rose"
                />
              </div>
              {(mySide === 'pro' || mySide === 'con') && (
                <button
                  onClick={requestExtend}
                  disabled={aiBusy}
                  className={classNames(
                    'w-full py-2 rounded text-sm font-medium border',
                    (mySide === 'pro' ? room.extendRequestPro : room.extendRequestCon)
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 hover:border-emerald-500/60 text-zinc-200',
                    aiBusy && 'opacity-50',
                  )}
                >
                  {(mySide === 'pro' ? room.extendRequestPro : room.extendRequestCon)
                    ? '✓ 추가 라운드 요청 중 (취소하려면 다시 클릭)'
                    : '🔁 추가 라운드 요청'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div
        ref={scrollRef}
        className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 h-[480px] overflow-y-auto space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-10">
            {room.status === 'open'
              ? '두 토론자가 모이면 AI 사회자가 토론을 시작합니다.'
              : aiBusy
                ? '🤖 AI 사회자가 발언을 준비하고 있습니다…'
                : '잠시만 기다려주세요.'}
          </p>
        ) : (
          messages.map((m) => <MessageRow key={m.id} m={m} mine={m.uid === user?.uid && m.side !== 'moderator'} />)
        )}
        {aiBusy && messages.length > 0 && (
          <p className="text-xs text-amber-400 text-center pt-2">🤖 AI 사회자 작성 중…</p>
        )}
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
              className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none resize-y min-h-[96px]"
            />
            <button
              onClick={send}
              disabled={!text.trim() || polishing}
              className="px-4 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-medium self-stretch"
            >
              {polishing ? '정리 중…' : '전송'}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400 select-none cursor-pointer">
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
              className="accent-emerald-500"
            />
            <span>자동 문단 정리</span>
            <span className="text-zinc-600">— 전송 시 AI가 띄어쓰기·오타·문장 분리·문단을 다듬음 (논거는 그대로)</span>
          </label>
        </div>
      )}

      {room.status === 'live' && (mySide === 'pro' || mySide === 'con') && !isMyTurn && (
        <p className="text-center text-xs text-zinc-500">
          현재는 {currentSpeakerSide === 'pro' ? '찬성' : currentSpeakerSide === 'con' ? '반대' : '사회자'}
          {' '}차례입니다. 기다려주세요.
        </p>
      )}

      {room.status === 'live' && mySide === 'spectator' && (
        <p className="text-center text-xs text-zinc-500">관전자는 발언할 수 없습니다. 투표로 참여하세요.</p>
      )}
    </div>
  );
}

function SideCard({
  label,
  color,
  name,
  mine,
  speaking,
  canTake,
  onTake,
}: {
  label: string;
  color: 'emerald' | 'rose';
  name: string | null;
  mine: boolean;
  speaking: boolean;
  canTake: boolean;
  onTake: () => void;
}) {
  const ring = speaking
    ? color === 'emerald'
      ? 'border-emerald-500 ring-2 ring-emerald-500/40'
      : 'border-rose-500 ring-2 ring-rose-500/40'
    : color === 'emerald'
      ? 'border-emerald-500/40'
      : 'border-rose-500/40';
  const text = color === 'emerald' ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div className={classNames('rounded-lg border p-3 bg-zinc-950 transition', ring)}>
      <div className="flex items-center justify-between">
        <span className={classNames('text-sm font-semibold', text)}>
          {label} {speaking && '🎤'}
        </span>
        {mine && <span className="text-xs text-zinc-500">(나)</span>}
      </div>
      <p className="mt-1 font-medium">{name ?? <span className="text-zinc-500">대기 중</span>}</p>
      {canTake && (
        <button
          onClick={onTake}
          className={classNames(
            'mt-2 w-full py-1.5 rounded text-sm font-medium',
            color === 'emerald'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
              : 'bg-rose-500 hover:bg-rose-400 text-zinc-950',
          )}
        >
          이 입장으로 참가
        </button>
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
    <div className="rounded border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-400">
      <div className="font-semibold text-zinc-300 mb-1">
        {PHASE_LABEL[phase]} 가이드
      </div>
      <ul className="space-y-0.5">
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function ConsentChip({
  label,
  name,
  agreed,
  color,
}: {
  label: string;
  name: string | null;
  agreed: boolean;
  color: 'emerald' | 'rose';
}) {
  const text = color === 'emerald' ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div
      className={classNames(
        'px-2 py-1.5 rounded border text-center',
        agreed ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-zinc-900 border-zinc-800',
      )}
    >
      <span className={classNames('font-medium', text)}>{label}</span>
      <span className="text-zinc-500 mx-1">·</span>
      <span className="text-zinc-300">{name ?? '?'}</span>
      <span className="ml-1.5">{agreed ? '✓ 동의' : '대기'}</span>
    </div>
  );
}

function MessageRow({ m, mine }: { m: Message; mine: boolean }) {
  if (m.side === 'moderator') {
    return (
      <div className="mx-auto max-w-[92%] rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
        <div className="text-xs text-amber-300 font-semibold mb-1">{AI_NAME}</div>
        <p className="text-sm whitespace-pre-wrap break-words text-amber-50">{m.text}</p>
      </div>
    );
  }
  const sideColor =
    m.side === 'pro'
      ? 'bg-emerald-500/15 border-emerald-500/30'
      : m.side === 'con'
        ? 'bg-rose-500/15 border-rose-500/30'
        : 'bg-zinc-800/50 border-zinc-700';
  const align = m.side === 'con' ? 'ml-auto' : '';
  return (
    <div className={classNames('max-w-[80%] rounded-lg border px-3 py-2', sideColor, align)}>
      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-0.5">
        <span className="font-medium">{m.name}</span>
        <span>{m.side === 'pro' ? '찬성' : m.side === 'con' ? '반대' : '관전'}</span>
        {mine && <span>· 나</span>}
      </div>
      <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
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

  useEffect(() => {
    setNickname(profile?.nickname ?? user.displayName ?? '');
  }, [profile?.nickname, user.displayName]);

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

  const wins = (profile?.winsAsPro ?? 0) + (profile?.winsAsCon ?? 0);
  const losses = (profile?.lossesAsPro ?? 0) + (profile?.lossesAsCon ?? 0);
  const ties = profile?.ties ?? 0;
  const total = profile?.totalDebates ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const dirty = (profile?.nickname ?? '') !== nickname.trim();

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-zinc-400 hover:text-zinc-200">
        ← 로비로
      </button>

      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">내 프로필</h2>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Google 계정</label>
          <p className="text-sm text-zinc-300">{user.displayName ?? '익명'} · {user.email ?? '—'}</p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">닉네임 (토론에서 표시되는 이름)</label>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder="닉네임"
              className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-medium"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1">최대 20자. 다음 토론부터 적용됩니다.</p>
        </div>
      </section>

      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">전적</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="총 토론" value={total} />
          <StatBox label="승률" value={`${winRate}%`} />
          <StatBox label="승" value={wins} accent="emerald" />
          <StatBox label="패" value={losses} accent="rose" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="text-emerald-400 font-medium mb-1">찬성 측 전적</div>
            <div className="text-zinc-300">
              {profile?.winsAsPro ?? 0}승 / {profile?.lossesAsPro ?? 0}패
            </div>
          </div>
          <div className="rounded border border-rose-500/20 bg-rose-500/5 p-3">
            <div className="text-rose-400 font-medium mb-1">반대 측 전적</div>
            <div className="text-zinc-300">
              {profile?.winsAsCon ?? 0}승 / {profile?.lossesAsCon ?? 0}패
            </div>
          </div>
        </div>
        {ties > 0 && (
          <p className="text-xs text-zinc-500 mt-3">무승부: {ties}회</p>
        )}
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
  accent?: 'emerald' | 'rose';
}) {
  const color =
    accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-400' : 'text-zinc-100';
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-center">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={classNames('text-2xl font-bold mt-1', color)}>{value}</div>
    </div>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center text-zinc-400">{children}</div>;
}

function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h1 className="text-xl font-bold">🔥 맞짱토론 — 설정 필요</h1>
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
