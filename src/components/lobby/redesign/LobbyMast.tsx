// 토론배틀 로비 redesign — masthead (deep-green academic band) + slim sticky
// search bar with filter chips + section header. Ported from the design bundle
// (redesign/LobbyMast.jsx, LobbyFeatured.jsx › SectionHead), wired to real data.
import type { CSSProperties, ReactNode } from 'react';
import type { Lang } from '../../../i18n/landing';
import { DebateSeal } from '../../redesign/RedesignPrimitives';

const L_GOLD = '#f0cf7e';
const L_CREAM = '#fcf6e8';

export type LobbyFilter = 'all' | 'live' | 'open' | 'ai' | 'ended';

/* ===== masthead — deep-green academic band ===== */
export function LobbyMasthead({
  live = 0,
  open = 0,
  ended = 0,
  dateLabel,
  onCreate,
  lang,
}: {
  live?: number;
  open?: number;
  ended?: number;
  dateLabel: string;
  onCreate: () => void;
  lang: Lang;
}) {
  const en = lang === 'en';
  const stats: Array<[number, string, string]> = [
    [live, en ? 'LIVE' : '진행', '#ff9d7a'],
    [open, en ? 'OPEN' : '모집', L_GOLD],
    [ended, en ? 'DONE' : '종료', 'rgba(252,246,232,0.55)'],
  ];
  return (
    <section
      className="tb-on-dark tb-mast"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(158deg, #3f6a55 0%, #335844 54%, #284835 100%)',
        color: L_CREAM,
        padding: '34px 64px 104px',
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

      <div style={{ position: 'relative', maxWidth: 1216, margin: '0 auto', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {/* brand — gold seal eyebrow + serif wordmark */}
          <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: 580 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.2em', color: L_GOLD, whiteSpace: 'nowrap' }}>
              <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                <DebateSeal display={26} />
              </span>
              {dateLabel} · {en ? 'ARENA LOBBY' : '토론장 로비'}
            </span>
            <h1
              style={{
                margin: '13px 0 0',
                fontFamily: 'var(--font-serif)',
                fontWeight: 800,
                fontSize: 'clamp(40px, 6vw, 64px)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: L_CREAM,
              }}
            >
              {en ? 'Arena' : '토론장'}
              <span style={{ color: L_GOLD }}>.</span>
            </h1>
            <p style={{ maxWidth: 500, margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.6, color: 'rgba(252,246,232,0.82)', fontWeight: 500, wordBreak: 'keep-all' }}>
              {en
                ? 'One topic, two stances. An AI moderator runs the rounds while the audience watches and votes live.'
                : '하나의 주제, 두 사람의 입장. AI 사회자가 라운드를 진행하고 관중은 실시간으로 지켜보며 투표합니다.'}
            </p>
          </div>

          {/* right — create + stats action block */}
          <div
            className="tb-mast-actions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              flexShrink: 0,
              width: 268,
              maxWidth: '100%',
              padding: '16px 18px 13px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            }}
          >
            <button
              type="button"
              onClick={onCreate}
              className="tb-mast-create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 24px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: L_CREAM,
                color: '#284835',
                boxShadow: '0 14px 30px -12px rgba(0,0,0,0.5)',
                fontFamily: 'var(--font-body)',
                fontWeight: 800,
                fontSize: 15.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 0 }}>+</span> {en ? 'Create a room' : '토론방 만들기'}
            </button>
            <div aria-hidden="true" style={{ height: 1, background: 'rgba(255,255,255,0.13)' }} />
            <div className="tb-mast-stats" style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between' }}>
              {stats.map(([n, l, c], i) => (
                <span key={l} style={{ display: 'contents' }}>
                  {i > 0 && <span style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />}
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: c, lineHeight: 1 }}>
                      {String(n).padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(252,246,232,0.6)' }}>{l}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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
