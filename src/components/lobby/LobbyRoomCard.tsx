// #25 (incremental step 8): lobby room card extracted from App.tsx.
import { AI_OPPONENT_UID, PHASE_LABEL, type Room } from '../../types';
import { classNames } from '../../lib/cn';

export function LobbyRoomCard({
  room,
  onEnter,
  onDelete,
  isMine,
  isHot,
}: {
  room: Room;
  onEnter: (id: string) => void;
  onDelete: (id: string) => void;
  isMine: boolean;
  isHot: boolean;
}) {
  const isAiGame = room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
  const proPct = typeof room.finalProScore === 'number' ? room.finalProScore : 50;
  const conPct = 100 - proPct;
  const winner = room.winner;
  const phaseLabel = room.phase ? PHASE_LABEL[room.phase] : '';
  const round = (room.extendRound ?? 0) + 1;

  return (
    <div className="relative">
      <button className="lb-card" onClick={() => onEnter(room.id)}>
        {(isHot || isMine) && (
          <div className={classNames('lb-hot', isMine && 'lb-hot--mine')}>
            {isMine ? '내 방' : '🔥 HOT'}
          </div>
        )}
        <div className="lb-card__top">
          {room.status === 'live' && (
            <span className="lb-pill lb-pill--live">
              <span className="d" /> LIVE
            </span>
          )}
          {room.status === 'open' && <span className="lb-pill lb-pill--open">모집중</span>}
          {room.status === 'ended' && <span className="lb-pill lb-pill--end">종료</span>}
          {room.isPrivate && <span className="lb-pill lb-pill--private">PRIVATE</span>}
          {isAiGame && <span className="lb-pill lb-pill--ai">AI전</span>}
          {room.status === 'live' && phaseLabel && (
            <span style={{ color: 'var(--color-ink-fade)' }}>
              R{round} · {phaseLabel}
            </span>
          )}
          {room.status === 'open' && (
            <span style={{ color: 'var(--color-ink-fade)' }}>
              {room.proUid || room.conUid ? '도전자 1명 필요' : '대기 중'}
            </span>
          )}
        </div>

        <h3 className="lb-card__topic">{room.topic}</h3>

        <div className="lb-sides">
          {room.proUid ? (
            <div className="lb-side lb-side--pro">
              <div className="lb-side__av">
                {room.proAvatarDataUrl ? (
                  <img src={room.proAvatarDataUrl} alt="" />
                ) : (
                  <span>{room.proUid === AI_OPPONENT_UID ? '🤖' : '🦊'}</span>
                )}
              </div>
              <div className="lb-side__meta">
                <div className="lb-side__role">PRO · 찬성</div>
                <div className="lb-side__name">{room.proName ?? '?'}</div>
              </div>
            </div>
          ) : (
            <div className="lb-side lb-side--empty">
              <div className="lb-side__meta" style={{ textAlign: 'center' }}>
                <div className="lb-side__role">PRO · 찬성</div>
                <div className="lb-side__name" style={{ color: 'var(--color-ink-fade)' }}>
                  자리 비어있음
                </div>
              </div>
              <span className="lb-side__empty-mark">?</span>
            </div>
          )}
          <span className="lb-side__vs">VS</span>
          {room.conUid ? (
            <div className="lb-side lb-side--con">
              <div className="lb-side__av">
                {room.conAvatarDataUrl ? (
                  <img src={room.conAvatarDataUrl} alt="" />
                ) : (
                  <span>{room.conUid === AI_OPPONENT_UID ? '🤖' : '🐻'}</span>
                )}
              </div>
              <div className="lb-side__meta">
                <div className="lb-side__role">CON · 반대</div>
                <div className="lb-side__name">{room.conName ?? '?'}</div>
              </div>
            </div>
          ) : (
            <div className="lb-side lb-side--empty">
              <div className="lb-side__meta" style={{ textAlign: 'center' }}>
                <div className="lb-side__role">CON · 반대</div>
                <div className="lb-side__name" style={{ color: 'var(--color-ink-fade)' }}>
                  자리 비어있음
                </div>
              </div>
              <span className="lb-side__empty-mark">?</span>
            </div>
          )}
        </div>

        {room.status === 'ended' && typeof room.finalProScore === 'number' && (
          <div className="lb-votebar">
            <div className="lb-votebar__pro" style={{ width: `${proPct}%` }}>
              {proPct}%
            </div>
            <div className="lb-votebar__con" style={{ width: `${conPct}%` }}>
              {conPct}%
            </div>
          </div>
        )}

        <div className="lb-meta">
          {room.status === 'ended' && winner === 'pro' && (
            <span className="lb-winner-stamp">찬성 승</span>
          )}
          {room.status === 'ended' && winner === 'con' && (
            <span className="lb-winner-stamp lb-winner-stamp--con">반대 승</span>
          )}
          {room.status === 'ended' && winner === 'tie' && (
            <span style={{ color: 'var(--color-ink-soft)', fontWeight: 700 }}>무승부</span>
          )}
          {room.status === 'open' && !room.proUid && !room.conUid && (
            <span className="lb-card__hint">↳ 첫 도전자가 되어보세요</span>
          )}
        </div>
      </button>
      {isMine && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(room.id);
          }}
          className="lb-card__del"
          title="삭제"
        >
          🗑
        </button>
      )}
    </div>
  );
}
