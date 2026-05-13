import { useMemo, useState } from 'react';
import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';

interface Fallacy {
  name: string;
  en: string;
  cat: string;
  defn: string;
  ex: string;
  counter: string;
}

const FALLACIES: Fallacy[] = [
  // 관련성 오류 (Relevance fallacies)
  { name: '인신공격 (애드 호미넴)', en: 'Ad Hominem', cat: '관련성', defn: '주장 자체가 아닌 발언자의 인격·배경을 공격해 반박을 시도하는 오류.', ex: '"너 같은 사람이 하는 말 누가 믿어?"', counter: '"인격에 대한 평가를 잠시 미루고, 주장의 근거 자체를 봅시다."' },
  { name: '권위에 호소', en: 'Appeal to Authority', cat: '관련성', defn: '해당 분야 전문가가 아니거나 검증되지 않은 권위자를 근거로 삼는 오류.', ex: '"이 의사가 그렇게 말했으니 정답이다." (해당 의사가 해당 분야 비전문가일 때)', counter: '"권위가 아니라 그 주장의 근거 자체를 검증해야 합니다."' },
  { name: '대중에 호소 (밴드웨건)', en: 'Bandwagon / Appeal to Popularity', cat: '관련성', defn: '"많은 사람이 그렇게 생각한다"는 이유만으로 옳다고 주장.', ex: '"이미 90%가 동의하니까 맞는 말이다."', counter: '"동의자 수가 진실의 기준일 수는 없습니다."' },
  { name: '감정에 호소', en: 'Appeal to Emotion', cat: '관련성', defn: '논리적 근거 대신 동정·공포·분노 같은 감정을 자극하는 오류.', ex: '"아이들을 생각해보세요. 이 정책을 반대할 수 있겠습니까?"', counter: '"감정은 잠시 두고, 정책의 효과·근거를 봅시다."' },
  { name: '공포에 호소', en: 'Appeal to Fear', cat: '관련성', defn: '받아들이지 않으면 끔찍한 결과가 온다고 위협해 동의를 유도.', ex: '"이걸 안 도입하면 사회가 무너집니다."', counter: '"극단적 결과의 인과 사슬을 단계별로 검증해주세요."' },
  { name: '전통에 호소', en: 'Appeal to Tradition', cat: '관련성', defn: '"옛날부터 그래 왔다"는 이유로 정당화하려는 오류.', ex: '"수십 년간 이렇게 해왔으니 바꿀 필요 없다."', counter: '"전통이 옳음을 보장하지는 않습니다. 지금 그 근거가 유효한가요?"' },
  { name: '새로움에 호소', en: 'Appeal to Novelty', cat: '관련성', defn: '"최신이라서 더 낫다"는 무근거 주장.', ex: '"이건 2024년 최신 방법이니까 맞다."', counter: '"새롭다고 더 효과적인 것은 아닙니다. 비교 데이터가 있나요?"' },
  { name: '무지에 호소', en: 'Appeal to Ignorance', cat: '관련성', defn: '"반증된 적 없으니 옳다", 또는 "증명된 적 없으니 틀리다"는 식의 주장.', ex: '"외계인이 없다는 증거가 없으니 있다고 봐야 한다."', counter: '"부재의 증거는 증거의 부재와 다릅니다."' },

  // 구조 오류 (Structural)
  { name: '허수아비 공격', en: 'Straw Man', cat: '구조', defn: '상대의 주장을 약화·왜곡해서 그 왜곡된 버전을 반박하는 오류.', ex: 'A: "교육 예산을 늘리자." B: "그럼 다른 모든 예산을 줄이자는 거냐?"', counter: '"제가 한 말은 그게 아닙니다. 정확히는 ___입니다. 그 지점에 대해 답해주세요."' },
  { name: '미끄러운 경사', en: 'Slippery Slope', cat: '구조', defn: '한 사건이 일어나면 연쇄적으로 극단적 결과가 온다고 무근거 비약.', ex: '"이걸 허용하면 결국 사회가 무너진다."', counter: '"각 단계의 인과 관계를 입증해주세요. 어떤 단계가 자동으로 일어나나요?"' },
  { name: '잘못된 이분법', en: 'False Dichotomy / False Dilemma', cat: '구조', defn: '실제로 다양한 선택지가 있는데 두 가지로 한정해 선택을 강요.', ex: '"애국자거나, 매국노거나."', counter: '"제3·제4의 선택지가 있습니다. 예: ___."' },
  { name: '순환 논증', en: 'Circular Reasoning / Begging the Question', cat: '구조', defn: '결론을 전제 안에 이미 포함시킨 논증.', ex: '"성경은 신의 말씀이다. 왜냐하면 성경에 그렇게 쓰여 있기 때문이다."', counter: '"결론을 가정 없이도 도출할 수 있는 근거가 있나요?"' },
  { name: '성급한 일반화', en: 'Hasty Generalization', cat: '구조', defn: '소수의 사례나 표본에서 전체에 대한 결론을 내리는 오류.', ex: '"내 친구 두 명이 그러던데, 요즘 20대는 다 그렇대."', counter: '"표본 크기와 대표성을 확인해야 합니다."' },
  { name: '선결문제 요구', en: 'Begging the Question', cat: '구조', defn: '논쟁의 핵심을 미리 참으로 전제하고 논의를 진행.', ex: '"이 정책은 옳다, 왜냐하면 옳은 가치 위에 세워졌으므로."', counter: '"전제 자체가 본 논쟁의 쟁점입니다."' },
  { name: '비유의 오용', en: 'Faulty Analogy', cat: '구조', defn: '비교 대상이 결정적 측면에서 다른데도 동일하게 취급.', ex: '"국가도 가정처럼 가장이 강해야 한다."', counter: '"국가와 가정은 ___ 측면에서 다릅니다. 비유가 성립할까요?"' },
  { name: '복합 질문', en: 'Loaded Question', cat: '구조', defn: '대답 자체가 부당한 전제를 받아들이게 만드는 질문.', ex: '"언제부터 거짓말을 그만뒀나요?"', counter: '"질문의 전제부터 짚겠습니다. 저는 거짓말한 적이 없습니다."' },
  { name: '부분과 전체 혼동 (구성의 오류)', en: 'Composition Fallacy', cat: '구조', defn: '부분의 속성이 전체에도 같다고 가정.', ex: '"이 부품 하나하나가 가벼우니, 완제품도 가볍다."', counter: '"부분이 합쳐질 때 새로 생기는 속성을 고려해야 합니다."' },
  { name: '전체와 부분 혼동 (분할의 오류)', en: 'Division Fallacy', cat: '구조', defn: '전체의 속성이 부분에도 동일하게 적용된다고 가정.', ex: '"이 팀이 우승했으니, 모든 팀원이 최고다."', counter: '"전체의 속성이 모든 개체에 적용되지는 않습니다."' },
  { name: '결론 비약 (논점 일탈)', en: 'Non Sequitur', cat: '구조', defn: '전제에서 결론이 논리적으로 따라 나오지 않는 오류.', ex: '"날씨가 좋다. 그러니 이 투자도 성공할 것이다."', counter: '"전제와 결론 사이를 잇는 추론 단계를 보여주세요."' },

  // 통계·인과 오류
  { name: '상관관계와 인과관계 혼동', en: 'Correlation ≠ Causation', cat: '통계·인과', defn: '두 사건이 함께 발생한다고 해서 한쪽이 다른 쪽의 원인이라고 단정.', ex: '"아이스크림 판매 증가 시기에 익사 사고도 증가한다 → 아이스크림이 익사를 유발."', counter: '"공통 원인(여름철 등)을 고려해야 합니다."' },
  { name: '잘못된 원인 (Post Hoc)', en: 'Post Hoc Ergo Propter Hoc', cat: '통계·인과', defn: '"A 이후에 B가 일어났다 → A가 B의 원인이다"라는 시간 순서 기반 오해.', ex: '"이 약을 먹고 나았다 → 약이 효과 있다."', counter: '"플라시보·자연 회복·다른 변수도 가능합니다."' },
  { name: '체리피킹', en: 'Cherry Picking', cat: '통계·인과', defn: '자기 주장을 뒷받침하는 사례만 선택적으로 인용.', ex: '"성공한 자수성가 5명을 보세요." (실패한 다수는 무시)', counter: '"전체 모집단을 보면 어떤가요? 반대 사례는요?"' },
  { name: '생존자 편향', en: 'Survivorship Bias', cat: '통계·인과', defn: '살아남은 사례만 보고 결론을 내려 실제 분포를 왜곡.', ex: '"창업자 책을 읽으니 성공의 비결이 보인다." (실패한 99%는 책을 쓰지 못함)', counter: '"표본에서 빠진 사례가 무엇인지 확인해야 합니다."' },
  { name: '도박사의 오류', en: 'Gambler\'s Fallacy', cat: '통계·인과', defn: '독립적 사건의 과거 결과가 다음 결과에 영향을 준다고 믿는 오류.', ex: '"연속 5번 빨강이 나왔으니 이번엔 검정 차례다."', counter: '"독립 시행에서 과거는 다음 확률을 바꾸지 않습니다."' },
  { name: '평균에의 회귀', en: 'Regression to the Mean', cat: '통계·인과', defn: '극단적 값 다음에는 평균에 가까운 값이 따라오는 것을 인과로 오해.', ex: '"호된 꾸중을 들었더니 다음에 잘했다. 꾸중이 효과적이다."', counter: '"통계적 회귀 현상일 수 있습니다."' },
  { name: '기준선 무시 (Base Rate)', en: 'Base Rate Fallacy', cat: '통계·인과', defn: '일반적 빈도(기준선)를 무시하고 개별 정보만으로 판단.', ex: '"양성 판정 = 병이 있다." (질병 자체의 유병률이 매우 낮다면 위양성 가능성 큼)', counter: '"전체 인구 기준의 유병률·정확도를 함께 봐야 합니다."' },
  { name: '일화적 근거', en: 'Anecdotal Evidence', cat: '통계·인과', defn: '개인적 경험·일화를 데이터 대신 근거로 사용.', ex: '"내 할아버지는 평생 담배 피우셨는데 90세까지 사셨다."', counter: '"한두 사례가 통계를 뒤집을 순 없습니다."' },

  // 모호성 오류
  { name: '애매어 (모호어)', en: 'Equivocation', cat: '모호성', defn: '같은 단어를 두 가지 다른 의미로 슬쩍 바꿔 사용해 잘못된 결론 도출.', ex: '"법은 정의롭다. 이 법은 법이다. 그러므로 정의롭다." (\'법\'의 의미가 미끄러짐)', counter: '"이 문장에서 단어 X는 어떤 의미로 쓰셨나요?"' },
  { name: '강조의 오류', en: 'Accent Fallacy', cat: '모호성', defn: '문장 내 강조점을 바꿔 원래 의미를 왜곡.', ex: '"우리는 친구를 험담해서는 안 된다." → "친구만 빼면 험담해도 된다는 뜻이다."', counter: '"원래 문장의 의도를 그대로 받아들여야 합니다."' },
  { name: '범주 오류', en: 'Category Mistake', cat: '모호성', defn: '서로 다른 범주의 개념을 같은 범주로 묶어 비교·논의.', ex: '"수학은 빨간색이다."', counter: '"이 두 개념은 같은 차원에서 비교할 수 없습니다."' },

  // 입증 책임 오류
  { name: '입증 책임 전가', en: 'Shifting the Burden of Proof', cat: '입증', defn: '자기 주장의 입증 책임을 상대에게 떠넘기는 오류.', ex: '"내가 옳다는 걸 네가 반박해봐."', counter: '"주장한 쪽이 먼저 입증해야 합니다."' },
  { name: '거짓 균형 (양비론)', en: 'False Balance / False Equivalence', cat: '입증', defn: '근거의 질이 매우 다른 두 주장을 동등한 무게로 다루는 오류.', ex: '"기후 변화 찬반 양측을 같이 들어봅시다." (한쪽은 압도적 과학적 합의)', counter: '"근거의 질을 가중치로 봐야 공정합니다."' },
  { name: '특수 변호 (Special Pleading)', en: 'Special Pleading', cat: '입증', defn: '자기 주장에 불리한 반례가 나오면 임의로 예외 규정을 추가.', ex: '"이 예측은 맞다. 다만 그 경우는 예외다." (예외가 계속 늘어남)', counter: '"예외 추가의 기준이 일관적인가요?"' },
  { name: '신 같은 결론 (god of the gaps)', en: 'God of the Gaps', cat: '입증', defn: '현재 설명 불가능한 영역에 자동으로 특정 결론(보통 초자연)을 채워 넣음.', ex: '"과학이 이걸 설명 못 하니까 신이 한 거다."', counter: '"미설명 ≠ 설명 불가. 추후 설명 가능성을 인정해야 합니다."' },

  // 인격·감정 호소
  { name: '연좌제 (출처에 호소)', en: 'Genetic Fallacy', cat: '관련성', defn: '주장의 진위를 그 기원·출처만으로 판단.', ex: '"그 주장 옛날 신문에서 본 거니까 틀렸다."', counter: '"출처와 내용의 진위는 별도로 봐야 합니다."' },
  { name: '피장파장 (Tu Quoque)', en: 'Tu Quoque / Whataboutism', cat: '관련성', defn: '비판자가 같은 잘못을 했다는 이유로 비판을 무효화하려는 오류.', ex: '"너도 옛날에 그랬잖아!"', counter: '"제 과거 잘못과 지금 논의되는 사안은 별개입니다."' },
  { name: '연민에 호소', en: 'Appeal to Pity', cat: '관련성', defn: '연민을 일으켜 결론에 동의하도록 유도.', ex: '"제가 얼마나 힘들었는데, 이 정도는 봐주세요."', counter: '"개인 사정과 사안의 옳고 그름은 별개입니다."' },
  { name: '돈에 호소 (Appeal to Wealth)', en: 'Appeal to Wealth', cat: '관련성', defn: '"부자가 그렇게 한다 = 옳다"는 식의 가치 부여 오류.', ex: '"부자들도 다 그렇게 산다."', counter: '"부와 진리는 별개입니다."' },

  // 논점 회피
  { name: '논점 일탈 (Red Herring)', en: 'Red Herring', cat: '회피', defn: '논점에서 벗어난 다른 화제를 던져 주의를 분산.', ex: '"세금 얘기 그만하고, 일자리 얘기를 합시다."', counter: '"세금에 대한 답을 먼저 마치고 일자리로 넘어가시죠."' },
  { name: '탈무드식 회피 (Moving the Goalposts)', en: 'Moving the Goalposts', cat: '회피', defn: '상대가 기준을 충족하면 그 즉시 새로운 기준을 추가.', ex: '"이게 증거? 그럼 더 강한 증거를 가져와봐." (요구가 계속 강화)', counter: '"기준을 처음에 명확히 합의합시다."' },
  { name: '두 가지 잘못은 정당화', en: 'Two Wrongs Make a Right', cat: '회피', defn: '"상대도 잘못했으니 우리도 같은 잘못은 정당하다"는 식의 정당화.', ex: '"저쪽도 그러는데 우리는 왜 안 됩니까?"', counter: '"잘못의 정당화는 다른 잘못으로 안 됩니다."' },
  { name: '논점 회피 (Beside the Point)', en: 'Ignoratio Elenchi', cat: '회피', defn: '결론은 그럴듯하지만 본래 논쟁의 쟁점과 무관함.', ex: '(범죄율 논의 중) "교육이 중요하다." → 사실이지만 본 논점 아님.', counter: '"본 쟁점은 ___이었습니다. 그것에 대한 직접 답이 필요합니다."' },

  // 형식 오류
  { name: '전건 부정', en: 'Denying the Antecedent', cat: '형식', defn: '"A이면 B다. A가 아니다. 그러므로 B가 아니다." 형식의 잘못된 추론.', ex: '"비가 오면 길이 젖는다. 비가 오지 않았으므로 길이 젖지 않았다." (다른 원인 가능)', counter: '"길이 젖을 다른 원인을 고려해야 합니다."' },
  { name: '후건 긍정', en: 'Affirming the Consequent', cat: '형식', defn: '"A이면 B다. B이다. 그러므로 A다." 형식의 잘못된 추론.', ex: '"감기면 기침이 난다. 기침이 난다. 그러므로 감기다."', counter: '"기침의 다른 원인도 있습니다."' },
  { name: '오류의 오류 (Argumentum ad Logicam)', en: 'Argument from Fallacy', cat: '형식', defn: '"네 논증에 오류가 있으니 네 결론도 틀렸다"는 결론. 결론 자체는 다른 경로로 옳을 수 있음.', ex: '"네 논리는 비약이다 → 그러므로 네 결론도 틀렸다."', counter: '"논증의 오류와 결론의 거짓은 별개입니다."' },

  // 정치·미디어 빈출
  { name: '편들기 사고 (Tribalism)', en: 'In-group / Out-group Bias', cat: '인지편향', defn: '같은 진영이면 무조건 옳고, 다른 진영이면 무조건 틀렸다고 보는 사고.', ex: '"우리 편이 한 말이니까 맞아."', counter: '"진영을 지운 채로 그 주장 자체를 평가해봅시다."' },
  { name: '확증편향', en: 'Confirmation Bias', cat: '인지편향', defn: '자기 신념에 부합하는 정보만 선택적으로 받아들이는 경향.', ex: '"내 의견을 뒷받침하는 기사만 공유한다."', counter: '"반대 증거도 함께 검토해야 합니다."' },
  { name: '닻 내림 효과', en: 'Anchoring Bias', cat: '인지편향', defn: '처음 제시된 정보(앵커)에 후속 판단이 끌려가는 현상.', ex: '"50만 원짜리 옆에 보니 30만 원이 싸 보인다."', counter: '"앵커를 의식하고 절대 기준으로 평가합시다."' },
  { name: '더닝-크루거 효과', en: 'Dunning–Kruger', cat: '인지편향', defn: '능력이 부족할수록 자기 능력을 과대평가하는 경향.', ex: '"공부 안 한 사람이 자신만만하게 답한다."', counter: '"전문가 의견과 합의를 확인해보세요."' },
  { name: '평균 위 편향', en: 'Above Average Effect', cat: '인지편향', defn: '대부분의 사람이 자신을 평균보다 위라고 평가하는 통계적 모순.', ex: '"운전자의 80%가 자신이 평균 이상이라고 답함."', counter: '"객관적 지표로 검증해봅시다."' },

  // 추가 자주 보이는
  { name: '거짓 원인 (Cum Hoc)', en: 'Cum Hoc Ergo Propter Hoc', cat: '통계·인과', defn: 'A와 B가 동시에 일어나면 A가 B의 원인이라고 단정.', ex: '"교회 다니는 사람이 행복도가 높다 → 종교가 행복의 원인."', counter: '"공통 원인이나 역인과 가능성을 봐야 합니다."' },
  { name: '단순 인과 (Single Cause)', en: 'Fallacy of Single Cause', cat: '통계·인과', defn: '여러 원인이 작용하는 현상을 한 가지 원인으로만 설명.', ex: '"청년 실업은 단지 게으름 때문이다."', counter: '"구조적 요인과 개인 요인을 함께 고려해야 합니다."' },
  { name: '잘못된 권위에 호소', en: 'Appeal to False Authority', cat: '관련성', defn: '실제 권위가 없는 인물을 마치 권위인 양 인용.', ex: '"유명 연예인이 그러던데..."', counter: '"해당 분야의 검증된 전문가인지 확인해야 합니다."' },
  { name: '관습에 호소', en: 'Appeal to Common Practice', cat: '관련성', defn: '"다들 그렇게 한다 → 옳다"는 주장.', ex: '"다른 회사도 다 이렇게 해요."', counter: '"관행과 옳음은 별개입니다."' },
  { name: '본질주의 오류', en: 'Essentialism Fallacy', cat: '구조', defn: '집단의 본질이 고정돼 있고 모든 구성원에게 동일하게 적용된다고 가정.', ex: '"X 지역 사람들은 원래 그래."', counter: '"개인 편차와 사회적 형성 요인을 봐야 합니다."' },
  { name: '단순 비유 오류', en: 'Cliché Thinking', cat: '구조', defn: '복잡한 사안을 한 가지 비유로 환원해 설명.', ex: '"인생은 마라톤이다." (모든 결정을 거기에 맞춤)', counter: '"비유는 도구일 뿐, 구체적 분석이 필요합니다."' },
];

const ALL_CATS = ['전체', ...Array.from(new Set(FALLACIES.map((f) => f.cat)))];

export function FallaciesView() {
  useDocumentMeta(
    '논리 오류 백과 — 토론배틀',
    `자주 등장하는 ${FALLACIES.length}가지 논리 오류 사전. 정의·예시·대응법을 카테고리별로 정리.`,
  );
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('전체');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FALLACIES.filter((f) => {
      if (cat !== '전체' && f.cat !== cat) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.en.toLowerCase().includes(q) ||
        f.defn.toLowerCase().includes(q)
      );
    });
  }, [search, cat]);

  return (
    <ContentLayout
      eyebrow={`FALLACIES · 논리 오류 ${FALLACIES.length}+`}
      title={
        <>
          잘 안 보이는
          <br />
          <span className="hand">논리의 함정.</span>
        </>
      }
      subtitle={
        <>
          토론·일상 대화에서 자주 등장하는 <b>{FALLACIES.length}가지 논리 오류</b>를
          관련성·구조·통계·모호성·입증·회피·형식·인지편향 카테고리별로 정리했습니다.
          각 항목에 정의, 실제 예시, 그리고 토론에서 대응할 때 쓸 수 있는 한 줄
          반응이 포함돼 있습니다.
        </>
      }
    >
      <div className="topics-controls">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 이름·정의로 검색"
          className="topics-search"
        />
        <div className="topics-cats">
          {ALL_CATS.map((c) => (
            <button
              key={c}
              type="button"
              className={`topics-cat ${cat === c ? 'active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="fallacies-list">
        {filtered.map((f) => (
          <article key={f.name} className="fallacy-card">
            <div className="fallacy-card__head">
              <h3 className="fallacy-card__name">{f.name}</h3>
              <span className="fallacy-card__en">{f.en}</span>
              <span className="fallacy-card__cat">{f.cat}</span>
            </div>
            <p className="fallacy-card__defn">{f.defn}</p>
            <div className="fallacy-card__ex">
              <span className="fallacy-card__lbl">예시</span>
              <span>{f.ex}</span>
            </div>
            <div className="fallacy-card__counter">
              <span className="fallacy-card__lbl">대응</span>
              <span>{f.counter}</span>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: 40, color: 'var(--color-ink-fade)' }}>
            결과가 없습니다.
          </p>
        )}
      </div>
    </ContentLayout>
  );
}
