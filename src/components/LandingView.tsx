import type { CSSProperties, ReactNode } from 'react';
import '../landing.css';
import '../landing-edu-hero.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLandingRooms } from '../hooks/useLandingRooms';
import type { LandingRoom } from '../hooks/useLandingRooms';
import type { Lang } from '../i18n/landing';
import { landingStrings } from '../i18n/landing';
import { CharacterAvatar } from './CharacterAvatar';
import { ScrollSpyNav } from './ScrollSpyNav';

/* ============================================================
   토론배틀 — 소개 페이지 (LandingView)
   핸드오프 "토론배틀 소개 페이지.html" 1:1 이식 + 실데이터 연결.
   원본 구성: HeroEDU → 진행 방식(5단계) → 왜 토론배틀(3특징)
            → 오늘의 논제(라이브 카드) → 참여 CTA.

   실데이터(useLandingRooms): 히어로 피처드/사이드 행/오늘의 논제/통계는
   Firestore의 실제 live·open 방과 투표 집계를 사용한다.
   ⚠️ 열린 토론이 하나도 없으면(신규/한산할 때) 가짜 숫자 대신
      정직한 빈 상태 카피 + "방 만들기" CTA로 대체한다(hasActive=false).
   히어로 통계도 활성 방이 없으면 제품 사실(5단계/1:1/50:50)로 대체.
   ============================================================ */

/* ---------- i18n 문자열 (KO = 핸드오프 원본 톤) ---------- */
const INTRO_KO = {
  brand: '토론배틀',
  hero: {
    eyebrow: '실시간 토론 플랫폼 · AI 사회자 진행',
    headA: '당신의 논리로',
    headAccent: '승부하라',
    subLead: '누구나 참여하는 ',
    subAccent: '1:1 찬반 토론',
    lead: '주제를 등록하고 참가자를 모집해 토론을 열어보세요. 5단계 라운드가 진행되며, 관중 투표와 AI 평가가 함께 승부를 결정합니다.',
    ctaStart: '토론 시작하기',
    ctaSample: '샘플 토론 보기',
    liveBefore: '지금 ',
    liveAfter: '개 토론이 실시간으로 진행 중입니다',
    statLive: '진행 중',
    statOpen: '모집 중',
    statToday: '오늘 열림',
    factStats: [
      ['5', '진행 단계'],
      ['1:1', '실시간 대결'],
      ['50/50', '청중·AI 판정'],
    ] as [string, string][],
    panelHead: '지금 진행 중인 토론',
    featLabel: '지금 가장 뜨거운 토론',
    featMetaLive: (n: number) => `● LIVE · 투표 ${n}표`,
    featMetaOpen: '· 모집 중',
    featCta: '관전하고 투표하기',
    seatOpen: '모집 중',
    proPrefix: '찬성',
    conPrefix: '반대',
    voteSoon: '투표 전',
    seeAll: '전체 토론 보기',
    proShort: '찬',
    conShort: '반',
    rowLiveMeta: (n: number) => `투표 ${n}표`,
    rowLiveNoVote: '진행 중',
    rowOpenMeta: '상대 모집 중 · 참가 가능',
    rowLive: 'LIVE',
    rowOpen: '모집중',
    emptyTitle: '아직 열린 토론이 없어요',
    emptyBody: '첫 무대를 열면 바로 여기 올라와요.',
    emptyCta: '방 만들기',
  },
  how: {
    eyebrow: 'HOW IT WORKS · 진행 방식',
    title: '입론부터 판정까지, 5단계로 진행됩니다',
    steps: [
      ['01', '주제 등록 · 입장 선택', '누구나 토론방을 열고 찬성 또는 반대 입장을 정합니다.'],
      ['02', '입론', '각자 자신의 주장을 세우고 핵심 근거를 제시합니다.'],
      ['03', '반론 · 교차질의', '상대의 근거를 반박하고, 서로 묻고 답하며 쟁점을 좁힙니다.'],
      ['04', '최종변론', '논의를 정리해 자신의 입장을 마지막으로 설득합니다.'],
      ['05', '판정', '관중 투표 50%와 AI 평가 50%를 합산해 승부를 가립니다.'],
    ] as [string, string, string][],
  },
  why: {
    eyebrow: 'WHY DEBATE BATTLE · 특징',
    title: '토론에만 집중할 수 있도록 설계했습니다',
    feats: [
      ['討', 'AI 사회자 진행', '사회자가 5단계 라운드를 안내하고 발언 순서와 시간을 관리합니다. 진행 부담 없이 토론에만 집중할 수 있습니다.'],
      ['評', '공정한 판정', '관중 투표 50%와 AI 평가 50%를 합산합니다. 인기와 논리, 어느 한쪽에 치우치지 않게 균형을 맞춥니다.'],
      ['論', '실시간 1:1', '주제만 있으면 누구나 방을 열고 상대를 만납니다. 관중은 실시간으로 토론을 지켜보고 투표에 참여합니다.'],
    ] as [string, string, string][],
  },
  motions: {
    eyebrow: 'LIVE NOW · 오늘의 논제',
    title: '지금 열려 있는 토론을 살펴보세요',
    seeAll: '전체 논제 보기',
    round: (r: number, total: number) => `ROUND ${r}/${total}`,
    open: '모집 중',
    votes: (n: number) => `관중 ${n}명 투표`,
    voteSoon: '투표를 기다리는 중',
    seatWaiting: '상대를 기다리는 중',
    proTag: 'PRO · 찬성',
    conTag: 'CON · 반대',
    seatOpen: '모집 중',
    emptyTitle: '지금은 열린 토론이 없어요',
    emptyBody: '첫 번째 토론자가 되어보세요. 방을 만들면 바로 여기에 표시됩니다.',
    emptyCta: '방 만들기',
  },
  cta: {
    eyebrow: 'READY TO DEBATE · 지금 시작하세요',
    title: '주제를 등록하고 첫 토론을 시작하세요',
    lead: '가입과 참여는 무료입니다. AI 사회자가 진행을 맡으니, 입장만 정하면 바로 토론에 들어갈 수 있습니다.',
    primary: '토론 시작하기',
    secondary: '진행 방식 보기',
  },
};

const INTRO_EN: typeof INTRO_KO = {
  brand: 'Debate Battle',
  hero: {
    eyebrow: 'REAL-TIME DEBATE · AI MODERATOR',
    headA: 'Settle it with',
    headAccent: 'your logic',
    subLead: 'Open ',
    subAccent: '1:1 pro–con debate',
    lead: 'Post a motion, find an opponent, and open the floor. Each debate runs through five rounds, and the winner is decided by audience votes and an AI judge together.',
    ctaStart: 'Start a debate',
    ctaSample: 'Watch a sample',
    liveBefore: '',
    liveAfter: ' debate(s) running live right now',
    statLive: 'live now',
    statOpen: 'recruiting',
    statToday: 'opened today',
    factStats: [
      ['5', 'debate rounds'],
      ['1:1', 'real-time duel'],
      ['50/50', 'crowd · AI verdict'],
    ],
    panelHead: 'Live debates now',
    featLabel: 'Hottest debate',
    featMetaLive: (n: number) => `● LIVE · ${n} votes`,
    featMetaOpen: '· recruiting',
    featCta: 'Watch & vote',
    seatOpen: 'open seat',
    proPrefix: 'For',
    conPrefix: 'Against',
    voteSoon: 'no votes yet',
    seeAll: 'See all debates',
    proShort: 'For',
    conShort: 'Vs',
    rowLiveMeta: (n: number) => `${n} votes`,
    rowLiveNoVote: 'in progress',
    rowOpenMeta: 'Opponent wanted · seat open',
    rowLive: 'LIVE',
    rowOpen: 'OPEN',
    emptyTitle: 'No debates open yet',
    emptyBody: 'Open the first stage and it shows up right here.',
    emptyCta: 'Create a room',
  },
  how: {
    eyebrow: 'HOW IT WORKS',
    title: 'From opening to verdict, in five rounds',
    steps: [
      ['01', 'Post a motion · pick a side', 'Anyone can open a room and choose For or Against.'],
      ['02', 'Opening', 'Each side states its claim and lays out the key reasons.'],
      ['03', 'Rebuttal · cross-exam', 'Refute the other side and narrow the points at issue through Q&A.'],
      ['04', 'Closing', 'Sum up the discussion and make a final case for your side.'],
      ['05', 'Verdict', 'Audience votes (50%) and the AI judge (50%) are combined to decide.'],
    ],
  },
  why: {
    eyebrow: 'WHY DEBATE BATTLE',
    title: 'Designed so you can focus only on the debate',
    feats: [
      ['討', 'AI moderator', 'The moderator guides the five rounds and manages turns and timing, so you can focus on the debate itself.'],
      ['評', 'Fair verdict', 'Audience votes (50%) and the AI judge (50%) are combined — balancing popularity and logic.'],
      ['論', 'Real-time 1:1', 'With just a motion, anyone can open a room and meet an opponent. The audience watches live and votes.'],
    ],
  },
  motions: {
    eyebrow: 'LIVE NOW · TODAY’S MOTIONS',
    title: 'Take a look at the debates open right now',
    seeAll: 'See all motions',
    round: (r: number, total: number) => `ROUND ${r}/${total}`,
    open: 'recruiting',
    votes: (n: number) => `${n} have voted`,
    voteSoon: 'waiting for votes',
    seatWaiting: 'waiting for an opponent',
    proTag: 'PRO · FOR',
    conTag: 'CON · AGAINST',
    seatOpen: 'open seat',
    emptyTitle: 'No debates are open right now',
    emptyBody: 'Be the first debater — create a room and it appears right here.',
    emptyCta: 'Create a room',
  },
  cta: {
    eyebrow: 'READY TO DEBATE',
    title: 'Post a motion and start your first debate',
    lead: 'Signing up and joining are free. The AI moderator runs the show — just pick a side and jump straight in.',
    primary: 'Start a debate',
    secondary: 'See how it works',
  },
};

type Strings = typeof INTRO_KO;

/* ---------- 실데이터 헬퍼 ---------- */
function quote(topic: string, lang: Lang): string {
  const t = topic.trim();
  return lang === 'en' ? `“${t}”` : `「${t}」`;
}
function proPctOf(room: LandingRoom): number | null {
  return room.totalVotes > 0 ? Math.round((room.proVotes / room.totalVotes) * 100) : null;
}
function roundLabel(room: LandingRoom, s: Strings): string {
  if (room.status !== 'live') return s.motions.open;
  return s.motions.round((room.extendRound ?? 0) + 1, room.plannedRounds ?? 1);
}
/* 후기 카드 태그(PRO/CON/MOD) → 브랜드 색 */
function tagTone(tag: string): { color: string; tint: string } {
  if (tag === 'CON') return { color: 'var(--celadon)', tint: 'var(--celadon-tint)' };
  if (tag === 'MOD') return { color: 'var(--gold)', tint: 'var(--gold-tint)' };
  return { color: 'var(--vermillion)', tint: 'var(--vermillion-tint)' };
}

/* ============================================================
   공용 프리미티브 (핸드오프 hero-primitives.jsx 이식)
   ============================================================ */
function MascotChip({ side, size = 56, ring = true }: { side: 'pro' | 'con'; size?: number; ring?: boolean }) {
  const tint = side === 'pro' ? 'var(--tint-pro)' : 'var(--tint-con)';
  const accent = side === 'pro' ? 'var(--vermillion)' : 'var(--celadon)';
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tint,
        flexShrink: 0,
        color: 'var(--ink)',
        boxShadow: ring ? `0 0 0 3px #fff, 0 8px 20px -6px ${accent}66` : 'none',
      }}
    >
      <CharacterAvatar side={side} size={Math.round(size * 0.62)} />
    </span>
  );
}

type PillVariant = 'solid' | 'cream' | 'ghost' | 'ghostInk';
function Pill({
  children,
  variant = 'solid',
  accent = 'var(--vermillion)',
  size = 'lg',
  onClick,
  style,
}: {
  children: ReactNode;
  variant?: PillVariant;
  accent?: string;
  size?: 'lg' | 'sm';
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: size === 'lg' ? '15px 30px' : '11px 22px',
    borderRadius: 999,
    fontFamily: 'var(--font-body)',
    fontWeight: 800,
    fontSize: size === 'lg' ? 17 : 15,
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    border: 'none',
    transition: 'transform .14s ease, box-shadow .14s ease',
    whiteSpace: 'nowrap',
  };
  const variants: Record<PillVariant, CSSProperties> = {
    solid: { background: accent, color: '#fff', boxShadow: `0 10px 24px -8px ${accent}aa` },
    cream: { background: 'var(--paper-light)', color: 'var(--ink)', boxShadow: '0 10px 24px -10px rgba(0,0,0,0.35)' },
    ghost: { background: 'transparent', color: '#fff', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.55)' },
    ghostInk: { background: 'transparent', color: 'var(--ink)', boxShadow: 'inset 0 0 0 2px var(--ink)' },
  };
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function LiveChip({ tone = 'solid' }: { tone?: 'solid' | 'light' }) {
  const light = tone === 'light';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 13px 6px 11px',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.14em',
        background: light ? 'rgba(255,255,255,0.16)' : 'var(--vermillion)',
        color: '#fff',
        boxShadow: light ? 'inset 0 0 0 1px rgba(255,255,255,0.35)' : 'none',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 0 0 3px rgba(255,255,255,0.25)',
          animation: 'tb-pulse 1.6s ease-in-out infinite',
        }}
      />
      LIVE
    </span>
  );
}

function SectionHead({ eyebrow, title, accent = 'var(--celadon)' }: { eyebrow: string; title: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 12.5,
          letterSpacing: '0.2em',
          color: accent,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ width: 24, height: 1.5, background: accent }} />
        {eyebrow}
      </span>
      <h2
        className="kr-wrap"
        style={{
          margin: '16px 0 0',
          fontFamily: 'var(--font-serif)',
          fontWeight: 800,
          fontSize: 'clamp(28px, 4.4vw, 46px)',
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          maxWidth: 760,
        }}
      >
        {title}
      </h2>
      <span style={{ width: 64, height: 3, background: 'var(--gold)', marginTop: 22 }} />
    </div>
  );
}

/* 오늘의 논제 — 라이브 카드 (실데이터) */
function MotionCard({ room, s, lang, onClick }: { room: LandingRoom; s: Strings; lang: Lang; onClick: () => void }) {
  const live = room.status === 'live';
  const pct = proPctOf(room);
  const proPct = pct ?? 50;
  const conPct = 100 - proPct;
  const seatMissing = !room.proName || !room.conName;
  const footer = live
    ? room.totalVotes > 0
      ? s.motions.votes(room.totalVotes)
      : s.motions.voteSoon
    : s.motions.seatWaiting;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        background: 'var(--paper-light)',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: '0 28px 56px -32px rgba(20,40,30,0.5), 0 0 0 1px rgba(0,0,0,0.04)',
        font: 'inherit',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '15px 20px', borderBottom: '1px solid var(--line)' }}>
        {live ? (
          <LiveChip tone="solid" />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.14em',
              color: 'var(--celadon)',
              border: '1px solid var(--celadon)',
              padding: '4px 9px',
              borderRadius: 6,
            }}
          >
            {s.motions.open}
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-fade)' }}>
          {roundLabel(room, s)}
        </span>
      </div>
      <div style={{ padding: '20px 22px 22px' }}>
        <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 22, lineHeight: 1.34, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          {quote(room.topic, lang)}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
            <MascotChip side="pro" size={38} />
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', color: 'var(--vermillion)' }}>{s.motions.proTag}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {room.proName ?? s.motions.seatOpen}
              </div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink-ghost)' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, flexDirection: 'row-reverse', textAlign: 'right' }}>
            <MascotChip side="con" size={38} />
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', color: 'var(--celadon)' }}>{s.motions.conTag}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {room.conName ?? s.motions.seatOpen}
              </div>
            </div>
          </div>
        </div>
        {pct !== null ? (
          <div style={{ display: 'flex', height: 26, borderRadius: 999, overflow: 'hidden', background: 'var(--paper-deep)' }}>
            <div style={{ width: proPct + '%', background: 'var(--vermillion)', display: 'flex', alignItems: 'center', paddingLeft: 12, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11 }}>{proPct}%</div>
            <div style={{ width: conPct + '%', background: 'var(--celadon)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11 }}>{conPct}%</div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              height: 26,
              borderRadius: 999,
              overflow: 'hidden',
              background: 'var(--paper-deep)',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 10.5,
              letterSpacing: '0.06em',
              color: 'var(--ink-fade)',
            }}
          >
            {seatMissing && !live ? s.motions.seatWaiting : s.motions.voteSoon}
          </div>
        )}
        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-fade)' }}>{footer}</div>
      </div>
    </button>
  );
}

/* 히어로 우측 패널 — 컴팩트 토론 행 (실데이터) */
function LiveDebateRow({ room, s, onClick }: { room: LandingRoom; s: Strings; onClick: () => void }) {
  const live = room.status === 'live';
  const pct = proPctOf(room);
  const meta = live ? (pct !== null ? s.hero.rowLiveMeta(room.totalVotes) : s.hero.rowLiveNoVote) : s.hero.rowOpenMeta;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        fontFamily: 'var(--font-body)',
        background: live ? 'rgba(255,255,255,0.14)' : 'rgba(246,209,102,0.15)',
        border: live ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(246,209,102,0.55)',
        borderRadius: 13,
        padding: '12px 12px 12px 15px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: '#fcf6e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {room.topic}
        </div>
        {live && pct !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 7 }}>
            <div style={{ width: 84, height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ width: `${pct}%`, background: 'var(--vermillion)' }} />
              <span style={{ width: `${100 - pct}%`, background: '#cfe3d6' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10, color: 'rgba(252,246,232,0.78)' }}>
              {s.hero.proShort} {pct} · {s.hero.conShort} {100 - pct}
            </span>
          </div>
        ) : (
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10, letterSpacing: '0.03em', color: live ? 'rgba(252,246,232,0.7)' : '#ffe6a8' }}>{meta}</div>
        )}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 9.5,
          letterSpacing: '0.06em',
          padding: '4px 9px',
          borderRadius: 999,
          background: live ? 'rgba(200,75,31,0.32)' : 'var(--gold)',
          color: live ? '#ffd9c7' : '#3a2c08',
        }}
      >
        {live ? s.hero.rowLive : s.hero.rowOpen}
      </span>
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 18, lineHeight: 1, color: 'rgba(252,246,232,0.6)' }}>
        ›
      </span>
    </button>
  );
}

/* 히어로 우측 — 피처드 라이브 카드 (실데이터) */
function FeaturedCard({ room, s, lang, onClick }: { room: LandingRoom; s: Strings; lang: Lang; onClick: () => void }) {
  const pct = proPctOf(room);
  const proPct = pct ?? 50;
  const live = room.status === 'live';
  return (
    <div style={{ background: 'var(--paper-light)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 28px 54px -22px rgba(20,40,30,0.65)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--vermillion)' }}>{s.hero.featLabel}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', color: 'var(--ink-fade)', whiteSpace: 'nowrap' }}>
          {live ? s.hero.featMetaLive(room.totalVotes) : s.hero.featMetaOpen}
        </span>
      </div>
      <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 21, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
        {quote(room.topic, lang)}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '15px 0 7px' }}>
        <MascotChip side="pro" size={30} ring={false} />
        <div style={{ flex: 1, display: 'flex', height: 9, borderRadius: 999, overflow: 'hidden', background: 'var(--paper-deep)' }}>
          <span style={{ width: `${proPct}%`, background: 'var(--vermillion)' }} />
          <span style={{ width: `${100 - proPct}%`, background: 'var(--celadon)' }} />
        </div>
        <MascotChip side="con" size={30} ring={false} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, marginBottom: 15, gap: 8 }}>
        <span style={{ color: 'var(--vermillion)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pct !== null ? `${s.hero.proPrefix} ${proPct}%` : `${s.hero.proPrefix} ${room.proName ?? s.hero.seatOpen}`}
        </span>
        <span style={{ fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-ghost)' }}>VS</span>
        <span style={{ color: 'var(--celadon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pct !== null ? `${s.hero.conPrefix} ${100 - proPct}%` : `${s.hero.conPrefix} ${room.conName ?? s.hero.seatOpen}`}
        </span>
      </div>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          background: 'var(--vermillion)',
          color: '#fff',
          borderRadius: 11,
          padding: '13px 0',
          fontFamily: 'var(--font-body)',
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: '-0.01em',
          boxShadow: '0 12px 26px -10px rgba(200,75,31,0.7)',
        }}
      >
        {s.hero.featCta} →
      </button>
    </div>
  );
}

/* 히어로 우측 — 빈 상태 (정직한 카피) */
function FeaturedEmpty({ s, onClick }: { s: Strings; onClick: () => void }) {
  return (
    <div style={{ background: 'var(--paper-light)', borderRadius: 18, padding: '26px 22px', boxShadow: '0 28px 54px -22px rgba(20,40,30,0.65)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'var(--gold)', marginBottom: 12 }} aria-hidden="true">
        討
      </div>
      <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 19, lineHeight: 1.3, color: 'var(--ink)' }}>
        {s.hero.emptyTitle}
      </h3>
      <p className="kr-wrap" style={{ margin: '8px 0 16px', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{s.hero.emptyBody}</p>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          background: 'var(--vermillion)',
          color: '#fff',
          borderRadius: 11,
          padding: '13px 0',
          fontFamily: 'var(--font-body)',
          fontWeight: 800,
          fontSize: 15,
          boxShadow: '0 12px 26px -10px rgba(200,75,31,0.7)',
        }}
      >
        {s.hero.emptyCta} →
      </button>
    </div>
  );
}

/* ============================================================
   메인 — 소개 페이지
   ============================================================ */
export function LandingView({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const metaStr = landingStrings[lang];
  useDocumentMeta(metaStr.meta.title, metaStr.meta.description);
  const data = useLandingRooms();
  const s = lang === 'en' ? INTRO_EN : INTRO_KO;

  // 인페이지 목차(스크롤 스파이) — 긴 랜딩에서 현재 위치 표시 + 빠른 점프 (≥1280px에서만 노출)
  const spyItems = [
    { id: 'how', label: lang === 'en' ? 'How it works' : '진행 방식' },
    { id: 'why', label: lang === 'en' ? 'Why us' : '왜 토론배틀' },
    { id: 'motions', label: lang === 'en' ? 'Live now' : '오늘의 논제' },
    { id: 'voices', label: lang === 'en' ? 'Voices' : '후기' },
    { id: 'faq', label: 'FAQ' },
    { id: 'join', label: lang === 'en' ? 'Start' : '시작하기' },
  ];

  // 복원 섹션 콘텐츠 (i18n landing.ts 에 그대로 존재) — 후기 + FAQ
  const tm = landingStrings[lang].testimonials;
  const fq = landingStrings[lang].faq;

  // 통계: 활성 방이 있으면 실데이터, 없으면 제품 사실로 대체
  const stats: [string, string][] = data.hasActive
    ? [
        [String(data.stats.live), s.hero.statLive],
        [String(data.stats.open), s.hero.statOpen],
        [String(data.stats.today), s.hero.statToday],
      ]
    : s.hero.factStats;

  return (
    <>
      {/* 스크롤 스파이는 .float-in(애니메이션 transform) 밖에 둬야 position:fixed 가
         뷰포트 기준으로 고정되어 스크롤해도 따라다닌다. */}
      <ScrollSpyNav items={spyItems} />
      <div className="intro-page float-in">
      {/* ===== HERO (EDU) =====
           투명 헤더 영역까지 끌어올려 grad-paper 가 맨 위부터 끊김 없이 흐르게 한다.
           (.intro-hero 의 margin-top/padding-top 동량 상쇄 → 본문·녹색 패널 위치는 그대로,
            배경 그라데이션만 위로 확장 → 평면 띠 경계 제거) */}
      <section
        className="intro-hero"
        id="top"
        style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'stretch', overflow: 'hidden', background: 'var(--grad-paper)', color: 'var(--ink)', boxShadow: '0 22px 44px -26px rgba(40, 50, 40, 0.42)' }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background:
              'radial-gradient(80% 60% at 22% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%), radial-gradient(100% 90% at 78% 108%, rgba(120,98,64,0.16) 0%, rgba(120,98,64,0) 60%)',
          }}
        />

        {/* 좌측 본문 — 좌측 패딩을 calc 로 가운데 1152 섹션과 정렬(녹색 패널은 풀블리드 유지) */}
        <div className="intro-hero__left" style={{ flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 40px 64px max(24px, calc((100% - 1152px) / 2 - 64px))', zIndex: 3 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color: 'var(--celadon)', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 26, height: 1.5, background: 'var(--celadon)' }} />
            {s.hero.eyebrow}
          </span>

          <h1 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(40px, 5.4vw, 60px)', lineHeight: 1.06, letterSpacing: '-0.04em', color: 'var(--ink)' }}>
            {s.hero.headA}
            <br />
            <span style={{ color: 'var(--vermillion)' }}>{s.hero.headAccent}</span>
          </h1>
          <p className="kr-wrap" style={{ margin: '16px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(18px, 2.4vw, 22px)', lineHeight: 1.4, letterSpacing: '-0.02em', color: 'var(--ink-soft)' }}>
            {s.hero.subLead}
            <span style={{ color: 'var(--celadon)' }}>{s.hero.subAccent}</span>
          </p>

          <span style={{ width: 80, height: 3, background: 'var(--gold)', margin: '24px 0 0' }} />

          <p className="kr-wrap" style={{ maxWidth: 480, margin: '22px 0 0', fontSize: 17, lineHeight: 1.66, color: 'var(--ink-soft)', fontWeight: 500 }}>{s.hero.lead}</p>

          <div className="intro-hero__cta" style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <Pill variant="solid" accent="var(--celadon)" onClick={onStart}>
              {s.hero.ctaStart} <span style={{ fontSize: 15 }}>→</span>
            </Pill>
            <Pill variant="ghostInk" onClick={onStart}>
              {s.hero.ctaSample}
            </Pill>
          </div>

          {/* 신뢰 지표 */}
          <div style={{ marginTop: 40 }}>
            {data.stats.live > 0 && (
              <span
                role="status"
                aria-live="polite"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-fade)', marginBottom: 15 }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vermillion)', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
                {s.hero.liveBefore}
                <b style={{ color: 'var(--vermillion)' }}>{data.stats.live}</b>
                {s.hero.liveAfter}
              </span>
            )}
            <div className="intro-hero__stats" style={{ display: 'flex', alignItems: 'stretch', gap: 24 }}>
              {stats.map(([n, l], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 24 }}>
                  {i > 0 && <span style={{ width: 1, background: 'var(--ink-ghost)', opacity: 0.5 }} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1 }}>{n}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.05em', color: 'var(--ink-fade)' }}>{l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 그린 패널 — 면지(endpaper) 컨셉 */}
        <div className="intro-hero__panel intro-hero__panel--endpaper" style={{ flex: '1 1 45%' }}>
          {/* 코너 ornament — 우상단 */}
          <span className="intro-hero__ornament intro-hero__ornament--top" aria-hidden="true" />
          {/* 코너 ornament — 우하단 */}
          <span className="intro-hero__ornament intro-hero__ornament--bottom" aria-hidden="true" />

          <div style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px', gap: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <LiveChip tone="solid" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.14em', color: 'rgba(252,246,232,0.92)' }}>{s.hero.panelHead}</span>
            </div>

            {data.featured ? <FeaturedCard room={data.featured} s={s} lang={lang} onClick={onStart} /> : <FeaturedEmpty s={s} onClick={onStart} />}

            {data.rows.map((r) => (
              <LiveDebateRow key={r.id} room={r} s={s} onClick={onStart} />
            ))}

            <button
              type="button"
              onClick={onStart}
              style={{ alignSelf: 'flex-start', marginTop: 2, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, letterSpacing: '0.06em', color: 'rgba(252,246,232,0.82)' }}
            >
              {s.hero.seeAll} →
            </button>
          </div>
        </div>
      </section>

      {/* ===== 1. 진행 방식 — 5단계 ===== */}
      <section id="how" style={{ scrollMarginTop: 84, background: 'var(--paper)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
        <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <SectionHead eyebrow={s.how.eyebrow} title={s.how.title} />
          <div className="intro-grid5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginTop: 56 }}>
            {s.how.steps.map(([n, title, desc], i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {i < s.how.steps.length - 1 && (
                  <span className="intro-step-line" aria-hidden="true" style={{ position: 'absolute', top: 21, left: 'calc(50% + 28px)', right: 'calc(-50% + 28px)', height: 1.5, background: 'var(--ink-ghost)', opacity: 0.5 }} />
                )}
                <span
                  style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--paper-light)', border: '2px solid var(--celadon)', color: 'var(--celadon)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, zIndex: 1, boxShadow: '0 8px 18px -10px rgba(0,0,0,0.3)' }}
                >
                  {n}
                </span>
                <div>
                  <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 19, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{title}</h3>
                  <p className="kr-wrap" style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 2. 왜 토론배틀 — 3가지 ===== */}
      <section id="why" style={{ scrollMarginTop: 84, background: 'var(--paper-deep)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
        <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <SectionHead eyebrow={s.why.eyebrow} title={s.why.title} />
          <div className="intro-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {s.why.feats.map(([glyph, title, desc], i) => (
              <div key={i} style={{ background: 'var(--paper-light)', borderRadius: 20, padding: '32px 30px', boxShadow: '0 20px 44px -28px rgba(40,50,40,0.4)', borderTop: '3px solid var(--gold)' }}>
                <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 28, boxShadow: '0 10px 22px -10px rgba(79,122,100,0.6)' }}>
                  {glyph}
                </span>
                <h3 style={{ margin: '22px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{title}</h3>
                <p className="kr-wrap" style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.66, color: 'var(--ink-soft)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. 오늘의 논제 — 라이브 카드 (실데이터 / 빈 상태) ===== */}
      <section id="motions" style={{ scrollMarginTop: 84, background: 'var(--paper)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
        <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <SectionHead eyebrow={s.motions.eyebrow} title={s.motions.title} />
            <Pill variant="ghostInk" size="sm" onClick={onStart}>
              {s.motions.seeAll} →
            </Pill>
          </div>
          {data.motions.length > 0 ? (
            <div className="intro-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, marginTop: 52 }}>
              {data.motions.map((room) => (
                <MotionCard key={room.id} room={room} s={s} lang={lang} onClick={onStart} />
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: 48,
                background: 'var(--paper-light)',
                border: '1px solid var(--line)',
                borderRadius: 22,
                padding: 'clamp(40px, 6vw, 64px) 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 56, lineHeight: 1, color: 'var(--gold)', opacity: 0.5, marginBottom: 14 }} aria-hidden="true">
                論
              </div>
              <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 24, color: 'var(--ink)' }}>{s.motions.emptyTitle}</h3>
              <p className="kr-wrap" style={{ margin: '10px auto 24px', maxWidth: 420, fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{s.motions.emptyBody}</p>
              <Pill variant="solid" accent="var(--celadon)" onClick={onStart}>
                {s.motions.emptyCta} →
              </Pill>
            </div>
          )}
        </div>
      </section>

      {/* ===== 후기 (Testimonials) — 사라졌던 섹션 복원 · 새 디자인 =====
           ⚠️ 인용문은 placeholder(K/L/P…) — 실제 피드백 수집 후 교체 권장 */}
      <section id="voices" style={{ scrollMarginTop: 84, background: 'var(--paper-deep)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
        <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <SectionHead eyebrow={tm.eyebrow} title={`${tm.titleA} ${tm.titleB}`} />
          <div className="intro-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 52 }}>
            {tm.items.map((tv, i) => {
              const tone = tagTone(tv.tag);
              return (
                <figure key={i} style={{ margin: 0, position: 'relative', background: 'var(--paper-light)', borderRadius: 20, padding: '30px 26px 24px', boxShadow: 'var(--shadow-md)', borderTop: `3px solid ${tone.color}` }}>
                  <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 20, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 64, lineHeight: 1, color: tone.color, opacity: 0.16 }}>”</span>
                  <blockquote className="kr-wrap" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.72, color: 'var(--ink-soft)' }}>{tv.quote}</blockquote>
                  <figcaption style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: tone.color, background: tone.tint, padding: '3px 9px', borderRadius: 999 }}>{tv.tag}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-fade)' }}>{tv.who}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ — 사라졌던 섹션 복원 · 새 디자인 ===== */}
      <section id="faq" style={{ scrollMarginTop: 84, background: 'var(--paper)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
        <div className="intro-wrap" style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
          <SectionHead eyebrow={fq.eyebrow} title={`${fq.titleA} ${fq.titleB}`} />
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fq.items.map((item, i) => (
              <details key={i} className="intro-faq" open={'open' in item ? item.open : undefined} style={{ background: 'var(--paper-light)', border: '1px solid var(--color-line)', borderRadius: 14, padding: '0 20px', boxShadow: 'var(--shadow-sm)' }}>
                <summary>{item.q}</summary>
                <div className="intro-faq__a kr-wrap">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. 참여 CTA ===== */}
      <section id="join" style={{ scrollMarginTop: 84, position: 'relative', background: 'var(--grad-sage)', padding: 'clamp(72px, 10vw, 120px) 0', overflow: 'hidden' }}>
        <span aria-hidden="true" style={{ position: 'absolute', bottom: -120, left: -40, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(260px, 38vw, 460px)', lineHeight: 0.7, color: 'rgba(255,255,255,0.05)', userSelect: 'none', pointerEvents: 'none' }}>
          討
        </span>
        <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>{s.cta.eyebrow}</span>
          <h2 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fcf6e8', maxWidth: 720 }}>{s.cta.title}</h2>
          <p className="kr-wrap" style={{ maxWidth: 540, margin: '22px 0 0', fontSize: 17.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{s.cta.lead}</p>
          <div style={{ display: 'flex', gap: 13, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pill variant="cream" onClick={onStart}>
              {s.cta.primary} <span style={{ fontSize: 15 }}>→</span>
            </Pill>
            <Pill variant="ghost" onClick={onStart}>
              {s.cta.secondary}
            </Pill>
          </div>
        </div>
      </section>

      {/* 키프레임 + 반응형 (소개 페이지 한정) */}
      <style>{`
        @keyframes tb-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.62); opacity: 0.65; } }
        /* margin/padding 동량 상쇄: 본문 위치는 그대로 두고 grad-paper 배경만
           헤더(투명) 영역까지 위로 확장 → 맨 위~히어로가 하나의 그라데이션으로 이어짐.
           min-height 도 +84 해서 녹색 패널 높이를 원래대로 유지. */
        /* 첫 화면에 히어로만 보이도록 뷰포트 높이로 채움. 헤더 밑으로 14px 끌어올린
           만큼 더해 다음 섹션이 안 비치게(+16 버퍼). 콘텐츠는 세로 중앙 정렬이라
           아래 공간이 함께 늘어난다. */
        .intro-hero { min-height: calc(100vh + 16px); margin-top: -84px; padding-top: 84px; }
        @media (max-width: 960px) {
          .intro-hero { flex-direction: column; min-height: 0; margin-top: -72px; padding-top: 72px; }
          .intro-hero__left { padding: 48px 24px 8px; }
          .intro-hero__panel { flex: 1 1 auto; width: 100%; border-radius: 0; }
          .intro-grid5 { grid-template-columns: repeat(2, 1fr) !important; gap: 28px !important; }
          .intro-grid3 { grid-template-columns: 1fr !important; }
          .intro-step-line { display: none !important; }
        }
        @media (max-width: 560px) {
          .intro-hero__stats { flex-wrap: wrap; gap: 16px !important; }
          .intro-grid5 { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .intro-page [style*="tb-pulse"] { animation: none !important; }
        }
        /* FAQ 아코디언 (details/summary) */
        .intro-faq summary {
          cursor: pointer; list-style: none;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 0;
          font-family: var(--font-serif); font-weight: 800; font-size: 16.5px;
          letter-spacing: -0.02em; color: var(--ink); word-break: keep-all;
        }
        .intro-faq summary::-webkit-details-marker { display: none; }
        .intro-faq summary::after {
          content: '+'; flex-shrink: 0;
          font-family: var(--font-mono); font-size: 20px; font-weight: 700;
          color: var(--celadon); line-height: 1; transition: transform 0.2s ease;
        }
        .intro-faq[open] summary::after { content: '−'; }
        .intro-faq__a { padding: 0 0 18px; font-size: 14.5px; line-height: 1.72; color: var(--ink-soft); }
      `}</style>
      </div>
    </>
  );
}
