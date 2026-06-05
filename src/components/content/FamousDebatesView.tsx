import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';

interface FamousDebate {
  year: string;
  title: string;
  where: string;
  sides: { side: string; who: string; pos: string }[];
  body: string;
  legacy: string;
  tag: string;
}

const DEBATES: FamousDebate[] = [
  {
    year: '기원전 399',
    title: '소크라테스의 변론',
    where: '아테네 법정',
    sides: [
      { side: '피고', who: '소크라테스', pos: '청년 타락·신성 모독 혐의 부정' },
      { side: '검사', who: '멜레토스 등', pos: '아테네 신을 모독하고 청년을 타락시켰다' },
    ],
    body: '죽음을 앞두고도 자기 신념을 굽히지 않고 "검토되지 않은 삶은 살 가치가 없다"고 주장. 산파술(maieutics) 방식으로 검사 측의 논리적 모순을 질문으로 무너뜨림.',
    legacy: '서양 철학 사상 가장 유명한 자기변호. "질문으로 답하는" 토론 기법의 원형이며 양심·진리에 대한 헌신의 상징.',
    tag: '철학',
  },
  {
    year: '1858',
    title: '링컨-더글라스 토론',
    where: '일리노이주, 미국',
    sides: [
      { side: '공화당', who: '에이브러햄 링컨', pos: '노예제 확대 반대' },
      { side: '민주당', who: '스티븐 더글러스', pos: '주민 자결권으로 결정' },
    ],
    body: '일리노이 상원의원 선거 기간 동안 7개 도시에서 진행된 일련의 토론. 노예제의 도덕성·연방 권한·헌법 해석을 둘러싼 격렬한 논쟁. 회당 약 3시간씩 진행.',
    legacy: '미국 정치 토론의 표준 양식이 됐고, 후일 \'링컨-더글라스 토론\' 형식이 정식 대회 양식으로 정착. 링컨은 선거에 졌지만 전국적 명성으로 1860년 대통령 당선.',
    tag: '정치',
  },
  {
    year: '1860',
    title: '옥스포드 진화 토론',
    where: '옥스포드 자연사 박물관, 영국',
    sides: [
      { side: '진화론', who: '토마스 헉슬리', pos: '다윈의 진화론 옹호' },
      { side: '반대', who: '새뮤얼 윌버포스 주교', pos: '진화론은 신학에 반함' },
    ],
    body: '"당신의 조부와 조모 중 어느 쪽이 원숭이인가?"라는 윌버포스의 조롱에, 헉슬리가 "능력을 진리 왜곡에 쓰는 인간보다는 차라리 원숭이를 조부로 두겠다"고 응수.',
    legacy: '과학과 종교 사이의 공개 토론 역사상 가장 상징적 장면. 진화론이 학계 주류로 자리잡는 전환점.',
    tag: '과학',
  },
  {
    year: '1925',
    title: '스코프스 원숭이 재판',
    where: '테네시주 데이튼, 미국',
    sides: [
      { side: '검사', who: '윌리엄 제닝스 브라이언', pos: '학교에서 진화론 교육 금지' },
      { side: '피고', who: '클래런스 대로우', pos: '학문의 자유와 진화론 옹호' },
    ],
    body: '진화론 교육을 금지한 버틀러 법을 어긴 교사 스코프스 재판. 대로우가 검사 측 브라이언을 증인석에 세워 성경 해석의 모순을 캐물은 장면이 결정적.',
    legacy: '과학 교육·정교 분리 논쟁의 분기점. 영화 \'기적을 만드는 사람들(Inherit the Wind)\'의 모티브.',
    tag: '과학',
  },
  {
    year: '1948',
    title: 'BBC 라디오 신 존재 논쟁',
    where: 'BBC, 영국',
    sides: [
      { side: '기독교', who: 'F.C. 코플스턴', pos: '신은 우주의 필연적 존재' },
      { side: '회의론', who: '버트런드 러셀', pos: '신 존재의 논증은 성립하지 않음' },
    ],
    body: '러셀과 코플스턴이 신 존재 증명에 대해 약 1시간 동안 논쟁. 코플스턴은 우주론적 논증을 펼치고, 러셀은 "우주가 그냥 있다"고 응수.',
    legacy: '20세기 종교철학 토론의 표준. 학생들이 양측 논거 분석을 위해 지금도 인용하는 텍스트.',
    tag: '철학',
  },
  {
    year: '1960',
    title: '케네디 vs 닉슨 첫 TV 토론',
    where: 'CBS 시카고 스튜디오, 미국',
    sides: [
      { side: '민주당', who: '존 F. 케네디', pos: '"새로운 세대" 비전' },
      { side: '공화당', who: '리처드 닉슨', pos: '경험과 정책 연속성' },
    ],
    body: '첫 TV 토론. 라디오 청취자는 닉슨이 우세하다고 봤지만, TV 시청자는 자신감 있고 그을린 외모의 케네디 압승으로 평가. 정치 토론에서 시각적 인상의 힘을 입증.',
    legacy: '미디어 시대 정치 토론의 시작점. 이후 모든 대선 토론의 룰이 여기서 정립.',
    tag: '정치',
  },
  {
    year: '1965',
    title: '볼드윈 vs 버클리 — 케임브리지 토론',
    where: '케임브리지 유니언, 영국',
    sides: [
      { side: '찬성', who: '제임스 볼드윈', pos: '"미국 흑인의 꿈은 백인의 희생으로 이뤄진다" 명제 옹호' },
      { side: '반대', who: '윌리엄 F. 버클리 Jr.', pos: '명제 부정' },
    ],
    body: '미국 흑인 작가 볼드윈이 흑인의 역사적 경험을 격정적으로 풀어내자 청중이 기립박수. 보수 논객 버클리는 통계로 반박했으나 정서·도덕적 무게에서 밀림. 학생 투표 540-160으로 볼드윈 압승.',
    legacy: '시민권 운동기의 결정적 공개 담론. 도덕적 호소와 통계 논증의 강도 비교 사례로 자주 인용.',
    tag: '사회',
  },
  {
    year: '1971',
    title: '촘스키 vs 푸코',
    where: '네덜란드 TV',
    sides: [
      { side: '미국 지식인', who: '노엄 촘스키', pos: '인간 본성과 정의는 보편적' },
      { side: '프랑스 철학자', who: '미셸 푸코', pos: '정의는 사회·권력 구조의 산물' },
    ],
    body: '인간 본성·정의·정치 권력에 대해 약 1시간 논쟁. 촘스키는 보편 문법·도덕 본능을 강조, 푸코는 모든 개념이 권력의 구성물이라고 반박.',
    legacy: '20세기 후반 사상사 양대 거장의 결정적 만남. 보편주의 vs 구성주의 논쟁의 원형 텍스트.',
    tag: '철학',
  },
  {
    year: '1984',
    title: '레이건 vs 먼데일 두 번째 토론',
    where: '캔자스시티, 미국',
    sides: [
      { side: '공화당', who: '로널드 레이건', pos: '재선' },
      { side: '민주당', who: '월터 먼데일', pos: '대통령 후보' },
    ],
    body: '고령 우려가 컸던 73세 레이건이 "나는 이번 선거에서 상대의 젊음과 미숙함을 정치적 목적으로 이용하지 않겠다"고 농담. 청중·먼데일 본인도 웃음을 터뜨림.',
    legacy: '한 줄의 유머가 선거 판세를 바꾼 사례. 정치 토론에서 메시지보다 모먼트의 힘을 보여줌.',
    tag: '정치',
  },
  {
    year: '1992',
    title: '클린턴 vs 부시 vs 페로 — 타운홀 미팅',
    where: '리치몬드, 버지니아',
    sides: [
      { side: '민주당', who: '빌 클린턴', pos: '경제 변화 메시지' },
      { side: '공화당', who: '조지 H.W. 부시', pos: '재선 시도' },
      { side: '무소속', who: '로스 페로', pos: '재정 적자 의제' },
    ],
    body: '시민 청중이 직접 질문하는 타운홀 방식. 클린턴이 청중에게 다가가 눈을 맞춘 반면, 부시는 시계를 보는 장면이 카메라에 잡힘.',
    legacy: '타운홀 토론 방식의 정착. 비언어적 신호가 정치적 메시지보다 강할 수 있음을 보여줌.',
    tag: '정치',
  },
  {
    year: '2007',
    title: '돕킨스 vs 윌리엄슨 (Intelligence Squared)',
    where: '런던, 영국',
    sides: [
      { side: '무신론', who: '리처드 도킨스 등', pos: '"가톨릭 교회는 세상을 더 좋은 곳으로 만들지 못했다"' },
      { side: '옹호', who: '앤 위덤스마이트 대주교 등', pos: '명제 부정' },
    ],
    body: '도킨스·히친스 측이 가톨릭 교회의 역사적 잘못(종교 재판, 식민지 등)을 통계로 제시. 청중 토론 전 47% → 후 81% 명제 찬성으로 이동.',
    legacy: '청중 사전·사후 투표로 의견 변화를 측정하는 Intelligence Squared 양식의 대표 사례.',
    tag: '종교',
  },
  {
    year: '2010',
    title: 'IBM 왓슨 vs 제닝스 — 제퍼디!',
    where: '뉴욕, 미국',
    sides: [
      { side: 'AI', who: 'IBM 왓슨', pos: '퀴즈쇼 챔피언 도전' },
      { side: '인간 챔피언', who: '켄 제닝스', pos: '인간 지식의 깊이' },
    ],
    body: 'AI가 자연어 질문을 이해하고 백과사전적 지식으로 답하는 퀴즈쇼 대결. 왓슨이 인간 챔피언 둘을 압도. 마지막에 제닝스는 "AI 오버로드들을 환영한다"고 농담.',
    legacy: 'AI vs 인간 시대를 알린 상징적 이벤트. 자연어 처리의 가능성을 대중에 각인.',
    tag: '기술',
  },
  {
    year: '2014',
    title: '나이 vs 햄 — 진화론 vs 창조론',
    where: '켄터키 창조 박물관',
    sides: [
      { side: '과학', who: '빌 나이', pos: '진화론 옹호' },
      { side: '창조론', who: '켄 햄', pos: '6000년 지구설 옹호' },
    ],
    body: '약 2시간 30분 동안 양측이 과학적 증거와 성경 해석을 두고 논쟁. 양측 모두 강력한 자기 진영 지지를 받았지만, 청중 외 시청자 대상으로 진화론이 우세 평가.',
    legacy: '소셜 미디어 시대 첫 대규모 과학 논쟁. 유튜브 조회수 수백만으로 과학 커뮤니케이션의 새 방식을 제시.',
    tag: '과학',
  },
  {
    year: '2016',
    title: '알파고 vs 이세돌',
    where: '서울, 한국',
    sides: [
      { side: 'AI', who: 'DeepMind AlphaGo', pos: '바둑 최고 수준' },
      { side: '인간 챔피언', who: '이세돌', pos: '인간 직관과 창의성' },
    ],
    body: '5번기 바둑 대결. AlphaGo 4승 1패. 이세돌의 4국 78수 "신의 한 수"는 인간이 AI에 거둔 유일한 1승. 이후 이세돌은 AI에 마지막으로 이긴 인간으로 기록.',
    legacy: 'AI가 인간의 가장 직관적이라 여겨진 영역까지 정복할 수 있음을 입증. 한국 사회에 AI 시대 인식을 본격적으로 각인.',
    tag: '기술',
  },
  {
    year: '2018',
    title: '피터슨 vs 해리스 — 진실과 도덕',
    where: '북미 투어',
    sides: [
      { side: '심리학자', who: '조던 피터슨', pos: '종교적 진실의 가치 옹호' },
      { side: '신경과학자', who: '샘 해리스', pos: '도덕은 과학적 사실에 근거' },
    ],
    body: '진실의 정의·종교의 역할·도덕 기반에 대해 4회 공개 토론. 4시간 이상 분량. 두 사람 모두 양보하지 않았고 청중도 양분.',
    legacy: '21세기 지식인 공개 토론의 흥행 모델. 유튜브·팟캐스트 시대 토론 콘텐츠의 가능성을 보여줌.',
    tag: '철학',
  },
  {
    year: '2019',
    title: 'AOC vs 의회 청문회',
    where: '미국 의회',
    sides: [
      { side: '하원의원', who: '알렉산드리아 오카시오-코르테스', pos: '윤리·정치자금 규제의 허점 폭로' },
      { side: '공무원', who: '청문회 증인들', pos: '응답' },
    ],
    body: '5분 발언 시간 안에 5단계 가상 시나리오로 정치 헌금·윤리 규제의 구멍을 폭로. 짧고 날카로운 질의응답이 SNS로 폭발적 확산.',
    legacy: '디지털 시대 짧은 의회 발언의 영향력. 5분 한 사이클로 정치 메시지를 만드는 새 표준.',
    tag: '정치',
  },
  {
    year: '2023',
    title: 'Munk Debate — AI Existential Risk',
    where: '토론토, 캐나다',
    sides: [
      { side: '경고', who: '맥스 테그마크 / 요슈아 벤지오', pos: 'AI는 실존적 위험' },
      { side: '낙관', who: '얀 르쿤 / 멜라니 미첼', pos: 'AI 위험은 과장' },
    ],
    body: 'AI의 실존적 위험에 대해 4명의 AI 분야 권위자가 격돌. 청중 사전 67% 위험 인식 → 사후 64%로 큰 변화 없음. 양측의 논거가 팽팽했음을 보여줌.',
    legacy: 'AI 안전 논쟁의 결정적 공개 텍스트. 일반 대중에게 AI 위험 논의가 전문가 사이에서도 합의되지 않음을 알림.',
    tag: '기술',
  },
  {
    year: '1960~',
    title: '옥스포드 유니언 표준',
    where: '옥스포드, 영국',
    sides: [
      { side: '찬성 측', who: '4명', pos: '제안된 명제 옹호' },
      { side: '반대 측', who: '4명', pos: '명제 부정' },
    ],
    body: '"This House Believes…"로 시작하는 명제를 두고 8명의 발언자가 격돌. 청중이 토론 후 어느 쪽 방으로 걸어 나가는지로 투표(walking vote). 200년 역사.',
    legacy: '세계에서 가장 권위 있는 학생 토론 클럽. 처칠·간디·달라이라마·자카리아·오바마 등 역사적 인물이 거쳐 감.',
    tag: '교육',
  },
  {
    year: '1985~',
    title: 'World Universities Debating Championship (WUDC)',
    where: '매년 다른 국가',
    sides: [
      { side: '정부 1·2', who: 'OG/CG', pos: '명제 옹호' },
      { side: '야당 1·2', who: 'OO/CO', pos: '명제 부정' },
    ],
    body: '세계대학토론대회. 영국식 의회식(BP) 양식. 매년 1월 4팀 동시 토론으로 약 400팀이 참가. 토론은 영어로 진행되며 BP 양식의 표준을 정립.',
    legacy: '대학 토론의 올림픽. 한국 대학들도 정기적으로 참가하며 영어 토론 인재 양성의 표준.',
    tag: '교육',
  },
  {
    year: '1988~',
    title: 'World Schools Debating Championship (WSDC)',
    where: '매년 다른 국가',
    sides: [
      { side: '찬성', who: '3명', pos: '명제 옹호' },
      { side: '반대', who: '3명', pos: '명제 부정' },
    ],
    body: '세계학생토론대회. 매년 60여 개국 고교생이 참가. World Schools 양식 사용. 3:3 팀, 사전 준비 명제와 즉석 명제를 혼합.',
    legacy: '글로벌 청소년 토론 문화의 중심. 한국 대표팀도 매년 출전하며 영연방·아시아권에서 가장 권위 있는 학생 대회.',
    tag: '교육',
  },
];

const DEBATES_EN: FamousDebate[] = [
  {
    year: '399 BCE',
    title: "Socrates's Apology",
    where: 'Athenian court',
    sides: [
      { side: 'Defendant', who: 'Socrates', pos: 'Denying charges of corrupting youth and impiety' },
      { side: 'Prosecutors', who: 'Meletus et al.', pos: 'Insulting Athenian gods, corrupting youth' },
    ],
    body: 'Even facing death, Socrates refused to abandon his convictions: "The unexamined life is not worth living." Used the Socratic method (maieutics) to dismantle the prosecution\'s logic through questioning.',
    legacy: 'The most famous self-defense in Western philosophy. The prototype of debate-by-questioning, and a symbol of devotion to conscience and truth.',
    tag: 'Philosophy',
  },
  {
    year: '1858',
    title: 'Lincoln–Douglas Debates',
    where: 'Illinois, USA',
    sides: [
      { side: 'Republican', who: 'Abraham Lincoln', pos: 'Opposes extending slavery' },
      { side: 'Democrat', who: 'Stephen Douglas', pos: 'Decided by popular sovereignty' },
    ],
    body: 'A series of debates in 7 Illinois cities during the Senate race. Intense argument over the morality of slavery, federal authority, and constitutional interpretation. Each debate ran roughly 3 hours.',
    legacy: 'Became the standard format for American political debate, later codified as the "Lincoln-Douglas" tournament format. Lincoln lost the election but gained national fame, leading to his 1860 presidential win.',
    tag: 'Politics',
  },
  {
    year: '1860',
    title: 'Oxford Evolution Debate',
    where: 'Oxford University Museum, UK',
    sides: [
      { side: 'Evolution', who: 'Thomas Huxley', pos: "Defends Darwin's theory" },
      { side: 'Opposed', who: 'Bishop Samuel Wilberforce', pos: 'Evolution contradicts theology' },
    ],
    body: 'To Wilberforce\'s mocking "Was it through your grandfather or your grandmother that you claim descent from a monkey?" Huxley replied that he\'d rather have a monkey for a grandfather than a man who uses his gifts to distort the truth.',
    legacy: 'The most iconic moment in the history of public debate between science and religion — a turning point in evolution\'s rise to scientific mainstream.',
    tag: 'Science',
  },
  {
    year: '1925',
    title: 'Scopes "Monkey" Trial',
    where: 'Dayton, Tennessee, USA',
    sides: [
      { side: 'Prosecution', who: 'William Jennings Bryan', pos: 'Ban teaching of evolution in schools' },
      { side: 'Defense', who: 'Clarence Darrow', pos: 'Academic freedom and evolution' },
    ],
    body: "Trial of teacher Scopes for violating the Butler Act banning evolution in schools. The pivotal moment: Darrow puts Bryan on the stand and probes contradictions in his biblical interpretation.",
    legacy: 'A watershed for science education and church/state separation. The basis for the film "Inherit the Wind".',
    tag: 'Science',
  },
  {
    year: '1948',
    title: 'BBC Radio Debate on God',
    where: 'BBC, UK',
    sides: [
      { side: 'Christianity', who: 'F.C. Copleston', pos: 'God is the universe\'s necessary being' },
      { side: 'Skepticism', who: 'Bertrand Russell', pos: 'Arguments for God do not hold' },
    ],
    body: 'Russell and Copleston debated the existence of God for about an hour. Copleston deployed the cosmological argument; Russell countered "the universe is just there."',
    legacy: 'The 20th-century standard for philosophy-of-religion debate. Still cited by students analyzing both sides\' arguments.',
    tag: 'Religion',
  },
  {
    year: '1960',
    title: 'Kennedy vs Nixon — First TV Debate',
    where: 'CBS Chicago studio, USA',
    sides: [
      { side: 'Democrat', who: 'John F. Kennedy', pos: '"New generation" vision' },
      { side: 'Republican', who: 'Richard Nixon', pos: 'Experience and continuity' },
    ],
    body: 'The first televised debate. Radio listeners saw Nixon as the winner, but TV viewers gave it overwhelmingly to a confident, tanned Kennedy. Proved the power of visual impression in political debate.',
    legacy: 'The start of media-era political debate. Every presidential debate since has inherited the rules established here.',
    tag: 'Politics',
  },
  {
    year: '1965',
    title: 'Baldwin vs Buckley — Cambridge',
    where: 'Cambridge Union, UK',
    sides: [
      { side: 'For', who: 'James Baldwin', pos: "Defended: 'The American Dream is at the expense of the American Negro'" },
      { side: 'Against', who: 'William F. Buckley Jr.', pos: 'Denied the resolution' },
    ],
    body: 'African American author Baldwin gave a passionate account of Black historical experience, drawing a standing ovation. Conservative pundit Buckley fought back with statistics but lost on moral weight. Student vote: 540–160 for Baldwin.',
    legacy: 'A pivotal public discourse of the civil rights era. Often cited as a case study comparing moral appeal vs. statistical argument.',
    tag: 'Society',
  },
  {
    year: '1971',
    title: 'Chomsky vs Foucault',
    where: 'Dutch TV',
    sides: [
      { side: 'American intellectual', who: 'Noam Chomsky', pos: 'Human nature and justice are universal' },
      { side: 'French philosopher', who: 'Michel Foucault', pos: 'Justice is a product of social power structures' },
    ],
    body: 'About an hour of debate on human nature, justice, and political power. Chomsky emphasized universal grammar and moral instinct; Foucault countered that all concepts are constructions of power.',
    legacy: 'A defining encounter between two giants of late-20th-century thought. The prototype for universalism vs. constructivism debate.',
    tag: 'Philosophy',
  },
  {
    year: '1984',
    title: 'Reagan vs Mondale — Second Debate',
    where: 'Kansas City, USA',
    sides: [
      { side: 'Republican', who: 'Ronald Reagan', pos: 'Re-election' },
      { side: 'Democrat', who: 'Walter Mondale', pos: 'Presidential candidate' },
    ],
    body: 'Facing serious age concerns, the 73-year-old Reagan joked: "I will not make age an issue of this campaign. I am not going to exploit, for political purposes, my opponent\'s youth and inexperience." Even Mondale laughed.',
    legacy: 'A case where a single line of humor flipped an election. Showed how a moment can outweigh a message in political debate.',
    tag: 'Politics',
  },
  {
    year: '1992',
    title: 'Clinton vs Bush vs Perot — Town Hall',
    where: 'Richmond, Virginia',
    sides: [
      { side: 'Democrat', who: 'Bill Clinton', pos: 'Economic change message' },
      { side: 'Republican', who: 'George H.W. Bush', pos: 'Re-election bid' },
      { side: 'Independent', who: 'Ross Perot', pos: 'Fiscal deficit agenda' },
    ],
    body: 'Town hall format where citizens asked questions directly. Clinton stepped toward the audience and made eye contact; cameras caught Bush glancing at his watch.',
    legacy: 'Established the town-hall debate format. Demonstrated that non-verbal signals can outweigh political messages.',
    tag: 'Politics',
  },
  {
    year: '2007',
    title: 'Dawkins vs Widdecombe — Intelligence Squared',
    where: 'London, UK',
    sides: [
      { side: 'Atheism', who: 'Richard Dawkins et al.', pos: '"The Catholic Church has not been a force for good in the world"' },
      { side: 'Defense', who: 'Archbishop Onaiyekan et al.', pos: 'Rejected the resolution' },
    ],
    body: 'The Dawkins/Hitchens side cited historical wrongs of the Catholic Church (Inquisition, colonialism) with statistics. Audience moved from 47% in favor before the debate to 81% after.',
    legacy: 'A flagship example of the Intelligence Squared format, which measures opinion change via pre/post audience voting.',
    tag: 'Religion',
  },
  {
    year: '2010',
    title: 'IBM Watson vs Jennings — Jeopardy!',
    where: 'New York, USA',
    sides: [
      { side: 'AI', who: 'IBM Watson', pos: 'Quiz-show champion challenge' },
      { side: 'Human champion', who: 'Ken Jennings', pos: 'Depth of human knowledge' },
    ],
    body: 'A quiz-show showdown where an AI understood natural-language questions and answered from encyclopedic knowledge. Watson dominated two human champions. Jennings quipped at the end: "I, for one, welcome our new computer overlords."',
    legacy: 'A symbolic event announcing the AI-vs-human era. Etched the possibilities of natural-language processing into public consciousness.',
    tag: 'Technology',
  },
  {
    year: '2014',
    title: 'Nye vs Ham — Evolution vs Creation',
    where: 'Creation Museum, Kentucky',
    sides: [
      { side: 'Science', who: 'Bill Nye', pos: 'Defends evolution' },
      { side: 'Creationism', who: 'Ken Ham', pos: 'Defends young-earth (6,000 years)' },
    ],
    body: "Roughly 2.5 hours debating scientific evidence and biblical interpretation. Both sides drew strong support from their own camps, but evolution was generally seen as winning the broader viewer audience.",
    legacy: 'The first major science controversy of the social-media era. Millions of YouTube views demonstrated a new mode of science communication.',
    tag: 'Science',
  },
  {
    year: '2016',
    title: 'AlphaGo vs Lee Sedol',
    where: 'Seoul, South Korea',
    sides: [
      { side: 'AI', who: 'DeepMind AlphaGo', pos: 'Top-level Go' },
      { side: 'Human champion', who: 'Lee Sedol', pos: 'Human intuition and creativity' },
    ],
    body: 'A best-of-five Go match. AlphaGo won 4–1. Sedol\'s 78th move in Game 4 — the "God\'s Move" — was the only human win against AI. Sedol remains the last human to beat AI in Go.',
    legacy: 'Proved AI can conquer even the most intuitive of human domains. Etched the arrival of the AI era into Korean society.',
    tag: 'Technology',
  },
  {
    year: '2018',
    title: 'Peterson vs Harris — Truth and Morality',
    where: 'North American tour',
    sides: [
      { side: 'Psychologist', who: 'Jordan Peterson', pos: 'Defends the value of religious truth' },
      { side: 'Neuroscientist', who: 'Sam Harris', pos: 'Morality grounded in scientific facts' },
    ],
    body: 'Four public debates spanning over 4 hours on the definition of truth, the role of religion, and the basis of morality. Neither side yielded; the audience was equally split.',
    legacy: 'The blueprint for 21st-century public intellectual debate. Showed the potential of debate content in the YouTube/podcast era.',
    tag: 'Philosophy',
  },
  {
    year: '2019',
    title: 'AOC at the Congressional Hearing',
    where: 'US Congress',
    sides: [
      { side: 'Representative', who: 'Alexandria Ocasio-Cortez', pos: 'Exposing loopholes in ethics and campaign finance' },
      { side: 'Witnesses', who: 'Hearing witnesses', pos: 'Responses' },
    ],
    body: 'In her 5-minute slot, AOC walked through a 5-step hypothetical scenario exposing holes in campaign-finance and ethics regulation. The short, sharp Q&A went viral on social media.',
    legacy: "The influence of short congressional speech in the digital era. A new template for crafting political messages in a single 5-minute round.",
    tag: 'Politics',
  },
  {
    year: '2023',
    title: 'Munk Debate — AI Existential Risk',
    where: 'Toronto, Canada',
    sides: [
      { side: 'Warning', who: 'Max Tegmark / Yoshua Bengio', pos: 'AI is an existential risk' },
      { side: 'Optimist', who: 'Yann LeCun / Melanie Mitchell', pos: 'AI risk is overstated' },
    ],
    body: 'Four AI experts clashed on the existential risk of AI. Audience went from 67% perceiving risk before to 64% after — almost no change, showing how tight the arguments were on both sides.',
    legacy: 'A defining public text in the AI safety debate. Made clear to the general public that risk is not a settled question among experts.',
    tag: 'Technology',
  },
  {
    year: '1960~',
    title: 'Oxford Union Standard',
    where: 'Oxford, UK',
    sides: [
      { side: 'For', who: '4 speakers', pos: 'Defend the resolution' },
      { side: 'Against', who: '4 speakers', pos: 'Reject the resolution' },
    ],
    body: 'On a resolution starting with "This House Believes…", 8 speakers clash. The audience votes after the debate by walking out through one of two doors (walking vote). 200 years of history.',
    legacy: 'The world\'s most prestigious student debate club. Speakers include Churchill, Gandhi, the Dalai Lama, Zakaria, and Obama.',
    tag: 'Education',
  },
  {
    year: '1985~',
    title: 'World Universities Debating Championship (WUDC)',
    where: 'A different country each year',
    sides: [
      { side: 'Government 1·2', who: 'OG/CG', pos: 'Defend the motion' },
      { side: 'Opposition 1·2', who: 'OO/CO', pos: 'Reject the motion' },
    ],
    body: 'The world university debate championship in BP (British Parliamentary) format. ~400 teams compete each January in simultaneous 4-team rounds. Conducted in English; established the BP standard.',
    legacy: 'The Olympics of university debate. Korean universities participate regularly — the gold standard for raising English-debate talent.',
    tag: 'Education',
  },
  {
    year: '1988~',
    title: 'World Schools Debating Championship (WSDC)',
    where: 'A different country each year',
    sides: [
      { side: 'For', who: '3 speakers', pos: 'Defend the motion' },
      { side: 'Against', who: '3 speakers', pos: 'Reject the motion' },
    ],
    body: 'The world high-school debate championship. Held annually with high-schoolers from ~60 countries. Uses the World Schools format — 3v3 teams mixing prepared and impromptu motions.',
    legacy: 'The center of global youth debate culture. Korea sends a team every year; the most prestigious student event in the Commonwealth and Asia.',
    tag: 'Education',
  },
];

export function FamousDebatesView({
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
    lang === 'en' ? 'Famous Debates Archive — DebateBattle' : '명토론 아카이브 — 토론배틀',
    lang === 'en'
      ? `${DEBATES.length}+ famous debates throughout history — from Socrates and Lincoln–Douglas to AlphaGo and AI safety. (Body content in Korean.)`
      : `역사 속 ${DEBATES.length}여 건의 명토론. 소크라테스·링컨-더글라스·옥스포드 진화 토론부터 알파고·AI 안전 논쟁까지.`,
    '/famous',
  );

  const debates = lang === 'en' ? DEBATES_EN : DEBATES;

  return (
    <ContentLayout
      theme="library"
      lang={lang}
      onBackToLearn={onBackToLearn}
      onNav={onNav}
      onGoLobby={onGoLobby}
      crumbLabel={lang === 'ko' ? '명토론 아카이브' : 'Famous'}
      eyebrow={lang === 'en' ? `HISTORIC · ${DEBATES.length}+` : `HISTORIC · 명토론 ${DEBATES.length}+`}
      title={lang === 'en' ? (
        <>
          Matches worth
          <br />
          <span className="hand">remembering from history.</span>
        </>
      ) : (
        <>
          역사 속
          <br />
          <span className="hand">기억해야 할 한 판들.</span>
        </>
      )}
      subtitle={lang === 'en' ? (
        <>
          From Socrates's defense to AlphaGo vs. Lee Sedol to the recent AI safety debate —
          <b> {DEBATES.length}</b> pivotal moments in debate history. Both sides, the key
          scenes, and the legacy each left behind. (Body content currently in Korean.)
        </>
      ) : (
        <>
          소크라테스의 변론부터 알파고-이세돌, 최근 AI 안전 논쟁까지 — 토론
          역사의 결정적 장면 <b>{DEBATES.length}건</b>을 모았습니다. 양측의
          입장, 핵심 장면, 그리고 후대에 남긴 의의까지.
        </>
      )}
      hint={lang === 'en' ? '📜 Trace the evolution of debate in chronological order' : '📜 시간 순으로 따라가며 토론의 진화를 한눈에'}
    >
      <div className="famous-timeline">
        {debates.map((d) => (
          <article key={d.title} className="famous-card">
            <div className="famous-card__year">{d.year}</div>
            <div className="famous-card__body">
              <div className="famous-card__head">
                <h3 className="famous-card__title">{d.title}</h3>
                <span className="famous-card__tag">{d.tag}</span>
              </div>
              <div className="famous-card__where">📍 {d.where}</div>

              <div className="famous-card__sides">
                {d.sides.map((s, i) => (
                  <div
                    key={i}
                    className={`famous-card__side famous-card__side--${i === 0 ? 'pro' : i === 1 ? 'con' : 'neutral'}`}
                  >
                    <div className="famous-card__side-tag">{s.side}</div>
                    <div className="famous-card__side-who">{s.who}</div>
                    <div className="famous-card__side-pos">{s.pos}</div>
                  </div>
                ))}
              </div>

              <p className="famous-card__desc">{d.body}</p>
              <p className="famous-card__legacy">
                <b>{lang === 'en' ? 'Legacy · ' : '의의 · '}</b>
                {d.legacy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </ContentLayout>
  );
}
