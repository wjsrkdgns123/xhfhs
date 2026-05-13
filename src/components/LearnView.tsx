import '../learn.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ScrollSpyNav } from './ScrollSpyNav';

// DOM section order — 자료실에 남은 5개 챕터(실전 적용 가능한 것만) + 마지막 콘텐츠 허브
const LEARN_SPY_ITEMS = [
  { id: 'ch1', label: '5대 원칙' },
  { id: 'ch3', label: '논리 오류' },
  { id: 'ch7', label: '준비 단계' },
  { id: 'ch8', label: '평가 기준' },
  { id: 'ch6', label: '실전 팁' },
  { id: 'hub', label: '더 깊게' },
];

type TocCat = '기초' | '심화' | '참고';
const TOC: { num: string; tt: string; meta: string; id: string; cat: TocCat }[] = [
  { num: '01', tt: '실무 5대 원칙', meta: '3 MIN', id: 'ch1', cat: '기초' },
  { num: '02', tt: '자주 등장하는 논리 오류 10', meta: '3 MIN', id: 'ch3', cat: '기초' },
  { num: '03', tt: '단계별 준비 체크리스트', meta: '3 MIN', id: 'ch7', cat: '기초' },
  { num: '04', tt: '공식 평가 기준', meta: '2 MIN', id: 'ch8', cat: '기초' },
  { num: '05', tt: '실전 팁 7', meta: '1 MIN', id: 'ch6', cat: '기초' },
];

const CONTENT_HUB: { id: string; label: string; cat: string; desc: string; count: string }[] = [
  {
    id: 'topics',
    label: '토론 주제 100선',
    cat: '주제',
    desc: '9개 카테고리·80+ 주제, 각 주제마다 찬·반 핵심 논점 정리. 검색·필터 가능.',
    count: '80+',
  },
  {
    id: 'formats',
    label: '토론 형식 도감',
    cat: '양식',
    desc: 'LD·Public Forum·Policy·Parliamentary 등 세계 주요 토론 양식 7종을 한눈에.',
    count: '7',
  },
  {
    id: 'fallacies',
    label: '논리 오류 백과',
    cat: '논증',
    desc: '관련성·구조·통계·모호성 등 8개 카테고리 54가지 오류 + 일상 예시·대응법.',
    count: '54',
  },
  {
    id: 'glossary',
    label: '용어 사전',
    cat: '레퍼런스',
    desc: '절차·역할·논증·평가·전략·양식까지 80+ 용어, 한국어·영어 병기.',
    count: '80+',
  },
  {
    id: 'famous',
    label: '명토론 아카이브',
    cat: '역사',
    desc: '소크라테스부터 알파고·AI 안전 논쟁까지 역사 속 명토론 20건.',
    count: '20',
  },
  {
    id: 'resources',
    label: '자원 모음',
    cat: '바깥',
    desc: '국내·세계 토론 대회 7곳, 추천 도서 5권, 온라인 자원 4개까지.',
    count: '16',
  },
  {
    id: 'samples',
    label: '샘플 토론',
    cat: '실전',
    desc: 'AI 사회자 진행으로 끝까지 마친 토론 4편 — 풀 transcript + 평가 분석.',
    count: '4',
  },
];

const CHECKLIST = [
  {
    phase: 'BEFORE',
    name: '토론 전 준비',
    items: [
      '주제 속 핵심 용어를 미리 정의해본다 ("X"의 범위 · 시점 · 대상)',
      '자기 측 핵심 논거 2~3개와 각 근거 자료를 정리해둔다',
      '상대가 던질 수 있는 강한 반박을 예상하고 대응을 메모',
      '입증책임이 자기 측에 있는지 확인 (찬성=있음, 반대=상대 입증 무너뜨리기)',
    ],
  },
  {
    phase: 'OPENING',
    name: '입론 단계',
    items: [
      '주장 → 이유 → 근거 → 결론 순서로 구조화',
      '핵심 주장은 첫 문장에서 명확히, 두루뭉술 금지',
      '근거는 자료(통계·인용)나 사례, 또는 논리적 추론 한 가지 이상',
      '한 라운드 발언을 한 메시지에 모두 담는다 (분할 발언 금지)',
    ],
  },
  {
    phase: 'REBUTTAL',
    name: '반박 단계',
    items: [
      '**새 논거 도입 금지** — 입론에서 제시되지 않은 논점은 꺼내지 말 것',
      '상대 발언을 1~2문장으로 정확히 인용 후 약점 지적',
      '약점 유형: 근거 부족 · 논리 비약 · 모호한 정의 · 사실 오류',
      '마지막에 자기 측 입장이 여전히 유효한 이유 한 줄 요약',
    ],
  },
  {
    phase: 'CLOSING',
    name: '마무리 자세',
    items: [
      '판정 직전엔 추가 발언 욕심 버리기 — 이미 쌓은 논거가 평가됨',
      '심사 멘트는 공정성 기준이지 한쪽 응원이 아님을 이해할 것',
      '결과에 관계없이 상대와 한 라운드를 끝낸 것 자체를 존중',
    ],
  },
];

const CRITERIA = [
  {
    tag: 'A',
    name: '논거의 질',
    weight: '30%',
    desc: '주장과 근거가 얼마나 탄탄하게 연결되는가. 인과·추론·자료가 모두 따라붙는지.',
  },
  {
    tag: 'B',
    name: '클래시(Clash)',
    weight: '25%',
    desc: '상대 논거에 정면으로 응답했는가. 옆길 가지 않고 직접 충돌한 비율.',
  },
  {
    tag: 'C',
    name: '입증책임 이행',
    weight: '20%',
    desc: '찬성: 명제 입증의 충분성 / 반대: 그 입증을 무너뜨린 정도.',
  },
  {
    tag: 'D',
    name: '논리 일관성',
    weight: '15%',
    desc: '발언 안에 모순이 없고 입론과 반박이 같은 방향으로 일관되는가.',
  },
  {
    tag: 'E',
    name: '표현 · 매너',
    weight: '10%',
    desc: '명확한 어휘, 인신공격·감정 격앙 없이 정중한 어조 유지.',
  },
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
  { k: 'CLASH', n: '논쟁의 충돌점', d: '양측이 정면으로 부딪치는 핵심 쟁점. 평가의 무게중심.' },
  { k: 'LINK', n: '연결고리', d: '근거에서 결론으로 가는 논리적 다리. 빠지면 비약이 된다.' },
  { k: 'IMPACT', n: '영향력', d: '주장이 받아들여졌을 때 발생하는 실제 결과의 크기.' },
  { k: 'FRAMEWORK', n: '평가 프레임', d: '"이 토론은 무엇 기준으로 누가 이긴 것인지" 측정 기준 제안.' },
  { k: 'WEIGHING', n: '비교 분석', d: '양측 임팩트를 비교해 자기 측이 왜 더 무거운지 설명.' },
  { k: 'BURDEN OF PROOF', n: '입증책임', d: '주장하는 쪽이 그것이 옳다는 근거를 댈 책임.' },
  { k: 'DEFINITION', n: '용어 정의', d: '주제 속 모호한 단어를 토론용으로 한정해 두는 절차.' },
  { k: 'WARRANT', n: '뒷받침', d: '근거가 왜 그 결론을 지지하는지 설명하는 논리 다리.' },
];

export function LearnView({
  onBack,
  onOpenContent,
}: {
  onBack: () => void;
  onOpenContent?: (
    page:
      | 'topics'
      | 'fallacies'
      | 'glossary'
      | 'famous'
      | 'samples'
      | 'formats'
      | 'resources',
  ) => void;
}) {
  useDocumentMeta(
    '자료실 — 토론배틀',
    '토론에 필요한 원칙, 논리 오류, 준비 단계, 평가 기준, 실전 팁까지. 5개 챕터·약 12분 분량. 토론 형식·역사·자원은 심화 콘텐츠로.',
  );
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="learn-page-v2">
      <ScrollSpyNav items={LEARN_SPY_ITEMS} />
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
                <b>원칙 · 논리 오류 · 준비 단계 · 평가 기준 · 실전 팁</b>까지.
                지금 한 판 들어가기 전 바로 적용할 수 있는 것들만 모았습니다.
                <b> 5개 챕터, 약 12분 분량.</b>
                <br />
                토론 형식·역사·자원처럼 학술·참고 자료는 페이지 맨 끝
                <b> 심화 콘텐츠</b>에서 따로 보세요.
              </p>
              <div
                style={{
                  marginTop: 16,
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
                <span>● <b style={{ color: 'var(--color-ink)' }}>5</b>대 평가 기준</span>
                <span>● <b style={{ color: 'var(--color-ink)' }}>15</b>가지 용어</span>
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
                    <span className={`toc-cat toc-cat--${t.cat === '기초' ? 'basic' : t.cat === '심화' ? 'advanced' : 'ref'}`}>{t.cat}</span>
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

      {/* CH 02 FALLACIES (CH 02 토론 형식은 /formats 페이지로 이동) */}
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
          <div className="section-eyebrow">CHAPTER 02 · 논리 오류 10</div>
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

      {/* CH 03 CHECKLIST (옛 CH 04 역사 속 명토론은 /famous 페이지로 이동) */}
      <section className="pad-sm" id="ch7">
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 03 · 단계별 준비 체크리스트</div>
          <h2 className="section-title">
            막막할 땐
            <br />
            <span className="hand">이 리스트부터.</span>
          </h2>
          <p className="section-lead">
            토론 전, 입론, 반박, 마무리 — 단계마다 빠뜨리기 쉬운 것을
            점검하세요. 외우지 말고, 시작 전 한 번 훑어보면 됩니다.
          </p>

          <div className="checklist-grid">
            {CHECKLIST.map((c) => (
              <div key={c.phase} className="checklist">
                <div className="checklist__tag">{c.phase}</div>
                <h3 className="checklist__name">{c.name}</h3>
                <ul className="checklist__items">
                  {c.items.map((it, i) => (
                    <li key={i}>
                      <span className="checklist__check">✓</span>
                      <span dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CH 06 CRITERIA */}
      <section
        className="pad-sm"
        id="ch8"
        style={{
          background: 'var(--color-paper-light)',
          borderTop: '1.5px solid var(--color-ink)',
          borderBottom: '1.5px solid var(--color-ink)',
        }}
      >
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 04 · 공식 평가 기준</div>
          <h2 className="section-title">
            누가 이긴 건지,
            <br />
            <span className="hand">이렇게 본다.</span>
          </h2>
          <p className="section-lead">
            토론배틀의 AI 판정과 실제 대회 심사가 공통으로 보는 다섯 항목.
            가중치는 대회별로 다르지만 우선순위는 비슷합니다.
          </p>

          <div className="criteria">
            {CRITERIA.map((c) => (
              <div key={c.tag} className="criterion">
                <div className="criterion__tag">{c.tag}</div>
                <div className="criterion__main">
                  <div className="criterion__head">
                    <h3 className="criterion__name">{c.name}</h3>
                    <span className="criterion__weight">{c.weight}</span>
                  </div>
                  <p className="criterion__desc">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIPS + GLOSSARY (옛 CH 07 자원은 /resources 페이지로 이동) */}
      <section className="pad-sm" id="ch6">
        <div className="wrap">
          <div className="section-eyebrow">CHAPTER 05 · 실전 팁 7</div>
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

      {/* CONTENT HUB — 별도 콘텐츠 페이지 5선 (자료실 맨 마지막) */}
      <section className="pad-sm" id="hub">
        <div className="wrap">
          <div className="section-eyebrow">CONTENT · 더 깊게 보기</div>
          <h2 className="section-title">
            자료실 너머,
            <br />
            <span className="hand">전용 페이지로.</span>
          </h2>
          <p className="section-lead">
            자료실은 한 자리에서 훑어보는 곳. 더 풍부한 데이터·검색·카테고리
            필터가 필요할 땐 아래 다섯 콘텐츠 페이지로.
          </p>
          <div className="hub-grid">
            {CONTENT_HUB.map((c) => (
              <button
                key={c.id}
                type="button"
                className="hub-card"
                onClick={() => onOpenContent?.(c.id as
                    | 'topics'
                    | 'fallacies'
                    | 'glossary'
                    | 'famous'
                    | 'samples'
                    | 'formats'
                    | 'resources')}
              >
                <div className="hub-card__top">
                  <span className="hub-card__cat">{c.cat}</span>
                  <span className="hub-card__count">{c.count}</span>
                </div>
                <div className="hub-card__label">{c.label}</div>
                <div className="hub-card__desc">{c.desc}</div>
                <div className="hub-card__cta">자세히 보기 →</div>
              </button>
            ))}
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
