import { Fragment, useState } from 'react';
import type { Side } from '../types';
import { VSMark } from './common';
import type { Lang } from '../i18n/landing';
import { onboardingStrings } from '../i18n/onboarding';

export interface OnboardingTopicPreset {
  cat: string;
  text: string;
  heat?: 'hot' | 'new';
}

export interface OnboardingResult {
  topic: string;
  side: Side;
  rounds: number;
  timeLimit?: string;
  allowVoting?: boolean;
  aiModerator?: boolean;
  allowObjection?: boolean;
}

interface OnboardingViewProps {
  presetTopics?: OnboardingTopicPreset[];
  onCancel?: () => void;
  onStart?: (result: OnboardingResult) => void;
  onPolishTopic?: (raw: string) => Promise<string>;
  lang?: Lang;
}

const DEFAULT_PRESETS: OnboardingTopicPreset[] = [
  { cat: '사회', text: '기본소득은 도입되어야 한다', heat: 'hot' },
  { cat: '사회', text: '주 4일 근무제는 한국에 맞는가', heat: 'hot' },
  { cat: '교육', text: '대학 입시 제도는 폐지되어야 한다' },
  { cat: '교육', text: '교복은 학생 표현의 자유를 침해한다' },
  { cat: '기술', text: 'AI가 만든 작품에도 저작권을 인정해야 한다', heat: 'hot' },
  { cat: '기술', text: '소셜미디어는 청소년에게 해로운가' },
  { cat: '문화', text: '연예인 사생활은 공인의 의무다', heat: 'new' },
  { cat: '문화', text: '리메이크는 원작을 능가할 수 있다' },
  { cat: '환경', text: '원자력은 친환경 에너지로 분류해야 한다' },
  { cat: '환경', text: '일회용품 사용은 법으로 금지되어야 한다' },
  { cat: '철학', text: '인간은 본래 선한 존재인가', heat: 'new' },
  { cat: '철학', text: '거짓말은 어떤 경우에도 정당화될 수 없다' },
];

const DEFAULT_PRESETS_EN: OnboardingTopicPreset[] = [
  { cat: 'Society', text: 'Universal basic income should be implemented', heat: 'hot' },
  { cat: 'Society', text: 'A four-day work week suits South Korea', heat: 'hot' },
  { cat: 'Education', text: 'The college entrance system should be abolished' },
  { cat: 'Education', text: 'School uniforms infringe on student self-expression' },
  { cat: 'Tech', text: 'AI-generated works should be eligible for copyright', heat: 'hot' },
  { cat: 'Tech', text: 'Social media is harmful to adolescents' },
  { cat: 'Culture', text: 'Celebrity private lives are a public-figure duty', heat: 'new' },
  { cat: 'Culture', text: 'A remake can surpass its original' },
  { cat: 'Environment', text: 'Nuclear should be classified as green energy' },
  { cat: 'Environment', text: 'Single-use items should be banned by law' },
  { cat: 'Philosophy', text: 'Humans are inherently good', heat: 'new' },
  { cat: 'Philosophy', text: 'Lying can never be justified' },
];

/** 3-step onboarding flow: 주제 → 입장 → 규칙.
 *  Lifted from debate-battle-v2 design — OnboardingView in screen-landing.jsx. */
export function OnboardingView({
  presetTopics,
  onCancel,
  onStart,
  onPolishTopic,
  lang = 'ko',
}: OnboardingViewProps) {
  const t = onboardingStrings[lang];
  const ALL = lang === 'en' ? 'All' : '전체';
  // Pick the language-matched default list when caller didn't supply presets,
  // so EN users see English topics in the library.
  const effectivePresets = presetTopics ?? (lang === 'en' ? DEFAULT_PRESETS_EN : DEFAULT_PRESETS);
  const TIME_LIMITS = lang === 'en' ? ['1m', '2m', '3m', t.step3.timeUnlimited] : ['1분', '2분', '3분', t.step3.timeUnlimited];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [topic, setTopic] = useState('');
  const [side, setSide] = useState<Side | null>(null);
  const [rounds, setRounds] = useState(3);
  const [topicFilter, setTopicFilter] = useState(ALL);
  const [timeLimit, setTimeLimit] = useState(TIME_LIMITS[1]);
  const [allowVoting, setAllowVoting] = useState(true);
  const [aiModerator, setAiModerator] = useState(true);
  const [allowObjection, setAllowObjection] = useState(false);
  const [polishing, setPolishing] = useState(false);

  const cats = [ALL, ...Array.from(new Set(effectivePresets.map((p) => p.cat)))];
  const filtered = topicFilter === ALL ? effectivePresets : effectivePresets.filter((p) => p.cat === topicFilter);

  const start = () => {
    if (!topic.trim() || !side) return;
    onStart?.({ topic: topic.trim(), side, rounds, timeLimit, allowVoting, aiModerator, allowObjection });
  };

  const handlePolish = async () => {
    if (!onPolishTopic || !topic.trim() || polishing) return;
    try {
      setPolishing(true);
      const polished = await onPolishTopic(topic.trim());
      if (polished) setTopic(polished);
    } finally {
      setPolishing(false);
    }
  };

  return (
    <div className="float-in onboarding-root" style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        {[
          { n: 1 as const, label: t.steps.topic },
          { n: 2 as const, label: t.steps.side },
          { n: 3 as const, label: t.steps.rules },
        ].map((s, i, arr) => (
          <Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: step === s.n ? 40 : 30,
                  height: step === s.n ? 40 : 30,
                  flexShrink: 0,
                  borderRadius: step === s.n ? 'var(--r-pill)' : 'var(--r-sm)',
                  background:
                    step === s.n
                      ? 'var(--color-ink)'
                      : step > s.n
                        ? 'var(--color-paper-deep)'
                        : 'var(--color-paper-light)',
                  color:
                    step === s.n
                      ? 'var(--color-paper-light)'
                      : step > s.n
                        ? 'var(--color-ink)'
                        : 'var(--color-ink-fade)',
                  border:
                    step === s.n
                      ? '1px solid var(--color-ink)'
                      : step > s.n
                        ? '1.5px solid var(--color-ink)'
                        : '1px solid var(--color-line)',
                  boxShadow: step === s.n ? 'var(--shadow-md)' : 'none',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: step === s.n ? 15 : 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step > s.n ? '✓' : s.n}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif-display)',
                  fontWeight: 800,
                  fontSize: 15,
                  color: step >= s.n ? 'var(--color-ink)' : 'var(--color-ink-fade)',
                }}
              >
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <span
                style={{
                  flex: 1,
                  borderTop: step > s.n ? '1.5px solid var(--color-ink)' : '1px solid var(--color-line)',
                }}
              />
            )}
          </Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="float-in">
          <div className="eyebrow eyebrow--vermillion">{t.step1.label}</div>
          <h1
            className="serif-display"
            style={{ fontSize: 32, fontWeight: 800, marginTop: 8, marginBottom: 8, letterSpacing: '-0.025em' }}
          >
            {t.step1.title}
          </h1>
          <p style={{ margin: '0 0 24px', color: 'var(--color-ink-soft)', maxWidth: 560 }}>
            {t.step1.sub}{' '}
            <span style={{ fontFamily: 'var(--font-hand)', color: 'var(--color-vermillion)' }}>
              {t.step1.subHand}
            </span>
          </p>

          <div
            style={{
              background: 'var(--color-paper-light)',
              border: '2px solid var(--color-ink)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div className="eyebrow">{t.step1.directInputLabel}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <input
                className="input-paper"
                placeholder={t.step1.placeholder}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              {onPolishTopic && (
                <button
                  type="button"
                  className="btn"
                  style={{ flexShrink: 0 }}
                  onClick={handlePolish}
                  disabled={polishing || !topic.trim()}
                >
                  {polishing ? t.step1.polishing : t.step1.polish}
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-paper)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div className="eyebrow">{t.step1.libraryLabel(effectivePresets.length)}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {cats.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTopicFilter(c)}
                    className="chip"
                    style={{
                      background: topicFilter === c ? 'var(--color-ink)' : 'var(--color-paper)',
                      color: topicFilter === c ? 'var(--color-paper-light)' : 'var(--color-ink)',
                      borderColor: 'var(--color-ink)',
                      cursor: 'pointer',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="onboarding-presets" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {filtered.map((p) => (
                <button
                  key={p.text}
                  type="button"
                  onClick={() => setTopic(p.text)}
                  className="kr-wrap"
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    background: topic === p.text ? 'var(--color-vermillion-tint)' : 'var(--color-paper-light)',
                    border:
                      topic === p.text
                        ? '1.5px solid var(--color-vermillion)'
                        : '1px solid var(--color-line)',
                    borderRadius: 'var(--r-md)',
                    boxShadow: topic === p.text ? 'var(--glow-pro), var(--shadow-sm)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <span
                    className="label-mono"
                    style={{ color: topic === p.text ? 'var(--color-vermillion)' : 'var(--color-ink-fade)', minWidth: 30 }}
                  >
                    {p.cat}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: topic === p.text ? 700 : 500,
                      fontFamily: 'var(--font-serif-display)',
                    }}
                  >
                    {p.text}
                  </span>
                  {p.heat === 'hot' && (
                    <span
                      style={{
                        color: 'var(--color-vermillion)',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      HOT
                    </span>
                  )}
                  {p.heat === 'new' && (
                    <span
                      style={{
                        color: 'var(--color-gold)',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      NEW
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="onboarding-nav" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              type="button"
              className="btn"
              style={{ background: 'transparent', border: 'none' }}
              onClick={onCancel}
            >
              {t.step1.cancel}
            </button>
            <button
              type="button"
              className="btn btn--pri"
              disabled={!topic.trim()}
              onClick={() => setStep(2)}
            >
              {t.step1.next}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="float-in">
          <div className="eyebrow eyebrow--vermillion">{t.step2.label}</div>
          <h1
            className="serif-display"
            style={{ fontSize: 32, fontWeight: 800, marginTop: 8, marginBottom: 8, letterSpacing: '-0.025em' }}
          >
            {t.step2.title}
          </h1>
          <div style={{ margin: '0 0 24px' }}>
            <span style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>{t.step2.topicLabel}</span>
            <span
              className="serif-display kr-wrap"
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                textDecoration: 'underline',
                textDecorationColor: 'var(--color-gold)',
                textDecorationThickness: 3,
                textUnderlineOffset: 6,
              }}
            >
              「{topic}」
            </span>
          </div>

          <div className="onboarding-sides" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 0, alignItems: 'center' }}>
            <button
              type="button"
              aria-pressed={side === 'pro'}
              onClick={() => setSide('pro')}
              style={{
                position: 'relative',
                padding: 28,
                minHeight: 44,
                borderRadius: 4,
                background:
                  side === 'pro'
                    ? 'color-mix(in srgb, var(--color-vermillion) 9%, var(--color-paper-light))'
                    : 'var(--color-paper-light)',
                color: 'var(--color-vermillion)',
                border: side === 'pro' ? '2px solid var(--color-ink)' : '1px solid var(--color-line)',
                boxShadow: side === 'pro' ? '6px 6px 0 0 var(--color-vermillion)' : 'var(--shadow-sm)',
                transform: side === 'pro' ? 'translate(-2px, -2px)' : 'none',
                transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                textAlign: 'left',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <span
                aria-hidden="true"
                className="serif-display"
                style={{
                  position: 'absolute',
                  right: -8,
                  bottom: -24,
                  fontSize: 120,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-vermillion)',
                  opacity: side === 'pro' ? 0.12 : 0.08,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                正
              </span>
              <div className="label-mono" style={{ position: 'relative', color: 'inherit', opacity: side === 'pro' ? 0.95 : 1 }}>
                {t.step2.pro.label}
              </div>
              <div
                className="serif-display"
                style={{ position: 'relative', fontSize: 48, fontWeight: 800, lineHeight: 1, marginTop: 8, letterSpacing: '-0.04em' }}
              >
                {t.step2.pro.char}
              </div>
              <div
                className="kr-wrap"
                style={{ position: 'relative', marginTop: 14, fontSize: 13, lineHeight: 1.55, opacity: side === 'pro' ? 0.95 : 0.8 }}
              >
                {t.step2.pro.desc}
              </div>
            </button>

            <div className="onboarding-vs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VSMark variant="badge" size={56} />
            </div>

            <button
              type="button"
              aria-pressed={side === 'con'}
              onClick={() => setSide('con')}
              style={{
                position: 'relative',
                padding: 28,
                minHeight: 44,
                borderRadius: 4,
                background:
                  side === 'con'
                    ? 'color-mix(in srgb, var(--color-celadon) 9%, var(--color-paper-light))'
                    : 'var(--color-paper-light)',
                color: 'var(--color-celadon)',
                border: side === 'con' ? '2px solid var(--color-ink)' : '1px solid var(--color-line)',
                boxShadow: side === 'con' ? '6px 6px 0 0 var(--color-celadon)' : 'var(--shadow-sm)',
                transform: side === 'con' ? 'translate(-2px, -2px)' : 'none',
                transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                textAlign: 'right',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <span
                aria-hidden="true"
                className="serif-display"
                style={{
                  position: 'absolute',
                  left: -8,
                  bottom: -24,
                  fontSize: 120,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-celadon)',
                  opacity: side === 'con' ? 0.12 : 0.08,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                反
              </span>
              <div className="label-mono" style={{ position: 'relative', color: 'inherit', opacity: side === 'con' ? 0.95 : 1 }}>
                {t.step2.con.label}
              </div>
              <div
                className="serif-display"
                style={{ position: 'relative', fontSize: 48, fontWeight: 800, lineHeight: 1, marginTop: 8, letterSpacing: '-0.04em' }}
              >
                {t.step2.con.char}
              </div>
              <div
                className="kr-wrap"
                style={{
                  position: 'relative',
                  marginTop: 14,
                  fontSize: 13,
                  lineHeight: 1.55,
                  opacity: side === 'con' ? 0.95 : 0.8,
                  textAlign: 'right',
                }}
              >
                {t.step2.con.desc}
              </div>
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 14,
              background: 'var(--color-paper-deep)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 18 }}>⚠</span>
            <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
              <strong>{t.step2.anonymityWarn}</strong>{t.step2.anonymityRest}
            </span>
          </div>

          <div className="onboarding-nav" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              type="button"
              className="btn"
              style={{ background: 'transparent', border: 'none' }}
              onClick={() => setStep(1)}
            >
              {t.step2.back}
            </button>
            <button
              type="button"
              className="btn btn--pri"
              disabled={!side}
              onClick={() => setStep(3)}
            >
              {t.step2.next}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="float-in">
          <div className="eyebrow eyebrow--vermillion">{t.step3.label}</div>
          <h1
            className="serif-display"
            style={{ fontSize: 32, fontWeight: 800, marginTop: 8, marginBottom: 8, letterSpacing: '-0.025em' }}
          >
            {t.step3.title}
          </h1>
          <p style={{ margin: '0 0 24px', color: 'var(--color-ink-soft)' }}>
            {t.step3.sub}
          </p>

          <div
            style={{
              background: 'var(--color-paper-light)',
              border: '2px solid var(--color-ink)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: 24,
            }}
          >
            <div className="eyebrow">{t.step3.roundsLabel}</div>
            <div className="onboarding-rounds" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={rounds === n}
                  onClick={() => setRounds(n)}
                  style={{
                    padding: '16px 12px',
                    minHeight: 44,
                    borderRadius: 'var(--r-md)',
                    background:
                      rounds === n
                        ? 'color-mix(in srgb, var(--color-vermillion) 10%, var(--color-paper-light))'
                        : 'var(--color-paper-light)',
                    color: 'var(--color-ink)',
                    border: rounds === n ? '1.5px solid var(--color-vermillion)' : '1px solid var(--color-line)',
                    cursor: 'pointer',
                    boxShadow: rounds === n ? 'var(--glow-pro), var(--shadow-sm)' : 'var(--shadow-sm)',
                    transition: 'all 0.12s',
                    textAlign: 'center',
                  }}
                >
                  <div
                    className="serif-display"
                    style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}
                  >
                    {n}
                  </div>
                  <div
                    className="label-mono"
                    style={{ marginTop: 4, color: rounds === n ? 'var(--color-vermillion)' : 'var(--color-ink-fade)' }}
                  >
                    {t.step3.roundsUnit}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ margin: '30px 0 0', borderTop: '1px solid var(--color-line)' }} />

            <div className="eyebrow" style={{ marginTop: 24 }}>{t.step3.timeLimitLabel}</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIME_LIMITS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="chip"
                  onClick={() => setTimeLimit(t)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    background: timeLimit === t ? 'var(--color-ink)' : 'var(--color-paper)',
                    color: timeLimit === t ? 'var(--color-paper-light)' : 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ margin: '30px 0 0', borderTop: '1px solid var(--color-line)' }} />

            <div className="eyebrow" style={{ marginTop: 24 }}>{t.step3.optionsLabel}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CheckRow
                label={t.step3.opt.voting.label}
                sub={t.step3.opt.voting.sub}
                on={allowVoting}
                onChange={setAllowVoting}
              />
              <CheckRow
                label={t.step3.opt.aiMod.label}
                sub={t.step3.opt.aiMod.sub}
                on={aiModerator}
                onChange={setAiModerator}
              />
              <CheckRow
                label={t.step3.opt.objection.label}
                sub={t.step3.opt.objection.sub}
                on={allowObjection}
                onChange={setAllowObjection}
              />
            </div>
          </div>

          <div className="onboarding-nav" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              type="button"
              className="btn"
              style={{ background: 'transparent', border: 'none' }}
              onClick={() => setStep(2)}
            >
              {t.step3.back}
            </button>
            <button
              type="button"
              className="btn btn--pri onboarding-submit"
              style={{ padding: '14px 26px', fontSize: 16 }}
              onClick={start}
            >
              {t.step3.submit}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 720px) {
          .onboarding-root h1.serif-display { font-size: 28px; }
          .onboarding-presets { grid-template-columns: 1fr !important; }
          .onboarding-sides { grid-template-columns: 1fr !important; gap: 12px !important; }
          .onboarding-rounds { grid-template-columns: repeat(2, 1fr) !important; }
          .onboarding-vs {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding-block: 0;
            margin-block: 4px;
            border-top: none;
          }
          .onboarding-vs::before,
          .onboarding-vs::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--color-line);
          }
          .onboarding-nav {
            position: sticky;
            bottom: 0;
            z-index: 5;
            background: var(--color-paper);
            border-top: 1px solid var(--color-line);
            margin-left: -24px;
            margin-right: -24px;
            padding: 12px 24px calc(12px + env(safe-area-inset-bottom, 0px));
            margin-top: 20px !important;
            gap: 12px;
          }
          .onboarding-submit { flex: 1 1 auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .onboarding-root.float-in,
          .onboarding-root .float-in { animation: none; }
          .onboarding-sides button,
          .onboarding-rounds button { transition: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}

function CheckRow({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        minHeight: 44,
        borderRadius: 'var(--r-md)',
        background: on ? 'var(--color-paper-deep)' : 'var(--color-paper-light)',
        border: on ? '1.5px solid var(--color-line)' : '1px solid var(--color-line)',
        boxShadow: on ? 'var(--shadow-sm)' : 'none',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 'var(--r-sm)',
          background: on ? 'var(--color-ink)' : 'transparent',
          border: `1.5px solid ${on ? 'var(--color-ink)' : 'var(--color-line)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-paper-light)',
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {on && '✓'}
      </span>
      <span style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-fade)', marginTop: 2 }}>{sub}</div>
      </span>
    </button>
  );
}
