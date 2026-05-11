const PHASES = [
  { num: '01', name: '개회', who: '사회자', whoColor: 'gold', desc: 'AI 사회자가 주제를 정리하고 양측에게 발언 순서를 안내합니다.' },
  { num: '02', name: '찬성 입론', who: '찬성', whoColor: 'pro', desc: '왜 동의하는가. 핵심 근거 3가지를 정리해 던집니다.' },
  { num: '03', name: '반대 입론', who: '반대', whoColor: 'con', desc: '반대편의 주장과 근거. 입장 차이가 본격적으로 드러나는 라운드.' },
  { num: '04', name: '반박', who: '양측', whoColor: 'ink', desc: '상대 논리의 약점을 짚고 재반박. "이의 있음!" 컷이 등장하는 구간.' },
  { num: '05', name: '종료 · 판정', who: '사회자', whoColor: 'gold', desc: '관전자 투표 + AI 사회자의 정성 평가가 합쳐져 승부가 결정됩니다.' },
];

const FEATURES = [
  { icon: '⚖️', color: 'gold', tag: 'CORE', title: 'AI 사회자', desc: '개회 멘트, 단계 안내, 시간 조율까지. Claude 기반 AI가 끊김 없이 한 판을 진행합니다.' },
  { icon: '🤖', color: 'ink', title: 'AI 토론자', desc: '상대가 없어도 시작할 수 있습니다. AI를 찬성/반대로 세우고 바로 한 판.' },
  { icon: '⚡', color: 'pro', title: '실시간 1:1', desc: '선착순 2명만 무대에 오릅니다. 단 둘. 군더더기 없는 진검 승부.' },
  { icon: '🗳️', color: 'con', title: '관전자 투표', desc: '관전자는 실시간으로 표를 던집니다. 발언은 못 해도 결과는 바꿀 수 있습니다.' },
  { icon: '🔒', color: 'ink', tag: 'PRIVATE', title: '비공개방 + 초대 링크', desc: '친구·동아리·스터디용 비공개방을 만들고 링크 하나로 초대하세요.' },
  { icon: '🎲', color: 'pro', title: '주제 추천 · 발언 다듬기', desc: '막막할 땐 AI가 토론 주제를 추천하고, 발언도 가독성 있게 다듬어 줍니다.' },
  { icon: '📚', color: 'con', title: '자료실', desc: '토론 기본기, 자주 쓰는 논증 구조, 좋은 반박법까지 — 학습 콘텐츠가 함께 있습니다.' },
  { icon: '🏆', color: 'gold', title: '전적 · 프로필', desc: '사람전 / AI전 따로 집계. 캐릭터 아바타와 닉네임으로 나만의 토론 기록.' },
  { icon: '✂️', color: 'ink', title: '연장 라운드', desc: '아직 결판이 안 났다면 양측 동의로 1라운드 더. 끝장을 봅시다.' },
];

const STATS = [
  { num: '5', unit: '단계', label: '정형화된 라운드' },
  { num: '2', unit: '명', label: '선착순 토론자' },
  { num: '∞', unit: '석', label: '관전자 자리' },
  { num: '1', unit: '초', label: 'Google 로그인 시작' },
];

const FAQS = [
  { q: '혼자서도 토론할 수 있나요?', a: '네. 방을 만들 때 "AI와 토론"을 선택하면 AI 토론자가 즉시 상대편에 앉습니다. 사람이 없어도 진검 승부 한 판을 끝낼 수 있고, 관전자가 들어와 투표도 합니다.' },
  { q: '토론자는 어떻게 정해지나요?', a: '선착순 1:1입니다. 누구든 방에 들어와 찬성·반대 자리를 선점하면 토론자가 되고, 양쪽이 채워지는 순간 LIVE로 전환됩니다. 자리가 찬 뒤 들어온 사람은 관전자로 투표만 가능합니다.' },
  { q: '승부는 어떻게 결정되나요?', a: '관전자 투표와 AI 사회자의 정성 평가가 50:50으로 반영됩니다. 라운드 종료 시 사회자가 양측의 근거·반박을 정리해 코멘트를 남기고, 최종 득표가 많은 쪽이 승리합니다. 동점이면 무승부.' },
  { q: '친구들끼리만 토론하고 싶어요.', a: '방 생성 시 비공개방으로 설정하면 공개 목록에 노출되지 않습니다. 입장 후 생성되는 초대 링크를 친구·동아리·스터디원에게 공유하세요.' },
  { q: '발언이 정리가 안 돼요. 도와주나요?', a: '"자동 문단 정리" 옵션을 켜면 보낸 내용이 자동으로 가독성 있게 정리됩니다. 핵심 주장과 근거가 살아남되 문장이 매끄러워집니다 — 입력 부담을 크게 줄여줍니다.' },
  { q: '무료인가요?', a: '현재 MVP는 무료입니다. Google 계정으로 1초 로그인하고 바로 무대를 열 수 있습니다.' },
];

function colorVar(c: string) {
  if (c === 'pro') return 'var(--color-vermillion)';
  if (c === 'con') return 'var(--color-celadon)';
  if (c === 'gold') return 'var(--color-gold)';
  return 'var(--color-ink)';
}
function colorSoft(c: string) {
  if (c === 'pro') return 'rgba(200, 75, 31, 0.12)';
  if (c === 'con') return 'rgba(45, 74, 90, 0.12)';
  if (c === 'gold') return 'rgba(184, 132, 42, 0.15)';
  return 'rgba(26, 15, 8, 0.08)';
}

export function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ===== HERO ===== */}
      <section className="relative">
        <div
          className="font-bold mb-2"
          style={{
            color: 'var(--color-vermillion)',
            fontSize: 12,
            letterSpacing: '0.3em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          REAL-TIME · 1 vs 1 · KOREAN DEBATE
        </div>
        <h1
          className="m-0 font-bold leading-none"
          style={{
            fontSize: 'clamp(40px, 9vw, 84px)',
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
          }}
        >
          주제를 던지고
          <br />
          <span
            className="accent-hand"
            style={{
              color: 'var(--color-vermillion)',
              fontSize: 'clamp(56px, 12vw, 120px)',
              fontWeight: 700,
            }}
          >
            맞붙어라
          </span>
        </h1>
        <p
          className="mt-4 text-base sm:text-lg"
          style={{ color: 'var(--color-ink-soft)', maxWidth: 620, lineHeight: 1.7 }}
        >
          <strong>찬성과 반대 1대1.</strong> AI 사회자가 진행하고, 관전자가 투표하며,
          라운드가 끝나면 승부가 갈립니다. 사람과 사람, 혹은 사람과 AI — 누구든
          무대에 오를 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onStart}
            className="btn btn-pri"
            style={{ padding: '12px 22px', fontSize: 15 }}
          >
            무대 열기 ▶
          </button>
          <button
            onClick={onStart}
            className="btn"
            style={{ padding: '12px 22px', fontSize: 15 }}
          >
            관전부터 해보기
          </button>
        </div>
        <div
          className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs"
          style={{ color: 'var(--color-ink-fade)', fontFamily: 'var(--font-mono)' }}
        >
          <span>● Google 로그인 1초 시작</span>
          <span>● AI 사회자 자동 진행</span>
          <span>● 실시간 투표 집계</span>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        style={{
          background: 'var(--color-paper-deep)',
          padding: '40px 20px',
          borderTop: '1.5px solid var(--color-ink)',
          borderBottom: '1.5px solid var(--color-ink)',
          marginLeft: -16,
          marginRight: -16,
        }}
      >
        <div
          className="font-bold mb-2"
          style={{
            color: 'var(--color-vermillion)',
            fontSize: 12,
            letterSpacing: '0.3em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          HOW IT WORKS · 진행 방식
        </div>
        <h2
          className="m-0 font-bold"
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
            lineHeight: 1.2,
          }}
        >
          <span className="accent-hand" style={{ color: 'var(--color-vermillion)' }}>
            5단계
          </span>
          로 끝나는,
          <br />
          깔끔한 한 판.
        </h2>
        <p
          className="mt-3 text-sm sm:text-base"
          style={{ color: 'var(--color-ink-soft)', maxWidth: 620, lineHeight: 1.7 }}
        >
          AI 사회자가 단계를 자동으로 진행합니다. 토론자는 발언만, 관전자는 투표만
          — 룰이 단순해서 누구나 바로 참여할 수 있습니다.
        </p>
        <div className="grid gap-3 mt-6 sm:grid-cols-2 lg:grid-cols-5">
          {PHASES.map((p) => (
            <div
              key={p.num}
              className="card p-3"
              style={{ background: 'var(--color-paper-light)' }}
            >
              <div
                className="font-bold"
                style={{
                  color: 'var(--color-ink-fade)',
                  fontSize: 28,
                  fontFamily: 'var(--font-serif)',
                  lineHeight: 1,
                }}
              >
                {p.num}
              </div>
              <div
                className="font-bold mt-1"
                style={{ color: 'var(--color-ink)', fontSize: 15 }}
              >
                {p.name}
              </div>
              <span
                className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold"
                style={{
                  color: colorVar(p.whoColor),
                  border: `1px solid ${colorVar(p.whoColor)}`,
                  background: colorSoft(p.whoColor),
                  letterSpacing: '0.1em',
                }}
              >
                {p.who}
              </span>
              <p
                className="text-xs m-0 mt-2"
                style={{ color: 'var(--color-ink-soft)', lineHeight: 1.55 }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section>
        <div
          className="font-bold mb-2"
          style={{
            color: 'var(--color-vermillion)',
            fontSize: 12,
            letterSpacing: '0.3em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          FEATURES · 알찬 기능들
        </div>
        <h2
          className="m-0 font-bold"
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
            lineHeight: 1.2,
          }}
        >
          가볍게 켜지만,
          <br />
          <span className="accent-hand" style={{ color: 'var(--color-vermillion)' }}>
            속은 꽉 차있다.
          </span>
        </h2>
        <p
          className="mt-3 text-sm sm:text-base"
          style={{ color: 'var(--color-ink-soft)', maxWidth: 620, lineHeight: 1.7 }}
        >
          참여자도 관전자도 헤매지 않도록, 토론에 꼭 필요한 기능만 추렸습니다.
          처음 와도 5분 안에 한 라운드 끝낼 수 있습니다.
        </p>
        <div className="grid gap-3 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-4 relative"
              style={{ background: 'var(--color-paper-light)' }}
            >
              {f.tag && (
                <div
                  className="absolute font-bold"
                  style={{
                    top: -8,
                    right: 14,
                    background: 'var(--color-vermillion)',
                    color: 'var(--color-paper-light)',
                    padding: '2px 8px',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    fontFamily: 'var(--font-mono)',
                    border: '1.5px solid var(--color-ink)',
                  }}
                >
                  {f.tag}
                </div>
              )}
              <div
                className="inline-flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  fontSize: 24,
                  background: colorSoft(f.color),
                  border: `1.5px solid ${colorVar(f.color)}`,
                  marginBottom: 10,
                }}
              >
                {f.icon}
              </div>
              <h3
                className="m-0 font-bold"
                style={{ color: 'var(--color-ink)', fontSize: 17 }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm m-0 mt-1"
                style={{ color: 'var(--color-ink-soft)', lineHeight: 1.6 }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="card-sketch p-4 text-center"
              style={{ background: 'var(--color-paper-light)' }}
            >
              <div
                className="font-bold leading-none"
                style={{
                  fontSize: 'clamp(36px, 6vw, 56px)',
                  color: 'var(--color-vermillion)',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {s.num}
                <span
                  className="ml-1"
                  style={{
                    fontSize: 14,
                    color: 'var(--color-ink-soft)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {s.unit}
                </span>
              </div>
              <div
                className="text-xs mt-2"
                style={{ color: 'var(--color-ink-fade)', letterSpacing: '0.05em' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section
        style={{
          background: 'var(--color-paper-light)',
          borderTop: '1.5px solid var(--color-ink)',
          borderBottom: '1.5px solid var(--color-ink)',
          padding: '40px 20px',
          marginLeft: -16,
          marginRight: -16,
        }}
      >
        <div
          className="font-bold mb-2"
          style={{
            color: 'var(--color-vermillion)',
            fontSize: 12,
            letterSpacing: '0.3em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          FAQ · 자주 묻는 것들
        </div>
        <h2
          className="m-0 font-bold"
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
            lineHeight: 1.2,
          }}
        >
          궁금한 건
          <br />
          <span className="accent-hand" style={{ color: 'var(--color-vermillion)' }}>
            여기서 끝.
          </span>
        </h2>
        <div className="space-y-2 mt-6 max-w-3xl">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="card p-3"
              style={{ background: 'var(--color-paper)' }}
            >
              <summary
                className="font-bold cursor-pointer"
                style={{
                  color: 'var(--color-ink)',
                  fontSize: 15,
                  listStyle: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{f.q}</span>
                <span style={{ color: 'var(--color-ink-fade)', fontSize: 12 }}>+</span>
              </summary>
              <p
                className="text-sm mt-2 mb-0"
                style={{
                  color: 'var(--color-ink-soft)',
                  lineHeight: 1.7,
                  paddingTop: 8,
                  borderTop: '1px dashed var(--color-ink-fade)',
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="text-center py-6">
        <div
          className="font-bold mb-2"
          style={{
            color: 'var(--color-vermillion)',
            fontSize: 12,
            letterSpacing: '0.3em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          START NOW
        </div>
        <h2
          className="m-0 font-bold"
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
            lineHeight: 1.2,
          }}
        >
          주제는 이미 정해졌다.
          <br />
          <span className="accent-hand" style={{ color: 'var(--color-vermillion)' }}>
            남은 건, 손을 드는 일.
          </span>
        </h2>
        <p
          className="mt-3 mx-auto text-sm sm:text-base"
          style={{
            color: 'var(--color-ink-soft)',
            maxWidth: 480,
            lineHeight: 1.7,
          }}
        >
          찬성과 반대, 단 두 자리. 관전석은 무한.
          <br />
          지금 첫 무대를 열고 도전자를 기다리세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <button
            onClick={onStart}
            className="btn btn-pri"
            style={{ padding: '12px 22px', fontSize: 15 }}
          >
            지금 시작하기 ▶
          </button>
        </div>
      </section>
    </div>
  );
}
