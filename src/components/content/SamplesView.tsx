import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';

interface SampleMsg {
  side: 'mod' | 'pro' | 'con';
  name: string;
  text: string;
}

interface Sample {
  topic: string;
  proName: string;
  conName: string;
  result: 'pro' | 'con' | 'tie';
  audienceProPct: number;
  aiPick: 'pro' | 'con' | 'tie';
  why: string;
  msgs: SampleMsg[];
}

const SAMPLES: Sample[] = [
  {
    topic: 'AI는 결국 인간의 일자리를 대체한다',
    proName: '미래파',
    conName: '실용주의자',
    result: 'pro',
    audienceProPct: 56,
    aiPick: 'pro',
    why: '찬성 측이 단순 자동화에서 인지 노동으로 확대되는 추세를 구체 수치(이미 사무직 40% 자동화 영향권)로 제시하고, 반대 측의 \'새 직군이 생긴다\'는 주장에 대해 "새 직군의 절대 수 < 사라지는 직군의 수"를 데이터로 반박해 클래시에서 우위. 다만 임팩트 비중에 대한 weighing이 약했다는 점에서 차이가 크지는 않음.',
    msgs: [
      { side: 'mod', name: '🤖 AI 사회자', text: '주제: AI는 결국 인간의 일자리를 대체한다. 입증책임은 찬성 측에 있으며, 단순 자동화가 아니라 \'결국 대체\'의 입증이 핵심입니다. 미래파 님부터 찬성 입론 부탁드립니다.' },
      { side: 'pro', name: '미래파', text: '저는 다음 세 가지 근거로 결국 대체된다고 봅니다. 첫째, OECD 2023 보고서에 따르면 사무직 업무의 40%가 이미 자동화 영향권입니다. 둘째, GPT-4 이후 인지 노동 — 작성·요약·분석 — 까지 AI가 수행하고 있고, 셋째, 자동화의 역사는 일관되게 동일 직군의 인력을 줄여왔습니다. 19세기 직조공, 20세기 은행 창구 직원이 그 예시입니다. \'새 직군이 생긴다\'는 반론이 자주 나오지만, 새 직군의 절대 수는 사라지는 직군의 수보다 항상 적었다는 점을 미리 짚어둡니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '미래파 측이 수치와 역사적 추세, 그리고 예상되는 반박을 미리 차단했습니다. 실용주의자 님, 반대 입론입니다. 자기 측 핵심 논거와 함께, 찬성 측 \'결국 대체\'의 입증이 충분한지 짚어주세요.' },
      { side: 'con', name: '실용주의자', text: '저는 \'대체되지 않는다\'가 아니라 \'결국이라는 단정은 과합니다\'를 주장합니다. 세 가지입니다. 첫째, 자동화와 대체는 다릅니다. ATM 도입 후 은행원이 줄 줄 알았지만 오히려 늘었고, 업무 내용만 바뀌었습니다. 둘째, 판단·책임이 따르는 영역(법정 판결, 의료 진단의 최종 결정, 교육)은 인간이 계속 담당합니다. 셋째, AI는 도구이지 행위자가 아닙니다. 도구를 잘 쓰는 인간 + AI 조합이 표준이 될 것입니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '양측 입론 잘 들었습니다. 이제 찬성 반박 단계입니다. 새 논거 도입은 금지되며, 실용주의자 측의 ATM·판단 영역 주장에 직접 응답해주세요.' },
      { side: 'pro', name: '미래파', text: 'ATM 사례 — 은행원 절대 수가 늘었지만 1인당 처리하는 거래 수는 폭증했고, 신규 채용은 둔화됐습니다. 즉 "일자리 안 사라짐"이 아니라 "생산성 변화"입니다. 판단 영역 — 의료 진단에서도 IBM 왓슨 이후 AI 보조 비율이 30% 이상이고, 미국 일부 법원은 보석 결정에 AI 알고리즘을 도입했습니다. \'판단도 점진 대체\' 추세가 명확합니다. 결정적으로, 실용주의자 측은 "결국이라는 단정이 과하다"고만 했지, 대체되지 않는 영역을 명확히 제시하지 못했습니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '미래파 측이 ATM·의료·판결 사례를 들어 반박했고, 반대 측이 비교 기준을 명확히 하지 못했다는 점도 짚었습니다. 이제 반대 반박입니다. 실용주의자 님.' },
      { side: 'con', name: '실용주의자', text: '\'점진 대체\'는 \'결국 대체\'가 아닙니다. 의료 AI 30% 보조라는 통계 자체가, 70%는 여전히 인간이 한다는 의미입니다. 또한 \'대체\'의 정의를 명확히 해야 합니다. 모든 인간 노동의 0%가 된다는 의미라면 그건 입증되지 않았고, 일부 영역이라는 의미라면 이미 우리도 동의합니다. 입증책임은 \'결국 = 완전 대체\'에 대한 것이며, 그 점은 찬성 측이 아직 입증하지 못했습니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '양측 반박 종료. 마무리 심사로 넘어갑니다. (이어지는 verdict은 본 화면에서 생략 — 자세한 평가는 본문 위 \'왜\' 섹션 참조)' },
    ],
  },
  {
    topic: '주 4일 근무제, 한국에 도입해도 된다',
    proName: '시민A',
    conName: '시민B',
    result: 'tie',
    audienceProPct: 51,
    aiPick: 'tie',
    why: '양측 모두 명확한 통계 기반 논증을 펼쳤음. 찬성은 아이슬란드·영국 시범 사업의 생산성 유지 데이터를, 반대는 한국 GDP 구조와 중소기업 비중을 들어 비교 분석. 클래시에서 결정적 우위가 없었고 입증책임 측면에서도 양측이 비등. AI는 무승부로 판정했고 관전자 투표도 51:49로 한쪽이 결정적으로 우세하지 않음.',
    msgs: [
      { side: 'mod', name: '🤖 AI 사회자', text: '주제: 주 4일 근무제 한국 도입. 입증책임은 찬성 측에 있습니다. 시민A 님부터 찬성 입론입니다.' },
      { side: 'pro', name: '시민A', text: '주 4일 근무제는 단순한 휴식 늘리기가 아니라 검증된 정책입니다. 아이슬란드는 2015-19년 약 1%의 전체 노동력을 대상으로 시범했고 생산성 유지·삶의 만족도 상승이라는 결과를 얻어 2022년 정식 도입했습니다. 영국 4 Day Week 프로그램은 61개 기업 92%가 영구 전환을 결정했죠. 한국의 OECD 최장 노동시간과 OECD 평균 이하 생산성 격차를 메울 가장 직접적 정책입니다.' },
      { side: 'con', name: '시민B', text: '아이슬란드·영국 사례는 인상적이지만 한국 산업 구조와 다릅니다. 우리는 제조업·서비스업 중 영세 소상공인 비중이 OECD 최고 수준입니다. 4일제 도입 시 추가 인건비 부담을 흡수할 여력이 부족합니다. 또한 \'유연근무제\'가 이미 법제화돼 있는데 실제 활용률은 13%에 그칩니다 — 제도가 있어도 문화가 따라오지 않습니다. 4일제도 결국 대기업만의 특권이 될 위험이 큽니다.' },
      { side: 'pro', name: '시민A', text: '"중소기업이 못 견딘다"는 우려는 타당하지만, 정확히 그래서 단계적·업종별 도입을 제안합니다. 영국 시범도 IT·금융·서비스업이 먼저 시작했고, 제조업은 후순위였습니다. 또한 유연근무제 활용률이 낮은 건 \'제도\'의 문제가 아니라 \'기본값\'의 문제입니다. 4일제는 기본값을 바꾸는 정책입니다.' },
      { side: 'con', name: '시민B', text: '단계적 도입에 동의한다 해도 핵심 쟁점은 그대로입니다 — 가장 도움이 필요한 영세 노동자(전체의 80%)는 가장 마지막에 혜택을 받거나 영영 못 받을 가능성이 큽니다. 또한 한국은 야간·서비스 노동 비중이 높아 \'5일 → 4일\' 단순 환산이 불가능한 직군이 너무 많습니다. 결과적으로 \'도입해도 된다\'의 입증이 \'일부 화이트칼라에게만 적용 가능하다\'로 축소되는 셈입니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '양측이 데이터 기반으로 정면 충돌. 양측 모두 자기 입장을 끝까지 일관되게 유지했습니다. 마무리 평가에서 무승부 가능성이 큰 토론이었습니다.' },
    ],
  },
  {
    topic: '인터넷 익명성은 폐지해야 한다',
    proName: '질서파',
    conName: '자유파',
    result: 'con',
    audienceProPct: 38,
    aiPick: 'con',
    why: '찬성 측이 악성댓글·범죄 추적이라는 한정된 효용을 강조한 반면, 반대 측은 \'익명성 폐지\'의 비용(소수자 보호 약화, 내부고발 위축, 권위주의 검열 악용)을 구체 사례(중국 인터넷 실명제, 카카오 실명제 폐기 등)와 함께 제시. 입증책임 측면에서 \'폐지\'의 부담이 찬성 측에 있는데 그 부담을 충분히 이행하지 못함.',
    msgs: [
      { side: 'mod', name: '🤖 AI 사회자', text: '주제: 인터넷 익명성 폐지. 입증책임은 찬성 측이며, \'폐지\'라는 변화의 정당성을 입증해야 합니다. 질서파 님부터 찬성 입론입니다.' },
      { side: 'pro', name: '질서파', text: '익명성은 인터넷 공간을 무책임의 공간으로 만들었습니다. 첫째, 한국 댓글 자살 사건이 매년 증가하고 있고, 둘째, 범죄 추적 시 가해자 확보까지 평균 6개월 이상이 소요됩니다. 셋째, 책임감 있는 발언 문화는 신원 공개를 전제로 합니다. 실명제는 표현의 자유를 \'책임지는 자유\'로 격상시킵니다.' },
      { side: 'con', name: '자유파', text: '익명성 폐지는 효용 대비 비용이 너무 큽니다. 첫째, 한국은 이미 2007년 인터넷 실명제를 도입했다가 2012년 헌법재판소가 위헌 결정하며 폐기했습니다 — 효과는 미미했고 위축 효과만 컸습니다. 둘째, 익명성이 가장 절실한 사람들 — 성소수자, 내부고발자, 권위주의 국가 시민, 가정폭력 피해자 — 의 목소리를 차단하는 결과를 낳습니다. 셋째, 중국 실명제 모델이 보여주듯 권위주의 검열의 도구가 됩니다.' },
      { side: 'pro', name: '질서파', text: '2012년 헌재 결정은 당시 기술 환경에서의 판단입니다. AI 기반 익명·실명 식별 기술이 발달한 지금은 다릅니다. 또한 \'내부고발 보호\'는 별도의 법적 장치(공익신고자 보호법)로 해결할 수 있습니다. 익명성을 사회 전체의 기본값으로 두는 비용이 그 효용보다 큽니다.' },
      { side: 'con', name: '자유파', text: '"별도 법으로 보호하면 된다"는 논리가 바로 위험합니다. 익명성이 일반 기본값이어야 그 안에서 보호받을 사람이 자연스럽게 보호됩니다. 별도 신청·등록·검증 단계를 거쳐야 한다면, 가장 취약한 사람일수록 그 절차에 접근할 수 없습니다. 또한 찬성 측은 \'책임 있는 발언 문화\' 효과를 주장하지만, 카카오톡 오픈채팅·트위터 등 익명 공간에서도 양질의 토론이 이뤄지는 사례가 무수히 많습니다 — 매체보다 커뮤니티 문화의 문제입니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '반대 측이 헌재 판례·소수자 보호·권위주의 모델까지 종합적으로 짚었고, 찬성 측의 \'별도 법\'이라는 대안에 대한 반박이 핵심 클래시였습니다.' },
    ],
  },
  {
    topic: '학교 시험은 절대평가로 바꿔야 한다',
    proName: '교육개혁파',
    conName: '현실주의자',
    result: 'pro',
    audienceProPct: 62,
    aiPick: 'pro',
    why: '찬성 측이 절대평가의 학습 동기·협력 학습 효과를 핀란드·IB 시스템 데이터로 입증했고, 반대 측의 \'대학 입시 변별력\' 우려에 대해 \'대학 자율 평가 강화\'로 대응. 반대 측은 \'현실적으로 어렵다\'는 톤이 강했지만 구체적 변별 도구를 제시하지 못함. 입증책임은 \'바꿔야 한다\'에 있는데, 찬성 측이 비교 우위를 충분히 보임.',
    msgs: [
      { side: 'mod', name: '🤖 AI 사회자', text: '주제: 학교 시험을 절대평가로 전환. 입증책임은 찬성 측. 교육개혁파 님부터.' },
      { side: 'pro', name: '교육개혁파', text: '절대평가는 학습의 본질을 회복합니다. 첫째, 상대평가는 \'동료보다 잘하기\'를 목표로 만들어 협력 학습을 파괴합니다. 둘째, 핀란드·IB(국제 바칼로레아) 등 학습 동기 우수 국가들은 일관되게 절대평가를 사용합니다. 셋째, 동일한 학습량을 줄 때 절대평가 학급의 학업 만족도가 상대평가 학급보다 1.8배 높다는 연구 결과(서울대 2019)도 있습니다.' },
      { side: 'con', name: '현실주의자', text: '이상적이지만 한국 입시 현실과 부딪칩니다. 첫째, 절대평가는 변별력을 약화시켜 대학 입시 도구로 부적합합니다. 둘째, 한국은 학생 수 대비 상위 대학 정원이 매우 좁은 구조라 어떤 식으로든 줄을 세워야 합니다. 셋째, 절대평가 도입한 영어 과목에서 1등급 비율 폭증으로 변별 곤란이라는 실제 사례가 있습니다.' },
      { side: 'pro', name: '교육개혁파', text: '\'변별이 필요하다\' 는 동의합니다. 다만 그 변별을 \'1점 차이 줄세우기\'로 할 필요는 없습니다. 대학 자율의 면접·소논문·포트폴리오 등 정성 평가를 강화하면 됩니다. 영어 1등급 비율 폭증은 \'절대평가\' 자체의 문제가 아니라 \'절대평가 + 입시 변동성\' 조합의 문제이며, 시스템 전체를 함께 바꾸지 않은 채 한 과목만 바꿔서 생긴 부작용입니다.' },
      { side: 'con', name: '현실주의자', text: '정성 평가 강화는 사교육·부모 자원에 더 큰 영향을 받습니다. 면접·포트폴리오는 컨설팅 시장의 먹잇감이 되고 있고, 학종 사례에서 이미 확인됐습니다. 결국 \'줄세우기를 없앤다\'가 \'부모 자원에 따른 격차\'로 옮겨가는 셈입니다.' },
      { side: 'pro', name: '교육개혁파', text: '학종 부작용은 운영의 문제이지 정성 평가 자체의 문제는 아닙니다. 핀란드도 정성 평가가 강하지만 사교육 시장이 한국과 비교 안 될 정도로 작은 건, 시스템 전반(교사 신뢰·평가 표준화)이 함께 갖춰졌기 때문입니다. 즉, "절대평가만 도입하고 다른 건 그대로"가 아니라 시스템 전환을 함께 봐야 합니다.' },
      { side: 'mod', name: '🤖 AI 사회자', text: '찬성 측이 시스템 차원 접근을 강조하며 반대 측 우려에 일관되게 응답. 양측 모두 데이터 기반으로 논증.' },
    ],
  },
];

const SAMPLES_EN: Sample[] = [
  {
    topic: 'AI will eventually replace human jobs',
    proName: 'Futurist',
    conName: 'Pragmatist',
    result: 'pro',
    audienceProPct: 56,
    aiPick: 'pro',
    why: 'Pro extended the trend from routine automation into cognitive labor with concrete numbers (40% of office work already in the automation zone), and rebutted Con\'s "new jobs emerge" claim with data ("absolute count of new jobs < count of jobs disappearing"), winning the key clash. Impact-weighing was weaker, so the margin was not decisive.',
    msgs: [
      { side: 'mod', name: '🤖 AI Moderator', text: 'Resolution: AI will eventually replace human jobs. Burden of proof is on Pro, and the core is proving "eventual replacement," not just basic automation. Futurist, please open with the affirmative constructive.' },
      { side: 'pro', name: 'Futurist', text: 'Three reasons it will eventually replace jobs. First, the 2023 OECD report shows 40% of office tasks are already in the automation zone. Second, post-GPT-4, AI now performs cognitive labor — writing, summarizing, analysis. Third, the history of automation has consistently reduced headcount in its target sectors. 19th-century weavers and 20th-century bank tellers are clear examples. The standard rebuttal is "new jobs emerge," but I want to pre-empt that — the absolute count of new jobs has always been smaller than the count that disappeared.' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Futurist presented numbers, historical trend, and pre-empted an expected counter. Pragmatist, the negative constructive — please present your core arguments and address whether Pro\'s proof of "eventual replacement" is sufficient.' },
      { side: 'con', name: 'Pragmatist', text: 'I\'m not arguing "no replacement at all" — I\'m arguing "the word eventual overreaches." Three points. First, automation and replacement are different. Tellers were supposed to vanish with ATMs, but headcount actually grew — only the work content changed. Second, domains with judgment and accountability (court rulings, final medical diagnosis, education) remain with humans. Third, AI is a tool, not an agent. The standard will be humans-plus-AI, not AI alone.' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Both constructives heard. Pro rebuttal — no new arguments allowed. Please respond directly to Pragmatist\'s ATM and judgment-domain claims.' },
      { side: 'pro', name: 'Futurist', text: 'The ATM case — teller headcount grew in absolute terms, but transactions per teller exploded and new hiring slowed. That\'s not "no job loss," that\'s a productivity shift. Judgment domains — even in medical diagnosis, AI-assist rates have crossed 30% since IBM Watson, and some U.S. courts have introduced AI algorithms for bail decisions. The "judgment is also being gradually replaced" trend is clear. Decisively, Pragmatist only said "eventual is too strong" but failed to name a specific domain that will not be replaced.' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Futurist rebutted with ATM, medical, and judicial cases, and pointed out Con failed to clarify a comparative standard. Now Con rebuttal — Pragmatist.' },
      { side: 'con', name: 'Pragmatist', text: '"Gradual replacement" is not "eventual replacement." The 30% medical AI-assist figure itself means 70% is still done by humans. We also need to clarify "replacement." If it means 0% of human labor remains, that hasn\'t been proven. If it means some domains, we already agree. The burden of proof is on "eventual = complete replacement," and that has not been carried.' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Both rebuttals concluded. Moving to final judgment. (The verdict that follows is omitted on this screen — see the "Why" section above for the full evaluation.)' },
    ],
  },
  {
    topic: 'South Korea should adopt a four-day work week',
    proName: 'Citizen A',
    conName: 'Citizen B',
    result: 'tie',
    audienceProPct: 51,
    aiPick: 'tie',
    why: 'Both sides built clear, data-driven arguments. Pro cited productivity-maintained data from Iceland and UK pilots; Con compared Korea\'s GDP structure and small-business share. Neither side won a decisive clash, and burden-of-proof exchange was roughly even. AI returned a tie, and the audience vote was 51:49 — neither side decisive.',
    msgs: [
      { side: 'mod', name: '🤖 AI Moderator', text: 'Resolution: South Korea should adopt a four-day work week. Burden of proof is on Pro. Citizen A, please open with the affirmative constructive.' },
      { side: 'pro', name: 'Citizen A', text: 'A four-day week isn\'t just "more rest" — it\'s a validated policy. Iceland piloted it on roughly 1% of its workforce from 2015 to 2019, found productivity held and life satisfaction rose, and formally adopted it in 2022. In the UK\'s 4 Day Week program, 92% of the 61 participating companies chose to make it permanent. For South Korea — OECD-longest hours yet below-average productivity — this is the most direct policy to close the gap.' },
      { side: 'con', name: 'Citizen B', text: 'Iceland and the UK are impressive, but Korea\'s industrial structure is different. We have the OECD\'s highest share of small-business owners across manufacturing and services. They lack the capacity to absorb the added labor cost of a four-day week. We also already have flexible-work laws on the books, yet utilization sits at 13% — the system exists but the culture doesn\'t follow. A four-day week risks ending up as a privilege only large companies can grant.' },
      { side: 'pro', name: 'Citizen A', text: 'The "small businesses can\'t bear it" concern is fair — which is exactly why I propose phased, sector-by-sector rollout. The UK pilot also started with IT, finance, and services, with manufacturing later. And the low flexible-work utilization isn\'t a system problem — it\'s a default problem. A four-day week is a policy that changes the default.' },
      { side: 'con', name: 'Citizen B', text: 'Even granting phased rollout, the core issue remains — the small-business workers who need help most (80% of the workforce) get the benefit last, or never. Korea also has heavy night and service-sector work where a simple "5-day → 4-day" conversion doesn\'t apply. The result is that "we should adopt it" shrinks to "we can apply it only to some white-collar workers."' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Both sides clashed head-on with data, and both held their positions consistently to the end. This is a debate likely to land at a draw in final evaluation.' },
    ],
  },
  {
    topic: 'Internet anonymity should be abolished',
    proName: 'Order Faction',
    conName: 'Liberty Faction',
    result: 'con',
    audienceProPct: 38,
    aiPick: 'con',
    why: 'Pro emphasized limited benefits (curbing toxic comments, easier crime tracing). Con countered with concrete costs (weakening minority protection, chilling whistleblowers, authoritarian-censorship abuse), citing specific cases (China\'s real-name system, the scrapping of Kakao\'s real-name policy). The burden of proof on "abolition" sat with Pro and was not adequately discharged.',
    msgs: [
      { side: 'mod', name: '🤖 AI Moderator', text: 'Resolution: Internet anonymity should be abolished. Burden of proof is on Pro, who must justify the change called "abolition." Order Faction, please open with the affirmative constructive.' },
      { side: 'pro', name: 'Order Faction', text: 'Anonymity has turned the internet into a space of unaccountability. First, Korea has seen yearly increases in comment-related suicides. Second, tracking a perpetrator from a crime takes on average more than six months. Third, accountable speech culture presupposes identity disclosure. Real-name policy elevates "freedom of expression" into "freedom that accepts responsibility."' },
      { side: 'con', name: 'Liberty Faction', text: 'Abolishing anonymity carries costs far larger than its benefits. First, Korea already tried an internet real-name system in 2007, only for the Constitutional Court to rule it unconstitutional in 2012 — the effect was minimal and the chilling effect large. Second, it silences exactly the people who need anonymity most — sexual minorities, whistleblowers, citizens of authoritarian regimes, domestic-violence victims. Third, as China\'s real-name model shows, it becomes a tool for authoritarian censorship.' },
      { side: 'pro', name: 'Order Faction', text: 'The 2012 ruling was a judgment under that era\'s technology. AI-driven anonymity/identity-detection technology is far more advanced now. And "whistleblower protection" can be handled by a separate statute (Public Interest Whistleblower Protection Act). The cost of keeping anonymity as society\'s default outweighs its benefit.' },
      { side: 'con', name: 'Liberty Faction', text: 'The very logic of "we can handle it with a separate law" is what makes this dangerous. Anonymity must be the general default so those who need protection are naturally protected within it. If they must go through application, registration, and verification, the most vulnerable will be the ones least able to access that process. And Pro claims "accountable speech culture" as a benefit, but countless anonymous spaces — KakaoTalk open chats, Twitter — host high-quality debate. This is a community-culture problem, not a medium problem.' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Con covered Constitutional Court precedent, minority protection, and the authoritarian model comprehensively, and the key clash was the rebuttal of Pro\'s "separate law" alternative.' },
    ],
  },
  {
    topic: 'School exams should switch to criterion-referenced grading',
    proName: 'Education Reformer',
    conName: 'Realist',
    result: 'pro',
    audienceProPct: 62,
    aiPick: 'pro',
    why: 'Pro proved the motivation and collaboration benefits of criterion-referenced grading with data from Finland and IB systems, and answered Con\'s "college-entrance differentiation" concern with "stronger university-side qualitative evaluation." Con leaned on "realistically difficult" but failed to offer a concrete differentiation tool. Burden of proof was on "should switch," and Pro showed a sufficient comparative advantage.',
    msgs: [
      { side: 'mod', name: '🤖 AI Moderator', text: 'Resolution: School exams should switch to criterion-referenced grading. Burden of proof is on Pro. Education Reformer, you\'re up.' },
      { side: 'pro', name: 'Education Reformer', text: 'Criterion-referenced grading restores the essence of learning. First, norm-referenced grading makes "outperform your peers" the goal and destroys collaborative learning. Second, countries with strong learning motivation — Finland, the IB system — consistently use criterion-referenced grading. Third, given the same workload, classes on criterion-referenced grading reported academic satisfaction 1.8× higher than norm-referenced classes (Seoul National University, 2019).' },
      { side: 'con', name: 'Realist', text: 'Ideal, but it collides with Korea\'s admissions reality. First, criterion-referenced grading weakens differentiation and is unsuitable as a college-entrance tool. Second, Korea\'s ratio of top-university seats to student volume is extremely tight — students must be ranked somehow. Third, when English was switched to criterion-referenced, the Grade-1 share exploded and differentiation broke down — a real precedent.' },
      { side: 'pro', name: 'Education Reformer', text: 'I agree differentiation is needed. But that differentiation doesn\'t have to be "ranking by one-point margins." Strengthen university-led qualitative evaluation — interviews, essays, portfolios. The English-Grade-1 explosion isn\'t a problem of criterion-referenced grading itself — it\'s a problem of "criterion-referenced grading + admissions volatility," a side effect of switching one subject without changing the system around it.' },
      { side: 'con', name: 'Realist', text: 'Strengthening qualitative evaluation amplifies the influence of private tutoring and parental resources. Interviews and portfolios are already a prey market for consultants, as confirmed by the 학종 (comprehensive admissions) experience. The shift from "ranking" lands as "gaps by parental resources."' },
      { side: 'pro', name: 'Education Reformer', text: 'The 학종 problems are operational, not problems with qualitative evaluation itself. Finland also leans heavily on qualitative evaluation but its private-tutoring market is incomparably smaller than Korea\'s — because the surrounding system (teacher trust, standardized evaluation) was built up together. So it\'s not "introduce criterion-referenced grading and leave everything else the same" — it\'s a system transition we must look at as a whole.' },
      { side: 'mod', name: '🤖 AI Moderator', text: 'Pro emphasized a system-level approach and consistently answered Con\'s concerns. Both sides argued from data.' },
    ],
  },
];

const sideLabel = (s: 'mod' | 'pro' | 'con', lang: 'ko' | 'en' = 'ko') =>
  lang === 'en'
    ? (s === 'mod' ? 'Moderator' : s === 'pro' ? 'Pro' : 'Con')
    : (s === 'mod' ? '사회자' : s === 'pro' ? '찬성' : '반대');

const resultText = (r: 'pro' | 'con' | 'tie', sample: Sample, lang: 'ko' | 'en' = 'ko') =>
  lang === 'en'
    ? (r === 'pro'
        ? `Pro wins (${sample.proName})`
        : r === 'con'
          ? `Con wins (${sample.conName})`
          : 'Draw')
    : (r === 'pro'
        ? `찬성 승 (${sample.proName})`
        : r === 'con'
          ? `반대 승 (${sample.conName})`
          : '무승부');

export function SamplesView({
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
  const samples = lang === 'en' ? SAMPLES_EN : SAMPLES;

  useDocumentMeta(
    lang === 'en' ? 'Sample Debates — DebateBattle' : '샘플 토론 — 토론배틀',
    lang === 'en'
      ? `${samples.length} full sample debates moderated by AI — see the flow of constructives, rebuttals, and the final evaluation.`
      : 'AI 사회자 진행으로 끝까지 마친 샘플 토론 4편. 입론·반박의 흐름과 평가 결과를 그대로 볼 수 있습니다.',
    '/samples',
  );

  return (
    <ContentLayout
      theme="arena"
      lang={lang}
      onBackToLearn={onBackToLearn}
      onNav={onNav}
      onGoLobby={onGoLobby}
      crumbLabel={lang === 'ko' ? '샘플 토론' : 'Samples'}
      eyebrow={lang === 'en' ? `SAMPLES · ${samples.length}` : `SAMPLES · 샘플 토론 ${samples.length}편`}
      title={lang === 'en' ? (
        <>
          Real debates,
          <br />
          <span className="hand">played to the finish.</span>
        </>
      ) : (
        <>
          끝까지 마친
          <br />
          <span className="hand">실제 한 판들.</span>
        </>
      )}
      subtitle={lang === 'en' ? (
        <>
          Before your first debate, see what a complete one looks like. Below are <b>{samples.length}</b> full
          debates with key speeches and the AI moderator's qualitative summary. Live debates flow
          the same way.
        </>
      ) : (
        <>
          처음 토론에 도전하기 전, "이런 게 좋은 토론이구나"를 한 번 보고
          시작하세요. 아래는 끝까지 마친 토론 <b>{samples.length}편</b>의 핵심
          발언과 AI 사회자의 정성 평가 요약입니다. 실제 토론에서도 같은 방식으로
          진행됩니다.
        </>
      )}
      hint={lang === 'en' ? '🎬 Follow each match step by step' : '🎬 무대 위에서 어떻게 흘러가는지 그대로 따라가보세요'}
    >
      <div className="samples-list">
        {samples.map((s, idx) => (
          <article key={idx} className="sample">
            <header className="sample__head">
              <div className="sample__head-left">
                <div className="sample__index">SAMPLE {String(idx + 1).padStart(2, '0')}</div>
                <h3 className="sample__topic">{s.topic}</h3>
              </div>
              <div className="sample__head-right">
                <div className="sample__result">
                  <span className="sample__result-lbl">{lang === 'en' ? 'Result' : '결과'}</span>
                  <span className={`sample__result-val sample__result-val--${s.result}`}>
                    {resultText(s.result, s, lang)}
                  </span>
                </div>
                <div className="sample__meta">
                  👀 {lang === 'en' ? 'Crowd' : '관전자'} {s.audienceProPct}% : {100 - s.audienceProPct}% &nbsp;·&nbsp;
                  🤖 AI: {lang === 'en'
                    ? (s.aiPick === 'pro' ? 'Pro' : s.aiPick === 'con' ? 'Con' : 'Tie')
                    : (s.aiPick === 'pro' ? '찬성' : s.aiPick === 'con' ? '반대' : '무승부')}
                </div>
              </div>
            </header>

            <div className="sample__why">
              <span className="sample__why-lbl">{lang === 'en' ? 'Why this result?' : '왜 이런 결과?'}</span>
              <p>{s.why}</p>
            </div>

            <div className="sample__transcript">
              {s.msgs.map((m, i) => (
                <div key={i} className={`sample__msg sample__msg--${m.side}`}>
                  <div className="sample__msg-meta">
                    <span className={`sample__msg-tag sample__msg-tag--${m.side}`}>
                      {sideLabel(m.side, lang)}
                    </span>
                    <span className="sample__msg-name">{m.name}</span>
                  </div>
                  <div className="sample__msg-text">{m.text}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </ContentLayout>
  );
}
