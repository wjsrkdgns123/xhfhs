// 토론배틀 로비 redesign — split-stage masthead (deep-green academic hero) + slim
// sticky search bar with filter chips + section header. The masthead is ported
// from the archived local redesign (App.tsx › lb2-hero "스플릿 스테이지"): a large
// chalk-gold "토론장" wordmark + lead + gold create button + 3 big stats + a
// real-time pulse on the left, and a featured live scoreboard board on the right.
// Wired to real data only — when no room is live the right column shows an honest
// dashed fallback, and the board carries NO fabricated vote bar / vote tally
// (the lobby snapshot has no per-room votes; round · phase · faceoff are honest).
import type { CSSProperties, ReactNode } from 'react';
import type { Lang } from '../../../i18n/landing';
import { lobbyStrings } from '../../../i18n/lobby';
import { DebateSeal, MascotChip } from '../../redesign/RedesignPrimitives';
import type { CardRoom } from './LobbyCards';

const L_GOLD = '#f0cf7e';
const L_CREAM = '#fcf6e8';

export type LobbyFilter = 'all' | 'live' | 'open' | 'ai' | 'ended';

/* ===== masthead — deep-green split-stage hero ===== */
export function LobbyMasthead({
  live = 0,
  open = 0,
  ended = 0,
  dateLabel,
  onCreate,
  featured = null,
  onEnter,
  lang,
}: {
  live?: number;
  open?: number;
  ended?: number;
  dateLabel: string;
  onCreate: () => void;
  featured?: CardRoom | null;
  onEnter?: (id: string) => void;
  lang: Lang;
}) {
  const t = lobbyStrings[lang].hero;
  const stats: Array<[number, string, string]> = [
    [live, t.statLive, '#ff9d7a'],
    [open, t.statOpen, L_GOLD],
    [ended, t.statEnded, '#8db8c8'],
  ];
  return (
    <section
      className="tb-on-dark tb-mast tb-mast--split"
      aria-label={t.heroAria}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 35% 50%, rgba(255,255,255,0.05), transparent 35%), linear-gradient(135deg, #35684f 0%, #173429 100%)',
        color: L_CREAM,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(70% 60% at 14% -10%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 60%)',
        }}
      />
      <img
        src="/redesign/bubbles-bg.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        style={{ position: 'absolute', right: -28, bottom: -40, width: 520, maxWidth: '48%', opacity: 0.1, pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}
      />

      {/* feTurbulence 분필 필터 — 골드 밑줄/점에 분필 질감 부여 */}
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="tbChalkLobby" x="-20%" y="-120%" width="140%" height="340%" primitiveUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="6" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0.45" result="ga" />
            <feComposite in="d" in2="ga" operator="in" />
          </filter>
        </defs>
      </svg>

      <div className="tb-mast-grid" style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', zIndex: 1 }}>
        {/* ===== 좌측 — 페이지 타이틀 영역 ===== */}
        <div style={{ minWidth: 0 }}>
          {/* eyebrow: 골드 인장 + 날짜 · 토론장 로비 */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.14em', color: L_GOLD, whiteSpace: 'nowrap' }}>
            <span style={{ flexShrink: 0, display: 'inline-flex' }}>
              <DebateSeal display={26} />
            </span>
            {t.eyebrow(dateLabel)}
          </span>

          {/* 거대 "토론장" 헤드라인 + 분필-골드 밑줄 SVG */}
          <h1 style={{ margin: '20px 0 0', lineHeight: 0.9 }}>
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                fontFamily: 'var(--font-serif)',
                fontWeight: 800,
                fontSize: 'clamp(56px, 7vw, 96px)',
                letterSpacing: '-0.05em',
                color: '#fff7e8',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-block' }}>
                {t.word}
                {/* 골드 분필 밑줄 */}
                <svg aria-hidden="true" viewBox="0 0 300 14" preserveAspectRatio="none" style={{ position: 'absolute', left: '-1%', bottom: '-0.2em', width: '102%', height: '0.22em', overflow: 'visible' }}>
                  <rect x="2" y="4" width="296" height="6" fill={L_GOLD} filter="url(#tbChalkLobby)" />
                </svg>
              </span>
              {/* 골드 점 */}
              <span aria-hidden="true" style={{ display: 'inline-block', width: '0.3em', height: '0.4em', marginLeft: '0.04em', verticalAlign: 'baseline' }}>
                <svg viewBox="0 0 40 52" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <circle cx="20" cy="44" r="13" fill={L_GOLD} filter="url(#tbChalkLobby)" />
                </svg>
              </span>
            </span>
          </h1>

          {/* 리드 */}
          <p style={{ maxWidth: 440, margin: '30px 0 0', fontSize: 18, lineHeight: 1.7, fontWeight: 700, color: 'rgba(255,247,232,0.88)', wordBreak: 'keep-all' }}>
            {t.lead1}
            <br />
            {t.lead2}
            <br />
            {t.lead3}
          </p>

          {/* 골드 그라데이션 CTA */}
          <div style={{ marginTop: 36 }}>
            <button
              type="button"
              onClick={onCreate}
              className="tb-mast-create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                height: 62,
                padding: '0 34px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(180deg, #ffe49a 0%, #f0ce72 100%)',
                color: '#10291f',
                boxShadow: '0 16px 34px -14px rgba(0,0,0,0.4)',
                fontFamily: 'var(--font-body)',
                fontWeight: 900,
                fontSize: 18,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 0 }}>+</span> {t.create}
            </button>
          </div>

          {/* 큰 숫자 3개 (진행/모집/종료) + 실시간 펄스 */}
          <div style={{ marginTop: 40, paddingTop: 26, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="tb-mast-stats" style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
              {stats.map(([n, l, c], i) => (
                <span key={l} style={{ display: 'contents' }}>
                  {i > 0 && <span aria-hidden="true" style={{ alignSelf: 'stretch', width: 1, background: 'rgba(252,246,232,0.18)' }} />}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em', color: c }}>
                      {String(n).padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'rgba(255,247,232,0.72)', whiteSpace: 'nowrap' }}>{l}</span>
                  </span>
                </span>
              ))}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#7fae8a',
                  boxShadow: '0 0 8px 1px rgba(127,174,138,0.6)',
                  animation: 'tb-pulse 1.8s ease-in-out infinite',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, letterSpacing: '0.04em', color: 'rgba(252,246,232,0.5)', whiteSpace: 'nowrap' }}>
                {t.pulse}
              </span>
            </div>
          </div>
        </div>

        {/* ===== 우측 — 대표 라이브 전광판 or 정직한 폴백 ===== */}
        {featured ? (
          <FeaturedBoard room={featured} onEnter={onEnter} lang={lang} />
        ) : (
          <div
            className="tb-mast-fallback"
            aria-label={t.noLiveAria}
            style={{
              position: 'relative',
              borderRadius: 28,
              border: '2px dashed rgba(240,206,114,0.35)',
              padding: '48px 42px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              textAlign: 'center',
            }}
          >
            <div aria-hidden="true" style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 52, lineHeight: 1, color: 'rgba(240,206,114,0.45)' }}>
              討
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'rgba(255,247,232,0.7)', wordBreak: 'keep-all' }}>
              {t.noLiveTitle}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,247,232,0.45)', wordBreak: 'keep-all' }}>{t.noLiveSub}</div>
            <button
              type="button"
              onClick={onCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                padding: '14px 28px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: 'rgba(240,206,114,0.18)',
                color: L_GOLD,
                boxShadow: 'inset 0 0 0 1px rgba(240,206,114,0.35)',
                fontFamily: 'var(--font-body)',
                fontWeight: 800,
                fontSize: 15,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 0 }}>+</span> {t.noLiveBtn}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ===== featured live scoreboard board (right column of the split hero) =====
   Honest signals only: LIVE badge · topic · round/phase · faceoff portraits.
   No vote bar / vote tally — the lobby snapshot carries no per-room votes. */
function FeaturedBoard({ room, onEnter, lang }: { room: CardRoom; onEnter?: (id: string) => void; lang: Lang }) {
  const t = lobbyStrings[lang].hero;
  const sideBlock = (side: 'pro' | 'con') => {
    const isPro = side === 'pro';
    const accent = isPro ? '#e8825e' : '#8db8c8';
    const name = isPro ? room.pro : room.con;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
        <MascotChip side={side} size={56} ring />
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', color: accent }}>
          {isPro ? t.proRole : t.conRole}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 800,
            fontSize: 16,
            lineHeight: 1.25,
            color: '#fff7e8',
            textAlign: 'center',
            maxWidth: 120,
            wordBreak: 'keep-all',
          }}
        >
          {name && name.trim() ? name : t.recruiting}
        </div>
      </div>
    );
  };
  return (
    <div
      className="tb-mast-board"
      aria-label={t.featuredAria}
      style={{
        position: 'relative',
        justifySelf: 'stretch',
        width: '100%',
        borderRadius: 28,
        background: 'rgba(16,38,30,0.86)',
        boxShadow: '0 32px 80px -36px rgba(0,0,0,0.6)',
        border: '1px solid rgba(240,206,114,0.22)',
        padding: '32px 42px 34px',
        boxSizing: 'border-box',
      }}
    >
      {/* LIVE 태그 + 가장 뜨거운 토론 라벨 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px 8px 13px',
            borderRadius: 999,
            fontFamily: 'var(--font-mono)',
            fontWeight: 900,
            fontSize: 13.5,
            letterSpacing: '0.08em',
            background: '#d94a22',
            color: '#fff',
            boxShadow: '0 8px 20px -8px rgba(200,75,31,0.85)',
          }}
        >
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 9px 1px rgba(255,255,255,0.85)', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
          {t.live}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', color: L_GOLD, whiteSpace: 'nowrap' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill={L_GOLD} />
          </svg>
          {t.hottest}
        </span>
      </div>

      {/* 논제 */}
      <h2
        style={{
          margin: '24px 0 0',
          fontFamily: 'var(--font-serif)',
          fontWeight: 800,
          fontSize: 'clamp(26px, 2.7vw, 35px)',
          lineHeight: 1.25,
          letterSpacing: '-0.03em',
          color: '#fff7e8',
          wordBreak: 'keep-all',
        }}
      >
        <a
          className="tb-cardlink"
          href={`#room-${room.id}`}
          onClick={(e) => {
            e.preventDefault();
            onEnter?.(room.id);
          }}
          aria-label={`${room.topic} ${t.watch}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {room.topic}
        </a>
      </h2>

      {/* 라운드/페이즈 라벨 (실데이터) */}
      {room.roundLabel && (
        <div style={{ margin: '18px 0 0', display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'rgba(255,247,232,0.78)', whiteSpace: 'nowrap' }}>
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff7a52', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
          {room.roundLabel}
        </div>
      )}

      {/* 스코어보드 — 라운드 헤더 + 찬반 아바타 (가짜 득표바 없음) */}
      <div style={{ position: 'relative', borderRadius: 22, background: 'rgba(255,255,255,0.045)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)', padding: '26px 28px 24px', marginTop: 22 }}>
        {room.roundLabel && (
          <div style={{ textAlign: 'center', marginBottom: 18, fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 16, letterSpacing: '0.06em', color: '#fcf6e8', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase' }}>
            {room.roundLabel}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
          {sideBlock('pro')}
          <span aria-hidden="true" style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 22, color: 'rgba(252,246,232,0.6)', paddingTop: 30, flexShrink: 0 }}>
            {t.vs}
          </span>
          {sideBlock('con')}
        </div>

        {/* 골드 CTA */}
        <button
          type="button"
          className="tb-above"
          onClick={() => onEnter?.(room.id)}
          aria-label={`${room.topic} ${t.watch}`}
          style={{
            width: '100%',
            height: 56,
            marginTop: 20,
            borderRadius: 16,
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(180deg, #ffe49a, #f0ce72)',
            color: '#10291f',
            boxShadow: '0 12px 26px -14px rgba(240,207,126,0.6)',
            fontFamily: 'var(--font-body)',
            fontWeight: 900,
            fontSize: 17,
          }}
        >
          {t.watch}
        </button>
      </div>
    </div>
  );
}

/* ===== slim sticky search bar — search + light status filter chips ===== */
export function LobbySearchBar({
  search,
  onSearch,
  filter = 'all',
  onFilter,
  onCreate,
  lang,
}: {
  search: string;
  onSearch: (v: string) => void;
  filter?: LobbyFilter;
  onFilter?: (f: LobbyFilter) => void;
  onCreate: () => void;
  lang: Lang;
}) {
  const en = lang === 'en';
  const filters: Array<[LobbyFilter, string]> = [
    ['all', en ? 'All' : '전체'],
    ['live', en ? 'Live' : '진행 중'],
    ['open', en ? 'Open' : '참가 가능'],
    ['ai', en ? 'AI' : 'AI 상대'],
    ['ended', en ? 'Ended' : '종료'],
  ];
  return (
    <div
      className="tb-on-dark tb-searchbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'rgba(246,240,226,0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e3d9c2',
        boxShadow: '0 1px 0 rgba(40,60,45,0.04)',
        padding: '14px 64px',
      }}
    >
      <div style={{ maxWidth: 1216, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14 }}>討</span>
          {en ? 'Find a debate' : '토론 찾기'}
        </span>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 460, display: 'inline-flex', alignItems: 'center', gap: 9, padding: '10px 16px', borderRadius: 999, background: '#fff', boxShadow: 'inset 0 0 0 1px #e3d9c2' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="var(--ink-fade)" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="var(--ink-fade)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={en ? 'Search by topic or debater' : '주제·토론자 이름으로 검색'}
            aria-label={en ? 'Search debates' : '토론 검색'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}
          />
          {search && (
            <button type="button" onClick={() => onSearch('')} aria-label={en ? 'Clear search' : '검색어 지우기'} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-fade)', fontSize: 16, padding: 0 }}>
              ✕
            </button>
          )}
        </div>
        <div role="group" aria-label={en ? 'Filter by status' : '토론 상태 필터'} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(([key, lbl]) => {
            const on = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilter && onFilter(key)}
                aria-pressed={on}
                style={{
                  padding: '7px 13px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.02em',
                  background: on ? 'var(--ink)' : 'transparent',
                  color: on ? '#fcf6e8' : 'var(--ink-soft)',
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px #d9cdb4',
                  transition: 'all .14s ease',
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="tb-hide-sm"
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--celadon)', color: '#fff', boxShadow: '0 10px 22px -10px var(--celadon)', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}
        >
          <span style={{ fontSize: 17, lineHeight: 0 }}>+</span> {en ? 'Create' : '토론방 만들기'}
        </button>
      </div>
    </div>
  );
}

/* ===== section header ===== */
export function SectionHead({
  eyebrow,
  title,
  count,
  accent = 'var(--celadon)',
  action,
}: {
  eyebrow: string;
  title: string;
  count?: number;
  accent?: string;
  action?: ReactNode;
}) {
  const titleStyle: CSSProperties = {
    margin: '10px 0 0',
    fontFamily: 'var(--font-serif)',
    fontWeight: 800,
    fontSize: 27,
    letterSpacing: '-0.025em',
    color: 'var(--ink)',
    whiteSpace: 'nowrap',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: accent, whiteSpace: 'nowrap' }}>
          <span style={{ width: 20, height: 1.5, background: accent }} />
          {eyebrow}
        </span>
        <h2 style={titleStyle}>
          {title}
          {count != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink-ghost)', marginLeft: 11, letterSpacing: 0 }}>{count}</span>
          )}
        </h2>
      </div>
      {action}
    </div>
  );
}
