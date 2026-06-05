import { useCallback, useMemo, useRef, useState } from 'react';
import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';
import { headerStrings } from '../../i18n/header';

interface Topic {
  q: string;
  pro: string[];
  con: string[];
}

const CATEGORIES: { id: string; name: string; topics: Topic[] }[] = [
  {
    id: 'life',
    name: '생활 · 일상',
    topics: [
      { q: '탕수육은 부먹이 옳다', pro: ['소스가 고루 묻어 일관된 맛', '식감이 부드럽고 따뜻함이 오래감', '함께 떠서 나눠 먹기 편함'], con: ['튀김의 바삭함이 핵심 식감', '취향대로 양 조절 가능', '소스가 식어도 튀김 본맛 유지'] },
      { q: '민트초코는 음식이다', pro: ['세계적으로 사랑받는 정식 디저트 카테고리', '청량감이 다른 디저트와 차별화', '쇼콜라+허브 조합은 오래된 미식 전통'], con: ['치약 향이 단맛과 충돌', '식후 입가심 용도가 본질', '주재료 조합이 직관적이지 않음'] },
      { q: '아침은 꼭 먹어야 한다', pro: ['뇌 에너지 공급이 오전 집중력에 직결', '대사 활동 정상화에 도움', '습관적으로 거르면 점심 폭식 위험'], con: ['간헐적 단식 효과가 입증됨', '아침 식사 의무화 근거가 약함', '개인 컨디션에 따라 다름'] },
      { q: '커피보다 차가 더 좋다', pro: ['카페인 함량이 낮아 부작용 적음', '항산화 성분이 풍부', '문화적 차분함과 음용 의식'], con: ['커피의 각성·집중 효과가 강력', '향과 맛의 변주가 풍부', '글로벌 산업 규모와 다양성'] },
      { q: '나혼산보다 둘이 사는 게 낫다', pro: ['정서적 안정과 외로움 완화', '생활비 분담으로 효율적', '비상 상황 도움이 가까움'], con: ['독립성과 자기 시간 확보', '갈등·간섭 가능성 적음', '개인 라이프스타일 유지 자유'] },
      { q: '명절은 가족과 보내야 한다', pro: ['전통 유지가 사회 결속 기반', '세대 간 교류 기회', '정서적 의미가 큰 시간'], con: ['개인 선택과 휴식이 우선', '강제된 관계는 스트레스원', '가족 형태 다양화 시대'] },
      { q: '반려동물은 분양보다 입양이 옳다', pro: ['유기 동물 구조라는 사회적 가치', '신고와 등록이 잘 된 입양 체계', '품종 차별 완화'], con: ['건강·기질 정보 부족 위험', '책임감 부담이 큼', '특정 품종이 가족에 맞을 수 있음'] },
      { q: '쇼핑은 오프라인이 더 좋다', pro: ['실물 확인 후 구매 가능', '즉시 가져갈 수 있음', '쇼핑 자체가 경험·산책'], con: ['가격 비교가 즉시 가능', '시간·이동 비용 절약', '리뷰 데이터로 객관 판단'] },
      { q: '여행은 자유여행이 패키지보다 좋다', pro: ['일정 자유와 깊은 경험', '예상 외 만남이 가능', '비용 통제가 유연'], con: ['언어·안전 부담 적음', '효율적 동선과 시간', '전문 가이드의 깊이 있는 설명'] },
      { q: '구독 서비스는 사용자에게 손해다', pro: ['장기 누적 비용이 큼', '잊고 결제되는 함정', '소유보다 임대로 자산 손실'], con: ['최신 기능과 콘텐츠 접근', '필요할 때만 해지 가능', '대량 콘텐츠를 저렴하게 이용'] },
      { q: '한국 음식점은 반찬 무한리필이 사라져야 한다', pro: ['음식 낭비 문제 해결', '재료 단가와 가격 정상화', '위생적 관리 용이'], con: ['한국 식문화의 정체성', '소비자 만족도 핵심', '추가 비용 없이 균형식 가능'] },
      { q: '대중교통 vs 자차, 도시에서는 대중교통이 낫다', pro: ['주차·교통 정체 스트레스 적음', '환경 비용 절감', '러시아워 시간 예측 가능'], con: ['개인 일정 자유와 짐 운반', '날씨·심야 안전', '가족 단위 이동 효율'] },
    ],
  },
  {
    id: 'tech',
    name: '기술 · 사회',
    topics: [
      { q: 'AI는 결국 인간의 일자리를 대체한다', pro: ['반복·중급 인지노동 자동화 가속', '경제적 인센티브가 대체 방향', '역사적으로 자동화는 일자리 감소를 동반'], con: ['새 직군이 생성되어 보완 작용', '판단·창의 영역은 인간 중심 유지', '인간과 협업 도구로 정착'] },
      { q: '메타버스는 다음 인터넷이 될 것이다', pro: ['몰입 경험이 학습·근무에 새 가능성', 'VR·AR 기술이 임계점 통과', '글로벌 기업의 대규모 투자'], con: ['지금까지 상용화 속도가 더딤', '소비자 피로감과 멀미 문제', '기존 웹·앱으로 충분한 영역'] },
      { q: 'SNS 사용은 정신건강에 해롭다', pro: ['비교·박탈감으로 우울감 상승', '청소년 자존감 저하 연구 다수', '도파민 중독 구조'], con: ['관계 유지와 정보 접근의 가치', '사용 방식의 문제이지 매체 자체는 중립', '커뮤니티·소수자 지지망'] },
      { q: '자율주행차는 인간 운전보다 안전해질 것이다', pro: ['음주·졸음·부주의 제거', '센서와 학습으로 위험 인지', '통계상 사고율이 빠르게 감소'], con: ['엣지 케이스 대응 불완전', '윤리적 판단(트롤리)의 불확실성', '해킹·시스템 오류 위험'] },
      { q: '개인 데이터의 상업적 이용은 더 엄격히 규제돼야 한다', pro: ['프라이버시는 기본권', '동의 기반 사용이 형해화', '데이터 권력 집중 위험'], con: ['혁신과 무료 서비스 기반', '익명화로 충분', '과도한 규제는 산업 위축'] },
      { q: '암호화폐는 미래의 통화가 될 것이다', pro: ['중앙은행 의존도 감소', '국경 없는 송금 효율', '디지털 자산 인프라 확장'], con: ['가격 변동성으로 통화 기능 부적합', '환경·전력 비용 큼', '범죄·세탁 우회 통로'] },
      { q: '모든 학교에서 코딩 교육은 필수여야 한다', pro: ['논리적 사고와 문제 해결력 향상', '디지털 시대 기본 소양', '직업 기회의 평등'], con: ['모든 학생에게 적합하지 않음', '교사·인프라 부족', '진로 다양성 존중'] },
      { q: '뉴스는 알고리즘 추천보다 편집자 큐레이션이 낫다', pro: ['필터버블·확증편향 완화', '저널리즘 윤리와 책임 소재', '맥락과 비중 판단'], con: ['개인화로 관련성 ↑', '대중 매체 시대 종료', '편집자의 편향도 존재'] },
      { q: '로봇세 도입은 필요하다', pro: ['자동화로 줄어든 세수 보완', '기본소득 재원으로 활용', '대체 노동자 재교육 비용'], con: ['혁신 인센티브 위축', '"로봇" 정의 모호', '국제 경쟁력 약화'] },
      { q: 'AI가 만든 콘텐츠도 저작권을 가져야 한다', pro: ['창작 환경에 새 인센티브', '상업적 보호 필요', '인간 입력·큐레이션도 기여'], con: ['저작권은 인간 창작 보호 목적', '훈련 데이터 권리 침해 이슈', '권리 귀속 주체 불분명'] },
      { q: '인터넷 익명성은 폐지해야 한다', pro: ['혐오·악성 댓글 감소', '책임 있는 발언 문화', '범죄·사기 추적 용이'], con: ['소수자·내부고발자 보호', '권위주의 검열에 악용 가능', '자기검열로 공론장 위축'] },
      { q: '딥페이크는 전면 금지돼야 한다', pro: ['초상권·명예훼손 보호', '정치적 선동 도구화', '피해자 회복 어려움'], con: ['예술·풍자·교육 활용 사례', '기술 자체보다 악용 처벌', '검열 기준의 모호함'] },
    ],
  },
  {
    id: 'edu',
    name: '교육',
    topics: [
      { q: '학교 시험은 절대평가로 바꿔야 한다', pro: ['협력 학습 문화 조성', '학생 간 과도한 경쟁 완화', '학습 동기 본질 회복'], con: ['변별력 약화로 상위권 평가 곤란', '교사 평가 일관성 문제', '대학 입시 시스템과 충돌'] },
      { q: '대학 입시에서 수능은 폐지해야 한다', pro: ['한 번의 시험에 운명이 결정되는 부담', '사교육 과열의 핵심 원인', '다면 평가가 인재상에 부합'], con: ['공정성·객관성이 가장 높은 도구', '학종 등은 부모 자원 영향 큼', '국가 차원 학력 표준 필요'] },
      { q: '학생 휴대폰 사용은 학교에서 전면 금지해야 한다', pro: ['수업 집중도 회복', 'SNS·게임 중독 차단', '실종·사고 시 학교 전화로 충분'], con: ['긴급 연락과 안전', '디지털 리터러시 학습', '자기 통제력 길러야 함'] },
      { q: '코딩은 영어보다 중요한 과목이다', pro: ['미래 모든 산업의 기반 기술', '논리·문제해결력 핵심', '한국어로도 가능한 영역 확대'], con: ['언어는 글로벌 의사소통의 본질', '코딩은 도구, 사고가 더 중요', '모두에게 필수는 아님'] },
      { q: '대학은 무상교육이 되어야 한다', pro: ['교육 기회 평등', '국가 경쟁력 인재 양성', '학자금 부채 사회 문제'], con: ['세금 부담 전가', '학생의 책임감과 동기 약화', '대학 진학 자체가 옳은 길은 아님'] },
      { q: '학교 등급제·반 편성은 능력별로 해야 한다', pro: ['학습 효율 ↑, 진도 맞춤', '뒤처지는 학생 지원 집중', '상위권의 정체 방지'], con: ['낙인 효과와 자아상 손상', '사회적 분리 강화', '발달 단계별 잠재력 무시'] },
      { q: '체벌은 일정 수준에서 허용해야 한다', pro: ['교실 통제력 회복', '훈육의 즉시성', '말로 안 되는 경우 존재'], con: ['아동 인권 침해', '폭력 학습 효과', '대안 훈육법이 효과적'] },
      { q: '한국 대학은 영어 강의를 줄여야 한다', pro: ['한국어 학술 발전과 모국어 교육 깊이', '학생의 이해도 ↓', '국제화는 다른 방법으로'], con: ['글로벌 인재 양성에 영어 필수', '국제 학생 유치', '학문 표준 영어 트렌드'] },
      { q: '학교 교복은 폐지돼야 한다', pro: ['개성 표현 자유', '구매 비용 부담', '계절·체형 다양성'], con: ['빈부 차이 시각화 방지', '소속감과 정체성', '관리 편리성'] },
      { q: 'AI 활용 과제 작성은 부정행위가 아니다', pro: ['도구 활용도 능력의 일부', '미래 워크플로의 표준', '결과물의 평가가 본질'], con: ['학습 과정 자체가 교육 목적', '결과만 보면 사고 훈련 부족', '평가 공정성 훼손'] },
      { q: '대학 전공은 입학 후 2년 뒤에 정해야 한다', pro: ['진로 탐색 시간 확보', '학제 간 융합 사고', '미성숙한 진로 결정 방지'], con: ['전공 기초가 늦어짐', '학년별 학습 효율 ↓', '입학 정원 관리 곤란'] },
    ],
  },
  {
    id: 'society',
    name: '사회 · 정책',
    topics: [
      { q: '주 4일 근무제, 한국에 도입해도 된다', pro: ['삶의 질과 생산성 동시 향상 사례 다수', '저출산·번아웃 완화', '워라밸로 노동력 유지'], con: ['업종별 적용 곤란', '임금·생산 비용 증가', '소상공인 부담'] },
      { q: '기본소득은 시행해야 한다', pro: ['자동화 시대 안전망', '복지 행정비용 절감', '창업·창작 인센티브'], con: ['재원 부담', '근로 의욕 저하 우려', '인플레이션 가능성'] },
      { q: '사형제는 폐지돼야 한다', pro: ['오심·회복 불가', '인권 측면 국제 기준', '범죄 억제 효과 미입증'], con: ['피해자 가족 정의 회복', '최흉악 범죄 응징', '재범 가능성 차단'] },
      { q: '대마초 합법화는 필요하다', pro: ['의료적 유용성', '범죄 시장 양성화로 통제', '주류·담배보다 무해'], con: ['게이트웨이 약물 우려', '청소년 노출 위험', '사회·의료 비용'] },
      { q: '병역은 모병제로 전환해야 한다', pro: ['전문성·직업화', '개인 자유와 생애 설계', '인구감소 대응'], con: ['안보 자원 확보 어려움', '계층 간 부담 격차', '국방비 증가'] },
      { q: '안락사는 합법화해야 한다', pro: ['고통받는 환자의 자기결정권', '의료비·가족 부담 경감', '존엄한 죽음 권리'], con: ['생명 존엄성 훼손', '오·악용 위험', '사회적 압력 가능성'] },
      { q: '청소년 게임 셧다운은 부활시켜야 한다', pro: ['수면권과 학습 시간 보호', '게임 중독 예방', '부모 통제 보조'], con: ['실효성 낮은 우회', '게임 산업·문화 손실', '청소년 자율성 침해'] },
      { q: '담배는 단계적으로 금지돼야 한다', pro: ['건강 비용 최소화', '뉴질랜드 사례', '간접흡연 피해'], con: ['개인 선택의 자유', '암시장과 범죄 우려', '세수 손실'] },
      { q: '재택근무는 표준이 되어야 한다', pro: ['통근 시간·환경 비용', '집중·자율성', '인재 풀 확대'], con: ['협업·소속감 약화', '직무 적합성 차이', '신입 교육·문화 형성 곤란'] },
      { q: '결혼 제도는 다양화돼야 한다 (동성·동거)', pro: ['평등권', '가족 형태 사회 반영', '제도 밖 부당대우 해소'], con: ['기존 가족 가치 변화', '입양·상속 등 정합성', '사회 합의 우선'] },
      { q: '국회의원 정수는 늘려야 한다', pro: ['지역 대표성 강화', '의정 전문성·세분화', '의원 1인 부담 ↓'], con: ['세금 부담', '국민 반감', '효율보다 양적 확장'] },
      { q: '대법관·헌법재판관은 국민이 직접 뽑아야 한다', pro: ['민주적 정당성', '엘리트 카르텔 완화', '국민 통제력'], con: ['선거화로 정치색 짙어짐', '전문성 검증 곤란', '사법 독립 위협'] },
    ],
  },
  {
    id: 'env',
    name: '환경 · 에너지',
    topics: [
      { q: '원자력은 친환경 에너지로 분류해도 된다', pro: ['탄소 배출 거의 없음', '안정적 기저 전력', '재생만으로 부족'], con: ['고준위 폐기물 문제', '사고 시 피해 막대', '재생에너지 우선'] },
      { q: '내연기관차는 2035년까지 전면 금지해야 한다', pro: ['기후 위기 시급성', '도시 대기질 개선', '전기차 전환 가속'], con: ['전력망·인프라 미비', '소비자 비용 부담', '신흥국 형평성'] },
      { q: '플라스틱 사용은 완전히 금지해야 한다', pro: ['환경 오염 심각', '대체재 발전 촉진', '재활용으로 한계'], con: ['의료·식품 안전성', '대체재 비용·자원', '점진적 감축이 현실적'] },
      { q: '육식은 줄여야 한다', pro: ['축산업 온실가스', '동물 복지', '곡물 자원 효율'], con: ['식문화·영양 다양성', '축산 농가 생계', '개인 선택의 영역'] },
      { q: '지구공학(태양광 차폐 등) 연구는 필요하다', pro: ['감축만으로 부족할 가능성', '극한 위기 대비책', '과학적 가능성 확인'], con: ['예상 못한 부작용', '감축 노력 회피 명분', '국제 거버넌스 부재'] },
      { q: '환경 보호를 위해 출생률 억제 정책은 필요하다', pro: ['인구가 환경 부하 핵심 변수', '자원 한계', '미래 세대의 삶'], con: ['인구 감소가 이미 문제', '윤리적 강제 곤란', '소비 패턴이 더 큰 변수'] },
      { q: '도시에서 자전거 도로는 차도를 축소해서라도 확장해야 한다', pro: ['교통수단 다양화', '건강·환경', '도시 인간 중심'], con: ['교통 정체 심화', '안전 사고', '날씨 의존성'] },
      { q: '쓰레기 종량제는 더 비싸야 한다', pro: ['배출 감소 유인', '재활용 비용 회수', '경제적 압박이 효과적'], con: ['저소득층 부담', '무단투기 증가', '정책 외 대안 우선'] },
    ],
  },
  {
    id: 'culture',
    name: '문화 · 미디어',
    topics: [
      { q: 'K-콘텐츠 등급 심의는 더 강화해야 한다', pro: ['청소년 보호', '국가 이미지 관리', '극단적 콘텐츠 통제'], con: ['창작 자유', '글로벌 경쟁력 저하', '시장 자정 작용'] },
      { q: '리메이크보다 오리지널 콘텐츠가 우선돼야 한다', pro: ['창작 생태계 다양성', '신선한 서사', '제작자 도전 기회'], con: ['검증된 안정성', '팬덤·제작 효율', '문화 자산 재해석 가치'] },
      { q: '연예인 사생활은 보도돼선 안 된다', pro: ['공적 영역과 사적 영역 분리', '인권 보호', '루머·자살 위험'], con: ['공인의 책임 영역', '대중의 알 권리', '시장에 정보 비대칭'] },
      { q: '한국 영화 스크린 쿼터는 유지해야 한다', pro: ['자국 문화 산업 보호', '문화 다양성', 'K-콘텐츠 부흥의 토대'], con: ['시장 자유 침해', 'OTT 시대에 의미 약화', '경쟁력은 보호로 안 생김'] },
      { q: '게임은 정식 예술 장르로 인정해야 한다', pro: ['스토리·미학·인터랙션 결합', '주요 미술관 전시 사례', '세대 보편 문화'], con: ['상업적 색채 강함', '예술 정의 부합 곤란', '인정의 실익 불분명'] },
      { q: '광고 차단(Ad-blocker) 사용은 윤리적이다', pro: ['트래킹·프라이버시 침해', '브라우저 성능과 시간', '구독으로 후원 가능'], con: ['콘텐츠 제공자 수익 차단', '무료 서비스 기반 붕괴', '암묵적 무임승차'] },
      { q: '아이돌 산업의 어린 연습생 시스템은 폐지돼야 한다', pro: ['아동 인권', '학업·정체성 발달', '실패 시 회복 곤란'], con: ['글로벌 경쟁력 원천', '선택권은 본인·보호자', '훈련은 모든 예술 필수'] },
      { q: '베스트셀러는 신뢰할 수 없다', pro: ['마케팅·구매 캠페인 왜곡', '품질과 무관한 사건성', '편향된 추천 알고리즘'], con: ['대중 검증 신호', '진입 장벽 낮은 입문 도구', '데이터 기반 추천'] },
    ],
  },
  {
    id: 'ethics',
    name: '윤리 · 철학',
    topics: [
      { q: '거짓말은 어떤 상황에서도 옳지 않다', pro: ['칸트적 정언명령', '신뢰 사회의 기반', '예외 인정은 미끄러운 경사'], con: ['공리주의적 효용', '구체적 해악 방지', '\'선의의 거짓말\' 도덕성'] },
      { q: '안전을 위해 프라이버시를 일부 포기할 수 있다', pro: ['테러·범죄 예방', '공익이 사익보다 우선', '익명 보장 데이터 활용'], con: ['자유 사회의 핵심 가치', '\'안전을 위해서\'는 권력 남용 통로', '한 번 잃으면 회복 어려움'] },
      { q: '인간 복제 연구는 허용돼야 한다', pro: ['질병 치료 가능성', '과학적 자유', '단계적 윤리 통제 가능'], con: ['생명 존엄성', '신원·정체성 혼란', '돌이킬 수 없는 결과'] },
      { q: '동물 실험은 점진적으로 폐지해야 한다', pro: ['대체 기술(in silico, 오가노이드) 발전', '동물 권리', '결과의 인간 적용 한계'], con: ['신약·백신 안전성 검증', '대체재의 한계', '윤리위원회로 통제 가능'] },
      { q: '자기 결정에 의한 약물 사용은 본인 자유다', pro: ['자기 신체에 대한 권리', '범죄화의 부작용', '의료적 관리 전환'], con: ['중독·사회비용', '청소년 노출', '주변인에 대한 책임'] },
      { q: '트롤리 문제에서 5명을 살리기 위해 1명을 희생하는 건 옳다', pro: ['공리주의 다수 구원', '능동적 비행위도 결과 책임', '계산 가능한 도덕'], con: ['개인을 수단으로 사용 금지', '책임 소재 변화', '미끄러운 경사'] },
      { q: '존엄사는 본인 의지로 선택 가능해야 한다', pro: ['자기 결정권', '고통 회피', '의료 자원 효율'], con: ['생명 존엄', '취약 계층 압력', '회복 가능성 무시'] },
      { q: '돈으로 살 수 없는 영역(장기·표·시민권)이 있어야 한다', pro: ['공정성과 평등', '시장 논리의 한계', '인간 가치의 절대성'], con: ['효율과 자원 배분', '암시장보다 양성화 우월', '자유 거래의 기본권'] },
    ],
  },
  {
    id: 'work',
    name: '진로 · 직장',
    topics: [
      { q: '대기업보다 스타트업에 가는 게 더 낫다', pro: ['빠른 책임과 성장', '지분 인센티브', '실험과 자유'], con: ['안정성과 복지', '검증된 시스템 학습', '체계적 멘토링'] },
      { q: '평생 직장의 시대는 끝났다', pro: ['평균 근속 단축 데이터', '직업 이동의 보편화', '산업 격변'], con: ['전문성은 깊이에서 나옴', '연금·복지 시스템 결합', '특정 직군은 여전히 장기 근속'] },
      { q: '연봉 협상은 입사 시점이 가장 중요하다', pro: ['이후 인상률의 기준점', '협상 카드가 가장 강함', '한 번 정해지면 회복 어려움'], con: ['장기 성과로 추월 가능', '입사 즉시는 영향력 약함', '회사 내부 인상 정책 존재'] },
      { q: '사내 정치는 실력만큼 중요하다', pro: ['결정권자 관계가 평가에 직결', '협업의 본질', '실력만으로 한계'], con: ['장기적으로 실력이 승리', '윤리적 부담', '실력 없는 정치는 무너짐'] },
      { q: '재택근무 직원의 급여는 본사 기준보다 낮아야 한다', pro: ['생활비 지역 차이 반영', '글로벌 채용 효율', '공정성 시그널'], con: ['동일 노동 동일 임금', '재택은 회사 비용도 절감', '사기·이직 위험'] },
      { q: '커리어 초기에는 분야를 자주 바꿔보는 게 좋다', pro: ['적성 탐색', '다양한 기술 융합', '네트워크 폭'], con: ['깊이가 안 쌓임', '경력 일관성 약화', '연봉·승진 불리'] },
      { q: '리더는 타고나는 게 아니라 만들어진다', pro: ['훈련·경험이 핵심', '리더십 책 수만 권 사례', '환경이 90%'], con: ['특정 성향이 유리한 건 사실', '카리스마는 기질', '천성이 무시될 순 없음'] },
      { q: '연차가 능력보다 인사 평가에 더 영향을 미친다', pro: ['연공서열 문화', '경력은 곧 신뢰', '평가의 객관성 어려움'], con: ['성과 중심 전환', '젊은 인재 발탁 사례', '능력 객관 지표 발달'] },
    ],
  },
];

const CATEGORIES_EN: { id: string; name: string; topics: Topic[] }[] = [
  {
    id: 'life',
    name: 'Daily life',
    topics: [
      { q: 'Sweet-and-sour pork is better with the sauce poured over it', pro: ['Sauce coats every piece for a consistent flavor', 'Texture stays soft and the dish stays warm longer', 'Easier to scoop and share at the table'], con: ['The crunch of the fried batter is the whole point', 'Each person controls their own sauce ratio', 'Batter keeps its flavor even after it cools'] },
      { q: 'Mint chocolate is a legitimate food', pro: ['A globally beloved dessert category', 'Its cool freshness sets it apart from other desserts', 'The chocolate-and-herb pairing has deep culinary roots'], con: ['The toothpaste note clashes with sweetness', 'Its true role is as an after-meal palate cleanser', 'The main ingredients are not an intuitive match'] },
      { q: 'Breakfast is a meal you should never skip', pro: ['Morning energy is directly tied to focus', 'Helps normalize metabolic activity', 'Skipping it leads to lunchtime overeating'], con: ['Intermittent fasting benefits are well documented', 'There is little evidence breakfast must be mandatory', 'It depends on individual physiology'] },
      { q: 'Tea is better than coffee', pro: ['Lower caffeine means fewer side effects', 'Rich in antioxidants', 'Carries a culture of calm and ritual'], con: ['Coffee gives a stronger focus and alertness boost', 'Wider variety of aromas and flavors', 'Larger global industry and product diversity'] },
      { q: 'Living with a partner beats living alone', pro: ['Emotional stability and less loneliness', 'Shared living costs are more efficient', 'Help is close by in emergencies'], con: ['Independence and personal time are preserved', 'Less risk of conflict and interference', 'Freedom to keep your own lifestyle'] },
      { q: 'Holidays should be spent with family', pro: ['Tradition is the basis of social cohesion', 'A rare chance for cross-generational exchange', 'Carries deep emotional meaning'], con: ['Personal choice and rest should come first', 'Forced relationships are a source of stress', 'Family structures are increasingly diverse'] },
      { q: 'Adopting a pet is better than buying from a breeder', pro: ['Saves abandoned animals — a social good', 'Adoption systems now track and register well', 'Reduces breed-based discrimination'], con: ['Less information about health and temperament', 'Heavier responsibility burden', 'Specific breeds may fit a household better'] },
      { q: 'Offline shopping beats online shopping', pro: ['You can verify items in person before buying', 'Take it home immediately', 'Shopping itself becomes an experience and outing'], con: ['Instant price comparison online', 'Saves time and travel costs', 'Review data enables objective judgment'] },
      { q: 'Independent travel beats package tours', pro: ['Freedom in schedule and deeper experience', 'Allows unexpected encounters', 'Flexible cost control'], con: ['Less language and safety burden', 'Efficient routing and time use', 'In-depth explanations from expert guides'] },
      { q: 'Subscription services are a net loss for the user', pro: ['Long-term costs accumulate heavily', 'Easy to forget and keep paying', 'Renting instead of owning erodes assets'], con: ['Always access to the latest features and content', 'Can cancel anytime when not needed', 'Access huge content libraries cheaply'] },
      { q: 'Korean restaurants should stop offering free banchan refills', pro: ['Addresses food waste', 'Normalizes ingredient pricing', 'Easier hygienic management'], con: ['Core to Korean food culture and identity', 'Drives customer satisfaction', 'Lets diners get a balanced meal at no extra cost'] },
      { q: 'In cities, public transit beats owning a car', pro: ['Less parking and traffic stress', 'Cuts environmental costs', 'Predictable timing in rush hour'], con: ['Freedom for personal schedules and carrying loads', 'Safer in bad weather and late at night', 'More efficient for family travel'] },
    ],
  },
  {
    id: 'tech',
    name: 'Tech · Society',
    topics: [
      { q: 'AI will eventually replace human jobs', pro: ['Automation of routine and mid-level cognitive work is accelerating', 'Economic incentives point toward replacement', 'Historically automation has cut jobs in its target sectors'], con: ['New job categories emerge as offsets', 'Judgment and creative work stay human-centered', 'AI lands as a collaboration tool, not a replacement'] },
      { q: 'The metaverse will become the next internet', pro: ['Immersive experiences open new possibilities for learning and work', 'VR and AR tech has passed a critical threshold', 'Major firms are investing at huge scale'], con: ['Commercial adoption has been slow so far', 'Consumer fatigue and motion sickness remain', 'Existing web and apps are enough for most use cases'] },
      { q: 'Social media use harms mental health', pro: ['Comparison and FOMO drive depressive symptoms', 'Many studies link it to teen self-esteem decline', 'Built on dopamine-loop addiction'], con: ['Value in maintaining relationships and accessing information', 'The problem is usage, not the medium itself', 'Provides community and minority support networks'] },
      { q: 'Self-driving cars will become safer than human drivers', pro: ['Removes drunk, drowsy, and inattentive driving', 'Sensors and learning detect hazards faster', 'Accident rates are dropping quickly in data'], con: ['Edge-case handling remains incomplete', 'Ethical judgment (the trolley problem) is unresolved', 'Hacking and system failures pose new risks'] },
      { q: 'Commercial use of personal data should be tightly regulated', pro: ['Privacy is a fundamental right', 'Consent-based use has become a formality', 'Risk of dangerous data-power concentration'], con: ['Foundation of innovation and free services', 'Anonymization is sufficient', 'Excessive regulation chills the industry'] },
      { q: 'Cryptocurrency will become the currency of the future', pro: ['Reduces dependence on central banks', 'Efficient borderless transfers', 'Expanding digital-asset infrastructure'], con: ['Price volatility makes it unsuitable as currency', 'High energy and environmental costs', 'A workaround channel for crime and money laundering'] },
      { q: 'Coding education should be mandatory in every school', pro: ['Improves logical thinking and problem solving', 'A baseline literacy for the digital era', 'Equalizes future career opportunities'], con: ['Not suited to every student', 'Teachers and infrastructure are lacking', 'Career diversity should be respected'] },
      { q: 'Editor-curated news beats algorithmic news recommendations', pro: ['Mitigates filter bubbles and confirmation bias', 'Journalism ethics and clear accountability', 'Editors weigh context and importance'], con: ['Personalization improves relevance', 'The mass-media era is over', 'Editors carry their own biases'] },
      { q: 'A robot tax should be introduced', pro: ['Replaces tax revenue lost to automation', 'Funds a basic-income system', 'Pays for retraining displaced workers'], con: ['Dampens innovation incentives', 'The definition of "robot" is vague', 'Weakens international competitiveness'] },
      { q: 'AI-generated content should be eligible for copyright', pro: ['Creates new incentives in the creative economy', 'Commercial protection is needed', 'Human input and curation still contribute'], con: ['Copyright exists to protect human creation', 'Training data raises rights-violation issues', 'Unclear who the rights holder should be'] },
      { q: 'Internet anonymity should be abolished', pro: ['Reduces hate speech and toxic comments', 'Encourages a culture of accountable speech', 'Easier to trace crime and fraud'], con: ['Protects minorities and whistleblowers', 'Authoritarian regimes can weaponize it for censorship', 'Self-censorship shrinks the public sphere'] },
      { q: 'Deepfakes should be banned outright', pro: ['Protects likeness rights and reputations', 'Risk of political disinformation', 'Victims have little path to recovery'], con: ['Used in art, satire, and education', 'Punish misuse rather than ban the technology', 'Censorship standards would be vague'] },
    ],
  },
  {
    id: 'edu',
    name: 'Education',
    topics: [
      { q: 'School exams should switch to criterion-referenced grading', pro: ['Fosters a culture of collaborative learning', 'Reduces excessive competition between students', 'Restores the real motivation for learning'], con: ['Weaker discrimination makes top-tier evaluation hard', 'Consistency across teachers becomes a problem', 'Clashes with the college-entrance system'], },
      { q: 'The college entrance exam (Suneung) should be abolished', pro: ['Too much weight on a single high-stakes test', 'Core driver of the private-tutoring arms race', 'Multidimensional evaluation fits modern talent better'], con: ['Most fair and objective tool we have', 'Alternatives like 학종 are heavily influenced by parental resources', 'A national academic standard is necessary'] },
      { q: 'Student phone use should be fully banned at school', pro: ['Restores focus during class', 'Cuts off social media and gaming addiction', 'School phones suffice for emergencies'], con: ['Important for urgent contact and safety', 'A chance to learn digital literacy', 'Students need to develop self-control'] },
      { q: 'Coding is a more important subject than English', pro: ['Foundational technology of every future industry', 'Builds core logic and problem-solving skills', 'Korean-language coverage of the field keeps growing'], con: ['Language remains the heart of global communication', 'Coding is a tool — thinking matters more', 'Not essential for everyone'] },
      { q: 'College should be tuition-free', pro: ['Equality of educational opportunity', 'Cultivates national talent and competitiveness', 'Student debt has become a social problem'], con: ['Shifts the burden onto taxpayers', 'Weakens student responsibility and motivation', 'College is not the right path for everyone'] },
      { q: 'Class placement should be by ability level', pro: ['Improves learning efficiency with matched pacing', 'Concentrated support for students who fall behind', 'Prevents top students from stagnating'], con: ['Labeling damages self-image', 'Reinforces social separation', 'Ignores potential that emerges later in development'] },
      { q: 'Corporal punishment should be allowed within limits', pro: ['Restores classroom control', 'Discipline lands immediately', 'Some cases simply do not respond to words'], con: ['Violates children\'s rights', 'Teaches violence by example', 'Alternative discipline methods are more effective'] },
      { q: 'Korean universities should reduce English-taught courses', pro: ['Develops Korean academic vocabulary and deeper native-language learning', 'Lower student comprehension in English', 'Achieve internationalization through other means'], con: ['English is essential for cultivating global talent', 'Attracts international students', 'Academic standards are trending toward English'] },
      { q: 'School uniforms should be abolished', pro: ['Freedom to express individuality', 'Purchase costs are a burden', 'Season and body-type diversity'], con: ['Hides visible wealth disparity between students', 'Builds belonging and identity', 'Easier to manage day-to-day'] },
      { q: 'Using AI to write assignments is not cheating', pro: ['Skill with the tool is itself an ability', 'Reflects the future standard workflow', 'What matters is the quality of the output'], con: ['The learning process is the educational purpose', 'Outcomes alone hide a lack of thinking practice', 'Undermines the fairness of evaluation'] },
      { q: 'College majors should be declared two years after enrollment', pro: ['Gives time to explore career paths', 'Encourages interdisciplinary thinking', 'Prevents premature career decisions'], con: ['Major-specific foundations get delayed', 'Class-year learning efficiency drops', 'Admissions quotas become hard to manage'] },
    ],
  },
  {
    id: 'society',
    name: 'Society · Policy',
    topics: [
      { q: 'South Korea should adopt a four-day work week', pro: ['Many cases show quality of life and productivity rising together', 'Eases low birthrate and burnout', 'Sustains the workforce through better work-life balance'], con: ['Hard to apply uniformly across industries', 'Raises wage and production costs', 'Heavy burden on small businesses'] },
      { q: 'Universal basic income should be implemented', pro: ['A safety net for the automation era', 'Cuts welfare administration costs', 'Incentivizes startups and creative work'], con: ['Heavy funding burden', 'Concern about reduced work motivation', 'Possible inflationary pressure'] },
      { q: 'The death penalty should be abolished', pro: ['Wrongful convictions cannot be undone', 'Matches international human-rights standards', 'Deterrent effect remains unproven'], con: ['Restorative justice for victims\' families', 'Punishment for the most heinous crimes', 'Eliminates recidivism risk'] },
      { q: 'Marijuana should be legalized', pro: ['Has proven medical uses', 'Brings the black market under regulation', 'Less harmful than alcohol or tobacco'], con: ['Gateway-drug concerns', 'Risk of exposure to minors', 'Social and medical costs'] },
      { q: 'South Korea should switch to an all-volunteer military', pro: ['Greater professionalism and a career path', 'Personal freedom and life planning', 'A response to population decline'], con: ['Hard to secure enough security personnel', 'Burden falls unevenly across social classes', 'Defense spending rises'] },
      { q: 'Euthanasia should be legalized', pro: ['Self-determination for suffering patients', 'Reduces medical and family burdens', 'Right to a dignified death'], con: ['Undermines the sanctity of life', 'Risk of misuse or abuse', 'Possible social pressure to choose it'] },
      { q: 'The youth gaming shutdown law should be reinstated', pro: ['Protects sleep and study time', 'Prevents gaming addiction', 'Supports parental oversight'], con: ['Low effectiveness — easily bypassed', 'Loss to the gaming industry and culture', 'Violates youth autonomy'] },
      { q: 'Cigarettes should be phased out and banned', pro: ['Minimizes long-term health costs', 'The New Zealand precedent', 'Secondhand-smoke harm'], con: ['Individual freedom of choice', 'Risk of black markets and crime', 'Loss of tax revenue'] },
      { q: 'Remote work should be the default standard', pro: ['Cuts commuting time and environmental cost', 'Improves focus and autonomy', 'Expands the talent pool'], con: ['Weakens collaboration and belonging', 'Job-fit varies by role', 'Harder to train new hires and build culture'] },
      { q: 'Marriage should expand to same-sex and cohabiting couples', pro: ['Equal rights', 'Reflects diversified family structures', 'Resolves unfair treatment outside the system'], con: ['Shifts established family values', 'Adoption and inheritance frameworks need rework', 'Social consensus should come first'] },
      { q: 'The number of National Assembly seats should be increased', pro: ['Stronger regional representation', 'More specialized and professional legislation', 'Lower per-member workload'], con: ['Heavier tax burden', 'Public hostility to the idea', 'Quantity is not the right answer over efficiency'] },
      { q: 'Supreme Court and constitutional justices should be elected by the public', pro: ['Democratic legitimacy', 'Weakens the elite cartel', 'Public oversight'], con: ['Election turns the courts political', 'Hard to verify professional qualifications', 'Threatens judicial independence'] },
    ],
  },
  {
    id: 'env',
    name: 'Environment · Energy',
    topics: [
      { q: 'Nuclear should be classified as green energy', pro: ['Near-zero carbon emissions', 'Stable baseload power', 'Renewables alone are insufficient'], con: ['High-level waste problem', 'Catastrophic damage in worst-case accidents', 'Renewables should be prioritized'] },
      { q: 'Internal-combustion vehicles should be banned by 2035', pro: ['Climate urgency demands it', 'Improves urban air quality', 'Accelerates the EV transition'], con: ['Power grid and infrastructure are not ready', 'Heavy cost burden on consumers', 'Unfair to developing countries'] },
      { q: 'Plastic use should be completely banned', pro: ['Environmental pollution is severe', 'Forces development of alternatives', 'Recycling alone is hitting its limit'], con: ['Medical and food-safety needs', 'Cost and resource constraints of substitutes', 'Gradual reduction is more realistic'] },
      { q: 'We should eat less meat', pro: ['Livestock greenhouse-gas emissions', 'Animal welfare', 'More efficient grain-resource use'], con: ['Food culture and nutritional diversity', 'Livelihoods of livestock farmers', 'A matter of personal choice'] },
      { q: 'Geoengineering research (solar shading, etc.) is necessary', pro: ['Emission cuts alone may be insufficient', 'A backup plan for extreme-crisis scenarios', 'We need to confirm what is scientifically possible'], con: ['Unforeseen side effects', 'Excuse to avoid actual mitigation', 'No international governance framework'] },
      { q: 'Birth-rate suppression policies are needed for the environment', pro: ['Population is a key driver of environmental load', 'Resource limits are real', 'A matter of fairness to future generations'], con: ['Population decline is already a problem', 'Hard to enforce ethically', 'Consumption patterns matter more'] },
      { q: 'Bike lanes should be expanded in cities even by shrinking car lanes', pro: ['Diversifies transportation options', 'Better for health and the environment', 'Refocuses cities on people'], con: ['Worsens traffic congestion', 'Safety incidents rise', 'Heavily weather-dependent'] },
      { q: 'Pay-per-bag waste fees should be more expensive', pro: ['Stronger incentive to reduce waste', 'Recovers recycling costs', 'Economic pressure works'], con: ['Burden on low-income households', 'Encourages illegal dumping', 'Prefer non-pricing alternatives first'] },
    ],
  },
  {
    id: 'culture',
    name: 'Culture · Media',
    topics: [
      { q: 'K-content rating reviews should be strengthened', pro: ['Protects minors', 'Manages national image', 'Controls the most extreme content'], con: ['Creative freedom', 'Weakens global competitiveness', 'The market self-corrects'] },
      { q: 'Original content should take priority over remakes', pro: ['Diversifies the creative ecosystem', 'Fresh narratives for audiences', 'Gives creators a chance to take risks'], con: ['Proven, reliable performance', 'Efficient for fandoms and production', 'Value in reinterpreting cultural heritage'] },
      { q: 'Celebrity private lives should not be reported', pro: ['Separates public and private spheres', 'Protects human rights', 'Risk of rumors and suicide harm'], con: ['Public figures bear accountability in their domain', 'The public\'s right to know', 'Information asymmetry must be corrected'] },
      { q: 'South Korea should keep its film screen quota', pro: ['Protects the domestic cultural industry', 'Preserves cultural diversity', 'Foundation of the K-content boom'], con: ['Violates market freedom', 'Loses meaning in the OTT era', 'Competitiveness does not come from protection'] },
      { q: 'Video games should be recognized as a formal art form', pro: ['Combines story, aesthetics, and interaction', 'Major museums now exhibit games', 'A universal generational culture'], con: ['Strongly commercial in nature', 'Hard to fit standard definitions of art', 'Unclear what such recognition would accomplish'] },
      { q: 'Using an ad-blocker is ethical', pro: ['Tracking and privacy concerns', 'Browser performance and user time', 'You can support creators via subscriptions instead'], con: ['Blocks revenue for content providers', 'Collapses the free-service business model', 'Effectively a free ride'] },
      { q: 'The young-trainee system in the idol industry should be abolished', pro: ['Children\'s human rights', 'Affects schooling and identity development', 'Hard to recover from failure'], con: ['Source of global competitiveness', 'Choice rests with the individual and guardians', 'Training is essential to every art form'] },
      { q: 'Bestseller lists are untrustworthy', pro: ['Distorted by marketing and bulk-buying campaigns', 'Reflects events more than quality', 'Recommendation algorithms are biased'], con: ['A signal of broad public validation', 'A low-barrier entry point for new readers', 'Data-driven recommendation logic'] },
    ],
  },
  {
    id: 'ethics',
    name: 'Ethics · Philosophy',
    topics: [
      { q: 'Lying is wrong under any circumstance', pro: ['Kantian categorical imperative', 'Foundation of a trusting society', 'Exceptions are a slippery slope'], con: ['Utilitarian benefit', 'Prevents concrete harm', 'Morality of the "white lie"'] },
      { q: 'It is acceptable to give up some privacy for safety', pro: ['Prevents terrorism and crime', 'Public interest outweighs private interest', 'Anonymized data can still be used'], con: ['A core value of a free society', '"For safety" becomes a pipeline for abuse of power', 'Once lost, hard to recover'] },
      { q: 'Human cloning research should be allowed', pro: ['Potential to cure diseases', 'Scientific freedom', 'Ethical controls can be applied gradually'], con: ['Sanctity of human life', 'Confusion of identity and personhood', 'Consequences cannot be undone'] },
      { q: 'Animal testing should be phased out', pro: ['Alternatives (in silico, organoids) are maturing', 'Animal rights', 'Limited applicability of results to humans'], con: ['Safety verification for new drugs and vaccines', 'Limits of substitutes', 'Ethics committees provide control'] },
      { q: 'Recreational drug use should be the individual\'s right', pro: ['Right to your own body', 'Side effects of criminalization', 'Shifts handling to medical management'], con: ['Addiction and social costs', 'Exposure to minors', 'Responsibility to those around you'] },
      { q: 'In the trolley problem, sacrificing one to save five is right', pro: ['Utilitarian rescue of the majority', 'Inaction is itself a choice with consequences', 'Morality you can actually calculate'], con: ['Forbids treating a person as a means', 'Shifts the locus of responsibility', 'A slippery slope'] },
      { q: 'Death with dignity should be available by personal choice', pro: ['Self-determination', 'Escape from suffering', 'Efficient use of medical resources'], con: ['Sanctity of life', 'Pressure on vulnerable populations', 'Ignores possibility of recovery'] },
      { q: 'Some things (organs, votes, citizenship) should not be for sale', pro: ['Fairness and equality', 'The limits of market logic', 'Absolute value of human dignity'], con: ['Efficiency and resource allocation', 'Better than black markets', 'A free-trade fundamental right'] },
    ],
  },
  {
    id: 'work',
    name: 'Career · Work',
    topics: [
      { q: 'Joining a startup beats joining a large corporation', pro: ['Faster responsibility and growth', 'Equity-based incentives', 'Experimentation and freedom'], con: ['Stability and benefits', 'Learning proven systems', 'Structured mentorship'] },
      { q: 'The era of lifetime employment is over', pro: ['Data shows average tenure shrinking', 'Job changes are now the norm', 'Industries are in upheaval'], con: ['Expertise comes from depth over time', 'Pensions and benefits tie to long tenure', 'Some fields still favor long-term careers'] },
      { q: 'The salary negotiation at hire is the most important one', pro: ['Sets the baseline for all future raises', 'Negotiation leverage peaks here', 'Once set, hard to recover'], con: ['Long-term performance can overtake it', 'New hires have little leverage', 'Internal raise policies still apply'] },
      { q: 'Office politics matter as much as actual skill', pro: ['Relationships with decision-makers shape evaluations', 'Essence of collaboration', 'Skill alone has limits'], con: ['In the long run skill wins', 'Ethical burden', 'Politics without skill collapses'] },
      { q: 'Remote workers should be paid less than HQ-based colleagues', pro: ['Reflects regional cost-of-living differences', 'Efficient for global hiring', 'A signal about fairness'], con: ['Equal pay for equal work', 'Remote also saves the company costs', 'Hurts morale and triggers turnover'] },
      { q: 'It is good to change fields often early in your career', pro: ['Exploration of aptitudes', 'Cross-disciplinary skill combinations', 'Broader networks'], con: ['Depth does not accumulate', 'Career narrative becomes inconsistent', 'Hurts salary and promotion'] },
      { q: 'Leaders are made, not born', pro: ['Training and experience are decisive', 'Endless leadership-development case studies', 'Environment accounts for 90%'], con: ['Certain temperaments do have an advantage', 'Charisma is innate', 'Nature cannot be entirely dismissed'] },
      { q: 'Tenure affects HR evaluation more than ability does', pro: ['Korean seniority-based culture', 'Years of service equal trust', 'Hard to objectively assess performance'], con: ['Shift toward performance-based evaluation', 'Cases of promoting young talent ahead', 'Objective skill metrics are improving'] },
    ],
  },
];

export function TopicsView({
  onPickTopic,
  lang = 'ko',
  onBackToLearn,
  onNav,
  onGoLobby,
}: {
  onPickTopic?: (topic: string) => void;
  lang?: 'ko' | 'en';
  onBackToLearn?: () => void;
  onNav?: (page: string) => void;
  onGoLobby?: () => void;
}) {
  useDocumentMeta(
    lang === 'en' ? 'Topics — 100+ Debate Prompts — DebateBattle' : '토론 주제 100선 — 토론배틀',
    lang === 'en'
      ? '100+ debate prompts by category — daily life, tech, education, society, environment, culture, ethics, careers. Each includes Pro/Con talking points.'
      : '카테고리별 토론 주제 100여 개. 생활·기술·교육·사회·환경·문화·윤리·진로. 각 주제마다 찬성·반대 주요 논점 포함.',
  );

  const ts = headerStrings[lang].search;
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const isFiltered = search.trim() !== '' || activeCat !== 'all';

  const cats = lang === 'en' ? CATEGORIES_EN : CATEGORIES;
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cats.map((cat) => ({
      ...cat,
      topics: cat.topics.filter((t) => {
        if (activeCat !== 'all' && activeCat !== cat.id) return false;
        if (!q) return true;
        return t.q.toLowerCase().includes(q);
      }),
    })).filter((cat) => cat.topics.length > 0);
  }, [search, activeCat, cats]);

  const totalCount = cats.reduce((sum, c) => sum + c.topics.length, 0);
  const filteredCount = filtered.reduce((sum, c) => sum + c.topics.length, 0);

  const jumpTo = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  return (
    <ContentLayout
      theme="arena"
      lang={lang}
      onBackToLearn={onBackToLearn}
      onNav={onNav}
      onGoLobby={onGoLobby}
      crumbLabel={lang === 'ko' ? '토론 주제 100선' : 'Topics'}
      eyebrow={lang === 'en' ? `TOPICS · ${totalCount}+` : `TOPICS · 토론 주제 ${totalCount}+`}
      title={lang === 'en' ? (
        <>
          When you don't know
          <br />
          <span className="hand">what to argue about.</span>
        </>
      ) : (
        <>
          뭘로 싸울지
          <br />
          <span className="hand">고민될 땐.</span>
        </>
      )}
      subtitle={lang === 'en' ? (
        <>
          <b>{totalCount} debate prompts</b> organized by category. Each comes with Pro and Con
          talking points so you can prep a constructive in seconds. Pick one and take it straight
          to the stage.
        </>
      ) : (
        <>
          <b>{totalCount}개</b>의 토론 주제를 카테고리별로 모아두었습니다. 각
          주제 옆에 양측이 자주 쓰는 핵심 논점이 함께 적혀 있으니 입론 준비에
          참고하세요. 마음에 드는 주제는 그대로 가져가서 토론을 시작할 수
          있습니다.
        </>
      )}
      hint={lang === 'en' ? '🔥 Pick a topic and take it straight to the stage' : '🔥 주제를 골라 그대로 무대로 가져갈 수 있어요'}
    >
      <div className="topics-controls">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'en' ? '🔍 Search by keyword' : '🔍 키워드로 검색'}
          className="topics-search"
          aria-label={lang === 'en' ? 'Search by keyword' : '키워드로 검색'}
        />
        <div className="topics-cats" role="group" aria-label={lang === 'en' ? 'Filter by category' : '카테고리 필터'}>
          <button
            type="button"
            className={`topics-cat ${activeCat === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCat('all')}
            aria-pressed={activeCat === 'all'}
          >
            {lang === 'en' ? 'All' : '전체'}
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`topics-cat ${activeCat === c.id ? 'active' : ''}`}
              onClick={() => setActiveCat(c.id)}
              aria-pressed={activeCat === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="topics-meta" aria-live="polite" aria-atomic="true">
        <span className="topics-count">{ts.resultCount(filteredCount, totalCount)}</span>
        {activeCat !== 'all' && (
          <button
            type="button"
            className="topics-active-chip"
            onClick={() => setActiveCat('all')}
            aria-label={`${cats.find((c) => c.id === activeCat)?.name ?? activeCat} ${ts.reset}`}
          >
            {cats.find((c) => c.id === activeCat)?.name ?? activeCat}
            <span className="topics-active-chip__x" aria-hidden="true">×</span>
          </button>
        )}
        {isFiltered && (
          <button
            type="button"
            className="topics-reset"
            onClick={() => { setSearch(''); setActiveCat('all'); }}
          >
            {ts.reset}
          </button>
        )}
      </div>

      {!search.trim() && activeCat === 'all' && filtered.length > 1 && (
        <nav className="topics-jump" aria-label={lang === 'en' ? 'Jump to category' : '카테고리 바로가기'}>
          <div className="topics-jump__inner">
            <span className="topics-jump__label" aria-hidden="true">
              {lang === 'en' ? 'Jump' : '바로가기'}
            </span>
            {filtered.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="topics-jump__btn"
                onClick={() => jumpTo(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {filtered.length === 0 && (
        <div className="topics-empty" role="status">
          <p className="topics-empty__msg">{ts.noResults}</p>
          <p className="topics-empty__hint">{ts.noResultsHint}</p>
        </div>
      )}

      {filtered.map((cat) => (
        <section
          key={cat.id}
          id={`topics-section-${cat.id}`}
          className="topics-cat-section"
          ref={(el) => { sectionRefs.current[cat.id] = el; }}
        >
          <h2 className="topics-cat-title">{cat.name}</h2>
          <div className="topics-list">
            {cat.topics.map((t) => (
              <article key={t.q} className="topic-row">
                <h3 className="topic-row__q">{t.q}</h3>
                <div className="topic-row__split">
                  <div className="topic-row__side topic-row__side--pro">
                    <div className="topic-row__side-tag">{lang === 'en' ? 'Pro' : '찬성'}</div>
                    <ul>
                      {t.pro.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="topic-row__side topic-row__side--con">
                    <div className="topic-row__side-tag">{lang === 'en' ? 'Con' : '반대'}</div>
                    <ul>
                      {t.con.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {onPickTopic && (
                  <button
                    type="button"
                    className="topic-row__cta"
                    onClick={() => onPickTopic(t.q)}
                    aria-label={lang === 'en' ? `Use this topic: ${t.q}` : `이 주제로 무대 열기: ${t.q}`}
                  >
                    {lang === 'en' ? 'Use this topic ▶' : '이 주제로 무대 열기 ▶'}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </ContentLayout>
  );
}
