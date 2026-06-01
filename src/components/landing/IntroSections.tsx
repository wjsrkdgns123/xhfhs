// 토론배틀 소개(Intro) — redesign sections (Claude Design handoff:
// redesign/HeroEDU.jsx + IntroSections.jsx). Academic sage/celadon tone, gold 討論
// seal, serif headlines. Bilingual; the hero live-count is wired to real presence.
import type { ReactNode } from 'react';
import type { Lang } from '../../i18n/landing';
import { DebateSeal, LiveChip, MascotChip, Pill } from '../redesign/RedesignPrimitives';

const GREEN_PANEL = 'linear-gradient(165deg, #6f9c86 0%, #4f7a64 52%, #3c6450 100%)';

/* ===== HERO — academic split hero ===== */
export function HeroEDU({ lang, liveCount, onStart, onSamples }: { lang: Lang; liveCount: number; onStart: () => void; onSamples: () => void }) {
  const en = lang === 'en';
  const stats: Array<[string, string]> = en
    ? [['38', 'Debates today'], ['2,431', 'Total participants'], ['12 min', 'Avg. debate']]
    : [['38', '오늘 진행된 토론'], ['2,431', '누적 참가자'], ['12분', '평균 토론 시간']];
  return (
    <div className="tb-hero" style={{ position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)', background: 'radial-gradient(125% 120% at 18% 8%, #fbf6ea 0%, #f5efe0 42%, #ece3d0 100%)', color: 'var(--ink)' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'radial-gradient(80% 60% at 22% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%), radial-gradient(100% 90% at 78% 108%, rgba(120,98,64,0.16) 0%, rgba(120,98,64,0) 60%)' }} />

      {/* left — copy */}
      <div className="tb-hero__left" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', zIndex: 3 }}>
        <div className="tb-hero__topbar" style={{ position: 'absolute', top: 30, left: 56, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>討</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>{en ? 'Debate Battle' : '토론배틀'}</span>
          </span>
          <span className="tb-hide-sm" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-fade)' }}>EST. 2026 · DEBATE PLATFORM</span>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color: 'var(--celadon)', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 26, height: 1.5, background: 'var(--celadon)' }} />
          {en ? 'REAL-TIME DEBATE · AI MODERATOR' : '실시간 토론 플랫폼 · AI 사회자 진행'}
        </span>

        <h1 className="tb-hero__title" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 60, lineHeight: 1.06, letterSpacing: '-0.04em', color: 'var(--ink)', wordBreak: 'keep-all' }}>
          {en ? (
            <>Win with<br /><span style={{ color: 'var(--vermillion)' }}>your logic</span></>
          ) : (
            <>당신의 논리로<br /><span style={{ color: 'var(--vermillion)' }}>승부하라</span></>
          )}
        </h1>
        <p style={{ margin: '16px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, lineHeight: 1.4, letterSpacing: '-0.02em', color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>
          {en ? <>Open <span style={{ color: 'var(--celadon)' }}>1:1 pro/con debates</span> anyone can join</> : <>누구나 참여하는 <span style={{ color: 'var(--celadon)' }}>1:1 찬반 토론</span></>}
        </p>

        <span style={{ width: 80, height: 3, background: 'var(--gold)', margin: '24px 0 0' }} />

        <p style={{ maxWidth: 480, margin: '22px 0 0', fontSize: 17, lineHeight: 1.66, color: 'var(--ink-soft)', fontWeight: 500, wordBreak: 'keep-all' }}>
          {en
            ? 'Register a motion and recruit an opponent to open a debate. Five rounds run in order, and the audience vote plus the AI assessment together decide the winner.'
            : '주제를 등록하고 참가자를 모집해 토론을 열어보세요. 5단계 라운드가 진행되며, 관중 투표와 AI 평가가 함께 승부를 결정합니다.'}
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Pill variant="solid" accent="var(--celadon)" onClick={onStart}>{en ? 'Start a debate' : '토론 시작하기'} <span style={{ fontSize: 15 }}>→</span></Pill>
          <Pill variant="ghostInk" onClick={onSamples}>{en ? 'See a sample' : '샘플 토론 보기'}</Pill>
        </div>

        <div style={{ marginTop: 40 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-fade)', marginBottom: 15 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vermillion)', animation: 'tb-pulse 1.6s ease-in-out infinite' }} />
            {liveCount > 0
              ? en
                ? <>Right now <b style={{ color: 'var(--vermillion)' }}>{liveCount}</b> debate{liveCount > 1 ? 's are' : ' is'} live</>
                : <>지금 <b style={{ color: 'var(--vermillion)' }}>{liveCount}</b>개 토론이 실시간으로 진행 중입니다</>
              : en
                ? <>Start a debate with the AI moderator right now</>
                : <>AI 사회자와 지금 바로 토론을 시작할 수 있습니다</>}
          </span>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, flexWrap: 'wrap' }}>
            {stats.map(([n, l], i) => (
              <span key={l} style={{ display: 'contents' }}>
                {i > 0 && <span className="tb-hide-sm" style={{ width: 1, background: 'var(--ink-ghost)', opacity: 0.5 }} />}
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1 }}>{n}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.05em', color: 'var(--ink-fade)' }}>{l}</span>
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* right — green panel */}
      <div className="tb-hero__right" style={{ position: 'relative', background: GREEN_PANEL, borderRadius: '120px 0 0 0', overflow: 'hidden', zIndex: 2 }}>
        <span aria-hidden="true" style={{ position: 'absolute', bottom: -72, right: -34, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 340, lineHeight: 0.8, color: 'rgba(255,255,255,0.05)', userSelect: 'none', pointerEvents: 'none' }}>論</span>
        <div style={{ position: 'absolute', top: 30, right: 32, zIndex: 4, opacity: 0.86 }}><DebateSeal display={60} /></div>

        <div style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px', gap: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <LiveChip tone="solid" />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.14em', color: 'rgba(252,246,232,0.92)' }}>{en ? 'Live debates' : '지금 진행 중인 토론'}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 28px 54px -22px rgba(20,40,30,0.65)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--vermillion)' }}>{en ? 'Hottest debate' : '지금 가장 뜨거운 토론'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', color: 'var(--ink-fade)' }}>● LIVE · {en ? '142 watching' : '142명 관전'}</span>
            </div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 21, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'var(--ink)', wordBreak: 'keep-all' }}>
              {en ? '「Will AI replace humans?」' : '「AI는 인간을 대체할 것인가?」'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '15px 0 7px' }}>
              <MascotChip side="pro" size={30} ring={false} />
              <div style={{ flex: 1, display: 'flex', height: 9, borderRadius: 999, overflow: 'hidden', background: '#ede6d5' }}>
                <span style={{ width: '56%', background: 'var(--vermillion)' }} />
                <span style={{ width: '44%', background: 'var(--celadon)' }} />
              </div>
              <MascotChip side="con" size={30} ring={false} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, marginBottom: 15 }}>
              <span style={{ color: 'var(--vermillion)' }}>{en ? 'Pro 56%' : '찬성 56%'}</span>
              <span style={{ fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-ghost)' }}>VS</span>
              <span style={{ color: 'var(--celadon)' }}>{en ? 'Con 44%' : '반대 44%'}</span>
            </div>
            <button type="button" onClick={onStart} style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'var(--vermillion)', color: '#fff', borderRadius: 11, padding: '13px 0', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', boxShadow: '0 12px 26px -10px rgba(200,75,31,0.7)' }}>
              {en ? 'Watch & vote →' : '관전하고 투표하기 →'}
            </button>
          </div>

          <LiveDebateRow onClick={onStart} topic={en ? 'Adopt universal basic income?' : '기본소득, 도입해야 하는가?'} pro={52} state="live" meta={en ? '86 watching' : '관전 86명'} />
          <LiveDebateRow onClick={onStart} topic={en ? 'Ban phones in schools?' : '교내 스마트폰 전면 금지?'} state="open" meta={en ? 'Con seat open · Pro available' : '반대 측 비어 있음 · 찬성 측 참가 가능'} />

          <button type="button" onClick={onStart} style={{ alignSelf: 'flex-start', marginTop: 2, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, letterSpacing: '0.06em', color: 'rgba(252,246,232,0.82)' }}>{en ? 'See all debates →' : '전체 토론 보기 →'}</button>
        </div>
      </div>
    </div>
  );
}

function LiveDebateRow({ topic, pro, state, meta, onClick }: { topic: string; pro?: number; state: 'live' | 'open'; meta: string; onClick: () => void }) {
  const live = state === 'live';
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'var(--font-body)', background: live ? 'rgba(255,255,255,0.14)' : 'rgba(246,209,102,0.15)', border: live ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(246,209,102,0.55)', borderRadius: 13, padding: '12px 12px 12px 15px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: '#fcf6e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic}</div>
        {live && pro != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 7 }}>
            <div style={{ width: 84, height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ width: `${pro}%`, background: 'var(--vermillion)' }} />
              <span style={{ width: `${100 - pro}%`, background: '#cfe3d6' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10, color: 'rgba(252,246,232,0.78)' }}>{meta}</span>
          </div>
        ) : (
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10, letterSpacing: '0.03em', color: '#ffe6a8' }}>{meta}</div>
        )}
      </div>
      <span style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.06em', padding: '4px 9px', borderRadius: 999, background: live ? 'rgba(200,75,31,0.32)' : 'var(--gold)', color: live ? '#ffd9c7' : '#3a2c08' }}>{live ? 'LIVE' : '모집중'}</span>
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 18, lineHeight: 1, color: 'rgba(252,246,232,0.6)' }}>›</span>
    </button>
  );
}

/* ===== shared section header ===== */
function IntroHead({ eyebrow, title, accent = 'var(--celadon)', light }: { eyebrow: string; title: ReactNode; accent?: string; light?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.2em', color: accent, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 24, height: 1.5, background: accent }} />{eyebrow}
      </span>
      <h2 style={{ margin: '16px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.12, letterSpacing: '-0.03em', color: light ? '#fcf6e8' : 'var(--ink)', wordBreak: 'keep-all', maxWidth: 760 }}>{title}</h2>
      <span style={{ width: 64, height: 3, background: 'var(--gold)', marginTop: 22 }} />
    </div>
  );
}

/* ===== 1. how it works — 5 steps ===== */
export function SectionHow({ lang }: { lang: Lang }) {
  const en = lang === 'en';
  const steps: Array<[string, string, string]> = en
    ? [
        ['01', 'Register · pick a side', 'Anyone can open a room and choose to argue pro or con.'],
        ['02', 'Opening', 'Each side builds its case and lays out the key evidence.'],
        ['03', 'Rebuttal · cross-exam', 'Attack the other side and narrow the points of clash.'],
        ['04', 'Closing', 'Sum up the debate and make the final persuasive case.'],
        ['05', 'Verdict', 'Audience vote 50% + AI assessment 50% decide the winner.'],
      ]
    : [
        ['01', '주제 등록 · 입장 선택', '누구나 토론방을 열고 찬성 또는 반대 입장을 정합니다.'],
        ['02', '입론', '각자 자신의 주장을 세우고 핵심 근거를 제시합니다.'],
        ['03', '반론 · 교차질의', '상대의 근거를 반박하고, 서로 묻고 답하며 쟁점을 좁힙니다.'],
        ['04', '최종변론', '논의를 정리해 자신의 입장을 마지막으로 설득합니다.'],
        ['05', '판정', '관중 투표 50%와 AI 평가 50%를 합산해 승부를 가립니다.'],
      ];
  return (
    <section id="how" className="tb-intro-pad" style={{ background: '#f6f0e2' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        <IntroHead eyebrow={en ? 'HOW IT WORKS · 진행 방식' : 'HOW IT WORKS · 진행 방식'} title={en ? 'From opening to verdict — five rounds' : '입론부터 판정까지, 5단계로 진행됩니다'} />
        <div className="tb-intro-grid-5" style={{ marginTop: 56 }}>
          {steps.map(([n, t, d], i) => (
            <div key={n} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {i < 4 && <span aria-hidden="true" className="tb-intro-step-rule" style={{ position: 'absolute', top: 21, left: 'calc(50% + 28px)', right: 'calc(-50% + 28px)', height: 1.5, background: 'var(--ink-ghost)', opacity: 0.5 }} />}
              <span style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--paper-light)', border: '2px solid var(--celadon)', color: 'var(--celadon)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, zIndex: 1, boxShadow: '0 8px 18px -10px rgba(0,0,0,0.3)' }}>{n}</span>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 19, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'var(--ink)', wordBreak: 'keep-all' }}>{t}</h3>
                <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== 2. why — 3 features ===== */
export function SectionWhy({ lang }: { lang: Lang }) {
  const en = lang === 'en';
  const feats: Array<[string, string, string]> = en
    ? [
        ['討', 'AI moderation', 'The moderator guides all five rounds and manages turn order and timing — you focus only on the debate.'],
        ['評', 'A fair verdict', 'Audience vote 50% and AI assessment 50% are combined, so neither popularity nor logic alone decides it.'],
        ['論', 'Real-time 1:1', 'With just a topic, anyone opens a room and meets an opponent while the audience watches and votes live.'],
      ]
    : [
        ['討', 'AI 사회자 진행', '사회자가 5단계 라운드를 안내하고 발언 순서와 시간을 관리합니다. 진행 부담 없이 토론에만 집중할 수 있습니다.'],
        ['評', '공정한 판정', '관중 투표 50%와 AI 평가 50%를 합산합니다. 인기와 논리, 어느 한쪽에 치우치지 않게 균형을 맞춥니다.'],
        ['論', '실시간 1:1', '주제만 있으면 누구나 방을 열고 상대를 만납니다. 관중은 실시간으로 토론을 지켜보고 투표에 참여합니다.'],
      ];
  return (
    <section id="why" className="tb-intro-pad" style={{ background: '#efe7d3' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        <IntroHead eyebrow={en ? 'WHY DEBATE BATTLE · 특징' : 'WHY DEBATE BATTLE · 특징'} title={en ? 'Built so you can focus only on the debate' : '토론에만 집중할 수 있도록 설계했습니다'} />
        <div className="tb-intro-grid-3" style={{ marginTop: 56 }}>
          {feats.map(([g, t, d]) => (
            <div key={g} style={{ background: '#f9f4e7', borderRadius: 20, padding: '32px 30px', boxShadow: '0 20px 44px -28px rgba(40,50,40,0.4)', borderTop: '3px solid var(--gold)' }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 28, boxShadow: '0 10px 22px -10px rgba(79,122,100,0.6)' }}>{g}</span>
              <h3 style={{ margin: '22px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{t}</h3>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.66, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== 3. today's motions — illustrative live cards ===== */
function MotionCard({ lang, live, round, topic, pro, con, proPct, voters, time }: { lang: Lang; live?: boolean; round: string; topic: string; pro: string; con: string; proPct: number; voters: number; time: string }) {
  const en = lang === 'en';
  const conPct = 100 - proPct;
  return (
    <div style={{ background: 'var(--paper-light)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 28px 56px -32px rgba(20,40,30,0.5), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '15px 20px', borderBottom: '1px solid #efe7d6' }}>
        {live ? <LiveChip tone="solid" /> : <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', color: 'var(--celadon)', border: '1px solid var(--celadon)', padding: '4px 9px', borderRadius: 6 }}>{en ? 'SOON' : '예정'}</span>}
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-fade)' }}>{round}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-ghost)' }}>{time}</span>
      </div>
      <div style={{ padding: '20px 22px 22px' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 22, lineHeight: 1.34, letterSpacing: '-0.02em', color: 'var(--ink)', wordBreak: 'keep-all' }}>{topic}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
            <MascotChip side="pro" size={38} />
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', color: 'var(--vermillion)' }}>PRO · {en ? 'Pro' : '찬성'}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{pro}</div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink-ghost)' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, flexDirection: 'row-reverse', textAlign: 'right' }}>
            <MascotChip side="con" size={38} />
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', color: 'var(--celadon)' }}>CON · {en ? 'Con' : '반대'}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{con}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', height: 26, borderRadius: 999, overflow: 'hidden', background: '#f0ead9' }}>
          <div style={{ width: proPct + '%', background: 'var(--vermillion)', display: 'flex', alignItems: 'center', paddingLeft: 12, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11 }}>{proPct}%</div>
          <div style={{ width: conPct + '%', background: 'var(--celadon)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11 }}>{conPct}%</div>
        </div>
        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-fade)' }}>{en ? <>Audience <b style={{ color: 'var(--ink)' }}>{voters}</b> voting</> : <>관중 <b style={{ color: 'var(--ink)' }}>{voters}</b>명 참여 중</>}</div>
      </div>
    </div>
  );
}

export function SectionMotions({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const en = lang === 'en';
  return (
    <section id="motions" className="tb-intro-pad" style={{ background: '#f6f0e2' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <IntroHead eyebrow={en ? "LIVE NOW · 오늘의 논제" : 'LIVE NOW · 오늘의 논제'} title={en ? 'Look in on a debate that’s open now' : '지금 열려 있는 토론을 살펴보세요'} />
          <Pill variant="ghostInk" size="sm" onClick={onStart}>{en ? 'All motions →' : '전체 논제 보기 →'}</Pill>
        </div>
        <div className="tb-intro-grid-3" style={{ marginTop: 52 }}>
          <MotionCard lang={lang} live round={en ? 'ROUND 3/5 · Rebuttal' : 'ROUND 3/5 · 반박'} topic={en ? '「Will AI replace humans?」' : '「AI는 인간을 대체할 것인가?」'} pro="JINNY" con={en ? 'Jaehyun' : '재현'} proPct={58} voters={27} time="02:48" />
          <MotionCard lang={lang} live round={en ? 'ROUND 2/5 · Opening' : 'ROUND 2/5 · 입론'} topic={en ? '「Free school uniforms?」' : '「교복 자율화는 필요한가?」'} pro={en ? 'Haedeun' : '해든'} con={en ? 'Minseo' : '민서'} proPct={46} voters={19} time="04:12" />
          <MotionCard lang={lang} round={en ? 'Opens 8 PM' : '개설 예정 · 오후 8시'} topic={en ? '「Adopt a four-day week?」' : '「주 4일 근무제를 도입해야 하는가?」'} pro={en ? 'Doyun' : '도윤'} con={en ? 'Sua' : '수아'} proPct={50} voters={0} time="20:00" />
        </div>
      </div>
    </section>
  );
}

/* ===== 4. CTA ===== */
export function SectionCTA({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const en = lang === 'en';
  return (
    <section id="cta" style={{ position: 'relative', background: GREEN_PANEL, padding: '120px 64px', overflow: 'hidden' }}>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: -120, left: -40, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 460, lineHeight: 0.7, color: 'rgba(255,255,255,0.05)', userSelect: 'none', pointerEvents: 'none' }}>討</span>
      <div style={{ maxWidth: 1152, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>{en ? 'READY TO DEBATE · 지금 시작하세요' : 'READY TO DEBATE · 지금 시작하세요'}</span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fcf6e8', wordBreak: 'keep-all', maxWidth: 720 }}>
          {en ? 'Register a motion and start your first debate' : '주제를 등록하고 첫 토론을 시작하세요'}
        </h2>
        <p style={{ maxWidth: 540, margin: '22px 0 0', fontSize: 17.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', fontWeight: 500, wordBreak: 'keep-all' }}>
          {en ? 'Joining is free. The AI moderator runs the rounds, so just pick a side and step onto the stage.' : '가입과 참여는 무료입니다. AI 사회자가 진행을 맡으니, 입장만 정하면 바로 토론에 들어갈 수 있습니다.'}
        </p>
        <div style={{ display: 'flex', gap: 13, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pill variant="cream" onClick={onStart}>{en ? 'Start a debate' : '토론 시작하기'} <span style={{ fontSize: 15 }}>→</span></Pill>
          <Pill variant="ghost" onClick={onStart}>{en ? 'How it works' : '진행 방식 보기'}</Pill>
        </div>
      </div>
    </section>
  );
}
