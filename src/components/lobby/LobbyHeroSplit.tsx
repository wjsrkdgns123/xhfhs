import { Fragment } from 'react';
import { PHASE_LABEL, AI_OPPONENT_UID, type Room } from '../../types';

/** HeaderSplit (시안 B 스플릿 스테이지) — 핸드오프 CombinedHeaders.jsx 1:1 이식.
 *  좌: 거대 "토론장" 타이틀 + 분필-골드 밑줄 + 리드 + 골드 CTA + BigStats(실카운트).
 *  우: live 방 있으면 다크 카드 + LiveTag + 논제 + 메타 + 스코어보드(실득표).
 *      없으면 폴백 플레이스홀더 카드(가짜 라이브 금지). */
export function LobbyHeroSplit({
  featuredRoom,
  proVotes,
  conVotes,
  liveCount,
  openCount,
  endedCount,
  dateLabel,
  lang,
  onEnter,
  onCreate,
}: {
  featuredRoom: Room | null;
  proVotes: number;
  conVotes: number;
  liveCount: number;
  openCount: number;
  endedCount: number;
  dateLabel: string;
  lang: 'ko' | 'en';
  onEnter: (id: string) => void;
  onCreate: () => void;
}) {
  const room = featuredRoom;

  // --- 스코어보드 데이터 계산 ---
  const totalVotes = proVotes + conVotes;
  const proPct = totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 50;
  const conPct = 100 - proPct;

  // 플래그칩 (실득표 접전 ≤10%p, 총표≥1 + 라운드 접근) — 관전급증 금지
  let flagText: string | null = null;
  if (room) {
    const roundNum = (room.extendRound ?? 0) + 1;
    const totalRounds = room.plannedRounds ?? 1;
    const isClose = totalVotes > 0 && Math.abs(proPct - 50) <= 10;
    const isLastRound = roundNum >= totalRounds;
    const isNearEnd = roundNum === totalRounds - 1;
    if (isClose) {
      flagText = lang === 'en' ? `Close ${proPct}:${conPct}` : `접전 ${proPct}:${conPct}`;
    } else if (isLastRound && roundNum > 0) {
      flagText = lang === 'en' ? 'Final Round' : '마지막 라운드';
    } else if (isNearEnd && roundNum > 0) {
      flagText = lang === 'en' ? 'Near End' : '종반 라운드';
    }
  }

  const roundNum = room ? (room.extendRound ?? 0) + 1 : 1;
  const totalRounds = room?.plannedRounds ?? 1;
  const phaseLabel = room?.phase ? PHASE_LABEL[room.phase] : '';
  const proName = room?.proName ?? (lang === 'en' ? 'Pro' : '찬성');
  const conName = room?.conName ?? (lang === 'en' ? 'Con' : '반대');

  // 사이드 블록 (스코어보드 내 마스코트 + 역할 + 이름 + 득표수)
  const SideBlock = ({ side }: { side: 'pro' | 'con' }) => {
    if (!room) return null;
    const isPro = side === 'pro';
    const name = isPro ? proName : conName;
    const score = isPro ? proVotes : conVotes;
    const numColor = isPro ? '#e8825e' : '#8db8c8';
    const accent = isPro ? '#e8825e' : '#8db8c8';
    const role = isPro ? (lang === 'en' ? 'PRO' : '찬성') : (lang === 'en' ? 'CON' : '반대');
    const avatarDataUrl = isPro ? room.proAvatarDataUrl : room.conAvatarDataUrl;
    const uid = isPro ? room.proUid : room.conUid;
    const defaultEmoji = isPro ? '🦊' : '🐻';
    return (
      <div className="lb2-hero__side">
        {avatarDataUrl ? (
          <img src={avatarDataUrl} alt="" style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 0 0 2.5px ${accent}` }} />
        ) : (
          <span style={{ fontSize: 38, lineHeight: 1 }}>{uid === AI_OPPONENT_UID ? '🤖' : defaultEmoji}</span>
        )}
        <div className="lb2-hero__side-role" style={{ color: numColor }}>{role}</div>
        <div className="lb2-hero__side-name">{name}</div>
        <div className="lb2-hero__side-score" style={{ color: numColor }}>
          {score}
          <span className="lb2-hero__side-v">{lang === 'en' ? 'v' : '표'}</span>
        </div>
      </div>
    );
  };

  // BigStats 라벨
  const statItems: [number, string, string][] = [
    [liveCount, lang === 'en' ? 'Live Now' : '진행 중', 'var(--color-vermillion)'],
    [openCount, lang === 'en' ? 'Recruiting' : '참가 모집 중', '#f0cf7e'],
    [endedCount, lang === 'en' ? 'Ended' : '종료된 토론', '#8db8c8'],
  ];

  return (
    <section className="lb2-hero" aria-label={lang === 'en' ? 'Debate lobby hero' : '토론장 로비 히어로'}>
      {/* 배경 글로우 */}
      <div aria-hidden="true" className="lb2-hero__glow" />

      <div className="lb2-hero__inner">
        {/* ====== 좌측 — 페이지 타이틀 영역 ====== */}
        <div className="lb2-hero__left">
          {/* eyebrow: 골드 수평선 + 날짜 · 토론장 로비 */}
          <span className="lb2-hero__eyebrow">
            <span aria-hidden="true" className="lb2-hero__eyebrow-line" />
            {dateLabel}&nbsp;·&nbsp;{lang === 'en' ? 'Debate Lobby' : '토론장 로비'}
          </span>

          {/* 거대 "토론장" 헤드라인 + 분필-골드 밑줄 SVG */}
          <h1 className="lb2-hero__title">
            <span className="lb2-hero__wordmark">
              {/* feTurbulence 분필 필터 */}
              <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <filter id="tbChalkHero" x="-20%" y="-120%" width="140%" height="340%" primitiveUnits="userSpaceOnUse">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
                    <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="6" result="g" />
                    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0.45" result="ga" />
                    <feComposite in="d" in2="ga" operator="in" />
                  </filter>
                </defs>
              </svg>
              <span className="lb2-hero__chalk-wrap">
                {lang === 'en' ? 'Debate Arena' : '토론장'}
                {/* 골드 밑줄 */}
                <svg aria-hidden="true" viewBox="0 0 300 14" preserveAspectRatio="none" className="lb2-hero__chalk-line">
                  <rect x="2" y="4" width="296" height="6" fill="#f0cf7e" filter="url(#tbChalkHero)" />
                </svg>
              </span>
              {/* 골드 점 */}
              <span aria-hidden="true" className="lb2-hero__gold-dot">
                <svg viewBox="0 0 40 52" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <circle cx="20" cy="44" r="13" fill="#f0cf7e" filter="url(#tbChalkHero)" />
                </svg>
              </span>
            </span>
          </h1>

          {/* 리드 */}
          <p className="lb2-hero__lead">
            {lang === 'en'
              ? <>One topic, two stances.<br />AI moderates each round<br />while the crowd votes in real time.</>
              : <>하나의 주제, 두 사람의 입장.<br />AI 사회자가 라운드를 진행하고<br />관중은 실시간으로 승부에 참여합니다.</>}
          </p>

          {/* 골드 그라데이션 CTA */}
          <div className="lb2-hero__create-wrap">
            <button type="button" className="lb2-hero__create" onClick={onCreate}>
              <span style={{ fontSize: 22, lineHeight: 0 }}>+</span>
              {lang === 'en' ? 'Create a room' : '토론방 만들기'}
            </button>
          </div>

          {/* BigStats */}
          <div className="lb2-hero__stats">
            <div className="lb2-hero__stats-row">
              {statItems.map(([n, label, color], i) => (
                <Fragment key={label}>
                  {i > 0 && <span aria-hidden="true" className="lb2-hero__stat-sep" />}
                  <div className="lb2-hero__stat">
                    <span className="lb2-hero__stat-n" style={{ color }}>{String(n).padStart(2, '0')}</span>
                    <span className="lb2-hero__stat-l">{label}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div className="lb2-hero__pulse">
              <span aria-hidden="true" className="lb2-hero__pulse-dot" />
              <span className="lb2-hero__pulse-txt">
                {lang === 'en' ? 'Updated in real time' : '실시간으로 업데이트 됩니다'}
              </span>
            </div>
          </div>
        </div>

        {/* ====== 우측 — 라이브 카드 or 폴백 ====== */}
        {room ? (
          <div className="lb2-hero__card" aria-label={lang === 'en' ? 'Featured live debate' : '대표 라이브 토론'}>
            {/* LiveTag */}
            <div className="lb2-hero__live-tag">
              <span className="lb2-hero__live-pill">
                <span aria-hidden="true" className="lb2-hero__live-dot" />
                LIVE
              </span>
              <span className="lb2-hero__live-label">
                {/* 불꽃 아이콘 */}
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill="#f0cf7e" />
                </svg>
                {lang === 'en' ? 'Hottest debate right now' : '지금 가장 뜨거운 토론'}
              </span>
            </div>

            {/* 논제 */}
            <h2 className="lb2-hero__card-topic">
              <a
                href={`?room=${room.id}`}
                onClick={(e) => { e.preventDefault(); onEnter(room.id); }}
                aria-label={`${room.topic} ${lang === 'en' ? 'Watch live' : '관전하기'}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {room.topic}
              </a>
            </h2>

            {/* LiveMeta */}
            <div className="lb2-hero__card-meta">
              {/* 접전/라운드 플래그칩 — 실데이터 기준 */}
              {flagText && (
                <span className="lb2-hero__flag-chip">
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill="#ff9d7a" />
                  </svg>
                  {flagText}
                </span>
              )}
              {/* 라운드/페이즈 라벨 (가짜 카운트다운 금지 → 실제 라운드 표시) */}
              <span className="lb2-hero__round-meta">
                <span aria-hidden="true" className="lb2-hero__round-dot" />
                <b style={{ color: '#fcf6e8', fontWeight: 800 }}>
                  {lang === 'en' ? `Round ${roundNum}/${totalRounds}` : `${roundNum}/${totalRounds} 라운드`}
                </b>
                {phaseLabel && <span style={{ color: 'rgba(255,247,232,0.6)' }}>{' · '}{phaseLabel}</span>}
              </span>
              {/* 총 득표수 (관전자 수 없음 → 실득표로 대체) */}
              {totalVotes > 0 && (
                <span className="lb2-hero__votes-meta">
                  {lang === 'en' ? `${totalVotes} votes` : `관중 ${totalVotes}명 투표`}
                </span>
              )}
            </div>

            {/* 스코어보드 */}
            <div className="lb2-hero__board">
              {/* 카운트다운 자리 → ROUND N/T · 페이즈 큰 모노 텍스트 */}
              <div className="lb2-hero__board-clock">
                ROUND&nbsp;{roundNum}/{totalRounds}
                {phaseLabel && (
                  <div className="lb2-hero__board-phase">{phaseLabel}</div>
                )}
              </div>

              {/* 찬성 VS 반대 */}
              <div className="lb2-hero__sides">
                <SideBlock side="pro" />
                <span aria-hidden="true" className="lb2-hero__vs">VS</span>
                <SideBlock side="con" />
              </div>

              {/* 득표바 — 실득표 (총표 없으면 50:50) */}
              <div
                role="img"
                aria-label={lang === 'en' ? `Pro ${proPct}%, Con ${conPct}%` : `찬성 ${proPct}%, 반대 ${conPct}%`}
                className="lb2-hero__votebar"
              >
                <div className="lb2-hero__votebar-pro" style={{ width: `${proPct}%` }} />
                <div className="lb2-hero__votebar-con" style={{ width: `${conPct}%` }} />
              </div>

              {/* 골드 CTA */}
              <button
                type="button"
                className="lb2-hero__cta"
                onClick={() => onEnter(room.id)}
                aria-label={lang === 'en' ? `Watch: ${room.topic}` : `실시간 관전하기: ${room.topic}`}
              >
                {lang === 'en' ? 'Watch Live →' : '실시간 관전하기 →'}
              </button>
            </div>
          </div>
        ) : (
          /* 폴백 — live 방 없을 때. 가짜 라이브 카드 금지 */
          <div className="lb2-hero__fallback" aria-label={lang === 'en' ? 'No live debate yet' : '진행 중인 토론 없음'}>
            <div className="lb2-hero__fallback-icon" aria-hidden="true">討</div>
            <div className="lb2-hero__fallback-title">
              {lang === 'en' ? 'No live debates yet' : '아직 진행 중인 토론이 없어요'}
            </div>
            <div className="lb2-hero__fallback-sub" style={{ marginBottom: 0 }}>
              {lang === 'en'
                ? 'Be the first to open a stage — use the "Create a room" button on the left.'
                : `왼쪽 '토론방 만들기' 버튼으로 첫 번째 토론 무대를 열어보세요.`}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
