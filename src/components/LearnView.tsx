import '../learn.css';

const TOC = [
  { num: '01', tt: '실무 5대 원칙', meta: '3 MIN', id: 'ch1' },
  { num: '02', tt: '대표적인 토론 형식 4', meta: '2 MIN', id: 'ch2' },
  { num: '03', tt: '자주 등장하는 논리 오류 10', meta: '3 MIN', id: 'ch3' },
  { num: '04', tt: '던지기 좋은 주제 20', meta: '1 MIN', id: 'topics' },
  { num: '05', tt: '역사 속 명토론', meta: '2 MIN', id: 'ch5' },
  { num: '06', tt: '실전 팁 7', meta: '1 MIN', id: 'ch6' },
];

const PRINCIPLES = [
  {
    num: '01 · PROOF',
    hand: '立',
    name: '입증책임',
    desc: '명제를 주장하는 쪽이 입증한다. 찬성이 입증을 못 하면, 반대가 반박하지 않아도 진다.',
    egNode: (
      <>
        예) <b>"외계인은 있다"</b>는 사람이 증명할 책임, 없다는 사람은 부재를 증명할 의무가 없다.
      </>
    ),
  },
  {
    num: '02 · CLASH',
    hand: '衝',
    name: '정면 충돌',
    desc: '상대 핵심 논거에 직접 응답한다. 옆길로 새는 발언은 평가에서 깎인다.',
    egNode: (
      <>
        "AI가 일자리 줄인다" → "<b>X 분야에서 Y만큼 새로 만든다</b>"로 받기.
      </>
    ),
  },
  {
    num: '03 · NO NEW',
    hand: '禁',
    name: '반박서 새 논거 금지',
    desc: '입론에서 다 꺼냈어야 한다. 반박에 갑자기 등장한 논거는 상대가 응답할 기회가 줄어 불공정.',
    egNode: (
      <>
        입론에 A·B·C만 있었다면, 반박에서 D는 <b>나올 수 없다</b>.
      </>
    ),
  },
  {
    num: '04 · EVIDENCE',
    hand: '據',
    name: '근거 기반',
    desc: '"느낌상" 대신 자료·사례·논리적 추론. 출처가 있으면 강력해진다.',
    egNode: (
      <>
        "환경에 안 좋아요"(X) → "<b>OECD 2023 보고서: 5년 후 14% 감소</b>"(O)
      </>
    ),
  },
  {
    num: '05 · RESPECT',
    hand: '禮',
    name: '인신공격 금지',
    desc: '논거가 아니라 사람을 공격하면 토론의 품격과 내 주장의 신뢰도가 함께 떨어진다.',
    egNode: (
      <>
        "전문가도 아니잖아요"(X) → "<b>표본이 30명뿐인데 일반화 가능할까요?</b>"(O)
      </>
    ),
  },
];

const FORMATS = [
  {
    name: 'Lincoln–Douglas (LD)',
    sub: '1:1 · 약 45분 · 가치 · 철학',
    desc: '미국 고등학교 토론의 대표격. 도덕·윤리 같은 추상적 가치를 다룬다. "정의는 자유보다 우선되어야 한다" 같은 주제.',
    stats: [
      { k: 'PERSONS', v: '1 : 1' },
      { k: 'TIME', v: '45 MIN' },
      { k: 'FOCUS', v: 'VALUE' },
    ],
  },
  {
    name: 'Public Forum',
    sub: '2:2 · 약 35분 · 대중적 · 정책',
    desc: '일반 청중이 이해할 수 있는 시사 정책 중심. "한국은 청소년 SNS 사용을 법으로 제한해야 한다" 같은 사회 이슈.',
    stats: [
      { k: 'PERSONS', v: '2 : 2' },
      { k: 'TIME', v: '35 MIN' },
      { k: 'FOCUS', v: 'POLICY' },
    ],
  },
  {
    name: 'Policy (CX)',
    sub: '2:2 · 약 90분 · 깊이 · 자료',
    desc: '특정 정책 하나를 깊이 있게 분석한다. 방대한 자료 준비가 필수. 대학·대학원 수준 토론에서 흔하다.',
    stats: [
      { k: 'PERSONS', v: '2 : 2' },
      { k: 'TIME', v: '90 MIN' },
      { k: 'FOCUS', v: 'DEPTH' },
    ],
  },
  {
    name: 'Parliamentary',
    sub: '2:2 · 약 60분 · 즉흥 · 의회식',
    desc: '주제가 토론 직전에 공개되어 즉흥 대응이 핵심. 영국 의회 토론에서 유래. 순발력과 균형감을 평가.',
    stats: [
      { k: 'PERSONS', v: '2 : 2' },
      { k: 'TIME', v: '60 MIN' },
      { k: 'FOCUS', v: 'IMPROV' },
    ],
  },
];

const FALLACIES = [
  {
    num: '01',
    name: '허수아비 오류 (Strawman)',
    short: '— 상대 주장을 약화시킨 형태로 비틀어 공격',
    bodyNode: (
      <>
        예) <b>"AI 규제하자"</b>를 → "AI 다 금지하자는 거냐"로 비틀기
      </>
    ),
    open: true,
  },
  {
    num: '02',
    name: '인신공격 (Ad Hominem)',
    short: '— 논거가 아니라 사람을 공격',
    bodyNode: <>예) "네가 그 분야 전공도 아닌데 뭘 알아"</>,
  },
  {
    num: '03',
    name: '권위에 호소',
    short: '— 유명인이 했다 = 옳다는 주장',
    bodyNode: <>예) "스티브 잡스가 그렇게 말했으니 맞다"</>,
  },
  {
    num: '04',
    name: '미끄러운 비탈길',
    short: '— 작은 변화가 극단적 결과로 이어진다는 비약',
    bodyNode: <>예) "A를 허용하면 → B → C → 결국 사회 붕괴"</>,
  },
  {
    num: '05',
    name: '잘못된 이분법',
    short: '— 여러 선택지가 있는데 둘 중 하나로 강제',
    bodyNode: <>예) "우리 편이 아니면 적이다"</>,
  },
  {
    num: '06',
    name: '순환 논증',
    short: '— 결론을 전제로 다시 쓰는 것',
    bodyNode: <>예) "성경은 진실이다. 왜냐하면 성경에 그렇게 쓰여 있으니까"</>,
  },
  {
    num: '07',
    name: '일화적 증거',
    short: '— 한두 가지 사례로 일반화',
    bodyNode: (
      <>
        예) "우리 할아버지는 매일 담배 피우셨는데 90세까지 사셨다.{' '}
        <b>그러니 흡연은 해롭지 않다</b>."
      </>
    ),
  },
  {
    num: '08',
    name: '군중에 호소',
    short: '— 많은 사람이 믿으니까 옳다는 주장',
    bodyNode: <>예) "다들 이렇게 한다, 그러니까 맞다"</>,
  },
  {
    num: '09',
    name: '동음이의어 오류',
    short: '— 같은 단어를 다른 의미로 쓰며 결론을 끌어냄',
    bodyNode: <>예) "법은 인간이 만든 거다. 자연법도 법이니까 인간이 만든 거다"</>,
  },
  {
    num: '10',
    name: '후건 긍정',
    short: '— 결과가 같으면 원인도 같다는 잘못된 추론',
    bodyNode: (
      <>
        예) "비가 오면 길이 젖는다. 길이 젖었다.{' '}
        <b>그러므로 비가 왔다</b>" (스프링클러일 수도)
      </>
    ),
  },
];

const TOPICS_CATS = ['전체 20', '#사회 5', '#기술 5', '#철학 5', '#생활 5'];
const TOPICS = [
  { cat: '#사회', q: '청소년의 SNS 사용을 법으로 제한해야 하는가' },
  { cat: '#사회', q: '학교 폭력 가해자의 신상을 공개해야 하는가' },
  { cat: '#사회', q: '주 4일 근무제는 한국에서 가능한가' },
  { cat: '#사회', q: '동성결혼은 법적으로 인정되어야 하는가' },
  { cat: '#사회', q: '복지 확대가 근로 의욕을 떨어뜨리는가' },
  { cat: '#기술', q: 'AI는 인간의 일자리를 대체해야 하는가' },
  { cat: '#기술', q: 'AI 생성 콘텐츠에 저작권을 인정해야 하는가' },
  { cat: '#기술', q: 'SNS 알고리즘은 규제되어야 하는가' },
  { cat: '#기술', q: '자율주행차 사고의 책임은 누가 지는가' },
  { cat: '#기술', q: '암호화폐는 화폐로 인정되어야 하는가' },
  { cat: '#철학', q: '인간은 자유의지를 가지고 있는가' },
  { cat: '#철학', q: '거짓말은 언제든 나쁜가' },
  { cat: '#철학', q: '동물에게도 권리가 있는가' },
  { cat: '#철학', q: '예술의 가치는 시장이 결정하는가' },
  { cat: '#철학', q: '행복은 측정 가능한가' },
  { cat: '#생활', q: '결혼 전 동거는 결혼생활에 도움이 되는가' },
  { cat: '#생활', q: '반려동물은 가족 구성원인가' },
  { cat: '#생활', q: '직장에서 야근은 능력의 증거인가' },
  { cat: '#생활', q: '명절 가족 모임은 의무인가', },
  { cat: '#생활', q: '연애 전 부모님께 미리 인사해야 하는가' },
];

const HISTORIC = [
  {
    year: '1858',
    title: 'Lincoln–Douglas Debates',
    desc: '미국 상원 선거 중 링컨과 더글러스의 7회 토론. 노예제를 두고 펼쳐진 공개 토론으로, 이후 LD 토론 형식의 어원이 됨.',
  },
  {
    year: '1960',
    title: 'Kennedy vs Nixon TV 토론',
    desc: '미국 대선 사상 첫 TV 토론. 라디오 청취자는 닉슨이 이겼다 봤지만 TV 시청자는 케네디가 이겼다 평가. "이미지의 시대"를 연 분기점.',
  },
  {
    year: '2016',
    title: 'Apple vs FBI 암호화 논쟁',
    desc: '샌버나디노 테러범 휴대폰의 잠금 해제를 두고 FBI가 Apple에 요구. 보안 vs 수사권의 충돌. 결국 FBI가 외부 업체로 해킹.',
  },
  {
    year: '2024',
    title: 'Trump vs Harris 대선 토론',
    desc: 'ABC 주최. 진행자의 실시간 팩트체크가 화제. "정치 토론에서 진행자의 역할은 어디까지인가"라는 메타 논쟁을 촉발.',
  },
];

const TIPS: Array<{ num: string; node: React.ReactNode }> = [
  {
    num: '01',
    node: (
      <>
        상대 핵심 논거를 <b>한 줄씩 메모</b>하라.
      </>
    ),
  },
  {
    num: '02',
    node: (
      <>
        반박은 <b>1~2개에만 집중</b>한다. 다 잡으려다 다 놓친다.
      </>
    ),
  },
  {
    num: '03',
    node: (
      <>
        내 입장을 <b>한 줄로 요약</b>해 두자. 마무리에서 다시 쓸 카드.
      </>
    ),
  },
  {
    num: '04',
    node: (
      <>
        구체적 사례 <b>1개</b>를 미리 준비 — "예를 들어..."가 강력하다.
      </>
    ),
  },
  {
    num: '05',
    node: (
      <>
        감정이 격해질 땐 <b>30초 호흡</b>. 인신공격으로 빠지면 자동 감점.
      </>
    ),
  },
  {
    num: '06',
    node: (
      <>
        <b>핵심 단어 정의</b>로 시작하라. 모호한 단어는 토론을 흐린다.
      </>
    ),
  },
  {
    num: '07',
    node: (
      <>
        마무리에서 <b>핵심 쟁점</b>을 다시 한 번 — 마지막 인상이 평가를 좌우.
      </>
    ),
  },
];

const GLOSSARY = [
  { k: 'PRO / 찬성', n: '입론하는 쪽', d: '명제에 동의하는 측. 입증책임을 진다.' },
  { k: 'CON / 반대', n: '반박하는 쪽', d: '명제에 반대하는 측. 찬성의 입증 부재를 짚을 수 있다.' },
  { k: 'MODERATOR', n: '사회자', d: '단계를 진행하고 종료 시 정성 평가를 제공.' },
  { k: 'REBUTTAL', n: '반박', d: '상대 입론의 약점을 짚고 다시 자기 측을 정리하는 단계.' },
  { k: 'VERDICT', n: '판정', d: '관전자 투표 + AI 정성평가의 결합으로 승부 결정.' },
  { k: 'OBJECTION', n: '이의 있음', d: '상대 논리의 결함을 강조하며 끼어드는 컷-인. 1회 한정.' },
];

export function LearnView({ onBack }: { onBack: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="learn-page-v2">
      {/* HERO */}
      <section className="learn-hero">
        <div className="wrap">
          <div className="learn-hero__inner">
            <div>
              <div className="lobby-hero__eyebrow">REFERENCE · 토론 참고자료실</div>
              <h1 className="lobby-hero__title">
                토론에 필요한,
                <br />
                <span className="hand">모든 자료.</span>
              </h1>
              <p className="lobby-hero__sub">
                <b>원칙 · 형식 · 오류 · 주제 · 역사 · 실전 팁</b>까지. 토론에
                필요한 이론을 한 자리에 모았습니다. 처음 만나거나 다시 정리하고
                싶을 때 펼쳐보세요. <b>6개 챕터, 약 12분 분량.</b>
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => scrollTo('ch1')} className="lpbtn lpbtn--pri lpbtn--lg">
                  01부터 시작하기 ▶
                </button>
                <button onClick={() => scrollTo('topics')} className="lpbtn lpbtn--lg">
                  주제만 훑어보기
                </button>
              </div>
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  gap: 18,
                  flexWrap: 'wrap',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  color: 'var(--color-ink-fade)',
                  letterSpacing: '0.06em',
                }}
              >
                <span>● <b style={{ color: 'var(--color-ink)' }}>5</b>대 원칙</span>
                <span>● <b style={{ color: 'var(--color-ink)' }}>10</b>가지 논리 오류</span>
                <span>● <b style={{ color: 'var(--color-ink)' }}>20</b>개 토론 주제</span>
                <span>● <b style={{ color: 'var(--color-ink)' }}>7</b>가지 실전 팁</span>
              </div>
            </div>

            <aside className="learn-toc" aria-label="목차">
              <div className="learn-toc__head">
                <span>TABLE OF CONTENTS</span>
                <span>12 MIN</span>
              </div>
              <ul className="learn-toc__list">
                {TOC.map((t) => (
                  <li key={t.num} onClick={() => scrollTo(t.id)}>
                    <span className="num">{t.num}</span>
                    <span className="tt">{t.tt}</span>
                    <span className="meta">{t.meta}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* CH 01 PRINCIPLES */}
      <section
        className="pad-sm"
        id="ch1"
        style={{
          background: 'var(--color-paper-light)',
          borderTop: '1.5px solid var(--color-ink)',
          borderBottom: '1.5px solid var(--color-ink)',
        }}
      >
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 01 · 실무 5대 원칙</div>
          <h2 className="section-title">
            룰을 알면
            <br />
            <span className="hand">반은 이긴 셈.</span>
          </h2>
          <p className="section-lead">
            실제 토론장에서 평가 기준이 되는 다섯 가지. 외울 필요는 없고, 한 번
            읽어두면 발언이 달라집니다.
          </p>

          <div className="principles">
            {PRINCIPLES.map((p) => (
              <div key={p.num} className="principle">
                <div className="principle__num">{p.num}</div>
                <div className="principle__hand">{p.hand}</div>
                <h3 className="principle__name">{p.name}</h3>
                <p className="principle__desc">{p.desc}</p>
                <div className="principle__eg">{p.egNode}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CH 02 FORMATS */}
      <section className="pad-sm" id="ch2">
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 02 · 토론 형식</div>
          <h2 className="section-title">
            한국 밖엔 이런
            <br />
            <span className="hand">정형 토론들이 있다.</span>
          </h2>
          <p className="section-lead">
            토론배틀은 1:1 단순 라운드를 쓰지만, 세계엔 더 길고 복잡한 정식
            포맷이 많습니다. 각 형식이 무엇을 평가하려고 만들어졌는지 보면
            토론의 본질이 잡힙니다.
          </p>

          <div className="formats">
            {FORMATS.map((f) => (
              <div key={f.name} className="format">
                <div className="format__tag">FORMAT</div>
                <h3 className="format__name">{f.name}</h3>
                <div className="format__sub">{f.sub}</div>
                <p className="format__desc">{f.desc}</p>
                <div className="format__stats">
                  {f.stats.map((s) => (
                    <div key={s.k} className="st">
                      <div className="st__k">{s.k}</div>
                      <div className="st__v">{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CH 03 FALLACIES */}
      <section
        className="pad-sm"
        id="ch3"
        style={{
          background: 'var(--color-paper-deep)',
          borderTop: '1.5px solid var(--color-ink)',
          borderBottom: '1.5px solid var(--color-ink)',
        }}
      >
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 03 · 논리 오류 10</div>
          <h2 className="section-title">
            반박할 때
            <br />
            <span className="hand">상대의 어디를 칠 것인가.</span>
          </h2>
          <p className="section-lead">
            실제 토론에서 가장 자주 등장하는 논리 오류 10가지. 외워두면 상대
            발언의 구멍이 보이기 시작합니다. 누르면 예시가 펼쳐집니다.
          </p>

          <ul className="fallacies">
            {FALLACIES.map((f) => (
              <li key={f.num}>
                <details className="fallacy" open={f.open}>
                  <summary>
                    <span className="fallacy__num">{f.num}</span>
                    <span className="fallacy__name">{f.name}</span>
                    <span className="fallacy__short">{f.short}</span>
                    <span className="fallacy__chev">{f.open ? '−' : '+'}</span>
                  </summary>
                  <div className="fallacy__body">{f.bodyNode}</div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CH 04 TOPICS */}
      <section className="pad-sm" id="topics">
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 04 · 던지기 좋은 주제 20</div>
          <h2 className="section-title">
            뭘로 싸울지
            <br />
            <span className="hand">막막할 때.</span>
          </h2>
          <p className="section-lead">
            분야별 클래식 토픽 모음. 카드를 누르면 해당 주제로 바로 무대를 엽니다.
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {TOPICS_CATS.map((c, i) => (
              <button key={c} className={`chip${i === 0 ? ' active' : ''}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="topics-grid">
            {TOPICS.map((t) => (
              <button key={t.q} onClick={onBack} className="topic-card">
                <div className="topic-card__cat">{t.cat}</div>
                <div className="topic-card__q">{t.q}</div>
                <span className="topic-card__arrow">→</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button onClick={onBack} className="lpbtn">
              🎲 AI에게 새 주제 추천받기
            </button>
          </div>
        </div>
      </section>

      {/* CH 05 HISTORIC TIMELINE */}
      <section
        className="pad-sm"
        id="ch5"
        style={{
          background: 'var(--color-paper-light)',
          borderTop: '1.5px solid var(--color-ink)',
          borderBottom: '1.5px solid var(--color-ink)',
        }}
      >
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 05 · 역사 속 명토론</div>
          <h2 className="section-title">
            세상을 바꾼
            <br />
            <span className="hand">네 번의 충돌.</span>
          </h2>
          <p className="section-lead">
            토론은 단순한 말싸움이 아니라 시대의 변곡점이었습니다. 이미지·기술·법의
            영역에서 각각 어떤 토론이 분수령을 만들었는지 살펴봅니다.
          </p>

          <div className="timeline">
            {HISTORIC.map((h, i) => (
              <div key={h.year} className="timeline__item">
                <span className="timeline__dot">{i + 1}</span>
                <div className="timeline__year">{h.year}</div>
                <h3 className="timeline__title">{h.title}</h3>
                <p className="timeline__desc">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CH 06 TIPS + GLOSSARY */}
      <section className="pad-sm" id="ch6">
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 06 · 실전 팁 7</div>
          <h2 className="section-title">
            무대 위에서
            <br />
            <span className="hand">바로 써먹는 7가지.</span>
          </h2>
          <p className="section-lead">
            라운드가 시작되면 머리가 새하얘집니다. 그 순간을 위한 짧은
            체크리스트.
          </p>

          <div className="tips-grid">
            {TIPS.map((t) => (
              <div key={t.num} className="tip">
                <div className="tip__num">{t.num}</div>
                <div className="tip__txt">{t.node}</div>
              </div>
            ))}
            <div
              className="tip"
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-paper-light)',
                borderColor: 'var(--color-ink)',
              }}
            >
              <div className="tip__num" style={{ color: 'var(--color-paper-light)' }}>
                +
              </div>
              <div
                className="tip__txt"
                style={{ color: '#d9c9a8', fontFamily: 'var(--font-hand)' }}
              >
                <b
                  style={{
                    color: 'var(--color-vermillion)',
                    background: 'transparent',
                    padding: 0,
                  }}
                >
                  팁이 끝났다면
                </b>
                <br />
                지금 바로 한 판 시작해보자.
              </div>
            </div>
          </div>

          {/* Mini glossary */}
          <div style={{ marginTop: 56 }}>
            <div className="ribbon">GLOSSARY</div>
            <h3
              style={{
                fontFamily: 'var(--font-display-lite)',
                fontSize: 28,
                letterSpacing: '-0.02em',
                margin: '0 0 18px',
              }}
            >
              자주 쓰는 용어
            </h3>
            <div className="glossary">
              {GLOSSARY.map((g) => (
                <div key={g.k} className="term">
                  <div className="term__k">{g.k}</div>
                  <div className="term__n">{g.n}</div>
                  <div className="term__d">{g.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="tight">
        <div className="wrap">
          <div className="cta-block">
            <div className="section-eyebrow">START NOW</div>
            <h2>
              이제
              <br />
              <span className="hand">실전으로.</span>
            </h2>
            <p>이론은 충분합니다. 실력은 한 판 끝낼 때마다 늡니다.</p>
            <div
              style={{
                display: 'inline-flex',
                gap: 14,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button onClick={onBack} className="lpbtn lpbtn--pri lpbtn--lg">
                🎯 토론장으로 가기 ▶
              </button>
              <button
                onClick={() => scrollTo('ch1')}
                className="lpbtn lpbtn--lg"
                style={{ background: 'var(--color-paper-light)' }}
              >
                처음부터 다시 읽기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
