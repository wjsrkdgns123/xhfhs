import { useEffect, useState } from 'react';
import '../landing.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useInView } from '../hooks/useInView';
import { useLivePresence } from '../hooks/useLivePresence';
import type { Lang } from '../i18n/landing';
import { landingStrings } from '../i18n/landing';
import { CharacterAvatar } from './CharacterAvatar';
import { Reveal } from './Reveal';
import { ScrollSpyNav } from './ScrollSpyNav';

/** Demo card simulated state — drifts every few seconds to feel live without
 *  actually running anything. Used only by the DEMO PREVIEW room card. */
function useDemoSimulation() {
  const [state, setState] = useState({ pro: 58, spectators: 27, votes: 114, timeLeftSec: 168 });
  useEffect(() => {
    const tick = setInterval(() => {
      setState((s) => {
        // Drift pro 55–62, spectators ±1 (>=24), votes +0..3, time -1..-3
        const proNext = Math.max(54, Math.min(63, s.pro + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2))));
        const specNext = Math.max(24, s.spectators + (Math.random() > 0.5 ? 1 : -1));
        const voteNext = s.votes + Math.floor(Math.random() * 4);
        const timeNext = s.timeLeftSec > 30 ? s.timeLeftSec - (1 + Math.floor(Math.random() * 3)) : 168; // loop
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

export function LandingView({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const t = landingStrings[lang];
  useDocumentMeta(t.meta.title, t.meta.description);
  const { liveCount, openCount, ready } = useLivePresence();
  const totalActive = liveCount + openCount;
  const demoSim = useDemoSimulation();
  const demoCon = 100 - demoSim.pro;
  const spyItems = [
    { id: 'top', label: t.nav.top },
    { id: 'how', label: t.nav.how },
    { id: 'features', label: t.nav.features },
    { id: 'demo', label: t.nav.demo },
    { id: 'topics', label: t.nav.topics },
    { id: 'faq', label: t.nav.faq },
    { id: 'cta', label: t.nav.cta },
  ];
  return (
    <div className="landing-page">
      <ScrollSpyNav items={spyItems} />
      {/* ===== HERO (wordmark wall, entry point) ===== */}
      <section className="wordmark-wall" id="top" aria-label="Debate Battle">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow eyebrow--vermillion wordmark-wall__issue">
              {t.wordmark.issueEyebrow}
            </div>
            <h1 className="wordmark-wall__big">
              {t.wordmark.big.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t.wordmark.big.split('\n').length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="wordmark-wall__sub">
              {t.wordmark.subBefore}
              <span className="marker">{t.wordmark.subMarker}</span>
              <br />
              {t.wordmark.subAfter}
            </p>
            <ul className="wordmark-wall__pillars">
              {t.wordmark.pillars.map((p, i) => (
                <li key={i} className="wordmark-wall__pillar">
                  <span className="wordmark-wall__pillar-num">0{i + 1}</span>
                  <span className="wordmark-wall__pillar-bold">{p.bold}</span>
                  <span className="wordmark-wall__pillar-rest">{p.rest}</span>
                </li>
              ))}
            </ul>
            {ready && totalActive > 0 && (
              <div className="wordmark-wall__live" role="status" aria-live="polite">
                <span className="wordmark-wall__live-dot" aria-hidden="true"></span>
                <span>
                  {t.presence.livePrefix}<b>{liveCount}</b>{t.presence.liveSuffix}
                  {openCount > 0 && (
                    <>
                      <span className="wordmark-wall__live-sep">·</span>
                      {t.presence.openPrefix}<b>{openCount}</b>{t.presence.openSuffix}
                    </>
                  )}
                </span>
              </div>
            )}
            <div className="wordmark-wall__cta">
              <button onClick={onStart} className="lpbtn lpbtn--pri lpbtn--lg">
                {t.hero.ctaPrimary}
              </button>
              <button
                onClick={onStart}
                type="button"
                className="wordmark-wall__cta-secondary"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
          </Reveal>
          <div className="wordmark-wall__mark" aria-hidden="true">{t.wordmark.mark}</div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="phases-bg" id="how">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.how.eyebrow}</div>
            <h2 className="section-title">
              <span className="hand">{t.how.titleAccent}</span>{t.how.titleA}
              <br />
              {t.how.titleB}
            </h2>
            <p className="section-lead">{t.how.lead}</p>
          </Reveal>

          <div className="phases">
            {t.how.phases.map((p, i) => (
              <Phase
                key={i}
                index={i}
                num={String(i + 1).padStart(2, '0')}
                name={p.name}
                who={p.who}
                whoCls={['mod', 'pro', 'con', 'all', 'mod'][i] as 'pro' | 'con' | 'mod' | 'all'}
                desc={p.desc}
                last={i === t.how.phases.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.features.eyebrow}</div>
            <h2 className="section-title">
              {t.features.titleA}
              <br />
              <span className="hand">{t.features.titleB}</span>
            </h2>
            <p className="section-lead">{t.features.lead}</p>
          </Reveal>

          <div className="features-grid">
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

      {/* ===== STATS ===== */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="wrap">
          <div className="stats">
            {t.stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="stat__num">{s.num}<span className="unit">{s.unit}</span></div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARTNERS (placeholder schools/clubs) ===== */}
      <section className="partners">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.partners.eyebrow}</div>
            <h2 className="section-title">
              {t.partners.titleA}
              <br />
              <span className="hand">{t.partners.titleB}</span>
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

      {/* ===== CHAMPIONS (top debaters this week) ===== */}
      <section className="champions">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.champions.eyebrow}</div>
            <h2 className="section-title">
              {t.champions.titleA} <span className="hand">{t.champions.titleAccent}</span>
              <br />
              {t.champions.titleB}
            </h2>
            <p className="section-lead">{t.champions.lead}</p>
          </Reveal>
          <div className="champions-grid">
            {t.champions.items.map((c, i) => (
              <Reveal key={i} className={`champion champion--${c.side}`} delay={i * 80}>
                <div className="champion__avatar">
                  <CharacterAvatar side={c.side as 'pro' | 'con'} size={48} />
                </div>
                <div className="champion__rank">#{i + 1}</div>
                <div className="champion__name">{c.name}</div>
                <div className="champion__rate">
                  <b>{c.wins}</b>{t.champions.winLabel} <span>·</span> <b>{c.losses}</b>{t.champions.lossLabel}
                </div>
                <div className="champion__cat">{c.cat}</div>
                <p className="champion__motto">"{c.motto}"</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PULL QUOTE — editorial pause between Champions and Testimonials
           per debate-battle-v2 design package. Three-dot ornament + centered
           serif blockquote with vermillion brush-under accent. */}
      <section className="pull-quote">
        <div className="wrap-narrow">
          <Reveal>
            <div className="pull-quote__dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <blockquote className="pull-quote__text serif-display">
              {t.wordmark.quote}
            </blockquote>
            <div className="pull-quote__source label-mono">
              {t.wordmark.quoteSource}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.testimonials.eyebrow}</div>
            <h2 className="section-title">
              {t.testimonials.titleA}
              <br />
              <span className="hand">{t.testimonials.titleB}</span>
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

      {/* ===== DEMO PREVIEW ===== */}
      <section className="demo" id="demo">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.demo.eyebrow}</div>
            <h2 className="section-title">
              {t.demo.titleA}
              <br />
              <span className="hand">{t.demo.titleB}</span>
            </h2>
            <p className="section-lead">{t.demo.lead}</p>
          </Reveal>

          <div className="demo-grid">
            <div>
              <div className="ribbon">{t.demo.ribbonRoom}</div>
              <div className="roomcard">
                <div className="roomcard__bar">
                  <span className="pill-live">
                    <span className="dot"></span>LIVE
                  </span>
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
                <div
                  style={{
                    border: '1.5px solid var(--ink)',
                    background: 'var(--paper-light)',
                    boxShadow: '4px 4px 0 var(--ink)',
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.15em',
                      color: 'var(--ink-fade)',
                      marginBottom: 8,
                    }}
                  >
                    {t.demo.verdictHeader}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 700,
                      fontSize: 17,
                      lineHeight: 1.5,
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {t.demo.verdictText.prefix}
                    <span className="squiggle-under">{t.demo.verdictText.accent}</span>
                    {t.demo.verdictText.suffix}
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        background: 'var(--vermillion)',
                        color: '#fff',
                        padding: '4px 14px',
                        fontFamily: 'var(--font-hand)',
                        fontWeight: 700,
                        fontSize: 22,
                        transform: 'rotate(-3deg)',
                        display: 'inline-block',
                      }}
                    >
                      {t.demo.verdictBadge}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--ink-fade)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {t.demo.verdictNote}
                    </span>
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
                    <span
                      style={{
                        background: 'var(--celadon-soft)',
                        padding: '4px 10px',
                        border: '1.5px solid var(--celadon)',
                        color: 'var(--celadon)',
                      }}
                    >
                      {t.demo.typing}
                      <span className="dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOPICS ===== */}
      <section id="topics">
        <div className="wrap">
          <Reveal>
            <div className="section-eyebrow">{t.topics.eyebrow}</div>
            <h2 className="section-title">
              {t.topics.titleA}
              <br />
              <span className="hand">{t.topics.titleB}</span>
            </h2>
            <p className="section-lead">{t.topics.lead}</p>
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
                hotLabel={lang === 'ko' ? 'HOT' : 'HOT'}
                onClick={onStart}
              />
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button onClick={onStart} className="lpbtn">
              {t.topics.cta}
            </button>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section
        style={{
          background: 'var(--paper-light)',
          borderTop: '1.5px solid var(--ink)',
          borderBottom: '1.5px solid var(--ink)',
        }}
        id="faq"
      >
        <div className="wrap-narrow">
          <Reveal>
            <div className="section-eyebrow">{t.faq.eyebrow}</div>
            <h2 className="section-title">
              {t.faq.titleA}
              <br />
              <span className="hand">{t.faq.titleB}</span>
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

      {/* ===== CTA ===== */}
      <section id="cta" className="tight">
        <div className="wrap">
          <Reveal className="cta-block">
            <div className="section-eyebrow">{t.cta.eyebrow}</div>
            <h2 className="cta-title">
              {t.cta.titleA}
              <br />
              <span className="hand">{t.cta.titleB}</span>
            </h2>
            <p>{t.cta.lead}</p>
            <div
              style={{
                display: 'inline-flex',
                gap: 14,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button onClick={onStart} className="lpbtn lpbtn--pri lpbtn--lg">
                {t.cta.primary}
              </button>
              <button onClick={onStart} className="lpbtn lpbtn--lg">
                {t.cta.secondary}
              </button>
            </div>
          </Reveal>
        </div>
      </section>
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

function Phase({
  num,
  name,
  who,
  whoCls,
  desc,
  last,
  index = 0,
}: {
  num: string;
  name: string;
  who: string;
  whoCls: 'pro' | 'con' | 'mod' | 'all';
  desc: string;
  last?: boolean;
  index?: number;
}) {
  return (
    <Reveal className="phase" delay={index * 60}>
      <div className="phase__num">{num}</div>
      <div className="phase__name">{name}</div>
      <span className={`phase__who phase__who--${whoCls}`}>{who}</span>
      <div className="phase__desc">{desc}</div>
      {!last && <div className="phase__arrow"></div>}
    </Reveal>
  );
}

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
          <span className="seg seg-pro" style={{ width: `${pro}%` }}></span>
          <span className="seg seg-con" style={{ width: `${con}%` }}></span>
          <span className="lbl lbl-pro" style={{ marginLeft: 10 }}>
            {pro}
          </span>
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
