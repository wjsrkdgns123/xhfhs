// 토론배틀 소개(Intro) 페이지 — archive/local-redesign 디자인을 현재 프로덕션
// 구조 위에 재구현. HeroEDU(좌 카피 / 우 sage 무대 패널) → 진행 방식(5단계)
// → 왜 토론배틀(3특징) → 오늘의 논제(실데이터 라이브 카드) → 후기 → FAQ → 참여 CTA.
//
// 실데이터(useLandingRooms): 히어로 피처드/사이드 행/오늘의 논제/통계는 Firestore의
// 실제 live·open 방과 투표 집계를 사용한다. ⚠️ 열린 토론이 하나도 없으면 가짜 숫자
// 대신 정직한 빈 상태 카피 + "방 만들기" CTA로 대체한다(hasActive=false). 히어로 통계도
// 활성 방이 없으면 제품 사실(5단계 / 1:1 / 50:50)로 대체.
//
// 좋은 마감 유지(배포본 히어로): 우측 패널 큰 둥근 모서리(120px) · 論 워터마크 ·
// 討論 도장(DebateSeal). word-break: keep-all 유지(.kr-wrap).
import type { CSSProperties, ReactNode } from 'react';
import '../landing.css';
import '../landing-edu-hero.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLandingRooms } from '../hooks/useLandingRooms';
import type { LandingRoom } from '../hooks/useLandingRooms';
import type { Lang } from '../i18n/landing';
import { landingStrings } from '../i18n/landing';
import { CharacterAvatar } from './CharacterAvatar';
import { DebateSeal } from './redesign/RedesignPrimitives';
import { ScrollSpyNav } from './ScrollSpyNav';

// KO/EN intro 는 구조가 같지만 as const 로 문자열 리터럴 타입이 다르다.
// 헬퍼에 한쪽 리터럴 타입만 받으면 다른 언어에서 대입 불가 → 두 언어의 합집합으로 둔다.
// (읽기 전용 문자열만 JSX 로 렌더하므로 union 으로 충분하다.)
type Intro = (typeof landingStrings)['ko']['intro'] | (typeof landingStrings)['en']['intro'];

/* ---------- 실데이터 헬퍼 ---------- */
function quote(topic: string, lang: Lang): string {
  const t = topic.trim();
  return lang === 'en' ? `“${t}”` : `「${t}」`;
}
function proPctOf(room: LandingRoom): number | null {
  return room.totalVotes > 0 ? Math.round((room.proVotes / room.totalVotes) * 100) : null;
}
function roundLabel(room: LandingRoom, s: Intro): string {
  if (room.status !== 'live') return s.motionsOpen;
  const r = (room.extendRound ?? 0) + 1;
  const total = room.plannedRounds ?? 1;
  return `ROUND ${r}/${total}`;
}
function liveVoteMeta(n: number, lang: Lang): string {
  return lang === 'en' ? `● LIVE · ${n} votes` : `● LIVE · 투표 ${n}표`;
}
function motionsVotes(n: number, lang: Lang): string {
  return lang === 'en' ? `${n} have voted` : `관중 ${n}명 투표`;
}
function rowLiveMeta(n: number, lang: Lang): string {
  return lang === 'en' ? `${n} votes` : `투표 ${n}표`;
}
/* 후기 카드 태그(PRO/CON/MOD) → 브랜드 색/틴트 */
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
        boxShadow: ring ? `0 0 0 3px var(--paper-light), 0 8px 20px -6px ${accent}66` : 'none',
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
    <button type="button" onClick={onClick} className="intro-pill" style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function LiveChip() {
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
        background: 'var(--vermillion)',
        color: '#fff',
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
function MotionCard({ room, s, lang, onClick }: { room: LandingRoom; s: Intro; lang: Lang; onClick: () => void }) {
  const live = room.status === 'live';
  const pct = proPctOf(room);
  const proPct = pct ?? 50;
  const conPct = 100 - proPct;
  const seatMissing = !room.proName || !room.conName;
  const footer = live
    ? room.totalVotes > 0
      ? motionsVotes(room.totalVotes, lang)
      : s.motionsVoteSoon
    : s.motionsSeatWaiting;
  return (
    <button
      type="button"
      onClick={onClick}
      className="intro-card-btn"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid var(--line)',
        padding: 0,
        background: 'var(--paper-light)',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        font: 'inherit',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '15px 20px', borderBottom: '1px solid var(--line)' }}>
        {live ? (
          <LiveChip />
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
            {s.motionsOpen}
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
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', color: 'var(--vermillion)' }}>{s.motionsProTag}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {room.proName ?? s.motionsSeatOpen}
              </div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink-ghost)' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, flexDirection: 'row-reverse', textAlign: 'right' }}>
            <MascotChip side="con" size={38} />
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', color: 'var(--celadon)' }}>{s.motionsConTag}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {room.conName ?? s.motionsSeatOpen}
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
            {seatMissing && !live ? s.motionsSeatWaiting : s.motionsVoteSoon}
          </div>
        )}
        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-fade)' }}>{footer}</div>
      </div>
    </button>
  );
}

/* 히어로 우측 패널 — 컴팩트 토론 행 (실데이터) */
function LiveDebateRow({ room, s, lang, onClick }: { room: LandingRoom; s: Intro; lang: Lang; onClick: () => void }) {
  const live = room.status === 'live';
  const pct = proPctOf(room);
  const meta = live ? (pct !== null ? rowLiveMeta(room.totalVotes, lang) : s.rowLiveNoVote) : s.rowOpenMeta;
  return (
    <button
      type="button"
      onClick={onClick}
      className="intro-card-btn"
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
        color: 'inherit',
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
              {s.proShort} {pct} · {s.conShort} {100 - pct}
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
        {live ? s.rowLive : s.rowOpen}
      </span>
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 18, lineHeight: 1, color: 'rgba(252,246,232,0.6)' }}>
        ›
      </span>
    </button>
  );
}

/* 히어로 우측 — 피처드 라이브 카드 (실데이터) */
function FeaturedCard({ room, s, lang, onClick }: { room: LandingRoom; s: Intro; lang: Lang; onClick: () => void }) {
  const pct = proPctOf(room);
  const proPct = pct ?? 50;
  const live = room.status === 'live';
  return (
    <div style={{ background: 'var(--paper-light)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 28px 54px -22px rgba(20,40,30,0.65)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--vermillion)' }}>{s.featLabel}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', color: 'var(--ink-fade)', whiteSpace: 'nowrap' }}>
          {live ? liveVoteMeta(room.totalVotes, lang) : s.featMetaOpen}
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
          {pct !== null ? `${s.proPrefix} ${proPct}%` : `${s.proPrefix} ${room.proName ?? s.seatOpen}`}
        </span>
        <span style={{ fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-ghost)' }}>VS</span>
        <span style={{ color: 'var(--celadon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pct !== null ? `${s.conPrefix} ${100 - proPct}%` : `${s.conPrefix} ${room.conName ?? s.seatOpen}`}
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
        {s.featCta} →
      </button>
    </div>
  );
}

/* 히어로 우측 — 빈 상태 (정직한 카피) */
function FeaturedEmpty({ s, onClick }: { s: Intro; onClick: () => void }) {
  return (
    <div style={{ background: 'var(--paper-light)', borderRadius: 18, padding: '26px 22px', boxShadow: '0 28px 54px -22px rgba(20,40,30,0.65)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'var(--gold)', marginBottom: 12 }} aria-hidden="true">
        討
      </div>
      <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 19, lineHeight: 1.3, color: 'var(--ink)' }}>
        {s.heroEmptyTitle}
      </h3>
      <p className="kr-wrap" style={{ margin: '8px 0 16px', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{s.heroEmptyBody}</p>
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
        {s.heroEmptyCta} →
      </button>
    </div>
  );
}

/* ============================================================
   메인 — 소개 페이지
   ============================================================ */
export function LandingView({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const t = landingStrings[lang];
  const s = t.intro;
  useDocumentMeta(t.meta.title, t.meta.description);
  const data = useLandingRooms();

  // 인페이지 목차(스크롤 스파이) — 긴 랜딩에서 현재 위치 표시 + 빠른 점프 (≥1280px에서만 노출)
  const spyItems = [
    { id: 'how', label: s.spy.how },
    { id: 'why', label: s.spy.why },
    { id: 'motions', label: s.spy.motions },
    { id: 'voices', label: s.spy.voices },
    { id: 'faq', label: s.spy.faq },
    { id: 'join', label: s.spy.join },
  ];

  // 복원 섹션 콘텐츠 (i18n landing.ts 에 그대로 존재) — 후기 + FAQ
  const tm = t.testimonials;
  const fq = t.faq;

  // 통계: 활성 방이 있으면 실데이터, 없으면 제품 사실(5단계 / 1:1 / 50:50)로 대체
  const factN: readonly string[] = s.factStatN;
  const factL: readonly string[] = s.factStatL;
  const stats: [string, string][] = data.hasActive
    ? [
        [String(data.stats.live), s.statLive],
        [String(data.stats.open), s.statOpen],
        [String(data.stats.today), s.statToday],
      ]
    : factN.map((n, i): [string, string] => [n, factL[i]]);

  return (
    <>
      {/* 스크롤 스파이는 position:fixed 라 애니메이션 transform 컨테이너 밖에 둔다. */}
      <ScrollSpyNav items={spyItems} />
      <div className="intro-page">
        {/* ===== HERO (EDU) — 좌 카피 / 우 sage 무대 패널 ===== */}
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

          {/* 좌측 본문 — 좌측 패딩 calc 로 가운데 1152 섹션과 정렬(녹색 패널은 풀블리드) */}
          <div className="intro-hero__left" style={{ flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 40px 64px max(24px, calc((100% - 1152px) / 2 - 64px))', zIndex: 3 }}>
            <div className="intro-hero__brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>討</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{s.brand}</span>
            </div>

            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color: 'var(--celadon)', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 26, height: 1.5, background: 'var(--celadon)' }} />
              {s.heroEyebrow}
            </span>

            <h1 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(40px, 5.4vw, 60px)', lineHeight: 1.06, letterSpacing: '-0.04em', color: 'var(--ink)' }}>
              {s.heroHeadA}
              <br />
              <span style={{ color: 'var(--vermillion)' }}>{s.heroHeadAccent}</span>
            </h1>
            <p className="kr-wrap" style={{ margin: '16px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(18px, 2.4vw, 22px)', lineHeight: 1.4, letterSpacing: '-0.02em', color: 'var(--ink-soft)' }}>
              {s.heroSubLead}
              <span style={{ color: 'var(--celadon)' }}>{s.heroSubAccent}</span>
            </p>

            <span style={{ width: 80, height: 3, background: 'var(--gold)', margin: '24px 0 0' }} />

            <p className="kr-wrap" style={{ maxWidth: 480, margin: '22px 0 0', fontSize: 17, lineHeight: 1.66, color: 'var(--ink-soft)', fontWeight: 500 }}>{s.heroLead}</p>

            <div className="intro-hero__cta" style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <Pill variant="solid" accent="var(--celadon)" onClick={onStart}>
                {s.ctaStart} <span style={{ fontSize: 15 }}>→</span>
              </Pill>
              <Pill variant="ghostInk" onClick={onStart}>
                {s.ctaSample}
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
                  {s.liveBefore}
                  <b style={{ color: 'var(--vermillion)' }}>{data.stats.live}</b>
                  {s.liveAfter}
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

          {/* 우측 그린 패널 — 큰 둥근 모서리(120px) · 論 워터마크 · 討論 도장 (배포본 마감 유지) */}
          <div className="intro-hero__panel" style={{ flex: '1 1 45%', position: 'relative', background: 'var(--grad-sage)', borderRadius: '120px 0 0 0', overflow: 'hidden', zIndex: 2 }}>
            <span aria-hidden="true" style={{ position: 'absolute', bottom: -72, right: -34, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 340, lineHeight: 0.8, color: 'rgba(255,255,255,0.06)', userSelect: 'none', pointerEvents: 'none' }}>論</span>
            <div style={{ position: 'absolute', top: 30, right: 32, zIndex: 4, opacity: 0.86 }}><DebateSeal display={60} /></div>

            <div style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px', gap: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <LiveChip />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.14em', color: 'rgba(252,246,232,0.92)' }}>{s.panelHead}</span>
              </div>

              {data.featured ? <FeaturedCard room={data.featured} s={s} lang={lang} onClick={onStart} /> : <FeaturedEmpty s={s} onClick={onStart} />}

              {data.rows.map((r) => (
                <LiveDebateRow key={r.id} room={r} s={s} lang={lang} onClick={onStart} />
              ))}

              <button
                type="button"
                onClick={onStart}
                style={{ alignSelf: 'flex-start', marginTop: 2, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, letterSpacing: '0.06em', color: 'rgba(252,246,232,0.82)' }}
              >
                {s.seeAll} →
              </button>
            </div>
          </div>
        </section>

        {/* ===== 1. 진행 방식 — 5단계 ===== */}
        <section id="how" style={{ scrollMarginTop: 84, background: 'var(--paper)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
          <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
            <SectionHead eyebrow={s.howEyebrow} title={s.howTitle} />
            <div className="intro-grid5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginTop: 56 }}>
              {s.howSteps.map(([n, title, desc], i) => (
                <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {i < s.howSteps.length - 1 && (
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
            <SectionHead eyebrow={s.whyEyebrow} title={s.whyTitle} />
            <div className="intro-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
              {s.whyFeats.map(([glyph, title, desc], i) => (
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

        {/* ===== 3. 오늘의 논제 — 라이브 카드 (실데이터 / 정직한 빈 상태) ===== */}
        <section id="motions" style={{ scrollMarginTop: 84, background: 'var(--paper)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
          <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <SectionHead eyebrow={s.motionsEyebrow} title={s.motionsTitle} />
              <Pill variant="ghostInk" size="sm" onClick={onStart}>
                {s.motionsSeeAll} →
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
                <h3 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 24, color: 'var(--ink)' }}>{s.motionsEmptyTitle}</h3>
                <p className="kr-wrap" style={{ margin: '10px auto 24px', maxWidth: 420, fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{s.motionsEmptyBody}</p>
                <Pill variant="solid" accent="var(--celadon)" onClick={onStart}>
                  {s.motionsEmptyCta} →
                </Pill>
              </div>
            )}
          </div>
        </section>

        {/* ===== 후기 (Testimonials) — 복원 · 새 디자인 =====
             ⚠️ 인용문은 placeholder(K/L/P…) — 실제 피드백 수집 후 교체 권장 (i18n에 명시) */}
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

        {/* ===== FAQ — 복원 · 아코디언 (details/summary) ===== */}
        <section id="faq" style={{ scrollMarginTop: 84, background: 'var(--paper)', padding: 'clamp(64px, 9vw, 110px) 0' }}>
          <div className="intro-wrap" style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
            <SectionHead eyebrow={fq.eyebrow} title={`${fq.titleA} ${fq.titleB}`} />
            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fq.items.map((item, i) => (
                <details key={i} className="intro-faq" open={'open' in item ? item.open : undefined} style={{ background: 'var(--paper-light)', border: '1px solid var(--line)', borderRadius: 14, padding: '0 20px', boxShadow: 'var(--shadow-sm)' }}>
                  <summary>{item.q}</summary>
                  <div className="intro-faq__a kr-wrap">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 4. 참여 CTA ===== */}
        <section id="join" style={{ scrollMarginTop: 84, position: 'relative', background: 'var(--grad-sage)', padding: 'clamp(72px, 10vw, 120px) 0', overflow: 'hidden' }}>
          <span aria-hidden="true" style={{ position: 'absolute', bottom: -120, left: -40, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(260px, 38vw, 460px)', lineHeight: 0.7, color: 'rgba(255,255,255,0.06)', userSelect: 'none', pointerEvents: 'none' }}>
            討
          </span>
          <div className="intro-wrap" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>{s.joinEyebrow}</span>
            <h2 className="kr-wrap" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fcf6e8', maxWidth: 720 }}>{s.joinTitle}</h2>
            <p className="kr-wrap" style={{ maxWidth: 540, margin: '22px 0 0', fontSize: 17.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{s.joinLead}</p>
            <div style={{ display: 'flex', gap: 13, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pill variant="cream" onClick={onStart}>
                {s.joinPrimary} <span style={{ fontSize: 15 }}>→</span>
              </Pill>
              <Pill variant="ghost" onClick={onStart}>
                {s.joinSecondary}
              </Pill>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
