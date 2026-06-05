// #25 (incremental step 12): RoomView (debate room) extracted from App.tsx (body verbatim).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  AI_OPPONENT_NAME,
  AI_OPPONENT_UID,
  NEXT_PHASE,
  PHASE_LABEL,
  PHASE_SPEAKER,
  type Message,
  type Phase,
  type Room,
  type Side,
  type UserProfile,
} from '../../types';
import { AI_NAME, STATS_KEY, TIDY_KEY } from '../../lib/constants';
import { aiFetch, closeDebateFn, polishText } from '../../lib/aiClient';
import { displayNameOf } from '../../lib/userText';
import { computeOutcome } from '../../lib/verdict';
import type { Lang } from '../../i18n/landing';
import { roomStrings } from '../../i18n/room';
import { commonStrings } from '../../i18n/common';
import { useRoomPrefs } from '../../hooks/useRoomPrefs';
import { showToast } from '../Toast';
import { ChatPanel } from '../ChatPanel';
import { ObjectionOverlay, type OverlayKind } from '../ObjectionOverlay';
import { RoundTimeline, VSMark, VoteBar } from '../common';
import { CenterMsg } from '../AppChrome';
import { InviteLinkButton, PhaseGuide, PhaseProgress, StatusBadge } from './RoomParts';
import { MessageRow, SideCard, VerdictBlock } from './RoomPanels';

export function RoomView({
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
    <div className="space-y-4 rm2-skin">
      <style>{`
        /* ===== rm2-* RoomView "arena" skin (restored from local redesign).
           Only cosmetics — scoped under .rm2-skin so nothing leaks globally.
           Uses theme-aware tokens for dark/4-theme support. ===== */

        /* --- 발언석(floor): dedicated header strip + paper body --- */
        .rm2-skin .rm2-floor {
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-md);
          border: var(--border-line);
          overflow: hidden;
          position: relative;
        }
        .rm2-skin .rm2-floor__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--color-paper-deep);
          border-bottom: var(--border-line);
        }
        .rm2-skin .rm2-floor__title {
          font-family: var(--font-hand);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-ink-soft);
        }
        .rm2-skin .rm2-floor__id {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--color-ink-fade);
        }
        .rm2-skin .rm2-floor__body {
          padding: 14px;
          background: var(--color-paper-light);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: clamp(360px, 55vh, 480px);
        }
        .rm2-skin .rm2-floor__empty {
          font-size: 13px;
          text-align: center;
          padding: 40px 16px;
          color: var(--color-ink-fade);
        }
        /* moderator card sits centered in the flex column */
        .rm2-skin .rm2-floor__body > .msg--mod { align-self: center; width: 100%; }
        /* AI-progress row spans full width in the flex column */
        .rm2-skin .rm2-floor__body > .ai-progress { align-self: stretch; }

        /* --- message bubbles: pro left / con right + corner tail --- */
        .rm2-skin .rm2-bubble {
          max-width: 82%;
          padding: 10px 14px;
          position: relative;
          box-shadow: var(--shadow-sm);
        }
        .rm2-skin .rm2-bubble--pro {
          background: var(--color-tint-pro);
          border: 1.5px solid var(--color-vermillion);
          border-radius: 14px 14px 14px 4px;
          align-self: flex-start;
        }
        .rm2-skin .rm2-bubble--con {
          background: var(--color-tint-con);
          border: 1.5px solid var(--color-celadon);
          border-radius: 14px 14px 4px 14px;
          align-self: flex-end;
          margin-left: auto;
        }
        .rm2-skin .rm2-bubble__header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 6px;
        }
        .rm2-skin .rm2-bubble__chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #fff;
          border-radius: var(--r-sm);
          padding: 2px 7px;
          margin-right: 2px;
        }
        .rm2-skin .rm2-bubble__chip--pro { background: var(--color-vermillion); }
        .rm2-skin .rm2-bubble__chip--con { background: var(--color-celadon); }
        .rm2-skin .rm2-bubble__name {
          font-family: var(--font-hand);
          font-size: 12px;
          color: var(--color-ink-soft);
        }
        .rm2-skin .rm2-bubble__mine {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-ink-fade);
          letter-spacing: 0.08em;
        }
        .rm2-skin .rm2-bubble__text {
          font-family: var(--font-body);
          font-size: 14.5px;
          line-height: 1.75;
          white-space: pre-wrap;
          word-break: keep-all;
          color: var(--color-ink);
          margin: 0;
        }

        /* --- composer: arena-toned input --- */
        .rm2-skin .rm2-composer {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rm2-skin .rm2-composer__row {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }
        .rm2-skin .rm2-composer__textarea {
          flex: 1;
          border-radius: var(--r-md);
          border: 1.5px solid var(--color-line);
          background: var(--color-paper-light);
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-ink);
          padding: 12px 14px;
          resize: vertical;
          min-height: 96px;
          transition: border-color 0.15s;
          outline: none;
        }
        .rm2-skin .rm2-composer__textarea:focus { border-color: var(--color-vermillion); }
        .rm2-skin .rm2-composer__send {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: var(--color-vermillion);
          border: none;
          border-radius: var(--r-pill);
          padding: 0 24px;
          cursor: pointer;
          align-self: stretch;
          transition: opacity 0.15s, transform 0.1s;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .rm2-skin .rm2-composer__send:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .rm2-skin .rm2-composer__send:disabled { opacity: .45; cursor: not-allowed; }
        .rm2-skin .rm2-composer__send:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        .rm2-skin .rm2-composer__tidy {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-ink-soft);
          cursor: pointer;
          user-select: none;
          flex-wrap: wrap;
        }
        .rm2-skin .rm2-composer__tidy-label { font-weight: 700; }
        .rm2-skin .rm2-composer__tidy-hint { color: var(--color-ink-fade); }

        .rm2-skin .rm2-wait {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--color-ink-fade);
          padding: 6px;
        }

        @media (max-width: 480px) {
          .rm2-skin .rm2-composer__row { flex-wrap: wrap; }
          .rm2-skin .rm2-composer__send { width: 100%; padding: 12px; border-radius: var(--r-md); }
        }
      `}</style>
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
              border: 'var(--border-line)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--shadow-md)',
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
                      border: 'var(--border-line)',
                      borderRadius: 'var(--r-pill)',
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
                      border: 'var(--border-line)',
                      borderRadius: 'var(--r-pill)',
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
              border: '1px solid var(--color-vermillion)',
              borderRadius: 'var(--r-md)',
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

      {/* ④ 발언석 (Debate Floor) — dedicated header bar with room tag, then the
          bubble feed. The whole block shares the rounded "arena" tone (deep-tint
          header strip + paper body) to read as one piece with the HUD above. */}
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
          <span className="rm2-floor__title">{tRoom.floor.title}</span>
          <span className="rm2-floor__id">{tRoom.floor.roomTag(roomId.slice(0, 8))}</span>
        </div>
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="토론 발언"
          className="rm2-floor__body"
        >
        {messages.length === 0 ? (
          <p className="rm2-floor__empty">
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

      {/* ⑤ 입력(composer) — same rounded arena tone: deep-tint guide + paper
          textarea with vermillion focus + pill send button. */}
      {room.status === 'live' && isMyTurn && room.phase && (
        <div className="rm2-composer">
          <PhaseGuide phase={room.phase} side={mySide as Side} />
          <div className="rm2-composer__row">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${PHASE_LABEL[room.phase]} 발언…`}
              rows={4}
              className="rm2-composer__textarea"
            />
            <button
              onClick={send}
              disabled={!text.trim() || polishing}
              className="rm2-composer__send"
            >
              {polishing ? '정리 중…' : '전송'}
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
            <span className="rm2-composer__tidy-label">자동 문단 정리</span>
            <span className="rm2-composer__tidy-hint">
              — 전송 시 AI가 띄어쓰기·오타·문장 분리·문단을 다듬음 (논거는 그대로)
            </span>
          </label>
        </div>
      )}

      {room.status === 'live' && (mySide === 'pro' || mySide === 'con') && !isMyTurn && (
        <p className="rm2-wait">
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
        <p className="rm2-wait">
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
