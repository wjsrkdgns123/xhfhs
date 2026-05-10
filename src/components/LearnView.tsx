import { useState } from 'react';

const PRINCIPLES = [
  {
    title: '입증책임 (Burden of Proof)',
    body: '명제를 주장하는 쪽이 그것을 입증할 책임을 진다. 토론배틀에서는 찬성 측이 입증책임을 진다. 입증이 충분하지 않으면 반대가 따로 반박하지 않아도 찬성 측이 패배할 수 있다.',
    example: '"외계인은 존재한다"고 주장하는 사람이 증명해야지, "존재하지 않는다"고 주장하는 사람이 부재를 증명할 의무는 없다.',
  },
  {
    title: '클래시 (Clash)',
    body: '토론의 핵심은 양측 주장이 직접 충돌하는 지점에서 결정된다. 옆길로 새는 발언은 평가에서 깎인다. 상대의 핵심 논거를 인용하고, 그것에 직접 응답해야 한다.',
    example: '상대가 "AI는 일자리를 줄인다"고 했다면, 단순히 "AI는 좋다"고 답하는 게 아니라 "AI가 줄이는 일자리보다 새로 만드는 일자리가 많다 — 구체적으로 X 분야에서 Y만큼"이라고 응답해야 한다.',
  },
  {
    title: '반박 단계에서 새 논거 도입 금지',
    body: '입론에서 자기 측 논거를 모두 꺼냈어야 한다. 반박 단계에서 새로 등장한 논거는 상대가 응답할 기회가 줄어 불공정하다.',
    example: '찬성이 입론에서 "A, B, C"만 말했다면, 반박에서 갑자기 "D"를 꺼낼 수 없다. D는 입론에 포함되었어야 한다.',
  },
  {
    title: '근거 기반 발언',
    body: '"내 생각엔" "느낌상" 같은 주관적 표현보다 자료·사례·논리적 추론을 동반해야 설득력이 생긴다. 출처가 있으면 더 강력하다.',
    example: '"환경에 안 좋아요" (X) → "OECD 2023년 보고서에 따르면 X 정책 도입 5년 후 탄소 배출이 14% 감소했다" (O)',
  },
  {
    title: '인신공격·감정적 격앙 금지',
    body: '상대의 논거가 아닌 상대 자체를 공격하는 것은 가장 흔한 오류다. 토론의 품격이 떨어지고 본인 주장의 신뢰도도 함께 떨어진다.',
    example: '"당신은 이 분야 전문가도 아니잖아요" (X) → "그 자료의 표본 크기가 30명뿐인데, 일반화하기엔 부족하지 않을까요?" (O)',
  },
];

const FORMATS = [
  {
    name: 'Lincoln-Douglas (LD)',
    persons: '1 : 1',
    duration: '약 45분',
    focus: '가치 · 철학',
    desc: '미국 고등학교 토론 형식의 대표격. 도덕·윤리 같은 추상적 가치를 다룬다. "정의는 자유보다 우선되어야 한다" 같은 주제.',
  },
  {
    name: 'Public Forum',
    persons: '2 : 2',
    duration: '약 35분',
    focus: '대중적 · 정책',
    desc: '일반 청중이 이해할 수 있는 시사 정책 중심. "한국은 청소년 SNS 사용을 법으로 제한해야 한다" 같은 사회 이슈.',
  },
  {
    name: 'Policy (CX)',
    persons: '2 : 2',
    duration: '약 90분',
    focus: '깊이 · 자료',
    desc: '특정 정책 하나를 깊이 있게 분석한다. 방대한 자료 준비가 필수. 대학·대학원 수준 토론에서 흔하다.',
  },
  {
    name: 'Parliamentary',
    persons: '2 : 2',
    duration: '약 60분',
    focus: '즉흥 · 의회식',
    desc: '주제가 토론 직전에 공개되어 즉흥 대응이 핵심. 영국 의회 토론에서 유래. 순발력과 균형감을 평가.',
  },
];

const FALLACIES = [
  { name: '허수아비 오류 (Strawman)', explain: '상대 주장을 약화시킨 형태로 비틀어 공격', sample: '"AI 규제하자"는 주장을 → "AI 다 금지하자는 거냐"로 비틀기' },
  { name: '인신공격 (Ad Hominem)', explain: '논거가 아니라 사람을 공격', sample: '"네가 그 분야 전공도 아닌데 뭘 알아"' },
  { name: '권위에 호소', explain: '유명인이 했다 = 옳다는 주장', sample: '"스티브 잡스가 그렇게 말했으니 맞다"' },
  { name: '미끄러운 비탈길', explain: '작은 변화가 극단적 결과로 이어진다는 비약', sample: '"동성결혼 허용하면 다음엔 다자혼, 결국 사회 붕괴"' },
  { name: '잘못된 이분법', explain: '실제로는 여러 선택지가 있는데 둘 중 하나로 강제', sample: '"우리 편이 아니면 적이다"' },
  { name: '순환 논증', explain: '결론을 전제로 다시 쓰는 것', sample: '"성경은 진실이다. 왜냐하면 성경에 그렇게 쓰여 있으니까"' },
  { name: '일화적 증거', explain: '한두 가지 사례로 일반화', sample: '"내 할아버지는 매일 담배 피우셨는데 90세까지 사셨다. 그러니 흡연은 해롭지 않다"' },
  { name: '군중에 호소', explain: '많은 사람이 믿으니까 옳다는 주장', sample: '"다들 이렇게 한다, 그러니까 맞다"' },
  { name: '동음이의어 오류', explain: '같은 단어를 다른 의미로 쓰며 결론을 끌어냄', sample: '"법은 인간이 만든 거다. 자연법도 법이니까 인간이 만든 거다"' },
  { name: '후건 긍정', explain: '결과가 같으면 원인도 같다는 잘못된 추론', sample: '"비가 오면 길이 젖는다. 길이 젖었다. 그러므로 비가 왔다"' },
];

const TOPICS = {
  사회: [
    '청소년의 SNS 사용을 법으로 제한해야 하는가',
    '학교 폭력 가해자의 신상을 공개해야 하는가',
    '주 4일 근무제는 한국에서 가능한가',
    '동성결혼은 법적으로 인정되어야 하는가',
    '복지 확대가 근로 의욕을 떨어뜨리는가',
  ],
  기술: [
    'AI는 인간의 일자리를 대체해야 하는가',
    'AI 생성 콘텐츠에 저작권을 인정해야 하는가',
    'SNS 알고리즘은 규제되어야 하는가',
    '자율주행차 사고의 책임은 누가 지는가',
    '암호화폐는 화폐로 인정되어야 하는가',
  ],
  철학: [
    '인간은 자유의지를 가지고 있는가',
    '거짓말은 언제든 나쁜가',
    '동물에게도 권리가 있는가',
    '예술의 가치는 시장이 결정하는가',
    '행복은 측정 가능한가',
  ],
  생활: [
    '연애 전에 부모님께 미리 인사해야 하는가',
    '결혼 전 동거는 결혼생활에 도움이 되는가',
    '반려동물은 가족 구성원인가',
    '직장에서 야근은 능력의 증거인가',
    '명절 가족 모임은 의무인가',
  ],
};

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

const TIPS = [
  '듣고 메모하라 — 상대의 핵심 논거 한 줄씩 적기',
  '상대 논거 1-2개에만 집중 — 모든 걸 반박하려다 다 못 한다',
  '자기 입장을 한 줄로 요약해 두기 — 마무리에서 다시 강조용',
  '구체적 사례를 1개 미리 준비 — "예를 들어..."가 강력하다',
  '감정이 격해질 때 30초 호흡 — 인신공격으로 빠지지 않게',
  '핵심 단어 정의로 시작 — 모호한 단어는 토론을 흐린다',
  '마무리에서 핵심 쟁점 재강조 — 마지막 인상이 평가를 좌우',
];

export function LearnView({ onBack }: { onBack: () => void }) {
  const [openFallacy, setOpenFallacy] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="btn btn-ghost text-sm"
          style={{ padding: '4px 10px' }}
        >
          ← 로비로
        </button>
      </div>

      <header className="text-center py-4">
        <div
          className="text-xs font-bold mb-1"
          style={{ color: 'var(--color-ink-fade)', letterSpacing: '0.25em' }}
        >
          LEARN · 자료실
        </div>
        <h1
          className="m-0 font-bold accent-hand"
          style={{
            fontSize: 'clamp(32px, 6vw, 48px)',
            color: 'var(--color-ink)',
            letterSpacing: '-0.02em',
          }}
        >
          토론 입문 가이드
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          토론을 처음 시작하는 사람도 따라할 수 있는 핵심 원칙과 사례
        </p>
      </header>

      {/* 1. 원칙 */}
      <section className="card-sketch p-4 sm:p-5">
        <SectionTitle num="01" title="토론 실무 5대 원칙" />
        <div className="space-y-3 mt-4">
          {PRINCIPLES.map((p, i) => (
            <div
              key={i}
              className="card p-3"
              style={{
                background: 'var(--color-paper)',
                borderLeft: '4px solid var(--color-vermillion)',
              }}
            >
              <div
                className="font-bold mb-1"
                style={{ color: 'var(--color-ink)', fontSize: 16 }}
              >
                {p.title}
              </div>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-ink-soft)', lineHeight: 1.6 }}
              >
                {p.body}
              </p>
              <p
                className="text-xs mt-2 m-0"
                style={{ color: 'var(--color-ink-fade)' }}
              >
                💡 <em>{p.example}</em>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 형식 */}
      <section className="card-sketch p-4 sm:p-5">
        <SectionTitle num="02" title="대표적인 토론 형식" />
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <div
              key={f.name}
              className="card p-3"
              style={{ background: 'var(--color-paper)' }}
            >
              <div
                className="font-bold"
                style={{ color: 'var(--color-vermillion)', fontSize: 15 }}
              >
                {f.name}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-ink-fade)' }}
              >
                {f.persons} · {f.duration} · {f.focus}
              </div>
              <p
                className="text-sm mt-2 m-0"
                style={{ color: 'var(--color-ink-soft)', lineHeight: 1.55 }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 논리적 오류 */}
      <section className="card-sketch p-4 sm:p-5">
        <SectionTitle num="03" title="자주 등장하는 논리적 오류 10" />
        <p
          className="text-xs mb-3"
          style={{ color: 'var(--color-ink-fade)' }}
        >
          각 항목을 눌러 예시를 볼 수 있습니다.
        </p>
        <div className="space-y-1.5">
          {FALLACIES.map((f, i) => {
            const open = openFallacy === i;
            return (
              <button
                key={f.name}
                onClick={() => setOpenFallacy(open ? null : i)}
                className="card w-full text-left p-3 transition"
                style={{
                  background: open ? 'var(--color-paper-deep)' : 'var(--color-paper-light)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span
                      className="font-bold"
                      style={{ color: 'var(--color-vermillion)' }}
                    >
                      {String(i + 1).padStart(2, '0')}.
                    </span>{' '}
                    <span className="font-bold" style={{ color: 'var(--color-ink)' }}>
                      {f.name}
                    </span>
                    <span
                      className="ml-2 text-sm"
                      style={{ color: 'var(--color-ink-soft)' }}
                    >
                      — {f.explain}
                    </span>
                  </div>
                  <span style={{ color: 'var(--color-ink-fade)', fontSize: 12 }}>
                    {open ? '▲' : '▼'}
                  </span>
                </div>
                {open && (
                  <div
                    className="mt-2 pt-2 text-sm"
                    style={{
                      borderTop: '1px dashed var(--color-ink-fade)',
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    예) <em>{f.sample}</em>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. 흥미로운 주제 */}
      <section className="card-sketch p-4 sm:p-5">
        <SectionTitle num="04" title="흥미로운 토론 주제 20" />
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {(Object.keys(TOPICS) as Array<keyof typeof TOPICS>).map((cat) => (
            <div
              key={cat}
              className="card p-3"
              style={{ background: 'var(--color-paper)' }}
            >
              <div
                className="font-bold mb-2"
                style={{ color: 'var(--color-vermillion)' }}
              >
                #{cat}
              </div>
              <ul
                className="list-disc list-inside m-0 space-y-1 text-sm"
                style={{ color: 'var(--color-ink-soft)', lineHeight: 1.55 }}
              >
                {TOPICS[cat].map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 역사적 토론 */}
      <section className="card-sketch p-4 sm:p-5">
        <SectionTitle num="05" title="역사 속 명토론" />
        <div className="space-y-3 mt-4">
          {HISTORIC.map((h) => (
            <div
              key={h.title}
              className="card p-3 flex gap-3 items-start"
              style={{ background: 'var(--color-paper)' }}
            >
              <div
                className="flex-shrink-0 font-bold accent-hand"
                style={{
                  color: 'var(--color-vermillion)',
                  fontSize: 22,
                  minWidth: 60,
                }}
              >
                {h.year}
              </div>
              <div>
                <div
                  className="font-bold"
                  style={{ color: 'var(--color-ink)', fontSize: 15 }}
                >
                  {h.title}
                </div>
                <p
                  className="text-sm m-0 mt-1"
                  style={{ color: 'var(--color-ink-soft)', lineHeight: 1.55 }}
                >
                  {h.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. 팁 */}
      <section className="card-sketch p-4 sm:p-5">
        <SectionTitle num="06" title="토론 잘하는 7가지 팁" />
        <ol
          className="list-decimal list-inside m-0 mt-3 space-y-2 text-sm"
          style={{ color: 'var(--color-ink-soft)', lineHeight: 1.6 }}
        >
          {TIPS.map((t, i) => (
            <li key={i}>
              <span style={{ color: 'var(--color-ink)' }}>{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="text-center py-2">
        <button
          onClick={onBack}
          className="btn btn-pri"
          style={{ padding: '10px 18px' }}
        >
          🎯 지금 토론 시작하기
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <h2
      className="m-0 font-bold flex items-baseline gap-2"
      style={{ color: 'var(--color-ink)', fontSize: 20 }}
    >
      <span
        className="font-bold accent-hand"
        style={{ color: 'var(--color-vermillion)', fontSize: 26 }}
      >
        {num}
      </span>
      <span>{title}</span>
    </h2>
  );
}
