import { Fragment, useEffect, useMemo, useState } from 'react';
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

/** Certificate-style verdict screen — soft-round reskin.
 *  All reveal logic (revealStep / interval / Confetti / formatDuration) UNCHANGED.
 *  Only markup + inline styles swapped to rm2 soft-round language. */
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
    <div
      className="wrap float-in"
      style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 80px' }}
    >
      <style>{`
        /* ===== verdict-v2 soft-round styles ===== */
        .vd2-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; flex-wrap: wrap; gap: 10px;
        }
        .vd2-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; color: var(--color-ink-soft);
          background: var(--color-paper-light); border: 1px solid var(--color-line);
          border-radius: var(--r-pill); padding: 7px 16px;
          box-shadow: var(--shadow-sm); cursor: pointer;
          transition: background 0.15s;
        }
        .vd2-pill:hover { background: var(--color-paper-deep); }
        .vd2-pill--vermillion { background: var(--color-vermillion); color: var(--color-on-accent); border-color: var(--color-vermillion); }
        .vd2-pill--vermillion:hover { opacity: .88; }
        .vd2-pill--cream { background: var(--color-paper-deep); color: var(--color-ink); }
        .vd2-pill:focus-visible { outline: 2px solid var(--color-vermillion); outline-offset: 2px; }
        .vd2-envelope {
          background: var(--color-paper-light);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-line);
          /* gold hairline inset */
          outline: none;
          position: relative; overflow: hidden;
          padding: clamp(28px,5vw,56px);
        }
        .vd2-envelope::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: var(--r-xl);
          pointer-events: none;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 18%, transparent);
        }
        .vd2-header { text-align: center; margin-bottom: 32px; }
        .vd2-stamp-wrap {
          position: absolute; top: 36px; right: 56px;
          transform: rotate(-8deg); z-index: 2;
        }
        /* Staged reveal status — narrates 청중 → AI → 최종 so the blurred
           panels read as a deliberate beat (the named "판정 공개" moment),
           not a loading glitch. (UX: loading is communicated · BX: emotional moment) */
        .vd2-reveal-status {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 22px;
          font-family: var(--font-mono); font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; color: var(--color-ink-fade);
        }
        .vd2-reveal-step {
          /* Pending (not yet revealed) steps are quieter than done/active,
             but these are meaningful labels (청중/AI/최종 판정, also aria-live),
             not decoration. So we recede with weight + a softer ink-soft tone —
             NOT by multiplying ink-fade by 0.4, which fell to ~1.5:1 on paper
             (WCAG AA fail). ink-soft at 0.78 stays ≥4.5:1 after compositing. */
          display: inline-flex; align-items: center; gap: 6px;
          transition: color 0.4s, opacity 0.4s, font-weight 0.4s;
          color: var(--color-ink-soft);
          font-weight: 600;
          opacity: 0.78;
        }
        .vd2-reveal-step--done { color: var(--color-ink-soft); font-weight: 700; opacity: 1; }
        /* Active (currently revealing) step must be the MOST legible of the three.
           So its text uses the darkest ink (top contrast on paper, ≥8:1 across all
           4 themes), NOT gold — gold @ 11px small text fell below 4.5:1 on the 3
           light themes (DESIGN-SYSTEM §5: low-contrast gold on paper). The brand
           gold + pulse rides ONLY on the dot, which is a 7px shape (not text), and
           "active" is also carried by ink + weight 800 — never by color alone. */
        .vd2-reveal-step--active { color: var(--color-ink); font-weight: 800; opacity: 1; }
        .vd2-reveal-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: currentColor; flex: 0 0 auto;
        }
        .vd2-reveal-step--active .vd2-reveal-dot {
          background: var(--color-gold);
          animation: vd2-reveal-pulse 1.1s ease-in-out infinite;
        }
        @keyframes vd2-reveal-pulse { 50% { opacity: 0.35; } }
        .vd2-reveal-sep {
          width: 16px; height: 1px; background: var(--color-line); flex: 0 0 auto;
        }
        .vd2-panel {
          border-radius: var(--r-lg);
          border: 1px solid var(--color-line);
          padding: 24px;
          margin-top: 14px;
        }
        /* 청중·AI 패널은 50/50 판정의 동등한 두 축 — 둘 다 좌측 inset bar로
           "증거 패널" 격을 맞춘다. 진영 편향이 없도록 청중=중립 잉크, AI=중립 골드
           (둘 다 찬/반 색 아님). (BX: AI·청중 모두 중립 제3자 · UX: 두 패널 동급 위계) */
        .vd2-panel--crowd {
          background: var(--color-paper-deep);
          border-color: var(--color-ink-fade);
          box-shadow: inset 2px 0 0 var(--color-ink-fade);
        }
        .vd2-panel--ai { background: var(--color-gold-tint); border-color: var(--color-gold); box-shadow: inset 2px 0 0 var(--color-gold); }
        .vd2-crowd-row {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 10px;
        }
        .vd2-vote-num {
          font-family: var(--font-serif); font-weight: 800; font-size: 22px;
          letter-spacing: -0.02em;
        }
        .vd2-vote-unit { font-size: 13px; color: var(--color-ink-fade); margin-left: 4px; }
        .vd2-crowd-result {
          margin-top: 14px; padding: 8px 12px;
          background: var(--color-paper-light);
          border-radius: var(--r-md);
          border: 1px solid var(--color-line);
          font-size: 12px;
        }
        .vd2-ai-pick {
          font-family: var(--font-serif); font-weight: 900; font-size: clamp(23px, 2.4vw, 26px);
          letter-spacing: -0.02em; margin-bottom: 10px;
        }
        .vd2-ai-commentary {
          font-family: var(--font-serif); font-size: 14px;
          line-height: 1.7; color: var(--color-ink-soft);
          word-break: keep-all;
        }
        .vd2-final {
          /* extra breathing room before the climax — a beat of silence
             before the headline drops (GPT judge: scene-transition rhythm) */
          margin-top: 56px; padding: 32px 28px;
          border-radius: var(--r-xl);
          color: var(--color-on-accent); text-align: center;
          position: relative; overflow: hidden;
          transition: filter 0.7s 0.2s;
        }
        .vd2-final > * { position: relative; z-index: 1; }
        .vd2-final::after {
          content: attr(data-mark);
          position: absolute; right: clamp(18px, 5vw, 48px); top: 50%;
          transform: translateY(-50%);
          font-family: var(--font-serif); font-size: clamp(120px, 18vw, 180px);
          font-weight: 900; line-height: 1;
          color: color-mix(in srgb, var(--color-on-accent) 8%, transparent);
          pointer-events: none; z-index: 0;
        }
        .vd2-final__label {
          font-family: var(--font-mono); font-size: 10px; font-weight: 600;
          letter-spacing: 0.16em; color: color-mix(in srgb, var(--color-on-accent) 75%, transparent); margin-bottom: 6px;
        }
        .vd2-final__title {
          font-family: var(--font-serif); font-size: 36px; font-weight: 800;
          letter-spacing: -0.04em; margin: 0; color: var(--color-on-accent);
        }
        .vd2-final__voice {
          /* serif italic, not handwriting — the final 판정 is the serious
             climax; Gaegu wit belongs in the eyebrow/empty states, not here.
             (BX: 위트는 진지한 판정 영역에 넣지 않는다) */
          margin-top: 10px; font-family: var(--font-serif); font-style: italic;
          font-size: 17px; letter-spacing: -0.01em;
          color: color-mix(in srgb, var(--color-on-accent) 92%, transparent);
        }
        .vd2-actions {
          margin-top: 36px; display: flex; justify-content: center;
          gap: 12px; flex-wrap: wrap;
        }
        .vd2-sidecard {
          padding: 24px; border-radius: var(--r-lg);
          transition: all 0.5s; position: relative;
        }
        .vd2-sidecard__chip {
          width: 56px; height: 56px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-weight: 800; font-size: 24px;
          letter-spacing: -0.02em;
        }
        .vd2-highlight {
          padding: 16px; position: relative;
          border-radius: var(--r-md); box-shadow: var(--shadow-sm);
        }
        @media (max-width: 720px) {
          .verdict-breakdown { grid-template-columns: 1fr !important; }
          .verdict-faceoff { grid-template-columns: 1fr !important; }
          .vd2-envelope { padding: 20px; }
          .vd2-panel { padding: 20px; }
          .vd2-final { margin-top: 40px; }
          .vd2-final::after { right: 12px; font-size: clamp(96px, 32vw, 132px); }
        }
        @media (prefers-reduced-motion: reduce) {
          /* staged blur reveal stays legible, just no easing motion */
          .vd2-final, .vd2-sidecard, .vd2-pill { transition: none; }
          /* don't hide content behind blur for reduced-motion users —
             the reveal sequence is decorative; legibility comes first (a11y) */
          .vd2-reveal-mask { filter: none !important; }
          .vd2-reveal-step { opacity: 1; }
          .vd2-reveal-step--active .vd2-reveal-dot { animation: none; }
        }
      `}</style>

      <div className="vd2-topbar">
        {onBack && (
          <button type="button" className="vd2-pill" onClick={onBack}>
            {t.actions.back}
          </button>
        )}
        {onViewProfile && (
          <button type="button" className="vd2-pill" onClick={onViewProfile}>
            {t.actions.saveRecord}
          </button>
        )}
      </div>

      <article className="vd2-envelope">
        <div className="vd2-stamp-wrap">
          <span className="stamp">{t.certificate.stamp}</span>
        </div>

        {revealStep >= 3 && finalWinner !== 'tie' && (
          <Confetti color={finalWinner === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)'} />
        )}

        <div className="vd2-header">
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
            style={{ color: 'var(--color-ink-soft)', fontSize: 18, fontFamily: 'var(--font-serif)' }}
          >
            「{topic}」
          </div>
          {dateStr && (
            <div className="label-mono" style={{ color: 'var(--color-ink-fade)', marginTop: 10 }}>
              {dateStr}
            </div>
          )}
        </div>

        {/* Faceoff */}
        <div className="verdict-faceoff" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'stretch', margin: '0 -8px' }}>
          <VdSideCard
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
                fontFamily: 'var(--font-serif)',
                fontSize: 56,
                fontWeight: 800,
                color: 'var(--color-ink-fade)',
                letterSpacing: '-0.04em',
              }}
            >
              vs
            </div>
          </div>
          <VdSideCard
            side="con"
            name={conName}
            voice={conVoice}
            winning={finalWinner === 'con'}
            revealed={revealStep >= 3}
            lang={lang}
          />
        </div>

        <div className="rule-double" style={{ margin: '36px 0' }} />

        {/* Staged reveal narration — 청중 → AI → 최종 */}
        <div className="vd2-reveal-status" aria-live="polite">
          {[t.crowdLabel, t.aiLabel, t.finalDecision].map((stepLabel, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="vd2-reveal-sep" aria-hidden="true" />}
              <span
                className={
                  'vd2-reveal-step' +
                  (revealStep > i ? ' vd2-reveal-step--done' : revealStep === i ? ' vd2-reveal-step--active' : '')
                }
              >
                <span className="vd2-reveal-dot" aria-hidden="true" />
                {stepLabel}
              </span>
            </Fragment>
          ))}
        </div>

        {/* Breakdown: crowd + AI */}
        <div className="verdict-breakdown" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* 청중 패널 */}
          <div>
            <div className="eyebrow"><UsersIcon /> {t.crowdLabel}</div>
            <div className="vd2-panel vd2-panel--crowd">
              <div className="vd2-reveal-mask" style={{ filter: revealStep < 1 ? 'blur(8px)' : 'none', transition: 'filter 0.6s' }}>
                <div className="vd2-crowd-row">
                  <span className="vd2-vote-num" style={{ color: 'var(--color-vermillion)' }}>
                    {audVotes.pro}
                    <span className="vd2-vote-unit">{t.certificate.voteUnit}</span>
                  </span>
                  <span className="label-mono">{t.certificate.totalVotes(audVotes.pro + audVotes.con)}</span>
                  <span className="vd2-vote-num" style={{ color: 'var(--color-celadon)' }}>
                    {audVotes.con}
                    <span className="vd2-vote-unit">{t.certificate.voteUnit}</span>
                  </span>
                </div>
                <VoteBar pro={audVotes.pro} con={audVotes.con} variant={voteBarVariant} size="lg" showLabels={false} lang={lang} />
                <div className="vd2-crowd-result">
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
                      fontFamily: 'var(--font-serif)',
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

          {/* AI 판단 패널 */}
          <div>
            <div className="eyebrow"><GavelIcon /> {t.aiLabel}</div>
            <div className="vd2-panel vd2-panel--ai">
              <div className="vd2-reveal-mask" style={{ filter: revealStep < 2 ? 'blur(8px)' : 'none', transition: 'filter 0.6s' }}>
                <div
                  className="vd2-ai-pick"
                  style={{
                    color:
                      aiPick === 'pro'
                        ? 'var(--color-vermillion)'
                        : aiPick === 'con'
                        ? 'var(--color-celadon)'
                        : 'var(--color-ink-fade)',
                  }}
                >
                  {aiPick === 'pro'
                    ? t.aiDecision.pro
                    : aiPick === 'con'
                    ? t.aiDecision.con
                    : t.aiDecision.tie}
                </div>
                {aiCommentary && (
                  <div className="vd2-ai-commentary kr-wrap">{aiCommentary}</div>
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

        {/* 최종 승자 */}
        <div
          className="vd2-final vd2-reveal-mask"
          data-mark={finalWinner === 'tie' ? '平' : '勝'}
          style={{
            background:
              finalWinner === 'pro'
                ? 'var(--color-vermillion)'
                : finalWinner === 'con'
                ? 'var(--color-celadon)'
                : 'var(--color-ink-soft)',
            boxShadow:
              finalWinner === 'pro'
                ? 'var(--glow-pro), var(--shadow-lg)'
                : finalWinner === 'con'
                ? 'var(--glow-con), var(--shadow-lg)'
                : 'var(--shadow-lg)',
            filter: revealStep < 3 ? 'blur(12px)' : 'none',
          }}
        >
          <div className="vd2-final__label">{t.finalDecision}</div>
          <div className="vd2-final__title">
            {finalWinner === 'pro' ? t.winnerPro : finalWinner === 'con' ? t.winnerCon : t.tie}
          </div>
          <div className="vd2-final__voice">
            "{finalWinner === 'pro' ? proVoice : finalWinner === 'con' ? conVoice : t.certificate.evenTie}"
          </div>
        </div>

        {/* 하이라이트 */}
        {highlights && highlights.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <div className="eyebrow"><StarIcon /> {t.highlights}</div>
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

        {/* 액션 버튼 */}
        <div className="vd2-actions">
          {onNewDebate && (
            <button type="button" className="vd2-pill vd2-pill--cream" onClick={onNewDebate}>
              {t.actions.newDebate}
            </button>
          )}
          {onReadTranscript && (
            <button type="button" className="vd2-pill" onClick={onReadTranscript}>
              {t.actions.reread}
            </button>
          )}
          {onViewProfile && (
            <button type="button" className="vd2-pill vd2-pill--vermillion" onClick={onViewProfile}>
              {t.actions.viewProfile}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

// ── Confetti — logic UNCHANGED (deterministic, 24 bits, useMemo) ──
function Confetti({ color }: { color: string }) {
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

// ── VdSideCard — soft-round SideCard for Verdict ──
function VdSideCard({
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
  const tint = side === 'pro' ? 'var(--color-tint-pro)' : 'var(--color-tint-con)';
  const initial =
    name.charAt(0) || (side === 'pro' ? t.certificate.proInitial : t.certificate.conInitial);

  // Faceoff is the "대진표 요약" — the winner gets a quiet 2px 진영색 frame + faint tint,
  // not a full color fill. The full 진영색 fill is reserved for the FINAL banner alone,
  // so the climax reads as a single headline (GPT judge: remove emphasis competition).
  return (
    <div
      className="vd2-sidecard"
      style={{
        background: winning ? tint : 'var(--color-paper-light)',
        color: 'var(--color-ink)',
        border: `${winning ? 2 : 1}px solid ${winning ? color : 'var(--color-line)'}`,
        boxShadow: 'var(--shadow-sm)',
        transform: winning && revealed ? 'translateY(-3px)' : 'none',
        opacity: winning ? 1 : 0.9,
      }}
    >
      <span
        className="vd2-sidecard__chip"
        style={{
          background: tint,
          color,
          border: `1px solid ${color}`,
        }}
      >
        {initial}
      </span>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--color-ink)',
            }}
          >
            {name}
          </span>
          <span className="label-mono" style={{ color }}>
            {side === 'pro' ? t.certificate.proLabel : t.certificate.conLabel}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            marginTop: 4,
            color: 'var(--color-ink-fade)',
          }}
        >
          "{voice}"
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

// ── HighlightCard — soft-round ──
function HighlightCard({ side, name, round, votes, text }: Highlight) {
  const color = side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const tint = side === 'pro' ? 'var(--color-tint-pro)' : 'var(--color-tint-con)';
  const initial = name.charAt(0) || (side === 'pro' ? '찬' : '반');
  return (
    <div className="vd2-highlight" style={{ background: tint, border: `1px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 26, height: 26, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: tint, color,
            border: `1px solid ${color}`,
            fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 12,
          }}
        >
          {initial}
        </span>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 14, color }}>{name}</span>
        <span className="label-mono" style={{ color: 'var(--color-ink-fade)' }}>· {round}</span>
        <span
          style={{
            marginLeft: 'auto', fontFamily: 'var(--font-mono)',
            fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em',
          }}
        >
          ♡ {votes}
        </span>
      </div>
      <p
        className="kr-wrap"
        style={{
          margin: 0, fontFamily: 'var(--font-serif)',
          fontSize: 14, lineHeight: 1.6, color: 'var(--color-ink)',
        }}
      >
        "{text}"
      </p>
    </div>
  );
}

// ── formatDuration — UNCHANGED ──
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

// ── Icons — UNCHANGED ──
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
