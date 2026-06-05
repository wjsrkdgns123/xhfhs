import { useMemo, useState } from 'react';
import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';
import { headerStrings } from '../../i18n/header';

interface Term {
  k: string;
  en?: string;
  cat: string;
  d: string;
}

const TERMS: Term[] = [
  // 절차 / 진행
  { k: '입론', en: 'Constructive', cat: '절차', d: '자기 측의 핵심 주장과 근거를 처음 제시하는 발언. 입론에서 제기되지 않은 논점은 반박 단계에서 사용 불가.' },
  { k: '반박', en: 'Rebuttal', cat: '절차', d: '상대의 입론·발언에 대해 약점을 지적하고 자기 측을 보강하는 발언 단계.' },
  { k: '마무리 발언', en: 'Closing / Summary', cat: '절차', d: '토론의 결론부에서 양측이 자기 입장을 종합적으로 정리하는 단계.' },
  { k: '교차 질문', en: 'Cross-Examination', cat: '절차', d: '상대에게 직접 질문해 논거를 검증하는 단계. 짧고 날카로운 질문으로 약점 노출.' },
  { k: '준비 시간', en: 'Prep Time', cat: '절차', d: '발언 사이 양측에게 주어지는 전략 정리 시간. 토론 양식별로 분량이 다름.' },
  { k: '발언권', en: 'Floor', cat: '절차', d: '현재 발언할 권리. 사회자가 누구에게 발언권을 부여할지 관리.' },
  { k: '이의 있음', en: 'Objection / Point of Order', cat: '절차', d: '진행상 문제(시간 초과, 규칙 위반 등)를 즉시 지적하는 발언.' },
  { k: '단계 전환', en: 'Phase Transition', cat: '절차', d: '한 발언 단계가 끝나고 다음 단계로 넘어가는 사회자 진행 절차.' },

  // 역할 / 측
  { k: '찬성 측', en: 'Pro / Affirmative / Proposition', cat: '역할', d: '주제(명제)에 동의하고 입증할 책임을 진 측.' },
  { k: '반대 측', en: 'Con / Negative / Opposition', cat: '역할', d: '주제에 반대하고 찬성 측 입증을 무너뜨리거나 자체 논거를 제시하는 측.' },
  { k: '사회자', en: 'Moderator / Chair', cat: '역할', d: '토론을 진행하고 단계·시간·규칙을 관리하는 중립적 진행자.' },
  { k: '심사위원', en: 'Judge', cat: '역할', d: '논거의 질·클래시·표현 등을 평가해 승부를 결정하는 인물 또는 단체.' },
  { k: '관전자', en: 'Audience / Spectator', cat: '역할', d: '토론을 시청하며 토론배틀에선 투표권을 행사. 발언은 별도 채팅으로 분리.' },
  { k: '팀 캡틴', en: 'First Speaker', cat: '역할', d: '팀 단위 토론에서 첫 발언을 맡는 인물. 입론의 톤과 프레임을 결정.' },

  // 논증 구조
  { k: '명제', en: 'Resolution / Motion', cat: '논증', d: '토론의 주제 문장. "X는 Y해야 한다" 같은 가치·정책 명제.' },
  { k: '주장', en: 'Claim', cat: '논증', d: '논증의 결론으로 내세우는 핵심 메시지.' },
  { k: '근거', en: 'Evidence / Ground', cat: '논증', d: '주장을 뒷받침하는 사실·통계·사례·전문가 의견.' },
  { k: '뒷받침', en: 'Warrant', cat: '논증', d: '근거에서 결론으로 가는 논리적 다리. 빠지면 비약이 됨.' },
  { k: '예외 단서', en: 'Qualifier / Backing', cat: '논증', d: '주장의 적용 범위·강도를 한정하는 단서. 책임 있는 주장이 갖는 특징.' },
  { k: '반례', en: 'Counter-example', cat: '논증', d: '일반화·주장을 반박하기 위해 제시하는 구체적 반대 사례.' },
  { k: '연결고리 (링크)', en: 'Link', cat: '논증', d: '논증 내에서 한 명제가 다음 명제로 이어지는 인과·논리적 다리.' },
  { k: '임팩트', en: 'Impact', cat: '논증', d: '주장이 받아들여졌을 때 발생하는 실제 결과의 크기·중요성.' },

  // 평가 / 메타
  { k: '클래시', en: 'Clash', cat: '평가', d: '양측이 정면으로 부딪치는 핵심 쟁점. 평가의 무게중심.' },
  { k: '비교 분석', en: 'Weighing', cat: '평가', d: '양측 임팩트를 비교해 자기 측이 왜 더 무거운지 설명하는 작업.' },
  { k: '평가 프레임', en: 'Framework / Standard', cat: '평가', d: '"무엇을 기준으로 누가 이긴 것인지" 측정 기준을 제안하는 메타 논증.' },
  { k: '입증 책임', en: 'Burden of Proof', cat: '평가', d: '주장하는 쪽이 그것이 옳다는 근거를 댈 책임. 일반적으로 찬성 측에 있음.' },
  { k: '입증 임계점', en: 'Threshold', cat: '평가', d: '입증 책임을 충족하기 위해 필요한 근거의 최소 수준.' },
  { k: '용어 정의', en: 'Definition', cat: '평가', d: '주제 속 모호한 단어를 토론용으로 한정하는 절차. 양측 합의가 이상적.' },
  { k: '범위 한정', en: 'Scope Limitation', cat: '평가', d: '토론에서 다룰 시간·지역·대상 범위를 미리 좁히는 합의.' },
  { k: '관찰', en: 'Observation', cat: '평가', d: '논증 전 사실 환경·맥락에 대한 짧은 설명. 본 논증의 전제 정립.' },
  { k: '평가 우선순위', en: 'Voter / Voting Issue', cat: '평가', d: '심사위원이 결정 시 어떤 쟁점을 가장 무겁게 봐야 하는지 강조하는 발언.' },

  // 전략 / 기법
  { k: '컷-인', en: 'Cut-in', cat: '전략', d: '상대 발언 중 짧게 끼어드는 기법. 토론배틀에선 "이의 있음!"으로 구현.' },
  { k: '준비된 논거', en: 'Block', cat: '전략', d: '예상되는 상대 논거에 대해 미리 준비해둔 표준 응답.' },
  { k: '함정 질문', en: 'Loaded Question', cat: '전략', d: '대답 자체가 부당한 전제를 받아들이게 만드는 질문. 토론에선 거짓 전제를 짚어내야 함.' },
  { k: '시그포스팅', en: 'Signposting', cat: '전략', d: '"첫째, 둘째, 셋째…"처럼 발언 구조를 명시적으로 알려주는 기법. 청자 이해 ↑' },
  { k: '터널링', en: 'Tunnelling', cat: '전략', d: '한 쟁점에 집중해 그 안에서 깊게 파고드는 전략. 폭보다 깊이.' },
  { k: '확장 (Extending)', en: 'Extension', cat: '전략', d: '동료가 제시한 논거를 다음 발언자가 더 깊게 발전시키는 작업.' },
  { k: '드롭 (Drop)', en: 'Drop / Concede', cat: '전략', d: '상대가 한 주장에 대해 응답하지 않고 넘어가는 것. 묵인으로 해석됨.' },
  { k: '카운터 모델', en: 'Counter-Model', cat: '전략', d: '반대 측이 단순 반박이 아니라, 대안적 정책·시스템을 제시해 비교하는 전략.' },
  { k: '워런트 어택', en: 'Warrant Attack', cat: '전략', d: '근거가 아니라 근거와 결론 사이의 논리적 다리(warrant)를 공격하는 반박.' },

  // 양식 / 종류
  { k: 'BP (영국식 의회식)', en: 'British Parliamentary', cat: '양식', d: '4개 팀이 동시에 토론하는 형식. WUDC가 사용. 정부·야당 측 각 2팀.' },
  { k: 'WSDC (세계 학생식)', en: 'World Schools', cat: '양식', d: '고교생 세계 대회에서 사용. 3:3 팀 토론. 5명의 발언자 구성.' },
  { k: 'LD (링컨-더글라스)', en: 'Lincoln-Douglas', cat: '양식', d: '미국 고교 1:1 가치 토론. 도덕·철학 명제를 다룸.' },
  { k: 'PF (퍼블릭 포럼)', en: 'Public Forum', cat: '양식', d: '미국 고교 2:2 정책 토론. 시사 이슈가 주제, 일반인이 이해하기 쉬운 톤.' },
  { k: 'Policy (정책)', en: 'Policy Debate', cat: '양식', d: '미국 고교/대학 2:2 형식. 정부 정책 변경 plan을 두고 토론.' },
  { k: 'Karl-Popper', en: 'Karl Popper', cat: '양식', d: '동유럽·아시아 학생 토론 양식. 3:3, 가치·정책 모두 다룸.' },
  { k: '의회식', en: 'Parliamentary', cat: '양식', d: '의회 진행 양식을 모방. 정부/야당 측이 한 명제에 대해 토론.' },
  { k: '한국 교육식', en: 'Korean Educational', cat: '양식', d: '국내 학교에서 자주 쓰는 입론·반론·재반론 단순 양식.' },

  // 평가 기준 (대회 빈출)
  { k: '논리성', en: 'Logic', cat: '기준', d: '주장과 근거가 논리적으로 일관되는지에 대한 평가.' },
  { k: '근거의 질', en: 'Evidence Quality', cat: '기준', d: '인용 자료의 신뢰성·구체성·최신성을 본다.' },
  { k: '발표력', en: 'Delivery', cat: '기준', d: '발음·속도·억양·시선 처리 등 비언어적 측면 평가.' },
  { k: '매너', en: 'Decorum', cat: '기준', d: '상대를 존중하는 어조, 인신공격 회피 등 토론 윤리.' },
  { k: '시간 관리', en: 'Time Management', cat: '기준', d: '주어진 시간 안에 핵심을 전달하고 라운드를 마치는 능력.' },

  // AI / 토론배틀 고유
  { k: 'AI 사회자', en: 'AI Moderator', cat: 'AI', d: '토론배틀의 AI가 자동으로 개회·전환·마무리를 진행하는 기능. Claude 기반.' },
  { k: 'AI 토론자', en: 'AI Debater', cat: 'AI', d: '상대 토론자가 없을 때 AI가 찬성/반대 자리를 채워주는 모드.' },
  { k: '발언 다듬기', en: 'Polishing', cat: 'AI', d: 'AI가 사용자의 메시지를 가독성 있게 정리해주는 옵션.' },
  { k: '판정 (정성평가)', en: 'AI Verdict', cat: 'AI', d: 'AI 사회자가 토론 전체를 분석해 더 설득력 있던 측을 평가한 결과. 관전자 투표 50%와 합산.' },
  { k: '관전석 투표', en: 'Audience Vote', cat: 'AI', d: '관전자가 라운드 종료 후 어느 쪽이 더 설득력 있었는지 투표. 결과의 50%.' },
  { k: '연장 라운드', en: 'Extension Round', cat: 'AI', d: '결판이 안 났을 때 양측 동의로 한 라운드 더 진행.' },
  { k: '비공개방', en: 'Private Room', cat: 'AI', d: '공개 목록에 노출되지 않는 토론방. 초대 링크로만 입장 가능.' },

  // 자주 등장하는 단어
  { k: '커뮤니티 가치', en: 'Community Value', cat: '논증', d: '도덕·가치 토론에서 측이 옹호하는 상위 가치 (예: 자유, 평등, 정의).' },
  { k: '기준', en: 'Criterion', cat: '논증', d: '커뮤니티 가치를 측정하는 구체적 도구.' },
  { k: '관찰자 효과', en: 'Audience Effect', cat: '평가', d: '관전자 존재가 발언자의 표현·전략에 미치는 영향.' },
  { k: '맥락', en: 'Context', cat: '논증', d: '주제가 다뤄지는 시기·지역·전제 환경. 토론 초반에 명확히 해두는 게 좋음.' },
  { k: '귀납', en: 'Induction', cat: '논증', d: '구체 사례에서 일반 결론을 끌어내는 추론.' },
  { k: '연역', en: 'Deduction', cat: '논증', d: '일반 원리에서 구체 결론을 도출하는 추론.' },
  { k: '귀류법', en: 'Reductio ad Absurdum', cat: '논증', d: '상대 입장을 받아들이면 모순적 결과가 나옴을 보여 반박.' },
  { k: '비유 논증', en: 'Argument by Analogy', cat: '논증', d: '유사한 사례를 들어 결론을 끌어내는 추론. 비유의 정합성이 핵심.' },
  { k: '가설적 시나리오', en: 'Hypothetical', cat: '논증', d: '"만약 ___라면"으로 시작해 구체 상황을 가정하고 논증.' },
  { k: '카운터플랜', en: 'Counterplan', cat: '전략', d: '반대 측이 찬성안 대신 더 나은 대안 정책을 제시하는 전략.' },
  { k: '드릴다운', en: 'Drill-down', cat: '전략', d: '특정 쟁점 하나를 끝까지 파고들어 결정적 약점을 노출시키는 기법.' },
  { k: '되갚기 (Spike)', en: 'Spike / Preemption', cat: '전략', d: '예상되는 반박을 입론 단계에서 미리 차단하는 발언.' },
  { k: '롤백 (Rollback)', en: 'Rollback', cat: '전략', d: '이전 발언에서 양보한 지점을 후속 발언에서 다시 가져오려는 전략.' },
  { k: '진영 논리', en: 'Tribal Argument', cat: '오류', d: '주장의 옳고 그름이 아니라 어느 진영이 말했는가로 평가하는 경향.' },
  { k: 'AI vs 인간', en: 'AI vs Human', cat: '주제', d: '토론배틀에서 자주 다뤄지는 메타 주제. AI의 인지·창의·도덕성을 비교.' },
];

const ALL_CATS = ['전체', ...Array.from(new Set(TERMS.map((t) => t.cat)))];

/** EN translations for 80+ Korean definitions. KO term + en label stay
 *  in their original `k` / `en` fields; only the description `d` is
 *  swapped. Categories are mapped via CAT_EN. */
const TERMS_EN_DEF: Record<string, string> = {
  // 절차 / 진행
  '입론': 'The opening speech where you lay out your side\'s core claims and evidence. Any point not raised here cannot be introduced in rebuttal.',
  '반박': 'Phase where you point out weaknesses in your opponent\'s constructive and reinforce your own.',
  '마무리 발언': 'The closing phase where both sides summarize their positions comprehensively.',
  '교차 질문': 'Direct questioning phase to probe the opponent\'s arguments. Short and sharp questions expose weaknesses.',
  '준비 시간': 'Strategy-organization time given between speeches. Amount varies by format.',
  '발언권': 'The right to speak at the current moment. The moderator manages who gets the floor.',
  '이의 있음': 'An immediate flag for procedural issues (over time, rule violation, etc.).',
  '단계 전환': "The moderator's process for moving from one speech phase to the next.",
  // 역할 / 측
  '찬성 측': 'The side that agrees with the resolution and bears the burden of proof.',
  '반대 측': "The side that opposes the resolution and either dismantles the affirmative's proof or presents its own arguments.",
  '사회자': 'A neutral facilitator who runs the debate, managing phases, time, and rules.',
  '심사위원': 'The person or panel that evaluates argument quality, clash, delivery, etc. and decides the result.',
  '관전자': 'Watches the debate and, in DebateBattle, casts a vote. Their comments are separated into a side chat.',
  '팀 캡틴': "The first speaker on a team. Sets the constructive's tone and frame.",
  // 논증
  '명제': 'The debate\'s topic statement — a value or policy proposition like "X should Y".',
  '주장': "The core message you put forward as the argument's conclusion.",
  '근거': 'Facts, statistics, examples, or expert opinion supporting a claim.',
  '뒷받침': 'The logical bridge from evidence to conclusion. Without it, the argument leaps.',
  '예외 단서': "A qualifier limiting the claim's scope or strength. A hallmark of responsible argumentation.",
  '반례': 'A concrete counter-instance presented to refute a generalization or claim.',
  '연결고리 (링크)': 'The causal or logical bridge linking one proposition to the next within an argument.',
  '임팩트': 'The size and importance of the real-world consequence if the claim is accepted.',
  // 평가
  '클래시': 'The core point where both sides directly clash — the center of gravity for evaluation.',
  '비교 분석': 'Comparing impacts on both sides to argue why yours is heavier.',
  '평가 프레임': 'A meta-argument proposing what standard to use to decide who won.',
  '입증 책임': 'The obligation of the side making a claim to support it. Usually rests on the affirmative.',
  '입증 임계점': 'The minimum level of evidence needed to discharge the burden of proof.',
  '용어 정의': 'The process of pinning down ambiguous words for the debate. Mutual agreement is ideal.',
  '범위 한정': 'Pre-debate agreement narrowing the time, region, or subject covered.',
  '관찰': 'A short setup describing factual environment or context, establishing the premises for the main argument.',
  '평가 우선순위': "A speech emphasizing which issues judges should weigh most when deciding.",
  // 전략
  '컷-인': 'Briefly interrupting an opponent\'s speech. In DebateBattle this is the "Objection!" overlay.',
  '준비된 논거': 'A pre-built standard response to a likely opposition argument.',
  '함정 질문': 'A question whose answer makes you accept an unfair premise. You must call out the false premise.',
  '시그포스팅': 'Explicitly announcing your structure ("first… second…"). Improves listener comprehension.',
  '터널링': 'Focusing on one issue and going deep — depth over breadth.',
  '확장 (Extending)': 'A later team speaker further developing an argument introduced by a teammate.',
  '드롭 (Drop)': "Not responding to an opponent's argument — interpreted as tacit acceptance.",
  '카운터 모델': "A strategy where the opposition presents an alternative policy/system to compare, not just rebut.",
  '워런트 어택': 'A rebuttal that attacks the logical bridge (warrant) between evidence and conclusion, not the evidence itself.',
  // 양식
  'BP (영국식 의회식)': 'A format where 4 teams debate simultaneously. Used at WUDC. 2 government teams + 2 opposition teams.',
  'WSDC (세계 학생식)': 'Used at the world high-school championship. 3v3 team debate, with 5 speakers total per round.',
  'LD (링컨-더글라스)': 'US high-school 1v1 value debate. Covers moral and philosophical resolutions.',
  'PF (퍼블릭 포럼)': 'US high-school 2v2 policy debate. Current-affairs topics, tone accessible to general audiences.',
  'Policy (정책)': 'US high-school/college 2v2 format. Debates a specific government policy plan.',
  'Karl-Popper': 'Eastern European / Asian student debate format. 3v3 covering both value and policy.',
  '의회식': 'Modeled on parliamentary procedure. Government vs. opposition sides debate a single motion.',
  '한국 교육식': 'A simple constructive / rebuttal / counter-rebuttal format common in Korean schools.',
  // 기준
  '논리성': "Evaluation of whether claims and evidence are logically consistent.",
  '근거의 질': 'Looks at the reliability, specificity, and recency of cited sources.',
  '발표력': 'Non-verbal aspects: pronunciation, pace, intonation, eye contact.',
  '매너': 'Debate ethics: respectful tone, avoiding personal attacks.',
  '시간 관리': 'Ability to deliver core points and finish the round within the given time.',
  // AI
  'AI 사회자': 'DebateBattle\'s built-in AI that automatically handles opening, transitions, and closing. Claude-based.',
  'AI 토론자': 'Mode where AI fills the Pro or Con seat when no opponent is available.',
  '발언 다듬기': "An option where AI polishes a user's message for readability before sending.",
  '판정 (정성평가)': "AI moderator's qualitative analysis of the debate, deciding which side was more persuasive. Combined 50/50 with audience vote.",
  '관전석 투표': "Spectator vote after the round on which side was more persuasive. Counts for 50% of the verdict.",
  '연장 라운드': 'An extra round when the debate is inconclusive, played with both sides\' consent.',
  '비공개방': 'A debate room hidden from the public list — joinable only via invite link.',
  // 자주 등장
  '커뮤니티 가치': 'In value debates, the higher-order value (e.g. freedom, equality, justice) your side advocates.',
  '기준': "A concrete tool for measuring the community value.",
  '관찰자 효과': "The effect of audience presence on a speaker's expression and strategy.",
  '맥락': "The time, place, and premise environment in which the topic is treated. Best clarified early in the round.",
  '귀납': 'Inference drawing a general conclusion from specific cases.',
  '연역': 'Inference deriving a specific conclusion from general principles.',
  '귀류법': "Refutation by showing the opponent's position leads to absurd or contradictory consequences.",
  '비유 논증': 'Inference drawing a conclusion from a similar case. The integrity of the analogy is key.',
  '가설적 시나리오': "Starts with 'if ___' to argue from a hypothetical situation.",
  '카운터플랜': 'A strategy where the opposition proposes a better alternative policy instead of the affirmative\'s.',
  '드릴다운': 'Drilling deeper and deeper into a single issue to expose a decisive weakness.',
  '되갚기 (Spike)': 'A constructive-stage speech that preemptively blocks an anticipated rebuttal.',
  '롤백 (Rollback)': 'Strategy of trying to reclaim a point you previously conceded.',
  '진영 논리': 'A tendency to evaluate claims by which camp said them, rather than by their truth.',
  'AI vs 인간': "A recurring meta-topic on DebateBattle — comparing AI's cognition, creativity, and morality with humans'.",
};

const CAT_EN: Record<string, string> = {
  '전체': 'All',
  '절차': 'Procedure',
  '역할': 'Roles',
  '논증': 'Argumentation',
  '평가': 'Evaluation',
  '전략': 'Strategy',
  '양식': 'Formats',
  '기준': 'Criteria',
  'AI': 'AI',
  '오류': 'Fallacy',
  '주제': 'Topic',
};

export function GlossaryView({
  lang = 'ko',
  onBackToLearn,
  onNav,
  onGoLobby,
}: {
  lang?: 'ko' | 'en';
  onBackToLearn?: () => void;
  onNav?: (page: string) => void;
  onGoLobby?: () => void;
} = {}) {
  useDocumentMeta(
    lang === 'en' ? 'Debate Glossary — DebateBattle' : '토론 용어 사전 — 토론배틀',
    lang === 'en'
      ? `Definitions of ${TERMS.length}+ debate terms — procedure, roles, argumentation, scoring, strategy, formats, criteria. Paired KR/EN.`
      : `토론에서 자주 쓰는 한국어·영어 용어 ${TERMS.length}여 개의 정의. 절차·역할·논증·평가·전략·양식·기준.`,
  );
  const ts = headerStrings[lang].search;
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('전체');
  const isFiltered = search.trim() !== '' || cat !== '전체';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TERMS.filter((t) => {
      if (cat !== '전체' && t.cat !== cat) return false;
      if (!q) return true;
      return (
        t.k.toLowerCase().includes(q) ||
        (t.en?.toLowerCase().includes(q) ?? false) ||
        t.d.toLowerCase().includes(q)
      );
    });
  }, [search, cat]);

  return (
    <ContentLayout
      theme="library"
      lang={lang}
      onBackToLearn={onBackToLearn}
      onNav={onNav}
      onGoLobby={onGoLobby}
      crumbLabel={lang === 'ko' ? '용어 사전' : 'Glossary'}
      eyebrow={lang === 'en' ? `GLOSSARY · ${TERMS.length}+` : `GLOSSARY · 용어 ${TERMS.length}+`}
      title={lang === 'en' ? (
        <>
          The dictionary of
          <br />
          <span className="hand">debate language.</span>
        </>
      ) : (
        <>
          토론에 쓰이는
          <br />
          <span className="hand">말의 사전.</span>
        </>
      )}
      subtitle={lang === 'en' ? (
        <>
          <b>{TERMS.length}+ terms</b> covering debate procedure, roles, argumentation, scoring,
          strategy, and formats — paired Korean/English. A handy reference when learning the rules
          or reading tournament guides.
        </>
      ) : (
        <>
          토론 절차·역할·논증·평가·전략·양식까지 <b>{TERMS.length}여 개</b>의
          용어를 한국어·영어 병기로 정리했습니다. 처음 토론을 만나거나 대회 룰을
          이해할 때 자주 참고하면 좋습니다.
        </>
      )}
      hint={lang === 'en' ? '📖 KR / EN paired for tournament rulebooks too' : '📖 한국어·영어 병기로 대회 룰서까지 한 번에'}
    >
      <div className="topics-controls">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'en' ? '🔍 Search terms or definitions' : '🔍 용어·뜻으로 검색'}
          className="topics-search"
          aria-label={lang === 'en' ? 'Search terms or definitions' : '용어·뜻으로 검색'}
        />
        <div className="topics-cats" role="group" aria-label={lang === 'en' ? 'Filter by category' : '카테고리 필터'}>
          {ALL_CATS.map((c) => (
            <button
              key={c}
              type="button"
              className={`topics-cat ${cat === c ? 'active' : ''}`}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
            >
              {lang === 'en' ? (CAT_EN[c] ?? c) : c}
            </button>
          ))}
        </div>
      </div>

      <div className="topics-meta" aria-live="polite" aria-atomic="true">
        <span className="topics-count">{ts.resultCount(filtered.length, TERMS.length)}</span>
        {cat !== '전체' && (
          <button
            type="button"
            className="topics-active-chip"
            onClick={() => setCat('전체')}
            aria-label={`${lang === 'en' ? (CAT_EN[cat] ?? cat) : cat} ${ts.reset}`}
          >
            {lang === 'en' ? (CAT_EN[cat] ?? cat) : cat}
            <span className="topics-active-chip__x" aria-hidden="true">×</span>
          </button>
        )}
        {isFiltered && (
          <button
            type="button"
            className="topics-reset"
            onClick={() => { setSearch(''); setCat('전체'); }}
          >
            {ts.reset}
          </button>
        )}
      </div>

      <div className="glossary-list">
        {filtered.map((t) => (
          <article key={t.k} className="glossary-card">
            <div className="glossary-card__head">
              <h3 className="glossary-card__k">{lang === 'en' && t.en ? t.en : t.k}</h3>
              {t.en && <span className="glossary-card__en">{lang === 'en' ? t.k : t.en}</span>}
              <span className="glossary-card__cat">{lang === 'en' ? (CAT_EN[t.cat] ?? t.cat) : t.cat}</span>
            </div>
            <p className="glossary-card__d">{lang === 'en' ? (TERMS_EN_DEF[t.k] ?? t.d) : t.d}</p>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="topics-empty" role="status">
            <p className="topics-empty__msg">{ts.noResults}</p>
            <p className="topics-empty__hint">{ts.noResultsHint}</p>
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
