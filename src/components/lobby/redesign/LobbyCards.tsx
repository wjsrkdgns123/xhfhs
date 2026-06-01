// 토론배틀 로비 redesign — curated cards (live / join / result) + featured stage.
// Ported from the design bundle (redesign/LobbyRooms.jsx + LobbyFeatured.jsx) and
// mapped onto the real Room model. Live rooms carry no live vote/viewer tally in
// the lobby snapshot, so those cards show real signals (round · phase · faceoff)
// instead of fabricated numbers; ended rooms use the real finalProScore/winner.
import type { CSSProperties } from 'react';
import { AI_OPPONENT_UID, PHASE_LABEL, type Phase, type Room } from '../../../types';
import type { Lang } from '../../../i18n/landing';
import { EyeIcon, MascotChip, TrophyIcon } from '../../redesign/RedesignPrimitives';

const EN_PHASE: Record<Phase, string> = {
  opening: 'Opening',
  pro_arg: 'Pro case',
  con_arg: 'Con case',
  pro_rebut: 'Pro rebuttal',
  con_rebut: 'Con rebuttal',
};

export interface CardRoom {
  id: string;
  status: Room['status'];
  topic: string;
  pro: string | null;
  con: string | null;
  ai: boolean;
  isPrivate: boolean;
  rounds?: number;
  roundLabel?: string;
  winner: 'pro' | 'con' | null;
  proPct: number;
  conPct: number;
}

export function toCardRoom(room: Room, lang: Lang): CardRoom {
  const ai = room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
  const proPct = typeof room.finalProScore === 'number' ? room.finalProScore : 50;
  let roundLabel: string | undefined;
  if (room.status === 'live') {
    const n = (room.extendRound ?? 0) + 1;
    const phase = room.phase ? (lang === 'en' ? EN_PHASE[room.phase] : PHASE_LABEL[room.phase]) : '';
    roundLabel = phase ? `R${n} · ${phase}` : `R${n}`;
  }
  return {
    id: room.id,
    status: room.status,
    topic: room.topic,
    pro: room.proName,
    con: room.conName,
    ai,
    isPrivate: !!room.isPrivate,
    rounds: room.plannedRounds,
    roundLabel,
    winner: room.winner === 'pro' ? 'pro' : room.winner === 'con' ? 'con' : null,
    proPct,
    conPct: 100 - proPct,
  };
}

/* ===== status pill ===== */
function StatusPill({ status, lang }: { status: Room['status']; lang: Lang }) {
  const en = lang === 'en';
  if (status === 'live') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px 5px 10px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 10.5, letterSpacing: '0.14em', background: 'var(--vermillion)', color: '#fff' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px 1px rgba(255,255,255,0.8)', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
        LIVE
      </span>
    );
  }
  const map = {
    open: { label: en ? 'OPEN' : '참가 가능', color: 'var(--gold)', tint: 'var(--gold-tint)' },
    ended: { label: en ? 'ENDED' : '종료', color: 'var(--ink-fade)', tint: '#ece4d3' },
  } as const;
  const m = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.12em', background: m.tint, color: m.color, boxShadow: `inset 0 0 0 1px ${m.color}40`, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function AiChip({ lang }: { lang: Lang }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.06em', background: 'var(--gold-tint)', color: 'var(--gold)', boxShadow: 'inset 0 0 0 1px rgba(184,132,42,0.3)', whiteSpace: 'nowrap' }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800 }}>討</span> {lang === 'en' ? 'AI' : 'AI 토론'}
    </span>
  );
}

function RoundChip({ text }: { text: string }) {
  return (
    <span className="tb-hide-sm" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.04em', color: 'var(--ink-fade)', padding: '5px 10px', borderRadius: 999, boxShadow: 'inset 0 0 0 1px #e3d9c2', whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

/* visual-only CTA (the whole card is the link; pointer-events:none lets clicks fall through) */
function EnterCTA({ label, color, dark, full, sm }: { label: string; color: string; dark?: boolean; full?: boolean; sm?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="tb-above"
      style={{
        pointerEvents: 'none',
        display: full ? 'flex' : 'inline-flex',
        boxSizing: 'border-box',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        width: full ? '100%' : 'auto',
        padding: sm ? '9px 16px' : '11px 20px',
        borderRadius: 999,
        background: dark ? '#ece4d3' : color,
        color: dark ? 'var(--ink-soft)' : '#fff',
        boxShadow: dark ? 'none' : `0 10px 22px -10px ${color}`,
        fontFamily: 'var(--font-body)',
        fontWeight: 800,
        fontSize: sm ? 13.5 : 14.5,
        whiteSpace: 'nowrap',
      }}
    >
      {label} →
    </span>
  );
}

const CARD_BASE: CSSProperties = {
  position: 'relative',
  background: 'var(--paper-light)',
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 22px 46px -30px rgba(40,60,45,0.45), 0 0 0 1px rgba(0,0,0,0.04)',
};

const TOPIC_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-serif)',
  fontWeight: 800,
  fontSize: 21,
  lineHeight: 1.32,
  letterSpacing: '-0.02em',
  color: 'var(--ink)',
  wordBreak: 'keep-all',
};

function CardTopic({ room, onEnter, ariaLabel }: { room: CardRoom; onEnter: (id: string) => void; ariaLabel: string }) {
  return (
    <h3 className="tb-card-topic" style={TOPIC_STYLE}>
      <a
        className="tb-cardlink"
        href={`#room-${room.id}`}
        onClick={(e) => {
          e.preventDefault();
          onEnter(room.id);
        }}
        aria-label={ariaLabel}
        style={{ color: 'inherit' }}
      >
        {room.topic}
      </a>
    </h3>
  );
}

/* faceoff nameplate — fox vs bear with names (real, honest signal for live) */
function Faceoff({ pro, con, lang }: { pro: string | null; con: string | null; lang: Lang }) {
  const en = lang === 'en';
  const name = (n: string | null, fallback: string) => (n && n.trim() ? n : fallback);
  const cell = (side: 'pro' | 'con') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, flexDirection: side === 'con' ? 'row-reverse' : 'row', textAlign: side === 'con' ? 'right' : 'left' }}>
      <MascotChip side={side} size={34} ring={false} />
      <div style={{ lineHeight: 1.2, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', color: side === 'pro' ? 'var(--vermillion)' : 'var(--celadon)' }}>
          {side === 'pro' ? (en ? 'PRO · 찬성' : 'PRO · 찬성') : en ? 'CON · 반대' : 'CON · 반대'}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {side === 'pro' ? name(pro, en ? 'Recruiting' : '모집 중') : name(con, en ? 'Recruiting' : '모집 중')}
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {cell('pro')}
      <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 16, color: 'var(--ink-ghost)', flexShrink: 0 }}>VS</span>
      {cell('con')}
    </div>
  );
}

/* mini vote bar — only used for ended rooms (real final split) */
function MiniVoteBar({ room }: { room: CardRoom }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <MascotChip side="pro" size={26} ring={false} />
      <div role="img" aria-label={`찬성 ${room.proPct}%, 반대 ${room.conPct}%`} style={{ flex: 1, position: 'relative', display: 'flex', height: 24, borderRadius: 999, overflow: 'hidden', background: '#f0ead9', opacity: 0.9 }}>
        <div style={{ width: room.proPct + '%', background: 'var(--vermillion)', display: 'flex', alignItems: 'center', paddingLeft: 9, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, boxShadow: room.winner === 'pro' ? 'inset 0 0 0 2px var(--gold)' : 'none' }}>
          {room.proPct}
        </div>
        <div style={{ width: room.conPct + '%', background: 'var(--celadon)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 9, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, boxShadow: room.winner === 'con' ? 'inset 0 0 0 2px var(--gold)' : 'none' }}>
          {room.conPct}
        </div>
        {room.winner === null && <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, transform: 'translateX(-50%)', background: 'var(--gold)' }} />}
      </div>
      <MascotChip side="con" size={26} ring={false} />
    </div>
  );
}

/* ===== live card ===== */
export function LiveCard({ room, onEnter, lang }: { room: CardRoom; onEnter: (id: string) => void; lang: Lang }) {
  const en = lang === 'en';
  return (
    <article className="tb-room-card" style={{ ...CARD_BASE, borderTop: '3px solid var(--vermillion)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 20px 0', flexWrap: 'wrap' }}>
        <StatusPill status="live" lang={lang} />
        {room.roundLabel && <RoundChip text={room.roundLabel} />}
        {room.ai && <AiChip lang={lang} />}
      </div>
      <div style={{ padding: '13px 20px 0' }}>
        <CardTopic room={room} onEnter={onEnter} ariaLabel={`${room.topic} — ${en ? 'watch' : '관전하기'}`} />
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <Faceoff pro={room.pro} con={room.con} lang={lang} />
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 18px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--ink-fade)', whiteSpace: 'nowrap' }}>
          <EyeIcon c="var(--ink-fade)" /> {en ? 'In session' : '관전 가능'}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <EnterCTA label={en ? 'Watch' : '관전하기'} color="var(--vermillion)" sm />
        </span>
      </div>
    </article>
  );
}

/* ===== join card (open) ===== */
export function JoinCard({ room, onEnter, lang }: { room: CardRoom; onEnter: (id: string) => void; lang: Lang }) {
  const en = lang === 'en';
  const openSide = !room.pro ? 'pro' : !room.con ? 'con' : null;
  const sideColor = openSide === 'pro' ? 'var(--vermillion)' : 'var(--celadon)';
  const openLabel = openSide === 'pro' ? (en ? 'PRO' : '찬성') : openSide === 'con' ? (en ? 'CON' : '반대') : '';
  return (
    <article className="tb-room-card" style={{ ...CARD_BASE, borderTop: '3px solid var(--gold)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 20px 0', flexWrap: 'wrap' }}>
        <StatusPill status="open" lang={lang} />
        {room.rounds != null && <RoundChip text={en ? `${room.rounds} rounds` : `${room.rounds}라운드`} />}
        {room.isPrivate && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, color: 'var(--ink-fade)' }}>{en ? 'Private' : '비공개'}</span>}
        {room.ai && <AiChip lang={lang} />}
      </div>
      <div style={{ padding: '13px 20px 0' }}>
        <CardTopic room={room} onEnter={onEnter} ariaLabel={`${room.topic} — ${en ? 'join' : '참가하기'}`} />
      </div>
      <div style={{ margin: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, background: 'var(--gold-tint)' }}>
        <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 0 1.5px ${sideColor}`, color: sideColor, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17 }}>+</span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.35 }}>
          {openSide ? (
            <>
              <b style={{ color: sideColor }}>{openLabel}</b> {en ? 'seat open · jump in' : '자리 비어있음 · 바로 입장'}
            </>
          ) : en ? (
            'Both seats open · pick first'
          ) : (
            '양측 모두 모집 중 · 먼저 선택'
          )}
        </span>
      </div>
      <div style={{ marginTop: 'auto', padding: '14px 20px 18px' }}>
        <EnterCTA label={en ? 'Join' : '참가하기'} color="var(--celadon)" full />
      </div>
    </article>
  );
}

/* ===== result card (ended) ===== */
export function ResultCard({ room, onEnter, lang }: { room: CardRoom; onEnter: (id: string) => void; lang: Lang }) {
  const en = lang === 'en';
  const draw = room.winner === null;
  const wc = room.winner === 'pro' ? 'var(--vermillion)' : room.winner === 'con' ? 'var(--celadon)' : 'var(--gold)';
  const result = room.winner === 'pro' ? (en ? 'PRO wins' : '찬성 승') : room.winner === 'con' ? (en ? 'CON wins' : '반대 승') : en ? 'Draw' : '무승부';
  return (
    <article className="tb-room-card" style={{ ...CARD_BASE, borderTop: '3px solid #cdbf9f' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 20px 0' }}>
        <StatusPill status="ended" lang={lang} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 12.5, color: wc, whiteSpace: 'nowrap' }}>
          {draw ? <span aria-hidden="true" style={{ width: 7, height: 7, background: wc, transform: 'rotate(45deg)' }} /> : <TrophyIcon c={wc} />}
          {result}
        </span>
        {room.ai && (
          <span style={{ marginLeft: 'auto' }}>
            <AiChip lang={lang} />
          </span>
        )}
      </div>
      <div style={{ padding: '13px 20px 0' }}>
        <CardTopic room={room} onEnter={onEnter} ariaLabel={`${room.topic} — ${en ? 'replay' : '다시 보기'}`} />
      </div>
      <div style={{ margin: '14px 20px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 14, padding: '6px 0' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 34, lineHeight: 1, color: 'var(--vermillion)', opacity: room.winner === 'con' ? 0.5 : 1 }}>{room.proPct}</span>
        <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 18, color: 'var(--ink-ghost)' }}>:</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 34, lineHeight: 1, color: 'var(--celadon)', opacity: room.winner === 'pro' ? 0.5 : 1 }}>{room.conPct}</span>
      </div>
      <div style={{ padding: '12px 20px 0' }}>
        <MiniVoteBar room={room} />
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 18px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--ink-fade)' }}>
          {en ? 'Final verdict' : '최종 판정'}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <EnterCTA label={en ? 'Replay' : '최종 승부 보기'} color="#ece4d3" dark sm />
        </span>
      </div>
    </article>
  );
}

/* ===== featured stage — most prominent live room ===== */
export function FeaturedMatch({ room, onEnter, lang }: { room: CardRoom; onEnter: (id: string) => void; lang: Lang }) {
  const en = lang === 'en';
  const name = (n: string | null, fb: string) => (n && n.trim() ? n : fb);
  const sideBlock = (side: 'pro' | 'con') => {
    const isPro = side === 'pro';
    const accent = isPro ? '#e8825e' : '#8fb6c4';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
        <MascotChip side={side} size={48} ring />
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.14em', color: accent }}>{isPro ? (en ? 'PRO' : '찬성') : en ? 'CON' : '반대'}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14, lineHeight: 1.15, color: '#fcf6e8', textAlign: 'center', maxWidth: 100, wordBreak: 'keep-all' }}>
          {isPro ? name(room.pro, en ? 'Recruiting' : '모집 중') : name(room.con, en ? 'Recruiting' : '모집 중')}
        </div>
      </div>
    );
  };
  return (
    <section
      aria-label={en ? 'Featured live debate' : '대표 라이브 토론'}
      className="tb-on-dark tb-featured"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        background: 'linear-gradient(152deg, #294035 0%, #20322a 56%, #1a2a23 100%)',
        boxShadow: '0 34px 72px -42px rgba(20,35,28,0.8), inset 0 0 0 1px rgba(240,207,126,0.2)',
        padding: '26px 30px',
      }}
    >
      <div className="tb-featured-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 26, alignItems: 'center' }}>
        {/* left — topic + stakes */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px 6px 11px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', background: 'var(--vermillion)', color: '#fff', boxShadow: '0 8px 20px -8px rgba(200,75,31,0.85)' }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 9px 1px rgba(255,255,255,0.85)', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
              LIVE
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.16em', color: '#f0cf7e', whiteSpace: 'nowrap' }}>
              {en ? 'HOTTEST DEBATE NOW' : '지금 가장 뜨거운 토론'}
            </span>
          </div>

          <h2 className="tb-feat-topic" style={{ margin: '14px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(21px, 2.3vw, 29px)', lineHeight: 1.22, letterSpacing: '-0.03em', color: '#fcf6e8', wordBreak: 'keep-all' }}>
            <a className="tb-cardlink" href={`#room-${room.id}`} onClick={(e) => { e.preventDefault(); onEnter(room.id); }} aria-label={`${room.topic} — ${en ? 'watch' : '관전하기'}`} style={{ color: 'inherit' }}>
              {room.topic}
            </a>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {room.roundLabel && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, color: 'rgba(252,246,232,0.78)', whiteSpace: 'nowrap' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff7a52', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
                {room.roundLabel}
              </span>
            )}
            {room.ai && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.06em', color: '#f0cf7e' }}>討 {en ? 'AI debater' : 'AI 토론자'}</span>}
          </div>
        </div>

        {/* right — faceoff scoreboard */}
        <div style={{ position: 'relative', borderRadius: 18, background: 'rgba(0,0,0,0.22)', boxShadow: 'inset 0 0 0 1px rgba(252,246,232,0.1)', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
            {sideBlock('pro')}
            <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 16, color: 'rgba(252,246,232,0.45)', paddingTop: 16 }}>VS</span>
            {sideBlock('con')}
          </div>
          <button
            type="button"
            className="tb-above"
            onClick={() => onEnter(room.id)}
            style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 13, border: 'none', cursor: 'pointer', background: '#f0cf7e', color: '#1a2a23', boxShadow: '0 12px 26px -12px rgba(240,207,126,0.6)', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15 }}
          >
            {en ? 'Watch live →' : '관전하기 →'}
          </button>
        </div>
      </div>
    </section>
  );
}
