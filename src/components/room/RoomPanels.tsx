// #25 (incremental step 6): larger RoomView-only sub-components extracted from App.tsx.
import { lazy, Suspense, useState } from 'react';
import { AIModCard, type AvatarId, Nameplate, ProfileAvatar, VoteBar } from '../common';
import { verdictStrings } from '../../i18n/verdict';
import type { Lang } from '../../i18n/landing';
import type { Message, Phase, Room, Side } from '../../types';
import { classNames } from '../../lib/cn';

// Full-bleed Verdict overlay (lazy). Only VerdictBlock uses it.
const VerdictViewLazy = lazy(() =>
  import('../VerdictView').then((m) => ({ default: m.VerdictView })),
);

export function SideCard({
  variant,
  name,
  mine,
  speaking,
  empty,
  canTake,
  onTake,
  avatarId,
  avatarDataUrl,
  isAi,
}: {
  variant: 'pro' | 'con';
  name: string | null;
  mine: boolean;
  speaking: boolean;
  empty: boolean;
  canTake: boolean;
  onTake: () => void;
  avatarId?: string | null;
  avatarDataUrl?: string | null;
  isAi?: boolean;
}) {
  const accent =
    variant === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const label = variant === 'pro' ? '찬성' : '반대';

  if (empty) {
    return (
      <div
        className="p-4 flex flex-col items-center justify-center text-center min-h-[160px] paper-grain"
        style={{
          border: `1.5px dashed ${accent}`,
          borderRadius: 'var(--r-lg)',
          background: 'var(--color-paper)',
        }}
      >
        <div
          className="rounded-full flex items-center justify-center mb-2 font-bold"
          style={{
            width: 56,
            height: 56,
            background: 'var(--color-paper-light)',
            border: `1px solid ${accent}`,
            color: accent,
            fontSize: 28,
          }}
        >
          ?
        </div>
        <Nameplate variant={variant} size="sm">
          {label} 도전자 모집
        </Nameplate>
        {canTake && (
          <button
            onClick={onTake}
            className="btn mt-3"
            style={{
              background: accent,
              color: 'var(--color-paper-light)',
              fontSize: 13,
              padding: '6px 12px',
            }}
          >
            {label}으로 입장하기 →
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-3 paper-grain transition"
      style={{
        border: `1px solid ${accent}`,
        borderRadius: 'var(--r-lg)',
        background: speaking
          ? 'linear-gradient(180deg, var(--color-paper-light) 0%, var(--color-paper) 100%)'
          : 'var(--color-paper-light)',
        boxShadow: speaking
          ? variant === 'pro'
            ? 'var(--glow-pro)'
            : 'var(--glow-con)'
          : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <Nameplate variant={variant} size="sm">
          {label}
          {speaking && ' 🎤'}
        </Nameplate>
        {mine && (
          <span className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
            (나)
          </span>
        )}
      </div>
      <div className="flex items-center justify-center mb-2" style={{ height: 92 }}>
        <ProfileAvatar
          avatarId={avatarId as AvatarId | undefined}
          avatarDataUrl={avatarDataUrl}
          size={84}
          ring={variant}
          style={{
            transform: speaking ? 'translateY(-3px)' : 'none',
            transition: 'transform 0.25s',
            filter: !speaking ? 'saturate(0.9)' : undefined,
          }}
        />
      </div>
      <p
        className="text-center m-0 serif-display"
        style={{
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {speaking ? (
          <span className="brush-under" style={{ color: accent }}>
            {name ?? '대기 중'}
          </span>
        ) : (
          name ?? '대기 중'
        )}
      </p>
      {isAi && (
        <p
          className="text-center text-xs mt-0.5 label-mono"
          style={{ color: 'var(--color-ink-fade)' }}
        >
          AI 토론자
        </p>
      )}
    </div>
  );
}

export function VerdictBlock({
  room,
  proCount,
  conCount,
  proPct,
  conPct,
  mySide,
  aiBusy,
  onRequestExtend,
  lang,
}: {
  room: Room;
  proCount: number;
  conCount: number;
  proPct: number;
  conPct: number;
  mySide: Side | 'spectator' | null;
  aiBusy: boolean;
  onRequestExtend: () => void;
  lang: Lang;
}) {
  const tV = verdictStrings[lang];
  // unused-but-kept-for-future: proPct/conPct still used inline for backwards compat
  void proPct;
  void conPct;
  const [showV2Verdict, setShowV2Verdict] = useState(false);
  const winner = room.winner;
  const winnerSide: Side | null = winner === 'pro' || winner === 'con' ? winner : null;
  const winnerName =
    winnerSide === 'pro' ? room.proName : winnerSide === 'con' ? room.conName : null;
  const headlineColor = winnerSide
    ? winnerSide === 'pro'
      ? 'var(--color-vermillion)'
      : 'var(--color-celadon)'
    : 'var(--color-ink)';
  const totalVotes = proCount + conCount;
  const aiPickLabel =
    room.aiPick === 'pro'
      ? tV.aiPick.pro
      : room.aiPick === 'con'
        ? tV.aiPick.con
        : tV.aiPick.tie;
  const aiPickColor =
    room.aiPick === 'pro'
      ? 'var(--color-vermillion)'
      : room.aiPick === 'con'
        ? 'var(--color-celadon)'
        : 'var(--color-ink-soft)';
  const myAgreed =
    mySide === 'pro'
      ? !!room.extendRequestPro
      : mySide === 'con'
        ? !!room.extendRequestCon
        : false;

  return (
    <div className="mt-4 space-y-3">
      <div
        className="card-sketch p-4"
        style={{
          background: 'var(--color-paper-light)',
          borderLeft: `8px solid ${headlineColor}`,
        }}
      >
        <div
          className="text-xs font-bold mb-1"
          style={{ color: 'var(--color-ink-fade)', letterSpacing: '0.25em' }}
        >
          {tV.label}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <h2
            className="m-0 font-bold accent-hand"
            style={{ fontSize: 32, color: headlineColor, letterSpacing: '-0.01em' }}
          >
            {winnerSide === 'pro' ? tV.winnerPro : winnerSide === 'con' ? tV.winnerCon : tV.tie}
          </h2>
          {winnerSide && winnerName && (
            <span className="text-base font-bold" style={{ color: 'var(--color-ink)' }}>
              — {winnerName}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2 flex-wrap text-sm mt-2 mb-3"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          <span>
            {tV.breakdown.ai}: <strong style={{ color: aiPickColor }}>{aiPickLabel}</strong>
          </span>
          <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
          <span>
            {tV.breakdown.crowd}: <strong>{tV.breakdown.crowdCount(totalVotes)}</strong>
          </span>
          {typeof room.finalProScore === 'number' && (
            <>
              <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
              <span>
                {tV.breakdown.total}{' '}
                <strong style={{ color: 'var(--color-vermillion)' }}>{room.finalProScore}</strong>
                {' : '}
                <strong style={{ color: 'var(--color-celadon)' }}>
                  {100 - room.finalProScore}
                </strong>
              </span>
            </>
          )}
          {!!room.extendRound && room.extendRound > 0 && (
            <>
              <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
              <span>{tV.breakdown.round(room.extendRound + 1)}</span>
            </>
          )}
        </div>

        {/* v2: VoteBar component handles the pro/con split bar */}
        <VoteBar pro={proCount} con={conCount} variant="classic" showLabels={false} />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowV2Verdict(true)}
            className="btn"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {tV.fullView}
          </button>
        </div>
      </div>

      {(mySide === 'pro' || mySide === 'con') && (
        <div
          className="card p-2 flex items-center gap-2 flex-wrap text-sm"
          style={{ background: 'var(--color-paper-light)' }}
        >
          <span style={{ color: 'var(--color-ink-soft)' }}>{tV.extend.title}</span>
          <span
            className="px-1.5"
            style={{
              color: room.extendRequestPro
                ? 'var(--color-vermillion)'
                : 'var(--color-ink-fade)',
              fontWeight: room.extendRequestPro ? 700 : 400,
            }}
          >
            {tV.extend.pro} {room.extendRequestPro ? tV.extend.check : tV.extend.waiting}
          </span>
          <span style={{ color: 'var(--color-ink-fade)' }}>·</span>
          <span
            className="px-1.5"
            style={{
              color: room.extendRequestCon
                ? 'var(--color-celadon)'
                : 'var(--color-ink-fade)',
              fontWeight: room.extendRequestCon ? 700 : 400,
            }}
          >
            {tV.extend.con} {room.extendRequestCon ? tV.extend.check : tV.extend.waiting}
          </span>
          <button
            onClick={onRequestExtend}
            disabled={aiBusy}
            className="btn ml-auto"
            style={{
              padding: '5px 12px',
              fontSize: 13,
              background: myAgreed ? 'var(--color-vermillion)' : 'var(--color-paper-light)',
              color: myAgreed ? '#fff' : 'var(--color-ink)',
            }}
          >
            {myAgreed ? tV.extend.requestedCancel : tV.extend.request}
          </button>
        </div>
      )}

      {showV2Verdict && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="토론 판정문"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowV2Verdict(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.55)',
            overflowY: 'auto',
            padding: '24px 12px',
          }}
        >
          <div style={{ position: 'sticky', top: 12, zIndex: 1, display: 'flex', justifyContent: 'flex-end', maxWidth: 1180, margin: '0 auto' }}>
            <button
              type="button"
              onClick={() => setShowV2Verdict(false)}
              aria-label={lang === 'en' ? 'Close verdict' : '판정문 닫기'}
              className="btn"
              style={{
                background: 'var(--color-paper-light)',
                padding: '8px 14px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {tV.closeOverlay}
            </button>
          </div>
          <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', padding: 48 }}>{tV.loading}</div>}>
            <VerdictViewLazy
              topic={room.topic}
              proName={room.proName ?? (lang === 'en' ? 'Pro' : '찬성')}
              conName={room.conName ?? (lang === 'en' ? 'Con' : '반대')}
              audVotes={{ pro: proCount, con: conCount }}
              aiPick={room.aiPick ?? 'tie'}
              finalWinner={room.winner ?? 'tie'}
              startedAt={room.createdAt}
              endedAt={Date.now()}
              rounds={(room.extendRound ?? 0) + 1}
              voteBarVariant="classic"
              onBack={() => setShowV2Verdict(false)}
              lang={lang}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export function MessageRow({
  m,
  mine,
  phase,
  aiModVariant = 'scroll',
}: {
  m: Message;
  mine: boolean;
  phase?: Phase;
  aiModVariant?: 'scroll' | 'avatar' | 'minimal';
}) {
  if (m.side === 'moderator') {
    return (
      <div className="mx-auto max-w-[92%] msg--mod">
        {/* v2: AIModCard variant cycled via HUD button — scroll / avatar / minimal */}
        <AIModCard variant={aiModVariant} message={m.text} phase={phase ?? 'opening'} />
      </div>
    );
  }
  // Restored local "speech-bubble" design: pro left-aligned / con right-aligned,
  // each with a clipped corner (tail) toward its speaker, a PRO/CON mono chip,
  // and the tint background matching the arena tone. Logic/data unchanged.
  const sideClass = m.side === 'pro' ? 'rm2-bubble--pro' : 'rm2-bubble--con';
  const chipClass = m.side === 'pro' ? 'rm2-bubble__chip--pro' : 'rm2-bubble__chip--con';
  // v2: slide-in animation per side — pro from left, con from right
  const slideClass = m.side === 'pro' ? 'msg--pro' : m.side === 'con' ? 'msg--con' : '';
  const sideLabel = m.side === 'pro' ? 'PRO' : 'CON';
  return (
    <div className={classNames('rm2-bubble', sideClass, slideClass)}>
      <div className="rm2-bubble__header">
        <span className={classNames('rm2-bubble__chip', chipClass)}>{sideLabel}</span>
        <span className="rm2-bubble__name">{m.name}</span>
        {mine && <span className="rm2-bubble__mine">· 나</span>}
      </div>
      <p className="rm2-bubble__text">{m.text}</p>
    </div>
  );
}
