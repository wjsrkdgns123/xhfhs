import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Side } from '../types';
import { VoteBar } from './common';
import type { Lang } from '../i18n/landing';
import { verdictStrings } from '../i18n/verdict';

interface Highlight {
  side: Side;
  name: string;
  round: string;
  votes: number;
  text: string;
}

interface VerdictViewProps {
  topic: string;
  proName: string;
  conName: string;
  proVoice?: string;
  conVoice?: string;
  audVotes: { pro: number; con: number };
  aiPick: Side | 'tie';
  finalWinner: Side | 'tie';
  startedAt?: number;
  endedAt?: number;
  rounds?: number;
  aiCommentary?: string;
  aiScores?: { logic?: number; evidence?: number; persuasion?: number };
  highlights?: Highlight[];
  verdictNumber?: number;
  voteBarVariant?: 'classic' | 'split' | 'tug' | 'beans';
  onBack?: () => void;
  onNewDebate?: () => void;
  onViewProfile?: () => void;
  onReadTranscript?: () => void;
  lang?: Lang;
}

/** Certificate-style verdict screen with staged blur reveal.
 *  Step 0: building (all blurred)
 *  Step 1: crowd verdict reveals
 *  Step 2: AI verdict reveals
 *  Step 3: final winner card reveals
 *  Lifted from debate-battle-v2 design — ResultView. */
export function VerdictView({
  topic,
  proName,
  conName,
  proVoice = '논리를 세운다',
  conVoice = '본질을 짚는다',
  audVotes,
  aiPick,
  finalWinner,
  startedAt,
  endedAt,
  rounds,
  aiCommentary,
  aiScores,
  highlights,
  verdictNumber,
  voteBarVariant = 'classic',
  onBack,
  onNewDebate,
  onViewProfile,
  onReadTranscript,
  lang = 'ko',
}: VerdictViewProps) {
  const t = verdictStrings[lang];
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRevealStep((s) => Math.min(3, s + 1)), 1100);
    return () => clearInterval(id);
  }, []);

  const audWinner: Side | 'tie' =
    audVotes.pro > audVotes.con ? 'pro' : audVotes.con > audVotes.pro ? 'con' : 'tie';

  const dateStr = startedAt && endedAt ? formatDuration(startedAt, endedAt, lang, rounds) : '';

  return (
    <div className="wrap float-in" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1180, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        {onBack && (
          <button className="btn" onClick={onBack} style={{ background: 'transparent', border: 'none' }}>
            {t.actions.back}
          </button>
        )}
        {onViewProfile && (
          <button className="btn" onClick={onViewProfile} style={{ background: 'transparent', border: 'none' }}>
            {t.actions.saveRecord}
          </button>
        )}
      </div>

      <article
        style={{
          padding: 'clamp(28px, 5vw, 56px)',
          background: 'var(--color-paper-light)',
          border: 'var(--border-line)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--r-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CornerOrn pos="tl" />
        <CornerOrn pos="tr" />
        <CornerOrn pos="bl" />
        <CornerOrn pos="br" />

        <div style={{ position: 'absolute', top: 36, right: 56, transform: 'rotate(-8deg)', zIndex: 2 }}>
          <span className="stamp">{t.certificate.stamp}</span>
        </div>

        {revealStep >= 3 && finalWinner !== 'tie' && (
          <Confetti color={finalWinner === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)'} />
        )}

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="eyebrow eyebrow--vermillion">
            <TrophyIcon /> {verdictNumber ? t.verdictNumber(verdictNumber) : t.title}
          </div>
          <h1
            className="display-2 serif-display"
            style={{ marginTop: 12, marginBottom: 8, letterSpacing: '-0.035em' }}
          >
            {t.title}
          </h1>
          <div
            className="kr-wrap"
            style={{ color: 'var(--color-ink-soft)', fontSize: 18, fontFamily: 'var(--font-serif-display)' }}
          >
            「{topic}」
          </div>
          {dateStr && (
            <div className="label-mono" style={{ color: 'var(--color-ink-fade)', marginTop: 10 }}>
              {dateStr}
            </div>
          )}
        </div>

        <div className="verdict-faceoff" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'stretch', margin: '0 -8px' }}>
          <SideCard
            side="pro"
            name={proName}
            voice={proVoice}
            winning={finalWinner === 'pro'}
            revealed={revealStep >= 3}
            lang={lang}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div
              style={{
                fontFamily: 'var(--font-serif-display)',
                fontSize: 56,
                fontWeight: 800,
                color: 'var(--color-ink-fade)',
                letterSpacing: '-0.04em',
              }}
            >
              vs
            </div>
          </div>
          <SideCard
            side="con"
            name={conName}
            voice={conVoice}
            winning={finalWinner === 'con'}
            revealed={revealStep >= 3}
            lang={lang}
          />
        </div>

        <div className="rule-double" style={{ margin: '36px 0' }} />

        <div className="verdict-breakdown" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="eyebrow">
              <UsersIcon /> {t.crowdLabel}
            </div>
            <div
              style={{
                marginTop: 14,
                padding: 20,
                background: 'var(--color-paper-deep)',
                border: 'var(--border-line)',
                borderRadius: 'var(--r-lg)',
              }}
            >
              <div style={{ filter: revealStep < 1 ? 'blur(8px)' : 'none', transition: 'filter 0.6s' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-serif-display)',
                      fontWeight: 800,
                      fontSize: 22,
                      color: 'var(--color-vermillion)',
                    }}
                  >
                    {audVotes.pro}
                    <span style={{ fontSize: 13, color: 'var(--color-ink-fade)', marginLeft: 4 }}>{t.certificate.voteUnit}</span>
                  </span>
                  <span className="label-mono">{t.certificate.totalVotes(audVotes.pro + audVotes.con)}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif-display)',
                      fontWeight: 800,
                      fontSize: 22,
                      color: 'var(--color-celadon)',
                    }}
                  >
                    {audVotes.con}
                    <span style={{ fontSize: 13, color: 'var(--color-ink-fade)', marginLeft: 4 }}>{t.certificate.voteUnit}</span>
                  </span>
                </div>
                <VoteBar pro={audVotes.pro} con={audVotes.con} variant={voteBarVariant} size="lg" showLabels={false} />
                <div
                  style={{
                    marginTop: 14,
                    padding: '8px 12px',
                    background: 'var(--color-paper-light)',
                    border: '1px dashed var(--color-line)',
                    borderRadius: 'var(--r-md)',
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-ink-fade)',
                      letterSpacing: '0.08em',
                      marginRight: 6,
                    }}
                  >
                    {t.certificate.judgment}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif-display)',
                      fontWeight: 800,
                      color:
                        audWinner === 'pro'
                          ? 'var(--color-vermillion)'
                          : audWinner === 'con'
                          ? 'var(--color-celadon)'
                          : 'var(--color-ink-fade)',
                    }}
                  >
                    {audWinner === 'pro' ? t.proWins : audWinner === 'con' ? t.conWins : t.even}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">
              <GavelIcon /> {t.aiLabel}
            </div>
            <div
              style={{
                marginTop: 14,
                padding: 20,
                background: 'var(--color-gold-tint)',
                border: 'var(--border-line)',
                borderRadius: 'var(--r-lg)',
              }}
            >
              <div style={{ filter: revealStep < 2 ? 'blur(8px)' : 'none', transition: 'filter 0.6s' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-serif-display)',
                    fontWeight: 800,
                    fontSize: 22,
                    color:
                      aiPick === 'pro'
                        ? 'var(--color-vermillion)'
                        : aiPick === 'con'
                        ? 'var(--color-celadon)'
                        : 'var(--color-ink-fade)',
                    marginBottom: 10,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {aiPick === 'pro'
                    ? t.aiDecision.pro
                    : aiPick === 'con'
                    ? t.aiDecision.con
                    : t.aiDecision.tie}
                </div>
                {aiCommentary && (
                  <div
                    className="kr-wrap"
                    style={{
                      fontSize: 13.5,
                      color: 'var(--color-ink-soft)',
                      lineHeight: 1.65,
                      fontFamily: 'var(--font-serif-display)',
                    }}
                  >
                    {aiCommentary}
                  </div>
                )}
                {aiScores && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {aiScores.logic !== undefined && (
                      <span className="chip chip--gold">{t.certificate.score.logic} {aiScores.logic.toFixed(1)}</span>
                    )}
                    {aiScores.evidence !== undefined && (
                      <span className="chip chip--gold">{t.certificate.score.evidence} {aiScores.evidence.toFixed(1)}</span>
                    )}
                    {aiScores.persuasion !== undefined && (
                      <span className="chip chip--gold">{t.certificate.score.persuasion} {aiScores.persuasion.toFixed(1)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 36,
            padding: 28,
            background:
              finalWinner === 'pro'
                ? 'var(--color-vermillion)'
                : finalWinner === 'con'
                ? 'var(--color-celadon)'
                : 'var(--color-ink-soft)',
            color: '#fff',
            border: 'var(--border-line)',
            borderRadius: 'var(--r-lg)',
            boxShadow:
              finalWinner === 'pro'
                ? 'var(--glow-pro)'
                : finalWinner === 'con'
                ? 'var(--glow-con)'
                : 'var(--shadow-lg)',
            textAlign: 'center',
            position: 'relative',
            filter: revealStep < 3 ? 'blur(12px)' : 'none',
            transition: 'filter 0.7s 0.2s',
          }}
        >
          <div className="label-mono" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
            {t.finalDecision}
          </div>
          <div className="display-2 serif-display" style={{ color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>
            {finalWinner === 'pro' ? t.winnerPro : finalWinner === 'con' ? t.winnerCon : t.tie}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--font-hand)', fontSize: 18, opacity: 0.95 }}>
            “{finalWinner === 'pro' ? proVoice : finalWinner === 'con' ? conVoice : t.certificate.evenTie}”
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <div className="eyebrow">
              <StarIcon /> {t.highlights}
            </div>
            <div
              className="verdict-highlights"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 14 }}
            >
              {highlights.map((h, i) => (
                <HighlightCard key={i} {...h} />
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 36,
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {onNewDebate && (
            <button className="btn" style={{ boxShadow: 'var(--shadow-sm)' }} onClick={onNewDebate}>
              {t.actions.newDebate}
            </button>
          )}
          {onReadTranscript && (
            <button className="btn" style={{ boxShadow: 'var(--shadow-sm)' }} onClick={onReadTranscript}>
              {t.actions.reread}
            </button>
          )}
          {onViewProfile && (
            <button className="btn btn-pri" style={{ boxShadow: 'var(--glow-gold)' }} onClick={onViewProfile}>
              {t.actions.viewProfile}
            </button>
          )}
        </div>
      </article>

      <style>{`
        @media (max-width: 720px) {
          .verdict-breakdown { grid-template-columns: 1fr !important; }
          .verdict-faceoff { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Confetti({ color }: { color: string }) {
  // Deterministic burst — derived once per mount so it doesn't reshuffle on
  // each parent render. ~24 paper bits drift down with rotation.
  const bits = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: (i / 24) * 100 + (Math.sin(i * 7.3) * 5),
        delay: (i % 8) * 0.07,
        dur: 1.6 + ((i * 0.13) % 0.9),
        rot: (i % 2 === 0 ? -1 : 1) * (120 + (i * 13) % 240),
        hue: i % 3,
      })),
    [],
  );
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-12px',
            left: `${b.left}%`,
            width: 8,
            height: 12,
            background: b.hue === 0 ? color : b.hue === 1 ? 'var(--color-gold)' : 'var(--color-ink)',
            opacity: 0.85,
            transform: `rotate(${b.rot}deg)`,
            animation: `verdict-confetti ${b.dur}s ease-in ${b.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes verdict-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(640px) rotate(540deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] > span { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function CornerOrn({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const styles: Record<typeof pos, CSSProperties> = {
    tl: { top: 16, left: 16, transform: 'rotate(0deg)' },
    tr: { top: 16, right: 16, transform: 'rotate(90deg)' },
    bl: { bottom: 16, left: 16, transform: 'rotate(-90deg)' },
    br: { bottom: 16, right: 16, transform: 'rotate(180deg)' },
  };
  return (
    <svg
      style={{ position: 'absolute', ...styles[pos], opacity: 0.6, pointerEvents: 'none' }}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
    >
      <path d="M2 2 L18 2 M2 2 L2 18 M2 8 L8 8 L8 2" stroke="var(--color-vermillion)" strokeWidth="1.5" />
    </svg>
  );
}

function SideCard({
  side,
  name,
  voice,
  winning,
  revealed,
  lang = 'ko',
}: {
  side: Side;
  name: string;
  voice: string;
  winning: boolean;
  revealed: boolean;
  lang?: Lang;
}) {
  const t = verdictStrings[lang];
  const color = side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const glow = side === 'pro' ? 'var(--glow-pro)' : 'var(--glow-con)';
  const initial =
    name.charAt(0) || (side === 'pro' ? t.certificate.proInitial : t.certificate.conInitial);
  return (
    <div
      style={{
        padding: 24,
        background: winning ? color : 'var(--color-paper)',
        color: winning ? '#fff' : 'var(--color-ink)',
        border: `1px solid ${winning ? 'transparent' : color}`,
        borderRadius: 'var(--r-lg)',
        boxShadow: winning ? glow : 'var(--shadow-sm)',
        transform: winning && revealed ? 'translate(-2px, -2px)' : 'none',
        transition: 'all 0.5s',
        position: 'relative',
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: winning ? 'rgba(255,255,255,0.12)' : side === 'pro' ? 'var(--color-tint-pro)' : 'var(--color-tint-con)',
          color: winning ? '#fff' : color,
          border: `1px solid ${winning ? '#fff' : color}`,
          borderRadius: 'var(--r-md)',
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: '-0.02em',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {initial}
      </span>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            className="serif-display"
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: winning ? '#fff' : 'var(--color-ink)',
            }}
          >
            {name}
          </span>
          <span
            className="label-mono"
            style={{ color: winning ? 'rgba(255,255,255,0.8)' : color }}
          >
            {side === 'pro' ? t.certificate.proLabel : t.certificate.conLabel}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 16,
            marginTop: 4,
            color: winning ? 'rgba(255,255,255,0.9)' : 'var(--color-ink-fade)',
          }}
        >
          “{voice}”
        </div>
      </div>
      {winning && revealed && (
        <div style={{ position: 'absolute', top: -14, right: -14, transform: 'rotate(8deg)' }}>
          <span className="stamp stamp--gold">{t.certificate.winStamp}</span>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ side, name, round, votes, text }: Highlight) {
  const color = side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const tint = side === 'pro' ? 'var(--color-tint-pro)' : 'var(--color-tint-con)';
  const initial = name.charAt(0) || (side === 'pro' ? '찬' : '반');
  return (
    <div style={{ padding: 16, background: tint, border: `1px solid ${color}`, borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 26,
            height: 26,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tint,
            color,
            border: `1px solid ${color}`,
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-serif-display)',
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {initial}
        </span>
        <span style={{ fontFamily: 'var(--font-serif-display)', fontWeight: 800, fontSize: 14, color }}>{name}</span>
        <span className="label-mono" style={{ color: 'var(--color-ink-fade)' }}>
          · {round}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color,
            letterSpacing: '0.06em',
          }}
        >
          ♡ {votes}
        </span>
      </div>
      <p
        className="kr-wrap"
        style={{
          margin: 0,
          fontFamily: 'var(--font-serif-display)',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        “{text}”
      </p>
    </div>
  );
}

function formatDuration(start: number, end: number, lang: Lang, rounds?: number): string {
  const t = verdictStrings[lang];
  const d = new Date(start);
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const startStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const e = new Date(end);
  const endStr = `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`;
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  return `${dateStr} · ${startStr}–${endStr} · ${t.certificate.duration(minutes, rounds)}`;
}

function TrophyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function GavelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 13L9 18l-3-3 5-5" />
      <path d="M16 16l3-3" />
      <path d="M9.6 4.6L13 8" />
      <path d="M3 21h12" />
      <path d="M17 7l4 4" />
      <path d="M13.5 3.5L20.5 10.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
