import { lobbyStrings } from '../../i18n/lobby';
import { roomStrings } from '../../i18n/room';
import { AI_OPPONENT_UID, type Room } from '../../types';
import type { Lang } from '../../i18n/landing';
import { classNames } from '../../lib/ui';

/** 핸드오프 슬림 카드 — LiveCard / JoinCard / ResultCard 3종 통합
 *  실데이터 기반: proVotes/conVotes는 live 방 votes 구독값, finalProScore는 ended 방 실데이터.
 *  viewers/타이머 없음 — R{n}/{total}·phase 라벨로 대체. 관전급증 없음. */
export function LobbyRoomCard({
  room,
  onEnter,
  onDelete,
  isMine,
  proVotes,
  conVotes,
  lang,
}: {
  room: Room;
  onEnter: (id: string) => void;
  onDelete: (id: string) => void;
  isMine: boolean;
  isHot: boolean; // kept for prop compat — not used visually in slim design
  proVotes: number;
  conVotes: number;
  lang: Lang;
}) {
  const tc = lobbyStrings[lang].card;
  const isAiGame = room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
  const proPct = typeof room.finalProScore === 'number' ? room.finalProScore : 50;
  const conPct = 100 - proPct;
  const winner = room.winner;
  const phaseLabel = room.phase ? roomStrings[lang].phases[room.phase] : '';
  const round = (room.extendRound ?? 0) + 1;
  const totalRounds = room.plannedRounds ?? 1;

  // live 방 실득표 계산 (MiniVoteBar + FlagChip용)
  const liveTotalVotes = proVotes + conVotes;
  const liveProPct = liveTotalVotes > 0 ? Math.round((proVotes / liveTotalVotes) * 100) : 50;
  const liveConPct = 100 - liveProPct;
  // 플래그: 접전(차이 ≤10%p, 총표≥1), 마지막/종반 라운드. 관전급증 없음.
  const isClose = liveTotalVotes > 0 && Math.abs(liveProPct - 50) <= 10;
  const isLastRound = round >= totalRounds;
  const isNearEnd = round === totalRounds - 1;

  // 빈 자리 신호 (JoinCard용)
  const openSide = !room.proUid ? 'pro' : !room.conUid ? 'con' : null;
  const openLabel = openSide === 'pro' ? tc.openLabelPro : openSide === 'con' ? tc.openLabelCon : tc.openLabelBoth;
  const sideColor = openSide === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';

  // 승자 표시 (ResultCard용)
  const resultLabel = winner === 'pro' ? tc.resultPro : winner === 'con' ? tc.resultCon : winner === 'tie' ? tc.resultTie : '';
  const winColor = winner === 'pro' ? 'var(--color-vermillion)' : winner === 'con' ? 'var(--color-celadon)' : 'var(--color-gold)';

  const cardClass = classNames(
    'lb2-card',
    room.status === 'live' && 'lb2-card--live',
    room.status === 'open' && 'lb2-card--open',
    room.status === 'ended' && 'lb2-card--ended',
  );

  return (
    <div style={{ position: 'relative' }}>
      {isMine && (
        <span className="lb2-mine-badge" aria-label={tc.myRoom}>{tc.myRoom}</span>
      )}
      <article className={cardClass} style={{ cursor: 'pointer' }} onClick={() => onEnter(room.id)}>
        {/* 상단 상태 바 */}
        <div className="lb2-card__topbar">
          {room.status === 'live' && (
            <span className="lb2-pill lb2-pill--live">
              <span className="lb2-pill__dot" aria-hidden="true" />
              LIVE
            </span>
          )}
          {room.status === 'open' && (
            <span className="lb2-pill lb2-pill--open">{tc.pillOpen}</span>
          )}
          {room.status === 'ended' && (
            <span className="lb2-pill lb2-pill--ended">{tc.pillEnded}</span>
          )}

          {/* 부가 정보 */}
          {room.status === 'live' && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5,
              color: 'var(--color-ink-fade)', whiteSpace: 'nowrap',
            }}>
              R{round}/{totalRounds}{phaseLabel ? ` · ${phaseLabel}` : ''}
            </span>
          )}
          {/* FlagChip — 실득표 기준 접전/마지막라운드. 관전급증 없음 */}
          {room.status === 'live' && isClose && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--color-vermillion-tint)', color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
              boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.28)', whiteSpace: 'nowrap',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2c.5 2.5-1 3.8-2.5 5.2C9 8.6 7.5 10.2 7.5 13a5.5 5.5 0 0 0 11 0c0-2.2-1-3.8-2.2-5.2-.3 1-.9 1.6-1.7 1.9C15.2 7 14.3 4.2 13 2Z" fill="var(--color-vermillion)" /></svg>
              {tc.flagClose} {liveProPct}:{liveConPct}
            </span>
          )}
          {room.status === 'live' && !isClose && isLastRound && round > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--color-vermillion-tint)', color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
              boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.28)', whiteSpace: 'nowrap',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 21V4M6 4.5c3-2 6 1 9-0.5v8c-3 1.5-6-1.5-9 0.5" stroke="var(--color-vermillion)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {tc.flagLastRound}
            </span>
          )}
          {room.status === 'live' && !isClose && !isLastRound && isNearEnd && round > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--color-vermillion-tint)', color: 'var(--color-vermillion)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
              boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.28)', whiteSpace: 'nowrap',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 21V4M6 4.5c3-2 6 1 9-0.5v8c-3 1.5-6-1.5-9 0.5" stroke="var(--color-vermillion)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {tc.flagNearEnd}
            </span>
          )}
          {room.status === 'open' && room.plannedRounds != null && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5,
              letterSpacing: '0.04em', color: 'var(--color-ink-fade)',
              padding: '5px 10px', borderRadius: 999,
              boxShadow: 'inset 0 0 0 1px #e3d9c2', whiteSpace: 'nowrap',
            }}>{tc.rounds(room.plannedRounds!)}</span>
          )}
          {room.status === 'ended' && resultLabel && (
            <span className="lb2-result-winner" style={{ color: winColor }}>
              {winner === 'tie'
                ? <span aria-hidden="true" style={{ width: 7, height: 7, background: winColor, transform: 'rotate(45deg)', display: 'inline-block' }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke={winColor} strokeWidth="2" strokeLinejoin="round"/><path d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9M10 13.5 9.5 17h5l-.5-3.5M8 20h8" stroke={winColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              {resultLabel}
            </span>
          )}

          {room.isPrivate && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, color: 'var(--color-ink-fade)', marginLeft: 'auto' }}>{tc.private}</span>
          )}
          {isAiGame && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.1em', color: 'var(--color-celadon)',
              padding: '3px 8px', borderRadius: 999,
              boxShadow: 'inset 0 0 0 1px rgba(45,74,90,0.4)',
            }}>{tc.ai}</span>
          )}
        </div>

        {/* 논제 */}
        <h3 className="lb2-card__topic">
          <a
            className="lb2-card__link"
            href={`?room=${room.id}`}
            onClick={(e) => { e.preventDefault(); onEnter(room.id); }}
            aria-label={`${room.topic} ${room.status === 'live' ? tc.ariaWatch : room.status === 'open' ? tc.ariaJoin : tc.ariaReplay}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {room.topic}
          </a>
        </h3>

        {/* LiveCard: MiniVoteBar — 실득표 기반 */}
        {room.status === 'live' && (
          <div className="lb2-votebar">
            {/* 찬성 마스코트 */}
            {room.proAvatarDataUrl
              ? <img src={room.proAvatarDataUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{room.proUid === AI_OPPONENT_UID ? '🤖' : '🦊'}</span>
            }
            <div
              role="img"
              aria-label={tc.voteBarAriaLabel(liveProPct, liveConPct)}
              className="lb2-votebar__bar"
            >
              <div className="lb2-votebar__pro" style={{ width: `${liveProPct}%` }}>{liveProPct}</div>
              <div className="lb2-votebar__con" style={{ width: `${liveConPct}%` }}>{liveConPct}</div>
            </div>
            {/* 반대 마스코트 */}
            {room.conAvatarDataUrl
              ? <img src={room.conAvatarDataUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{room.conUid === AI_OPPONENT_UID ? '🤖' : '🐻'}</span>
            }
          </div>
        )}

        {/* JoinCard: 빈 자리 신호 */}
        {room.status === 'open' && openSide != null && (
          <div className="lb2-open-seat">
            <span className="lb2-open-seat__plus" style={{ boxShadow: `inset 0 0 0 1.5px ${sideColor}`, color: sideColor }}>+</span>
            <span className="lb2-open-seat__txt">
              <b style={{ color: sideColor }}>{openLabel}</b> {tc.seatEmpty}
            </span>
          </div>
        )}
        {room.status === 'open' && openSide == null && (
          <div className="lb2-open-seat">
            <span className="lb2-open-seat__plus" style={{ boxShadow: 'inset 0 0 0 1.5px var(--color-gold)', color: 'var(--color-gold)' }}>+</span>
            <span className="lb2-open-seat__txt">{tc.seatBoth}</span>
          </div>
        )}

        {/* ResultCard: 최종 점수 */}
        {room.status === 'ended' && typeof room.finalProScore === 'number' && (
          <div className="lb2-result-score">
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 34, lineHeight: 1,
              color: 'var(--color-vermillion)', opacity: winner === 'con' ? 0.5 : 1,
            }}>{proPct}<span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>%</span></span>
            <span style={{ fontFamily: 'var(--font-hand,cursive)', fontWeight: 700, fontSize: 18, color: 'var(--color-ink-fade)' }}>:</span>
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 34, lineHeight: 1,
              color: 'var(--color-celadon)', opacity: winner === 'pro' ? 0.5 : 1,
            }}>{conPct}<span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>%</span></span>
          </div>
        )}

        {/* 득표바 — ended + finalProScore 있을 때만 (실데이터). live는 votes 서브컬렉션 구독 없어 집계 불가 → 표시 안 함 */}
        {room.status === 'ended' && typeof room.finalProScore === 'number' && (
          <div className="lb2-votebar">
            <div className="lb2-votebar__bar">
              <div
                className={classNames('lb2-votebar__pro', winner === 'pro' && 'lb2-votebar__pro--win')}
                style={{ width: `${proPct}%` }}
              >{proPct}</div>
              <div
                className={classNames('lb2-votebar__con', winner === 'con' && 'lb2-votebar__con--win')}
                style={{ width: `${conPct}%` }}
              >{conPct}</div>
              {winner === 'tie' && (
                <span className="lb2-votebar__tie" aria-hidden="true" />
              )}
            </div>
          </div>
        )}

        {/* CTA 푸터 */}
        <div className="lb2-card__footer">
          {room.status === 'live' && (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--color-ink-fade)', whiteSpace: 'nowrap' }}>
                {liveTotalVotes > 0
                  ? `${liveTotalVotes}표`
                  : `${room.proName ?? '?'} vs ${room.conName ?? '?'}`}
              </span>
              <span className="lb2-cta lb2-cta--live" style={{ marginLeft: 'auto' }}>{tc.ctaWatch}</span>
            </>
          )}
          {room.status === 'open' && (
            <span className="lb2-cta lb2-cta--open">{tc.ctaJoin}</span>
          )}
          {room.status === 'ended' && (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--color-ink-fade)', whiteSpace: 'nowrap' }}>
                {room.proName ?? '?'} vs {room.conName ?? '?'}
              </span>
              <span className="lb2-cta lb2-cta--ended" style={{ marginLeft: 'auto' }}>{tc.ctaReplay}</span>
            </>
          )}
        </div>
      </article>
      {/* 내 방 삭제 버튼 — 기존 동작 100% 보존 */}
      {isMine && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(room.id);
          }}
          className="lb2-card__del"
          title={tc.deleteTitle}
        >
          🗑
        </button>
      )}
    </div>
  );
}
