import type { Room } from '../types';
import { AI_OPPONENT_UID, PHASE_LABEL } from '../types';
import { VoteBar } from './common';

interface LobbyRoomRowProps {
  room: Room;
  viewers?: number;
  votes?: { pro: number; con: number };
  category?: string;
  isHot?: boolean;
  onEnter: (id: string) => void;
}

/** Newspaper-style horizontal room card for the Lobby v2 design.
 *  4-column layout: status badge | topic+sides | vote bar | action.
 *  Compresses to single column under 720px via inline media query.
 *  Drop-in alternative to the existing LobbyRoomCard grid item. */
export function LobbyRoomRow({
  room,
  viewers,
  votes,
  category,
  isHot,
  onEnter,
}: LobbyRoomRowProps) {
  const isLive = room.status === 'live';
  const isOpen = room.status === 'open';
  const isEnded = room.status === 'ended';
  const isAiGame = room.proUid === AI_OPPONENT_UID || room.conUid === AI_OPPONENT_UID;
  const total = (votes?.pro ?? 0) + (votes?.con ?? 0);
  const phaseLabel = room.phase ? PHASE_LABEL[room.phase] : '';
  const idDigits = room.id.replace(/[^0-9]/g, '').padStart(3, '0') || room.id.slice(0, 3).toUpperCase();

  return (
    <article
      className="lobby-row"
      onClick={() => onEnter(room.id)}
      style={{
        padding: 0,
        display: 'grid',
        gridTemplateColumns: '160px 1fr 280px 160px',
        alignItems: 'stretch',
        background: 'var(--color-paper-light)',
        border: `1.5px solid ${isLive ? 'var(--color-ink)' : 'var(--color-ink-fade)'}`,
        boxShadow: isLive ? '2px 2px 0 var(--color-ink)' : 'none',
        transition: 'transform 0.12s, box-shadow 0.12s',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: isLive
            ? 'var(--color-vermillion)'
            : isOpen
            ? 'var(--color-gold)'
            : 'var(--color-paper-deep)',
          color: isEnded ? 'var(--color-ink-fade)' : '#fff',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1.5px solid var(--color-ink)',
          minHeight: 130,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
          }}
        >
          {isLive && (
            <span
              style={{
                width: 6,
                height: 6,
                background: '#fff',
                borderRadius: '50%',
                animation: 'status-pulse-dot 1.4s ease-in-out infinite',
              }}
            />
          )}
          {isLive ? 'LIVE' : isOpen ? '대기중' : '종료'}
        </div>
        <div>
          <div
            className="serif-display"
            style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            #{idDigits}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              opacity: 0.85,
            }}
          >
            {isLive
              ? phaseLabel || '진행 중'
              : isOpen
              ? '입장 대기'
              : room.winner === 'pro'
              ? '찬성 승'
              : room.winner === 'con'
              ? '반대 승'
              : '무승부'}
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          {category && (
            <span
              style={{
                padding: '3px 9px',
                fontSize: 11,
                fontWeight: 700,
                border: '1.5px dashed var(--color-ink)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-body)',
                letterSpacing: '-0.01em',
              }}
            >
              #{category}
            </span>
          )}
          {isHot && (
            <span
              style={{
                padding: '3px 9px',
                fontSize: 11,
                fontWeight: 700,
                border: '1.5px dashed var(--color-vermillion)',
                color: 'var(--color-vermillion)',
                fontFamily: 'var(--font-body)',
                letterSpacing: '-0.01em',
              }}
            >
              #접전
            </span>
          )}
          {isAiGame && <span className="chip chip--gold">AI전</span>}
          {room.isPrivate && (
            <span className="chip" style={{ background: 'var(--color-paper-deep)' }}>
              비공개
            </span>
          )}
        </div>
        <h3
          className="serif-display kr-wrap"
          style={{
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: '-0.025em',
            margin: '0 0 14px',
            color: 'var(--color-ink)',
          }}
        >
          「{room.topic}」
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <SideMini name={room.proName} side="pro" />
          <span
            style={{
              fontFamily: 'var(--font-serif-display)',
              fontWeight: 800,
              fontSize: 16,
              color: 'var(--color-ink-fade)',
              letterSpacing: '-0.02em',
            }}
          >
            VS
          </span>
          <SideMini name={room.conName} side="con" />
        </div>
      </div>

      <div style={{ padding: 18, borderLeft: '1.5px dotted var(--color-ink-fade)' }}>
        {votes && total > 0 ? (
          <div>
            <div className="label-mono" style={{ marginBottom: 8 }}>
              현재 득표 · {total}표
            </div>
            <VoteBar pro={votes.pro} con={votes.con} variant="classic" showLabels={false} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
              }}
            >
              <span style={{ color: 'var(--color-vermillion)' }}>찬 {votes.pro}</span>
              <span style={{ color: 'var(--color-celadon)' }}>{votes.con} 반</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-ink-fade)',
              fontFamily: 'var(--font-hand)',
              fontSize: 17,
            }}
          >
            아직 투표 전
          </div>
        )}
      </div>

      <div
        style={{
          padding: 18,
          background: isLive ? 'var(--color-paper-deep)' : 'var(--color-paper)',
          borderLeft: '1.5px solid var(--color-ink)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        {viewers !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--color-ink-fade)',
            }}
          >
            👁 {viewers} 관전
          </div>
        )}
        <button
          type="button"
          className={`btn btn--shadow btn--sm ${isLive ? 'btn--pri' : isOpen ? 'btn--gold' : ''}`}
          style={{
            width: '100%',
            textAlign: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEnter(room.id);
          }}
        >
          {isLive ? '들어가서 보기 →' : isOpen ? '자리 잡기 →' : '복기 보기 →'}
        </button>
      </div>

      <style>{`
        .lobby-row:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--color-ink);
        }
        @media (max-width: 720px) {
          .lobby-row { grid-template-columns: 1fr !important; }
          .lobby-row > div { border-right: none !important; border-left: none !important; border-bottom: 1.5px dotted var(--color-ink-fade); }
          .lobby-row > div:last-child { border-bottom: none; }
        }
      `}</style>
    </article>
  );
}

function SideMini({ name, side }: { name: string | null; side: 'pro' | 'con' }) {
  const color = side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const tint = side === 'pro' ? 'var(--color-tint-pro)' : 'var(--color-tint-con)';
  const label = side === 'pro' ? '찬' : '반';
  if (!name) {
    return (
      <span
        className="chip"
        style={{
          border: `1.5px dashed ${color}`,
          color,
          background: 'transparent',
        }}
      >
        {side === 'pro' ? '찬성' : '반대'} 자리 비어있음
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tint,
          color,
          border: `1.5px solid ${color}`,
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        {name.charAt(0)}
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
        <div className="label-mono" style={{ color }}>
          {label}
        </div>
      </div>
    </div>
  );
}
