import { useEffect, useState } from 'react';
import '../landing.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useInView } from '../hooks/useInView';
import { useLivePresence } from '../hooks/useLivePresence';
import { useWeeklyChampions } from '../hooks/useWeeklyChampions';
import type { Lang } from '../i18n/landing';
import { landingStrings } from '../i18n/landing';
import { CharacterAvatar } from './CharacterAvatar';
import { Reveal } from './Reveal';
import { ScrollSpyNav } from './ScrollSpyNav';
import { Ornament } from './common';

/* Demo card simulated state — drifts every few seconds to feel live without
 * actually running anything. Used only by the DEMO PREVIEW room card. */
function useDemoSimulation() {
  const [state, setState] = useState({ pro: 58, spectators: 27, votes: 114, timeLeftSec: 168 });
  useEffect(() => {
    const tick = setInterval(() => {
      setState((s) => {
        const proNext = Math.max(54, Math.min(63, s.pro + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2))));
        const specNext = Math.max(24, s.spectators + (Math.random() > 0.5 ? 1 : -1));
        const voteNext = s.votes + Math.floor(Math.random() * 4);
        const timeNext = s.timeLeftSec > 30 ? s.timeLeftSec - (1 + Math.floor(Math.random() * 3)) : 168;
        return { pro: proNext, spectators: specNext, votes: voteNext, timeLeftSec: timeNext };
      });
    }, 3800);
    return () => clearInterval(tick);
  }, []);
  return state;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* Ticker headlines for the v2 newspaper-style hero card.
 * Mirrors `screen-landing.jsx` from the debate-battle-v2 design package:
 * 4 rotating sample matchups, refreshed every 3.2s. */
function useTickerHeadlines(lang: Lang) {
  const headlines = lang === 'en'
    ? [
        { topic: 'Should universal basic income be implemented', pro: 'JINNY', con: 'Jay', score: '52 : 48', winner: 'pro' as const },
        { topic: 'Should the college entrance exam be abolished',  pro: 'Seoyeon', con: 'Junyoung', score: '47 : 53', winner: 'con' as const },
        { topic: 'Copyright for AI-written work',                   pro: 'Minho', con: 'Haneul', score: '61 : 39', winner: 'pro' as const },
        { topic: 'Adopt a four-day work week',                      pro: 'Doyun', con: 'Yeonu', score: '55 : 45', winner: 'pro' as const },
      ]
    : [
        { topic: '기본소득은 도입되어야 하는가',  pro: 'JINNY', con: '재현',  score: '52 : 48', winner: 'pro' as const },
        { topic: '대학 입시 폐지 — 가능한가',     pro: '서연',  con: '준영',  score: '47 : 53', winner: 'con' as const },
        { topic: 'AI가 작성한 글에도 저작권을',   pro: '민호',  con: '하늘',  score: '61 : 39', winner: 'pro' as const },
        { topic: '주 4일 근무제 도입',           pro: '도윤',  con: '연우',  score: '55 : 45', winner: 'pro' as const },
      ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % headlines.length), 3200);
    return () => clearInterval(id);
  }, [headlines.length]);
  return { current: headlines[idx], idx, total: headlines.length };
}

export function LandingView({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const t = landingStrings[lang];
  useDocumentMeta(t.meta.title, t.meta.description);
  const { liveCount, openCount, ready } = useLivePresence();
  const totalActive = liveCount + openCount;
  const { champions: realChampions } = useWeeklyChampions(t.champions.items.length);
  const demoSim = useDemoSimulation();
  const demoCon = 100 - demoSim.pro;
  const ticker = useTickerHeadlines(lang);

  const spyItems = [
    { id: 'top', label: t.nav.top },
    { id: 'how', label: t.nav.how },
    { id: 'champions', label: t.champions.eyebrow.split('·')[0].trim() },
    { id: 'features', label: t.nav.features },
    { id: 'demo', label: t.nav.demo },
    { id: 'topics', label: t.nav.topics },
    { id: 'faq', label: t.nav.faq },
    { id: 'cta', label: t.nav.cta },
  ];

  return (
    <div className="landing-page float-in">
      <ScrollSpyNav items={spyItems} />

      {/* ============================================================
          HERO — v2 newspaper layout (per screen-landing.jsx)
          Left column: eyebrow + display-1 serif headline + sub + CTAs + stats
          Right column: rotating headline ticker card with "토론배틀 인가" postmark
          ============================================================ */}
      <section className="wrap landing-v2-hero" id="top" style={{ paddingTop: 64, paddingBottom: 56, position: 'relative' }}>
        <div className="landing-v2-hero__grid">
          <div>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">🔥</span> {t.wordmark.issueEyebrow}
            </div>
            <h1 className="display-1 serif-display" style={{ marginTop: 16, marginBottom: 0 }}>
              {t.hero.titleA}<br />
              <span className="brush-under">{t.hero.titleB}</span>
            </h1>
            <p className="kr-wrap" style={{
              marginTop: 20,
              marginBottom: 0,
              fontSize: 18,
              lineHeight: 1.55,
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              maxWidth: 540,
              letterSpacing: '-0.015em',
            }}>
              <span className="hand" style={{ color: 'var(--vermillion)', fontSize: 22, marginRight: 6 }}>
                {t.wordmark.pillars[1].bold}
              </span>
              {t.hero.sub.rest}
            </p>
            {/* Live presence — only shows when there's actual activity.
                (CTAs moved to the right column below the ticker card — design kit / chat1.) */}
            {ready && totalActive > 0 && (
              <div className="landing-v2-hero__live" role="status" aria-live="polite">
                <span className="status status--live"><span className="status-dot" />LIVE</span>
                <span>
                  {t.presence.livePrefix}<b>{liveCount}</b>{t.presence.liveSuffix}
                  {openCount > 0 && (
                    <>
                      <span style={{ margin: '0 8px', color: 'var(--ink-fade)' }}>·</span>
                      {t.presence.openPrefix}<b>{openCount}</b>{t.presence.openSuffix}
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Stats row — uses t.stats from i18n */}
            <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {t.stats.map((s, i) => (
                <HeroStat key={i} n={`${s.num}${s.unit}`} label={s.label} />
              ))}
            </div>
          </div>

          {/* Right column: ticker card + CTAs stacked below it (design kit / chat1) */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div className="card card--shadow-lg landing-v2-hero__ticker" style={{ padding: 22, transform: 'rotate(1deg)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="status status--live"><span className="status-dot" />LIVE</span>
                <span className="label-mono">{lang === 'en' ? 'TODAY\'S HEADLINE' : '오늘의 헤드라인'}</span>
              </div>
              <div style={{ minHeight: 110 }} key={ticker.idx} className="slide-in-l">
                <h3 className="serif-display kr-wrap" style={{ fontSize: 22, lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em' }}>
                  「{ticker.current.topic}」
                </h3>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CharacterAvatar side="pro" size={32} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em' }}>
                    {ticker.current.score}
                  </span>
                  <CharacterAvatar side="con" size={32} />
                  <span style={{ marginLeft: 'auto' }}>
                    <span className={`stamp${ticker.current.winner === 'con' ? ' stamp--ink' : ''}`}>
                      {lang === 'en' ? 'VERDICT' : '판정'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="divider-dotted" style={{ margin: '14px 0 10px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--ink-fade)' }}>
                <span>NO.{String(ticker.idx + 73).padStart(3, '0')}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: ticker.total }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        background: i === ticker.idx ? 'var(--vermillion)' : 'var(--ink-fade)',
                        opacity: i === ticker.idx ? 1 : 0.3,
                        borderRadius: '50%',
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
            {/* Postmark */}
            <div style={{ position: 'absolute', top: -16, right: -16, transform: 'rotate(8deg)', zIndex: 2 }}>
              <span className="stamp">{lang === 'en' ? 'DEBATE BATTLE OFFICIAL' : '토론배틀 인가'}</span>
            </div>
            {/* CTAs stacked below the ticker card, pushed to the bottom so the two
                hero columns are height-matched (design kit / chat1). */}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="btn btn--pri btn--xl btn--shadow" onClick={onStart} style={{ width: '100%' }}>
                <span aria-hidden="true">🔥</span> {t.hero.ctaPrimary}
              </button>
              <button type="button" className="btn btn--xl btn--ghost" onClick={onStart} style={{ width: '100%' }}>
                <span aria-hidden="true">📖</span> {t.hero.ctaSecondary}
              </button>
            </div>
          </div>
        </div>

        {/* Decorative ornament — center asterisk */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48, opacity: 0.5 }} aria-hidden="true">
          <Ornament kind="asterisk" size={32} color="var(--vermillion)" />
        </div>
      </section>

      <div className="rule-double" style={{ maxWidth: 1180, margin: '0 auto' }} />

      {/* ============================================================
          HOW IT WORKS — v2 step cards (5 phases rendered as horizontal grid)
          ============================================================ */}
      <section className="wrap" id="how" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <Reveal>
          <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden="true">📜</span> {t.how.eyebrow}
          </div>
          <h2 className="display-2 serif-display" style={{ marginTop: 12, marginBottom: 36 }}>
            {lang === 'en' ? (
              <>The order is fixed.<br /><span className="text-dim">Only your words are free.</span></>
            ) : (
              <>순서는 정해져 있다.<br /><span className="text-dim">발언만 자유롭다.</span></>
            )}
          </h2>
        </Reveal>
        <div className="landing-v2-steps">
          {t.how.phases.map((p, i) => (
            <StepCard
              key={i}
              n={String(i + 1).padStart(2, '0')}
              title={p.name}
              body={p.desc}
              accent={(['vermillion', 'vermillion', 'celadon', 'gold', 'ink'][i] ?? 'vermillion') as 'vermillion' | 'celadon' | 'gold' | 'ink'}
              eyebrow={lang === 'en' ? `STEP ${i + 1}` : `${i + 1}단계`}
              who={p.who}
            />
          ))}
        </div>
      </section>

      {/* ============================================================
          CHAMPIONS — leaderboard preview on paper-deep panel (v2)
          ============================================================ */}
      <section id="champions" style={{ background: 'var(--paper-deep)', padding: '64px 0', position: 'relative' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <Reveal>
              <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true">🏆</span> {t.champions.eyebrow}
              </div>
              <h2 className="display-2 serif-display" style={{ marginTop: 12, marginBottom: 0 }}>
                {t.champions.titleA} <span className="hand">{t.champions.titleAccent}</span>
                <br />
                {t.champions.titleB}
              </h2>
              <p className="kr-wrap" style={{ marginTop: 16, color: 'var(--ink-soft)', maxWidth: 600 }}>
                {t.champions.lead}
              </p>
            </Reveal>
          </div>
          <div className="landing-v2-champions">
            {(realChampions
              ? realChampions.map((rc, i) => ({
                  side: (i % 2 === 0 ? 'pro' : 'con') as 'pro' | 'con',
                  name: rc.name,
                  wins: rc.wins,
                  losses: rc.losses,
                  cat: t.champions.items[i]?.cat ?? '',
                  motto: t.champions.items[i]?.motto ?? '',
                  rate: rc.wins + rc.losses > 0 ? Math.round((rc.wins / (rc.wins + rc.losses)) * 100) : 0,
                }))
              : t.champions.items.map((c) => ({
                  side: c.side as 'pro' | 'con',
                  name: c.name,
                  wins: c.wins,
                  losses: c.losses,
                  cat: c.cat,
                  motto: c.motto,
                  rate: c.wins + c.losses > 0 ? Math.round((c.wins / (c.wins + c.losses)) * 100) : 0,
                }))
            ).map((c, i) => (
              <ChampionCard key={i} rank={i + 1} {...c} winLabel={t.champions.winLabel} lossLabel={t.champions.lossLabel} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES — preserved from previous landing, restyled with v2 cards
          ============================================================ */}
      <section id="features" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <div className="wrap">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">✨</span> {t.features.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ marginTop: 12, marginBottom: 8 }}>
              {t.features.titleA}<br /><span className="hand">{t.features.titleB}</span>
            </h2>
            <p className="kr-wrap" style={{ marginTop: 16, color: 'var(--ink-soft)', maxWidth: 600 }}>
              {t.features.lead}
            </p>
          </Reveal>
          <div className="features-grid" style={{ marginTop: 32 }}>
            {t.features.items.map((f, i) => (
              <Feat
                key={i}
                index={i}
                hero={i === 0}
                tag={'tag' in f ? f.tag : undefined}
                tagNew={i === 0}
                icon={FEATURE_ICONS[i]}
                iconCls={FEATURE_ICON_CLS[i]}
                title={f.title}
                desc={f.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PARTNERS — preserved
          ============================================================ */}
      <section className="partners">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">🏛️</span> {t.partners.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ marginTop: 12 }}>
              {t.partners.titleA}<br /><span className="hand">{t.partners.titleB}</span>
            </h2>
          </Reveal>
          <div className="partners-grid">
            {t.partners.items.map((name, i) => (
              <Reveal key={i} className="partner-card" delay={(i % 3) * 60}>
                <span className="partner-card__name">{name}</span>
              </Reveal>
            ))}
          </div>
          <p className="partners-note">{t.partners.note}</p>
        </div>
      </section>

      {/* ============================================================
          PULL QUOTE — v2 editorial pause
          ============================================================ */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 56, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }} aria-hidden="true">
          <Ornament kind="dot3" size={20} color="var(--ink-fade)" />
        </div>
        <blockquote className="serif-display kr-wrap" style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 800,
          lineHeight: 1.3,
          letterSpacing: '-0.025em',
          margin: '20px auto 12px',
          maxWidth: 820,
        }}>
          {(() => {
            const q = t.wordmark.quote;
            // brush-under the middle clause when KO format matches "반박당할 때" pattern
            if (lang === 'ko' && q.includes('반박당할 때')) {
              const [a, rest] = q.split('반박당할 때');
              return (
                <>
                  {a}<span className="brush-under">반박당할 때</span>{rest}
                </>
              );
            }
            return q;
          })()}
        </blockquote>
        <div className="label-mono" style={{ color: 'var(--ink-fade)' }}>{t.wordmark.quoteSource}</div>
      </section>

      {/* ============================================================
          TESTIMONIALS — preserved
          ============================================================ */}
      <section className="testimonials">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">💬</span> {t.testimonials.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ marginTop: 12 }}>
              {t.testimonials.titleA}<br /><span className="hand">{t.testimonials.titleB}</span>
            </h2>
          </Reveal>
          <div className="testimonials-grid">
            {t.testimonials.items.map((tm, i) => (
              <Reveal
                key={i}
                className={`testimonial testimonial--${tm.tag.toLowerCase()}`}
                delay={i * 90}
              >
                <span className="testimonial__mark" aria-hidden="true">"</span>
                <p className="testimonial__quote">{tm.quote}</p>
                <div className="testimonial__who">
                  <span className={`testimonial__tag testimonial__tag--${tm.tag.toLowerCase()}`}>
                    {tm.tag}
                  </span>
                  <span>{tm.who}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          DEMO PREVIEW — preserved
          ============================================================ */}
      <section className="demo" id="demo">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">▶️</span> {t.demo.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ marginTop: 12 }}>
              {t.demo.titleA}<br /><span className="hand">{t.demo.titleB}</span>
            </h2>
            <p className="kr-wrap" style={{ marginTop: 16, color: 'var(--ink-soft)', maxWidth: 600 }}>{t.demo.lead}</p>
          </Reveal>
          <div className="demo-grid">
            <div>
              <div className="ribbon">{t.demo.ribbonRoom}</div>
              <div className="roomcard">
                <div className="roomcard__bar">
                  <span className="pill-live"><span className="dot" />LIVE</span>
                  <span>{t.demo.roundLabel}</span>
                  <span style={{ marginLeft: 'auto' }}>#a7f2c1</span>
                </div>
                <h3 className="roomcard__topic">{t.stage.topicQuestion}</h3>
                <div className="roomcard__row">
                  <div className="roomcard__side roomcard__side--pro">
                    <div className="roomcard__av"><CharacterAvatar side="pro" /></div>
                    <div>
                      <div className="roomcard__role">PRO · {t.stage.proLabel}</div>
                      <div className="roomcard__name">{t.stage.proName}</div>
                    </div>
                  </div>
                  <div className="roomcard__vs">VS</div>
                  <div className="roomcard__side roomcard__side--con">
                    <div className="roomcard__av"><CharacterAvatar side="con" /></div>
                    <div>
                      <div className="roomcard__role">CON · {t.stage.conLabel}</div>
                      <div className="roomcard__name">{t.stage.conName}</div>
                    </div>
                  </div>
                </div>
                <div className="vote-bar vote-bar--live">
                  <div className="vote-bar__pro" style={{ flex: demoSim.pro }}>{demoSim.pro}%</div>
                  <div className="vote-bar__con" style={{ flex: demoCon }}>{demoCon}%</div>
                </div>
                <div className="vote-meta">
                  <span>{t.demo.spectators}<b>{demoSim.spectators}{t.demo.spectatorsUnit}</b></span>
                  <span>{t.demo.votes}<b>{demoSim.votes}{t.demo.votesUnit}</b></span>
                  <span>{t.demo.timeLeft}<b>{formatTime(demoSim.timeLeftSec)}</b></span>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="ribbon">{t.demo.ribbonVerdict}</div>
                <div className="card card--shadow" style={{ padding: 20 }}>
                  <div className="label-mono" style={{ color: 'var(--ink-fade)', marginBottom: 8 }}>{t.demo.verdictHeader}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 17, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
                    {t.demo.verdictText.prefix}
                    <span className="brush-under">{t.demo.verdictText.accent}</span>
                    {t.demo.verdictText.suffix}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ background: 'var(--vermillion)', color: '#fff', padding: '4px 14px', fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 22, transform: 'rotate(-3deg)', display: 'inline-block' }}>
                      {t.demo.verdictBadge}
                    </span>
                    <span className="label-mono" style={{ color: 'var(--ink-fade)' }}>{t.demo.verdictNote}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="ribbon">{t.demo.ribbonChat}</div>
              <div className="chat">
                <div className="chat__head">
                  <span>● ROOM · #a7f2c1</span>
                  <span className="phase-pill">PRO_REBUT</span>
                </div>
                <div className="chat__body">
                  <div className="msg msg--mod">
                    <div className="msg__meta">{t.demo.chatMod}</div>
                    <div className="msg__bubble">{t.demo.chatModText}</div>
                  </div>
                  <div className="msg msg--pro">
                    <div className="msg__meta">
                      <span className="pill">PRO</span>
                      <span>{t.stage.proName}</span>
                      <span>· 14:02</span>
                    </div>
                    <div className="msg__bubble">{t.demo.chatPro1}</div>
                  </div>
                  <div className="msg msg--con">
                    <div className="msg__meta">
                      <span>{t.stage.conName}</span>
                      <span className="pill">CON</span>
                      <span>· 14:03</span>
                    </div>
                    <div className="msg__bubble">{t.demo.chatCon}</div>
                  </div>
                  <div className="msg msg--pro">
                    <div className="msg__meta">
                      <span className="pill">PRO</span>
                      <span>{t.stage.proName}</span>
                      <span>· 14:04</span>
                    </div>
                    <div className="msg__bubble">{t.demo.chatPro2}</div>
                  </div>
                  <div className="typing">
                    <span style={{ background: 'var(--celadon-tint)', padding: '4px 10px', border: '1.5px solid var(--celadon)', color: 'var(--celadon)' }}>
                      {t.demo.typing}
                      <span className="dots"><span>.</span><span>.</span><span>.</span></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          TOPICS — preserved
          ============================================================ */}
      <section id="topics" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <div className="wrap">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">🗂️</span> {t.topics.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ marginTop: 12 }}>
              {t.topics.titleA}<br /><span className="hand">{t.topics.titleB}</span>
            </h2>
            <p className="kr-wrap" style={{ marginTop: 16, color: 'var(--ink-soft)', maxWidth: 600 }}>{t.topics.lead}</p>
          </Reveal>
          <div className="topics-grid">
            {t.topics.items.map((topic, i) => (
              <Topic
                key={i}
                index={i}
                cat={topic.cat}
                q={topic.q}
                pro={topic.pro}
                con={topic.con}
                emoji={topic.emoji}
                hot={'hot' in topic ? topic.hot : false}
                hotLabel="HOT"
                onClick={onStart}
              />
            ))}
          </div>
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button type="button" onClick={onStart} className="btn btn--lg btn--shadow">
              {t.topics.cta}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ — preserved
          ============================================================ */}
      <section
        id="faq"
        style={{ background: 'var(--paper-light)', borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)', padding: '64px 0' }}
      >
        <div className="wrap-narrow">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">❓</span> {t.faq.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ marginTop: 12 }}>
              {t.faq.titleA}<br /><span className="hand">{t.faq.titleB}</span>
            </h2>
          </Reveal>
          <div className="faq-list">
            {t.faq.items.map((item, i) => (
              <FAQ key={i} q={item.q} open={'open' in item ? item.open : undefined}>
                {item.a}
              </FAQ>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA STRIP — v2 dark ink card (per screen-landing.jsx)
          ============================================================ */}
      <section className="wrap" id="cta" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div
          className="card card--ink card--shadow-lg"
          style={{
            padding: 'clamp(28px, 5vw, 48px)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 32,
          }}
        >
          <div>
            <div className="eyebrow eyebrow--vermillion" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true">🔥</span> {t.cta.eyebrow}
            </div>
            <h2 className="display-2 serif-display" style={{ color: 'var(--paper-light)', marginTop: 12, marginBottom: 0, letterSpacing: '-0.03em' }}>
              {t.cta.titleA}<br />
              <span style={{ color: 'var(--paper-darker)' }}>{t.cta.titleB}</span>
            </h2>
            <p style={{ marginTop: 14, color: 'var(--ink-ghost)', maxWidth: 560 }}>{t.cta.lead}</p>
          </div>
          <div className="landing-v2-cta__btns">
            <button type="button" className="btn btn--pri btn--xl btn--shadow" onClick={onStart}>
              {t.cta.primary}
            </button>
            <button type="button" className="btn btn--xl btn--shadow" onClick={onStart} style={{ background: 'var(--paper-light)' }}>
              {t.cta.secondary}
            </button>
          </div>
        </div>
      </section>

      {/* Local responsive tweaks for v2 layout primitives in this view */}
      <style>{`
        .landing-v2-hero__grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 56px;
          align-items: stretch;
        }
        .landing-v2-hero__live {
          margin-top: 22px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.08em;
          color: var(--ink-fade);
        }
        .landing-v2-steps {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 18px;
        }
        .landing-v2-champions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .landing-v2-cta__btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (max-width: 1024px) {
          .landing-v2-steps { grid-template-columns: repeat(2, 1fr); }
          .landing-v2-champions { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 880px) {
          .landing-v2-hero__grid { grid-template-columns: 1fr; }
          .landing-v2-hero__grid > *:last-child { max-width: 380px; margin: 0 auto; }
        }
        @media (max-width: 720px) {
          .landing-v2-steps, .landing-v2-champions { grid-template-columns: 1fr; }
          .card--ink {
            grid-template-columns: 1fr !important;
          }
          .landing-v2-cta__btns { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

/* ============ INTERNAL COMPONENTS ============ */

function HeroStat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="serif-display" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>{n}</div>
      <div className="label-mono" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StepCard({
  n,
  title,
  body,
  accent = 'vermillion',
  eyebrow,
  who,
}: {
  n: string;
  title: string;
  body: string;
  accent?: 'vermillion' | 'celadon' | 'gold' | 'ink';
  eyebrow: string;
  who: string;
}) {
  const c =
    accent === 'vermillion' ? 'var(--vermillion)'
    : accent === 'celadon' ? 'var(--celadon)'
    : accent === 'gold' ? 'var(--gold)'
    : 'var(--ink)';
  return (
    <div className="card" style={{ padding: 24, position: 'relative', borderTop: `4px solid ${c}` }}>
      <div className="serif-display" style={{
        fontSize: 92,
        lineHeight: 0.9,
        color: c,
        opacity: 0.16,
        position: 'absolute',
        top: 4,
        right: 14,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        pointerEvents: 'none',
      }}>{n}</div>
      <div className="label-mono" style={{ color: c, marginBottom: 10 }}>{eyebrow}</div>
      <h3 className="serif-display" style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{title}</h3>
      <div style={{ marginTop: 6 }}>
        <span className="chip" style={{ borderColor: c, color: c }}>{who}</span>
      </div>
      <p className="kr-wrap" style={{ marginTop: 12, marginBottom: 0, color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

function ChampionCard({
  rank,
  side,
  name,
  wins,
  losses,
  rate,
  cat,
  motto,
  winLabel,
  lossLabel,
}: {
  rank: number;
  side: 'pro' | 'con';
  name: string;
  wins: number;
  losses: number;
  rate: number;
  cat: string;
  motto: string;
  winLabel: string;
  lossLabel: string;
}) {
  return (
    <div className="card card--shadow" style={{ padding: 20, position: 'relative', background: 'var(--paper-light)' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, transform: 'rotate(6deg)', zIndex: 2 }}>
        <span className="stamp" style={{ fontSize: 11, padding: '3px 7px' }}>#{rank}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CharacterAvatar side={side} size={48} />
        <div>
          <div className="serif-display" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>{name}</div>
          <div className="label-mono" style={{ marginTop: 2, color: 'var(--ink-fade)' }}>{cat}</div>
        </div>
      </div>
      <div className="divider-dotted" style={{ margin: '14px 0 10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label-mono">{wins}{winLabel} {losses}{lossLabel}</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>
          {rate}<span style={{ fontSize: 14, color: 'var(--ink-fade)' }}>%</span>
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--paper)', border: '1px solid var(--ink)', marginTop: 8, position: 'relative' }}>
        <div style={{ width: `${Math.min(100, Math.max(0, rate))}%`, height: '100%', background: side === 'pro' ? 'var(--vermillion)' : 'var(--celadon)' }} />
      </div>
      {motto && (
        <p className="kr-wrap" style={{ marginTop: 10, marginBottom: 0, fontSize: 12.5, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          "{motto}"
        </p>
      )}
    </div>
  );
}

const FEATURE_ICONS = ['⚖️', '🤖', '⚡', '🗳️', '🔒', '🎲', '📚', '🏆', '✂️'];
const FEATURE_ICON_CLS: Array<'pro' | 'con' | 'mod' | 'ink'> = [
  'mod',
  'ink',
  'pro',
  'con',
  'ink',
  'pro',
  'con',
  'mod',
  'ink',
];

function Feat({
  tag,
  tagNew,
  icon,
  iconCls,
  title,
  desc,
  hero,
  index = 0,
}: {
  tag?: string;
  tagNew?: boolean;
  icon: string;
  iconCls: 'pro' | 'con' | 'mod' | 'ink';
  title: string;
  desc: string;
  hero?: boolean;
  index?: number;
}) {
  return (
    <Reveal className={hero ? 'feat feat--hero' : 'feat'} delay={(index % 4) * 70}>
      {tag && <div className={`feat__tag${tagNew ? ' feat__tag--new' : ''}`}>{tag}</div>}
      <div className={`feat__icon feat__icon--${iconCls}`}>{icon}</div>
      <h3 className="feat__title">{title}</h3>
      <p className="feat__desc">{desc}</p>
    </Reveal>
  );
}

const TOPIC_COVER_TINTS: Array<'pro' | 'con' | 'mod'> = ['pro', 'con', 'mod', 'con', 'mod', 'pro'];

function Topic({
  cat,
  q,
  pro,
  con,
  emoji,
  hot,
  hotLabel = 'HOT',
  onClick,
  index = 0,
}: {
  cat: string;
  q: string;
  pro: number;
  con: number;
  emoji?: string;
  hot?: boolean;
  hotLabel?: string;
  onClick: () => void;
  index?: number;
}) {
  const { ref, inView } = useInView<HTMLButtonElement>();
  const delay = (index % 3) * 80;
  const tint = TOPIC_COVER_TINTS[index % TOPIC_COVER_TINTS.length];
  return (
    <button
      ref={ref}
      type="button"
      className={`topic-card${hot ? ' topic-card--hot' : ''}`}
      onClick={onClick}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {hot && <span className="topic-card__hot">🔥 {hotLabel}</span>}
      <div className={`topic-card__cover topic-card__cover--${tint}`}>
        {emoji && <span className="topic-card__emoji" aria-hidden="true">{emoji}</span>}
      </div>
      <div className="topic-card__body">
        <div className="topic-card__cat">{cat}</div>
        <div className="topic-card__q">{q}</div>
        <div className="topic-card__split">
          <span className="seg seg-pro" style={{ width: `${pro}%` }} />
          <span className="seg seg-con" style={{ width: `${con}%` }} />
          <span className="lbl lbl-pro" style={{ marginLeft: 10 }}>{pro}</span>
          <span className="lbl">:</span>
          <span className="lbl lbl-con">{con}</span>
        </div>
      </div>
    </button>
  );
}

function FAQ({
  q,
  open,
  children,
}: {
  q: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="faq" open={open}>
      <summary>{q}</summary>
      <div className="answer">{children}</div>
    </details>
  );
}
