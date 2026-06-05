import { lazy, Suspense, useState, useEffect } from 'react';
import { VoteBar } from '../common';
import { verdictStrings } from '../../i18n/verdict';
import type { Room, Side } from '../../types';
import type { Lang } from '../../i18n/landing';

const VerdictViewLazy = lazy(() =>
  import('../VerdictView').then((m) => ({ default: m.VerdictView })),
);

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

  // Esc 키로 판정문 모달 닫기 (접근성 — WCAG 2.1.2)
  useEffect(() => {
    if (!showV2Verdict) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowV2Verdict(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showV2Verdict]);

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
        style={{
          background: 'var(--color-paper-light)',
          borderLeft: `6px solid ${headlineColor}`,
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '16px',
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
        <VoteBar pro={proCount} con={conCount} variant="classic" showLabels={false} lang={lang} />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowV2Verdict(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              color: 'var(--color-ink-soft)',
              background: 'var(--color-paper-deep)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--r-pill)', padding: '7px 16px',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              transition: 'background 0.15s',
            }}
          >
            {tV.fullView}
          </button>
        </div>
      </div>

      {(mySide === 'pro' || mySide === 'con') && (
        <div
          style={{
            background: 'var(--color-paper-light)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--color-line)',
            boxShadow: 'var(--shadow-sm)',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            fontSize: 13,
          }}
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
            type="button"
            onClick={onRequestExtend}
            disabled={aiBusy}
            style={{
              display: 'inline-flex', alignItems: 'center',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              background: myAgreed ? 'var(--color-vermillion)' : 'var(--color-paper-light)',
              color: myAgreed ? '#fff' : 'var(--color-ink)',
              border: myAgreed ? 'none' : '1px solid var(--color-line)',
              borderRadius: 'var(--r-pill)', padding: '7px 16px',
              cursor: 'pointer', marginLeft: 'auto',
              opacity: aiBusy ? 0.45 : 1,
              transition: 'background 0.15s',
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
              style={{
                display: 'inline-flex', alignItems: 'center',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                color: 'var(--color-ink)',
                background: 'var(--color-paper-light)',
                border: '1px solid var(--color-line)',
                borderRadius: 'var(--r-pill)', padding: '8px 18px',
                cursor: 'pointer', boxShadow: 'var(--shadow-md)',
                transition: 'background 0.15s',
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
