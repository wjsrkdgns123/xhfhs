import React, { useState } from 'react';
import '../learn.css';
import '../learn-hub.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ScrollSpyNav } from './ScrollSpyNav';
import type { Lang } from '../i18n/landing';
import { learnStrings } from '../i18n/learn';
import { CharacterAvatar } from './CharacterAvatar';
import { DebateSeal } from './DebateSeal';

// DOM section order — 기본기 6챕터 + 심화 섹션 포함 단일 페이지 전체 커버
const LEARN_SPY_ITEMS = [
  { id: 'ch1', label: '5대 원칙' },
  { id: 'ch3', label: '논리 오류' },
  { id: 'ch7', label: '준비 단계' },
  { id: 'ch8', label: '평가 기준' },
  { id: 'ch6', label: '실전 팁' },
  { id: 'glossary', label: '용어' },
  { id: 'deeper', label: '더 배우기' },
];

/* ===================== 기존 데이터 배열 (전부 보존) ===================== */

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

const CHECKLIST_EN = [
  {
    phase: 'BEFORE',
    name: 'Pre-debate prep',
    items: [
      'Define key terms in the resolution ahead of time (scope · timing · subject)',
      'Outline 2–3 core arguments with supporting evidence for each',
      'Anticipate the strongest rebuttals and note your responses',
      'Confirm where the burden of proof sits (Pro carries it; Con dismantles)',
    ],
  },
  {
    phase: 'OPENING',
    name: 'Constructive',
    items: [
      'Structure: claim → reason → evidence → conclusion',
      'State the core claim in the very first sentence — no hedging',
      'Each argument needs evidence: data (stats/citations), examples, or logical reasoning',
      'Pack the whole round into one message (no split speeches)',
    ],
  },
  {
    phase: 'REBUTTAL',
    name: 'Rebuttal',
    items: [
      '**No new arguments** — only address what was in the constructive',
      'Quote the opponent in 1–2 sentences before identifying the weakness',
      'Weakness types: weak evidence · logical leap · vague definition · factual error',
      'End with a one-line reminder of why your side still holds',
    ],
  },
  {
    phase: 'CLOSING',
    name: 'Closing posture',
    items: [
      'Drop the urge to add more — only existing arguments are evaluated',
      'The verdict is fairness-based, not cheerleading for either side',
      'Regardless of result, respect that you both finished a full round',
    ],
  },
];

const CRITERIA = [
  {
    tag: 'A',
    name: '논거의 질',
    weight: 30,
    desc: '주장과 근거가 얼마나 탄탄하게 연결되는가. 인과·추론·자료가 모두 따라붙는지.',
  },
  {
    tag: 'B',
    name: '클래시(Clash)',
    weight: 25,
    desc: '상대 논거에 정면으로 응답했는가. 옆길 가지 않고 직접 충돌한 비율.',
  },
  {
    tag: 'C',
    name: '입증책임 이행',
    weight: 20,
    desc: '찬성: 명제 입증의 충분성 / 반대: 그 입증을 무너뜨린 정도.',
  },
  {
    tag: 'D',
    name: '논리 일관성',
    weight: 15,
    desc: '발언 안에 모순이 없고 입론과 반박이 같은 방향으로 일관되는가.',
  },
  {
    tag: 'E',
    name: '표현 · 매너',
    weight: 10,
    desc: '명확한 어휘, 인신공격·감정 격앙 없이 정중한 어조 유지.',
  },
];

const CRITERIA_EN = [
  {
    tag: 'A',
    name: 'Argument quality',
    weight: 30,
    desc: 'How well claims connect to reasons — causality, inference, evidence all in place.',
  },
  {
    tag: 'B',
    name: 'Clash',
    weight: 25,
    desc: 'Did you address the opponent head-on? Share of direct collisions vs. side roads.',
  },
  {
    tag: 'C',
    name: 'Burden of proof',
    weight: 20,
    desc: 'Pro: sufficiency of resolution proof / Con: how thoroughly that proof was dismantled.',
  },
  {
    tag: 'D',
    name: 'Logical consistency',
    weight: 15,
    desc: 'No contradictions within a speech, and rebuttals stay aligned with constructives.',
  },
  {
    tag: 'E',
    name: 'Delivery · manner',
    weight: 10,
    desc: 'Clear vocabulary, polite tone, no personal attacks or emotional flare-ups.',
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

const PRINCIPLES_EN = [
  {
    num: '01 · PROOF',
    hand: '立',
    name: 'Burden of proof',
    desc: 'Whoever advances a claim must prove it. If Pro fails to prove the resolution, they lose even without rebuttal.',
    egNode: (
      <>
        e.g. The person who says <b>"aliens exist"</b> bears the burden of proof — the other side
        doesn't have to prove absence.
      </>
    ),
  },
  {
    num: '02 · CLASH',
    hand: '衝',
    name: 'Direct clash',
    desc: "Address your opponent's core argument head-on. Side-tracking is penalized.",
    egNode: (
      <>
        "AI cuts jobs" → respond with "<b>X new jobs are created in field Y</b>".
      </>
    ),
  },
  {
    num: '03 · NO NEW',
    hand: '禁',
    name: 'No new arguments in rebuttal',
    desc: 'Everything has to be raised in the constructive. New arguments in rebuttal are unfair because the opponent has no chance to respond.',
    egNode: (
      <>
        If your constructive only had A·B·C, you <b>can't introduce D</b> in rebuttal.
      </>
    ),
  },
  {
    num: '04 · EVIDENCE',
    hand: '據',
    name: 'Grounded in evidence',
    desc: 'Replace "I feel" with data, examples, or logical reasoning. Sources make it stronger.',
    egNode: (
      <>
        "It's bad for the environment" (✗) → "<b>OECD 2023 report: 14% decline over 5 years</b>" (✓)
      </>
    ),
  },
  {
    num: '05 · RESPECT',
    hand: '禮',
    name: 'No personal attacks',
    desc: "Attacking the person instead of the argument drags down both the debate's dignity and your own credibility.",
    egNode: (
      <>
        "You're not even an expert" (✗) → "<b>Can a sample of 30 really generalize?</b>" (✓)
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

const FALLACIES_EN = [
  {
    num: '01',
    name: 'Strawman',
    short: "— Twist your opponent's claim into a weaker form, then attack that",
    bodyNode: (
      <>
        e.g. <b>"Let's regulate AI"</b> → distorted into "So you want to ban all AI?"
      </>
    ),
    open: true,
  },
  {
    num: '02',
    name: 'Ad Hominem',
    short: '— Attacking the person instead of the argument',
    bodyNode: <>e.g. "What would you know? You don't even have a degree in this."</>,
  },
  {
    num: '03',
    name: 'Appeal to authority',
    short: '— Famous person said it, therefore true',
    bodyNode: <>e.g. "Steve Jobs said so, therefore it's right"</>,
  },
  {
    num: '04',
    name: 'Slippery slope',
    short: '— Small change inevitably leads to extreme outcome',
    bodyNode: <>e.g. "If we allow A → B → C → society collapses"</>,
  },
  {
    num: '05',
    name: 'False dichotomy',
    short: '— Forcing two options when more exist',
    bodyNode: <>e.g. "If you're not with us, you're against us"</>,
  },
  {
    num: '06',
    name: 'Circular reasoning',
    short: '— Using the conclusion as a premise',
    bodyNode: <>e.g. "The Bible is true because the Bible says so."</>,
  },
  {
    num: '07',
    name: 'Anecdotal evidence',
    short: '— Generalizing from one or two cases',
    bodyNode: (
      <>
        e.g. "My grandfather smoked every day and lived to 90.{' '}
        <b>Therefore smoking isn't harmful</b>."
      </>
    ),
  },
  {
    num: '08',
    name: 'Appeal to popularity',
    short: '— Many believe it, so it must be right',
    bodyNode: <>e.g. "Everyone does it this way, so it must be correct"</>,
  },
  {
    num: '09',
    name: 'Equivocation',
    short: '— Using one word in two different senses to reach a conclusion',
    bodyNode: <>e.g. "Laws are made by humans. Natural law is a law. Therefore humans made natural law."</>,
  },
  {
    num: '10',
    name: 'Affirming the consequent',
    short: '— Same effect therefore same cause (false inference)',
    bodyNode: (
      <>
        e.g. "Rain wets the street. The street is wet.{' '}
        <b>Therefore it rained</b>" (could be a sprinkler)
      </>
    ),
  },
];

const TIPS: Array<{ num: string; node: React.ReactNode }> = [
  { num: '01', node: <>상대 핵심 논거를 <b>한 줄씩 메모</b>하라.</> },
  { num: '02', node: <>반박은 <b>1~2개에만 집중</b>한다. 다 잡으려다 다 놓친다.</> },
  { num: '03', node: <>내 입장을 <b>한 줄로 요약</b>해 두자. 마무리에서 다시 쓸 카드.</> },
  { num: '04', node: <>구체적 사례 <b>1개</b>를 미리 준비 — "예를 들어..."가 강력하다.</> },
  { num: '05', node: <>감정이 격해질 땐 <b>30초 호흡</b>. 인신공격으로 빠지면 자동 감점.</> },
  { num: '06', node: <><b>핵심 단어 정의</b>로 시작하라. 모호한 단어는 토론을 흐린다.</> },
  { num: '07', node: <>마무리에서 <b>핵심 쟁점</b>을 다시 한 번 — 마지막 인상이 평가를 좌우.</> },
];

const TIPS_EN: Array<{ num: string; node: React.ReactNode }> = [
  { num: '01', node: <><b>Note your opponent's key arguments</b>, one per line.</> },
  { num: '02', node: <>Pick <b>1–2 rebuttals</b> to focus on. Trying to catch them all = missing all.</> },
  { num: '03', node: <>Keep a <b>one-line summary</b> of your stance — your closing card.</> },
  { num: '04', node: <>Prep <b>one concrete example</b> in advance — "For instance..." is powerful.</> },
  { num: '05', node: <>If emotions spike, <b>breathe for 30 seconds</b>. Personal attacks = automatic deduction.</> },
  { num: '06', node: <>Start by <b>defining key terms</b>. Ambiguous words muddy the debate.</> },
  { num: '07', node: <>In closing, restate the <b>core issue</b> — last impressions drive the verdict.</> },
];

const GLOSSARY = [
  { k: '입증책임', en: 'BURDEN OF PROOF', d: '주장하는 쪽이 그것이 옳다는 근거를 댈 책임.' },
  { k: '클래시', en: 'CLASH', d: '양측이 정면으로 부딪치는 핵심 쟁점. 평가의 무게중심.' },
  { k: '반박', en: 'REBUTTAL', d: '상대 입론의 약점을 짚고 다시 자기 측을 정리하는 단계.' },
  { k: '판정', en: 'VERDICT', d: '관전자 투표 + AI 정성평가의 결합으로 승부 결정.' },
  { k: '이의 있음', en: 'OBJECTION', d: '상대 논리의 결함을 강조하며 끼어드는 컷-인. 1회 한정.' },
  { k: '연결고리', en: 'LINK', d: '근거에서 결론으로 가는 논리적 다리. 빠지면 비약이 된다.' },
  { k: '비교 분석', en: 'WEIGHING', d: '양측 임팩트를 비교해 자기 측이 왜 더 무거운지 설명.' },
  { k: '용어 정의', en: 'DEFINITION', d: '주제 속 모호한 단어를 토론용으로 한정해 두는 절차.' },
];

const GLOSSARY_EN = [
  { k: 'Burden of proof', en: 'BURDEN OF PROOF', d: 'The obligation to provide evidence that your claim is correct.' },
  { k: 'Clash', en: 'CLASH', d: "Direct collision on the core issue — the center of gravity in judging." },
  { k: 'Rebuttal', en: 'REBUTTAL', d: "The stage where you identify weaknesses in the opponent's case and re-assert your side." },
  { k: 'Verdict', en: 'VERDICT', d: 'The outcome determined by a 50/50 combination of audience vote and AI evaluation.' },
  { k: 'Objection', en: 'OBJECTION', d: "A cut-in that highlights a flaw in the opponent's logic. Limited to one per round." },
  { k: 'Link', en: 'LINK', d: 'The logical bridge from evidence to conclusion — without it, the argument is a leap.' },
  { k: 'Weighing', en: 'WEIGHING', d: 'Comparing the impact of both sides to explain why your case carries more weight.' },
  { k: 'Definition', en: 'DEFINITION', d: 'The procedure of narrowing an ambiguous word in the resolution to a debate-ready meaning.' },
];

/* ===================== LIB_HUB 글리프 매핑 (DeeperView) ===================== */
const HUB_GLYPHS: Record<string, string> = {
  topics: '題',
  formats: '式',
  fallacies: '誤',
  glossary: '語',
  famous: '史',
  resources: '庫',
  samples: '演',
};

/* ===================== 공용 헬퍼 ===================== */

/** **굵게** 마크업 파서 */
function rich(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <b key={i} style={{ color: 'var(--ink)', fontWeight: 800 }}>{p.slice(2, -2)}</b>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

/** MascotChip — StepTimeline 시작점 마스코트 */
function MascotChip({ side, size = 56 }: { side: 'pro' | 'con'; size?: number }) {
  const tint = side === 'pro' ? 'var(--vermillion-tint, rgba(200,75,31,0.12))' : 'var(--celadon-tint, rgba(45,74,90,0.12))';
  const accent = side === 'pro' ? 'var(--vermillion)' : 'var(--celadon)';
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: tint, flexShrink: 0,
      boxShadow: `0 0 0 3px #fff, 0 8px 20px -6px ${accent}66`,
    }}>
      <CharacterAvatar side={side} size={Math.round(size * 0.62)} />
    </span>
  );
}

/* ===================== SectionHead ===================== */
interface SectionHeadProps {
  eyebrow: string;
  title: React.ReactNode;
  accent?: string;
  center?: boolean;
  light?: boolean;
  lead?: string;
}
function SectionHead({ eyebrow, title, accent = 'var(--celadon)', center, light, lead }: SectionHeadProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'left' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.2em', color: accent, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 24, height: 1.5, background: accent }} />{eyebrow}
      </span>
      <h2 style={{ margin: '16px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 42, lineHeight: 1.14, letterSpacing: '-0.03em', color: light ? '#fcf6e8' : 'var(--ink)', wordBreak: 'keep-all', maxWidth: 760 }}>{title}</h2>
      <span style={{ width: 64, height: 3, background: 'var(--gold)', marginTop: 22 }} />
      {lead && (
        <p style={{ margin: '22px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.65, color: light ? 'rgba(252,246,232,0.85)' : 'var(--ink-soft)', wordBreak: 'keep-all', whiteSpace: 'pre-line', textAlign: center ? 'center' : 'left' }}>{lead}</p>
      )}
    </div>
  );
}

/* ===================== StepTimeline ===================== */
const TL_NODES_KO = [
  { x: 165, y: 162, num: '01', label: '입론', sub: '주장 세우기', accent: 'var(--celadon)' },
  { x: 360, y: 76, num: '02', label: '반론', sub: '근거로 반박', accent: 'var(--ink)' },
  { x: 575, y: 162, num: '03', label: '교차질의', sub: '서로 묻고 답하기', accent: 'var(--gold)' },
  { x: 800, y: 76, num: '04', label: '최종변론', sub: '입장 정리', accent: 'var(--vermillion)' },
];
const TL_NODES_EN = [
  { x: 165, y: 162, num: '01', label: 'Opening', sub: 'Build your case', accent: 'var(--celadon)' },
  { x: 360, y: 76, num: '02', label: 'Rebuttal', sub: 'Counter with evidence', accent: 'var(--ink)' },
  { x: 575, y: 162, num: '03', label: 'Cross-exam', sub: 'Q&A together', accent: 'var(--gold)' },
  { x: 800, y: 76, num: '04', label: 'Closing', sub: 'Summarize your side', accent: 'var(--vermillion)' },
];
const TL_W = 1100, TL_H = 230;
const TL_PATH = 'M 88,162 C 130,162 135,162 165,162 C 255,162 270,76 360,76 C 455,76 480,162 575,162 C 690,162 710,76 800,76 C 920,76 985,118 1052,118';
const STAR = { x: 1052, y: 118 };

function StepTimeline({ lang }: { lang: Lang }) {
  const nodes = lang === 'en' ? TL_NODES_EN : TL_NODES_KO;
  const verdictLabel = lang === 'en' ? 'Verdict' : '판정';
  const verdictSub = lang === 'en' ? 'Vote 50% + AI 50%' : '투표 50% + AI 50%';
  const pct = (v: number, tot: number) => (v / tot * 100) + '%';
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1100, margin: '0 auto', height: TL_H }}>
      <svg viewBox={`0 0 ${TL_W} ${TL_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden="true">
        <path d={TL_PATH} fill="none" stroke="var(--ink-ghost)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 13" opacity="0.85" />
      </svg>

      {/* 시작 마스코트 */}
      <span style={{ position: 'absolute', left: pct(44, TL_W), top: pct(162, TL_H), transform: 'translate(-50%,-50%)' }}>
        <MascotChip side="pro" size={56} />
      </span>

      {/* 단계 노드 */}
      {nodes.map((n) => (
        <React.Fragment key={n.num}>
          <span style={{
            position: 'absolute', left: pct(n.x, TL_W), top: pct(n.y, TL_H), transform: 'translate(-50%,-50%)',
            width: 44, height: 44, borderRadius: 12, background: '#fffaf0', boxShadow: `inset 0 0 0 2px ${n.accent}`, color: n.accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, zIndex: 2,
          }}>{n.num}</span>
          <span style={{ position: 'absolute', left: pct(n.x, TL_W), top: pct(n.y, TL_H), transform: 'translate(-50%, 30px)', textAlign: 'center', width: 130, zIndex: 2 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{n.label}</span>
            <span style={{ display: 'block', marginTop: 3, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.02em', color: 'var(--ink-fade)' }}>{n.sub}</span>
          </span>
        </React.Fragment>
      ))}

      {/* STEP05 판정 — DebateSeal */}
      <span style={{ position: 'absolute', left: pct(STAR.x, TL_W), top: pct(STAR.y, TL_H), transform: 'translate(-50%,-50%)', zIndex: 2 }}>
        <DebateSeal display={64} />
      </span>
      <span style={{ position: 'absolute', left: pct(STAR.x, TL_W), top: pct(STAR.y, TL_H), transform: 'translate(-50%, 36px)', textAlign: 'center', width: 150, zIndex: 2 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--gold)' }}>STEP 05</span>
        <span style={{ display: 'block', marginTop: 2, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>{verdictLabel}</span>
        <span style={{ display: 'block', marginTop: 3, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5, color: 'var(--ink-fade)' }}>{verdictSub}</span>
      </span>
    </div>
  );
}

/* ===================== LibraryHero ===================== */
function LibraryHero({ lang, onBasic, onDeeper }: { lang: Lang; onBasic: () => void; onDeeper: () => void }) {
  const isEn = lang === 'en';
  const t = learnStrings[lang];
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#f6f0e2', padding: '40px 64px 60px' }}>
      {/* 그리드 페이퍼 */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(26,15,8,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,15,8,0.05) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 58%, transparent 94%)',
        maskImage: 'linear-gradient(to bottom, #000 0%, #000 58%, transparent 94%)',
      }} />
      {/* 선셋 블롭 */}
      <span aria-hidden="true" style={{ position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)', width: 760, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,31,0.07), transparent 68%)', pointerEvents: 'none' }} />

      {/* 센터 콘텐츠 */}
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color: 'var(--celadon)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          <span aria-hidden="true" style={{ width: 26, height: 1.5, background: 'var(--celadon)' }} />
          {isEn ? 'Learn debate with an AI moderator' : 'AI 사회자와 함께 배우는 토론 수업'}
          <span aria-hidden="true" style={{ width: 26, height: 1.5, background: 'var(--celadon)' }} />
        </span>
        <h1 style={{ margin: '18px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(54px, 8vw, 94px)', lineHeight: 0.98, letterSpacing: '-0.045em', color: 'var(--ink)', wordBreak: 'keep-all' }}>
          {isEn ? (
            <>Debate<span style={{ color: 'var(--vermillion)' }}>Library</span></>
          ) : (
            <>토론<span style={{ color: 'var(--vermillion)' }}>자료실</span></>
          )}
        </h1>
        <p style={{ maxWidth: 560, margin: '22px 0 0', fontSize: 17, lineHeight: 1.62, color: 'var(--ink-soft)', fontWeight: 500, wordBreak: 'keep-all' }}>
          {isEn
            ? 'From principles to fallacies and scoring rubrics. Follow the 5-round flow from opening to verdict and naturally absorb how a debate works.'
            : '원칙부터 논리 오류·평가 기준까지. 5단계 라운드를 따라가며 입론부터 판정까지, 토론의 흐름을 자연스럽게 익힙니다.'}
        </p>
      </div>

      {/* 5단계 타임라인 */}
      <div style={{ maxWidth: 1216, margin: '44px auto 0', position: 'relative' }}>
        <StepTimeline lang={lang} />
      </div>

      {/* 2-옵션 모드 — 기본기 갖추기 / 더 배우기 (해당 섹션으로 스크롤) */}
      <div className="learn-mode" role="group" aria-label={isEn ? 'Library sections' : '자료실 섹션'}>
        <button type="button" onClick={onBasic} className="learn-mode__tab learn-mode__tab--basics">
          <span className="learn-mode__num">01</span>
          <span className="learn-mode__title">{t.modes.basics}</span>
          <span className="learn-mode__sub">{t.modes.basicsSub}</span>
        </button>
        <button type="button" onClick={onDeeper} className="learn-mode__tab learn-mode__tab--deeper">
          <span className="learn-mode__num">02</span>
          <span className="learn-mode__title">{t.modes.more}</span>
          <span className="learn-mode__sub">{t.modes.moreSub}</span>
        </button>
      </div>
    </section>
  );
}

/* ===================== ChapterBand ===================== */
interface ChapterBandProps {
  id: string;
  bg: string;
  eyebrow: string;
  title: React.ReactNode;
  hand?: string;
  lead?: string;
  children: React.ReactNode;
}
function ChapterBand({ id, bg, eyebrow, title, hand, lead, children }: ChapterBandProps) {
  return (
    <section id={id} style={{ background: bg, padding: '92px 64px' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        <SectionHead
          eyebrow={eyebrow}
          title={<>{title}{hand && <> <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--celadon)' }}>{hand}</span></>}</>}
          lead={lead}
        />
        <div style={{ marginTop: 52 }}>{children}</div>
      </div>
    </section>
  );
}

/* ===================== CH01 PrinciplesGrid ===================== */
function PrinciplesGrid({ lang }: { lang: Lang }) {
  const data = lang === 'en' ? PRINCIPLES_EN : PRINCIPLES;
  return (
    <div className="lib-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
      {data.map((p) => (
        <article key={p.num} style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 0, borderTop: '3px solid var(--celadon)', boxShadow: '0 22px 46px -30px rgba(40,60,45,0.45), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-fade)' }}>{p.num}</span>
            <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--celadon-tint, rgba(45,74,90,0.1))', color: 'var(--celadon)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 26 }}>{p.hand}</span>
          </div>
          <h3 style={{ margin: '20px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 21, letterSpacing: '-0.02em', color: 'var(--ink)', wordBreak: 'keep-all' }}>{p.name}</h3>
          <p style={{ margin: '11px 0 0', fontSize: 14.5, lineHeight: 1.62, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{p.desc}</p>
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--gold-tint, rgba(184,132,42,0.1))', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{p.egNode}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ===================== CH02 FallaciesList ===================== */
function FallacyItem({ num, name, short, bodyNode, defaultOpen }: {
  num: string; name: string; short: string; bodyNode: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: open ? '0 22px 46px -30px rgba(40,60,45,0.5), 0 0 0 1.5px var(--celadon)' : '0 14px 30px -26px rgba(40,60,45,0.4), 0 0 0 1px #e7ddc6', overflow: 'hidden', transition: 'box-shadow .16s ease' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '17px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: open ? 'var(--celadon)' : 'var(--paper-deep, #e8dcc0)', color: open ? '#fff' : 'var(--ink-fade)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{num}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{name}</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: 'var(--ink-fade)', wordBreak: 'keep-all' }}>{short}</span>
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--celadon-tint, rgba(45,74,90,0.1))' : 'transparent', color: 'var(--celadon)', fontSize: 18, fontWeight: 700, lineHeight: 0 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px 68px' }}>
          <div style={{ padding: '12px 15px', borderRadius: 12, background: 'var(--vermillion-tint, rgba(200,75,31,0.1))', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{bodyNode}</div>
        </div>
      )}
    </div>
  );
}

function FallaciesList({ lang }: { lang: Lang }) {
  const data = lang === 'en' ? FALLACIES_EN : FALLACIES;
  return (
    <div className="lib-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
      {data.map((f, i) => (
        <FallacyItem key={f.num} num={f.num} name={f.name} short={f.short} bodyNode={f.bodyNode} defaultOpen={i === 0} />
      ))}
    </div>
  );
}

/* ===================== CH03 ChecklistGrid ===================== */
function ChecklistGrid({ lang }: { lang: Lang }) {
  const data = lang === 'en' ? CHECKLIST_EN : CHECKLIST;
  return (
    <div className="lib-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>
      {data.map((c) => (
        <article key={c.phase} style={{ background: '#fff', borderRadius: 20, padding: '26px 28px', borderTop: '3px solid var(--gold)', boxShadow: '0 22px 46px -30px rgba(40,60,45,0.45), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: 'var(--gold)' }}>{c.phase}</span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{c.name}</h3>
          </div>
          <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
            {c.items.map((it, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 1, width: 21, height: 21, borderRadius: '50%', background: 'var(--celadon-tint, rgba(45,74,90,0.1))', color: 'var(--celadon)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{rich(it)}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

/* ===================== CH04 CriteriaList ===================== */
function CriteriaList({ lang }: { lang: Lang }) {
  const data = lang === 'en' ? CRITERIA_EN : CRITERIA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((c) => (
        <article key={c.tag} style={{ background: '#fff', borderRadius: 18, padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 18px 40px -30px rgba(40,60,45,0.45), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 13, background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 22 }}>{c.tag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{c.name}</h3>
            </div>
            <p style={{ margin: '7px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{c.desc}</p>
          </div>
          <div className="lib-weight" style={{ flexShrink: 0, width: 132, display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 26, lineHeight: 1, color: 'var(--celadon)' }}>{c.weight}%</span>
            <div style={{ width: '100%', height: 7, borderRadius: 999, background: 'var(--paper-deep, #e8dcc0)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: (c.weight / 30 * 100) + '%', background: 'var(--gold)', borderRadius: 999 }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ===================== CH05 TipsGrid ===================== */
function TipsGrid({ lang }: { lang: Lang }) {
  const data = lang === 'en' ? TIPS_EN : TIPS;
  const accentLabel = lang === 'en' ? "If you've read the tips — start a round right now." : '팁이 끝났다면 지금 바로 한 판 시작해보자.';
  return (
    <div className="lib-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {data.map((tip) => (
        <div key={tip.num} style={{ background: '#fff', borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 16px 36px -30px rgba(40,60,45,0.4), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', color: 'var(--vermillion)' }}>TIP {tip.num}</span>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{tip.node}</p>
        </div>
      ))}
      {/* 討 액센트 카드 */}
      <div style={{ background: 'var(--celadon)', borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 30, color: '#f0cf7e', lineHeight: 1 }}>討</span>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(252,246,232,0.92)', fontWeight: 600, wordBreak: 'keep-all' }}>{accentLabel}</p>
      </div>
    </div>
  );
}

/* ===================== GlossaryStrip ===================== */
function GlossaryStrip({ lang }: { lang: Lang }) {
  const data = lang === 'en' ? GLOSSARY_EN : GLOSSARY;
  return (
    <div className="lib-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {data.map((g) => (
        <div key={g.k} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, boxShadow: '0 14px 30px -28px rgba(40,60,45,0.4), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div style={{ flexShrink: 0, width: 116 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{g.k}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-ghost)', marginTop: 3 }}>{g.en}</div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{g.d}</div>
        </div>
      ))}
    </div>
  );
}

/* ===================== LibraryCTA ===================== */
interface LibraryCTAProps {
  eyebrow: string;
  title: string;
  hand?: string;
  body: string;
  primary: string;
  secondary?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}
function LibraryCTA({ eyebrow, title, hand, body, primary, secondary, onPrimary, onSecondary }: LibraryCTAProps) {
  return (
    <section style={{ position: 'relative', background: 'linear-gradient(165deg, #6f9c86 0%, #4f7a64 52%, #3c6450 100%)', padding: '104px 64px', overflow: 'hidden' }}>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: -120, left: -40, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 440, lineHeight: 0.7, color: 'rgba(255,255,255,0.05)', userSelect: 'none', pointerEvents: 'none' }}>討</span>
      <div style={{ maxWidth: 1152, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>{eyebrow}</span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'clamp(40px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.03em', color: '#fcf6e8', wordBreak: 'keep-all', maxWidth: 720 }}>
          {title}{hand && <><br /><span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: '#f0cf7e' }}>{hand}</span></>}
        </h2>
        <p style={{ maxWidth: 540, margin: '22px 0 0', fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', fontWeight: 500, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{body}</p>
        <div style={{ display: 'flex', gap: 13, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={onPrimary} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 30px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--paper-light, #fcf6e8)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16.5, boxShadow: '0 12px 28px -12px rgba(0,0,0,0.4)' }}>{primary} <span style={{ fontSize: 15 }}>→</span></button>
          {secondary && onSecondary && (
            <button type="button" onClick={onSecondary} style={{ display: 'inline-flex', alignItems: 'center', padding: '15px 28px', borderRadius: 999, cursor: 'pointer', background: 'transparent', color: '#fff', border: 'none', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16.5 }}>{secondary}</button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ===================== HubCard ===================== */
function HubCard({ idx, cat, glyph, label, desc, count, accent, onClick, hub }: {
  idx: number; cat: string; glyph: string; label: string; desc: string; count: string; accent: string; onClick: () => void;
  hub: { readMore: string; count: (s: string) => string; countSuffix: string; expandLabel: string };
}) {
  const [hover, setHover] = useState(false);
  return (
    <button type="button"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={onClick}
      aria-label={`${label} ${hub.expandLabel}`}
      style={{
        position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer', border: 'none',
        background: '#fff', borderRadius: 22, padding: '28px 28px 26px', display: 'flex', flexDirection: 'column',
        borderTop: `3px solid ${accent}`, transition: 'transform .16s ease, box-shadow .16s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 34px 64px -32px rgba(20,40,30,0.6), 0 0 0 1px rgba(0,0,0,0.05)' : '0 22px 46px -32px rgba(40,60,45,0.45), 0 0 0 1px rgba(0,0,0,0.04)',
      }}>
      {/* 거대 인덱스 워터마크 */}
      <span aria-hidden="true" style={{ position: 'absolute', top: -18, right: 8, fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 128, lineHeight: 1, color: 'rgba(26,15,8,0.045)', userSelect: 'none', pointerEvents: 'none' }}>{String(idx + 1).padStart(2, '0')}</span>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--ink-fade)', textTransform: 'uppercase' }}>
          <span style={{ width: 16, height: 1.5, background: accent }} />{cat}
        </span>
        <span style={{
          width: 52, height: 52, borderRadius: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: hover ? accent : 'var(--paper-deep, #e8dcc0)', color: hover ? '#fff' : accent, transition: 'all .16s ease',
          fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 27,
        }}>{glyph}</span>
      </div>

      <h3 style={{ position: 'relative', margin: '22px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 25, letterSpacing: '-0.025em', color: 'var(--ink)', lineHeight: 1.2, wordBreak: 'keep-all' }}>{label}</h3>
      <p style={{ position: 'relative', margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.62, color: 'var(--ink-soft)', wordBreak: 'keep-all' }}>{desc}</p>

      <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--ink-fade)', letterSpacing: '0.04em' }}>
          <b style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 17, color: accent }}>{count}</b> {hub.countSuffix}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 13.5, color: accent }}>
          {hub.expandLabel} <span aria-hidden="true" style={{ transition: 'transform .16s ease', transform: hover ? 'translateX(3px)' : 'none' }}>→</span>
        </span>
      </div>
    </button>
  );
}

/* ===================== HubCard accent 매핑 ===================== */
const HUB_ACCENTS: Record<string, string> = {
  topics: 'var(--celadon)',
  formats: 'var(--gold)',
  fallacies: 'var(--vermillion)',
  glossary: 'var(--celadon)',
  famous: 'var(--gold)',
  resources: 'var(--celadon)',
  samples: 'var(--vermillion)',
};

/* ===================== 메인 LearnView ===================== */
export function LearnView({
  onBack,
  onOpenContent,
  lang = 'ko',
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
  lang?: Lang;
}) {
  const t = learnStrings[lang];
  const isEn = lang === 'en';

  useDocumentMeta(
    isEn ? 'Library — Debate resources' : '자료실 — 토론 자료실',
    isEn
      ? '5 practical chapters + 7 deeper hubs. From principles and fallacies to famous debates and resources.'
      : '원칙·논리 오류·준비 단계·평가 기준·실전 팁 5챕터 + 7개 심화 콘텐츠 허브.',
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="learn-page-v2">
      <ScrollSpyNav items={LEARN_SPY_ITEMS} />

      {/* ===== LibraryHero — 그리드 페이퍼 + 타임라인 ===== */}
      <LibraryHero lang={lang} onBasic={() => scrollTo('ch1')} onDeeper={() => scrollTo('deeper')} />

      {/* ===== BasicsView — 6 챕터 밴드 ===== */}

      {/* CH01 실무 5대 원칙 */}
      <ChapterBand
        id="ch1"
        bg="#f6f0e2"
        eyebrow={isEn ? 'CHAPTER 01 · The 5 practical principles' : 'CHAPTER 01 · 실무 5대 원칙'}
        title={isEn ? <>Know the rules,</> : <>룰을 알면</>}
        hand={isEn ? 'half-won already.' : '반은 이긴 셈.'}
        lead={isEn
          ? "The five things real debate judges look for. You don't need to memorize them — one read changes how you speak."
          : '실제 토론장에서 평가 기준이 되는 다섯 가지. 외울 필요는 없고, 한 번 읽어두면 발언이 달라집니다.'}
      >
        <PrinciplesGrid lang={lang} />
      </ChapterBand>

      {/* CH02 논리 오류 10 */}
      <ChapterBand
        id="ch3"
        bg="#efe7d3"
        eyebrow={isEn ? 'CHAPTER 02 · 10 logical fallacies' : 'CHAPTER 02 · 논리 오류 10'}
        title={isEn ? <>When you rebut,</> : <>반박할 때</>}
        hand={isEn ? 'where do you strike?' : '어디를 칠 것인가.'}
        lead={isEn
          ? "The 10 most common fallacies in real debate. Memorize them and you'll start spotting holes in your opponent. Tap each card to see the example."
          : '실제 토론에서 가장 자주 등장하는 논리 오류 10가지.\n외워두면 상대 발언의 구멍이 보이기 시작합니다. 카드를 누르면 예시가 펼쳐집니다.'}
      >
        <FallaciesList lang={lang} />
      </ChapterBand>

      {/* CH03 단계별 준비 체크리스트 */}
      <ChapterBand
        id="ch7"
        bg="#f6f0e2"
        eyebrow={isEn ? 'CHAPTER 03 · Stage-by-stage checklist' : 'CHAPTER 03 · 단계별 준비 체크리스트'}
        title={isEn ? <>When you're stuck,</> : <>막막할 땐</>}
        hand={isEn ? 'start with this list.' : '이 리스트부터.'}
        lead={isEn
          ? "Pre-debate, constructive, rebuttal, closing — what to check at each stage. Don't memorize, just skim before starting."
          : '토론 전·입론·반박·마무리 — 단계마다 빠뜨리기 쉬운 것을 점검하세요.\n외우지 말고, 시작 전 한 번 훑어보면 됩니다.'}
      >
        <ChecklistGrid lang={lang} />
      </ChapterBand>

      {/* CH04 공식 평가 기준 */}
      <ChapterBand
        id="ch8"
        bg="#efe7d3"
        eyebrow={isEn ? 'CHAPTER 04 · Official scoring rubric' : 'CHAPTER 04 · 공식 평가 기준'}
        title={isEn ? <>How we decide</> : <>누가 이긴 건지,</>}
        hand={isEn ? 'who won.' : '이렇게 본다.'}
        lead={isEn
          ? "The five items DebateBattle's AI verdict and real tournament judges share. Weights differ per tournament, but priorities are similar."
          : '토론배틀의 AI 판정과 실제 대회 심사가 공통으로 보는 다섯 항목.\n가중치는 대회별로 다르지만 우선순위는 비슷합니다.'}
      >
        <CriteriaList lang={lang} />
      </ChapterBand>

      {/* CH05 실전 팁 7 */}
      <ChapterBand
        id="ch6"
        bg="#f6f0e2"
        eyebrow={isEn ? 'CHAPTER 05 · 7 live-stage tips' : 'CHAPTER 05 · 실전 팁 7'}
        title={isEn ? <>7 tactics</> : <>무대 위에서</>}
        hand={isEn ? 'to use mid-stage.' : '바로 써먹는 7가지.'}
        lead={isEn
          ? 'The moment the round starts, your mind goes blank. This is the short list for that moment.'
          : '라운드가 시작되면 머리가 새하얘집니다. 그 순간을 위한 짧은 체크리스트.'}
      >
        <TipsGrid lang={lang} />
      </ChapterBand>

      {/* GLOSSARY */}
      <ChapterBand
        id="glossary"
        bg="#efe7d3"
        eyebrow={isEn ? 'GLOSSARY · Key terms' : 'GLOSSARY · 자주 쓰는 용어'}
        title={isEn ? <>Terms you'll hear</> : <>토론장에서</>}
        hand={isEn ? 'on the floor.' : '이 말들이 오간다.'}
        lead={isEn
          ? "Key terms that come up during a round. For the full 80+ glossary, see 'Glossary' in Go deeper."
          : '라운드 중 자주 등장하는 핵심 용어.\n더 많은 용어는 \'더 배우기\'의 용어 사전에서 한국어·영어 병기로 볼 수 있습니다.'}
      >
        <GlossaryStrip lang={lang} />
      </ChapterBand>

      {/* ===== DeeperView — #deeper 섹션, 7개 허브 카드 ===== */}
      <section id="deeper" style={{ background: '#f6f0e2', padding: '96px 64px 100px', borderTop: '1.5px solid #e3d9c2' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <SectionHead
            eyebrow={isEn ? 'ADVANCED · Go deeper' : 'ADVANCED · 심화 과정'}
            title={isEn
              ? <>Theory, history, resources, <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--celadon)' }}>one level deeper.</span></>
              : <>이론·역사·자원, <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--celadon)' }}>한 단계 깊게.</span></>
            }
            accent="var(--gold)"
            lead={isEn
              ? "Not for your next round, but if you want to truly understand debate — here are 7 in-depth hubs, each with search and filters."
              : "토론배틀 한 판에 바로 쓰지는 않지만, 토론을 진짜로 이해하려면 알아두면 좋은 자료들. \n7개 심화 콘텐츠로 분리해 각각 검색·필터까지 가능하게 만들었습니다."}
          />
          <div className="lib-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, marginTop: 52, alignItems: 'stretch' }}>
            {t.hubCards.map((c, i) => (
              <HubCard
                key={c.id}
                idx={i}
                cat={c.cat}
                glyph={HUB_GLYPHS[c.id] ?? '討'}
                label={c.label}
                desc={c.desc}
                count={c.count}
                accent={HUB_ACCENTS[c.id] ?? 'var(--celadon)'}
                hub={t.hub}
                onClick={() =>
                  onOpenContent?.(
                    c.id as 'topics' | 'fallacies' | 'glossary' | 'famous' | 'samples' | 'formats' | 'resources',
                  )
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 단일 LibraryCTA — START NOW ===== */}
      <LibraryCTA
        eyebrow={t.cta.singleEyebrow}
        title={t.cta.singleTitle1}
        hand={t.cta.singleTitle2}
        body={t.cta.singleBody}
        primary={t.cta.singlePrimary}
        secondary={t.cta.singleSecondary}
        onPrimary={onBack}
        onSecondary={() => scrollTo('deeper')}
      />

      {/* 반응형 + 그리드 스타일 */}
      <style>{`
        @media (max-width: 768px) {
          .lib-grid-3 { grid-template-columns: 1fr !important; }
          .lib-grid-2 { grid-template-columns: 1fr !important; }
          .lib-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .lib-weight { display: none !important; }
          section[style*="padding: 92px 64px"] { padding: 56px 20px !important; }
          section[style*="padding: 96px 64px"] { padding: 56px 20px !important; }
          section[style*="padding: 104px 64px"] { padding: 72px 20px !important; }
          section[style*="padding: 40px 64px"] { padding: 28px 20px 36px !important; }
        }
        @media (max-width: 480px) {
          .lib-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
