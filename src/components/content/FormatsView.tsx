import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';

interface Format {
  name: string;
  en: string;
  origin: string;
  sub: string;
  desc: string;
  topics: string;
  stats: { persons: string; time: string; focus: string };
  used: string;
}

const FORMATS: Format[] = [
  {
    name: 'Lincoln–Douglas',
    en: 'LD',
    origin: '미국 (1980년대 정착)',
    sub: '1:1 · 약 45분 · 가치 토론',
    desc: '에이브러햄 링컨과 스티븐 더글러스의 1858년 토론에서 이름을 따왔습니다. 미국 고등학교 토론의 대표 양식으로, 도덕·윤리·정치 철학 같은 추상적 가치를 다룹니다. 한 명씩 1:1로 맞붙으며, 명확한 발언 단계와 짧은 교차 질문이 핵심.',
    topics:
      '"정의는 자유보다 우선되어야 한다", "다수의 의지가 소수의 권리보다 우선되어야 한다" 같은 명제',
    stats: { persons: '1 : 1', time: '45 MIN', focus: 'VALUE' },
    used: '미국 고교 토론 대회(NSDA), 일부 대학 윤리 수업',
  },
  {
    name: 'Public Forum',
    en: 'PF',
    origin: '미국 (2002 NSDA 도입)',
    sub: '2:2 · 약 35분 · 대중적 정책',
    desc: '일반 청중이 이해할 수 있는 시사 정책 중심. "보통 시민이 심사위원이어도 따라갈 수 있는 토론"을 목표로 만들어졌습니다. 짧은 발언 시간 + 빠른 교차 질문 + 활발한 클래시가 특징.',
    topics:
      '"한국은 청소년 SNS 사용을 법으로 제한해야 한다", "탄소세 도입은 효과가 있다"',
    stats: { persons: '2 : 2', time: '35 MIN', focus: 'POLICY' },
    used: '미국 고교 NSDA 메인 양식, 한국 일부 영어 토론 동아리',
  },
  {
    name: 'Policy Debate',
    en: 'CX',
    origin: '미국 (20세기 초)',
    sub: '2:2 · 약 90분 · 깊이 · 자료',
    desc: '특정 정부 정책 변경(plan)을 두고 깊이 있게 분석합니다. 방대한 자료(evidence)와 빠른 발화 속도(spreading)가 특징. 대학·대학원 수준 토론에서 흔하며, 카운터플랜·크리틱(K) 등 고급 전략이 발달했습니다.',
    topics:
      '시즌마다 정해진 단일 명제 (예: "미국 연방정부는 우주 탐사 정책을 변경해야 한다")',
    stats: { persons: '2 : 2', time: '90 MIN', focus: 'DEPTH' },
    used: '미국 대학(NDT, CEDA), 한국에서는 드묾',
  },
  {
    name: 'Parliamentary',
    en: 'BP/WS',
    origin: '영국 (의회식 차용)',
    sub: '2:2 또는 4팀 · 약 60분 · 즉흥',
    desc: '주제(motion)가 토론 직전(보통 15분 전)에 공개되어 즉흥 대응이 핵심. 영국 의회 토론 절차를 차용했습니다. BP(British Parliamentary)는 4팀이 동시 토론, WS(World Schools)는 3:3 팀 토론.',
    topics:
      '"This House Believes…"로 시작 (예: "This House Would ban first-class travel for politicians")',
    stats: { persons: '2 : 2 ~ 8명', time: '60 MIN', focus: 'IMPROV' },
    used: 'WUDC(세계대학대회), WSDC(세계학생대회), 옥스포드 유니언',
  },
  {
    name: 'Karl Popper',
    en: 'KP',
    origin: '동유럽 (Open Society 재단)',
    sub: '3:3 · 약 60분 · 가치+정책',
    desc: '체코·폴란드 등에서 발전한 학생 토론 양식. 가치 명제와 정책 명제를 모두 다루며, 입론·교차질문·반박이 명확히 구분됩니다. 동유럽·아시아 학생 대회에서 자주 쓰입니다.',
    topics: '가치+정책 혼합 명제 (예: "교육은 시장이 아니라 국가가 책임져야 한다")',
    stats: { persons: '3 : 3', time: '60 MIN', focus: 'MIXED' },
    used: '체코·슬로바키아·폴란드 학생 토론, IDEA 후원 국제 대회',
  },
  {
    name: '한국 교육식',
    en: 'KR-EDU',
    origin: '한국 (학교·교과서)',
    sub: '2:2 · 약 30분 · 입문',
    desc: '한국 중·고교에서 자주 사용되는 단순화된 양식. 입론 → 반론 → 재반론 → 마무리의 순서로, 각 발언 시간이 짧고 룰이 직관적이라 초심자가 시작하기 좋습니다.',
    topics: '교과서 토론 주제 (예: "교내 휴대전화 사용을 금지해야 한다")',
    stats: { persons: '2 : 2', time: '30 MIN', focus: 'BEGINNER' },
    used: '국내 대부분 학교 수업·동아리',
  },
  {
    name: '토론배틀',
    en: 'DB',
    origin: '본 서비스',
    sub: '1:1 · 약 15분 · AI 사회자',
    desc: '본 서비스가 사용하는 양식. 1:1 단순 라운드로, AI 사회자가 진행하고 청중 투표 + AI 정성 평가로 승부를 결정합니다. 입론·반박 한 라운드씩으로 단순화해 초심자도 바로 시작 가능.',
    topics: '자유 주제 (찬반이 명확한 명제 권장)',
    stats: { persons: '1 : 1', time: '15 MIN', focus: 'SIMPLE' },
    used: '본 서비스 (토론배틀)',
  },
];

const FORMATS_EN: Format[] = [
  {
    name: 'Lincoln–Douglas',
    en: 'LD',
    origin: 'USA (established 1980s)',
    sub: '1:1 · ~45 min · value debate',
    desc: 'Named after the 1858 Lincoln–Douglas debates. The leading high-school debate format in the US, focused on abstract values like morality, ethics, and political philosophy. Two debaters face off 1v1 with structured speech phases and short cross-examinations.',
    topics: 'e.g. "Justice should take precedence over freedom", "Majority will should take precedence over minority rights"',
    stats: { persons: '1 : 1', time: '45 MIN', focus: 'VALUE' },
    used: 'US high-school tournaments (NSDA), some university ethics classes',
  },
  {
    name: 'Public Forum',
    en: 'PF',
    origin: 'USA (introduced by NSDA in 2002)',
    sub: '2:2 · ~35 min · public policy',
    desc: 'Centered on current-affairs policy that ordinary audiences can follow — designed so "a typical citizen could judge it". Short speeches, fast cross-examinations, and active clash define it.',
    topics: 'e.g. "Korea should restrict adolescent SNS use by law", "Carbon taxes are effective"',
    stats: { persons: '2 : 2', time: '35 MIN', focus: 'POLICY' },
    used: 'NSDA main format in the US; some Korean English-debate clubs',
  },
  {
    name: 'Policy Debate',
    en: 'CX',
    origin: 'USA (early 20th century)',
    sub: '2:2 · ~90 min · depth · evidence',
    desc: 'Deep analysis of a specific government policy change ("plan"). Characterized by extensive evidence and fast speech ("spreading"). Common at college level, with advanced strategies like counterplans and critiques (K).',
    topics: 'one resolution per season (e.g. "The US federal government should change its space exploration policy")',
    stats: { persons: '2 : 2', time: '90 MIN', focus: 'DEPTH' },
    used: 'US college (NDT, CEDA); rare in Korea',
  },
  {
    name: 'Parliamentary',
    en: 'BP/WS',
    origin: 'UK (parliamentary procedure)',
    sub: '2:2 or 4 teams · ~60 min · impromptu',
    desc: 'The motion is announced just before the debate (typically 15 min prior), making impromptu response essential. Borrowed from UK parliamentary procedure. BP (British Parliamentary) runs 4 teams simultaneously; WS (World Schools) is 3v3.',
    topics: 'Starts with "This House Believes…" (e.g. "This House Would ban first-class travel for politicians")',
    stats: { persons: '2 : 2 ~ 8 ppl', time: '60 MIN', focus: 'IMPROV' },
    used: 'WUDC (world universities), WSDC (world schools), Oxford Union',
  },
  {
    name: 'Karl Popper',
    en: 'KP',
    origin: 'Eastern Europe (Open Society Foundation)',
    sub: '3:3 · ~60 min · value+policy',
    desc: 'A student debate format developed in the Czech Republic, Poland, and elsewhere. Covers both value and policy resolutions; constructives, cross-examinations, and rebuttals are clearly separated. Common in Eastern European and Asian student tournaments.',
    topics: 'Mixed value/policy resolutions (e.g. "Education should be the state\'s responsibility, not the market\'s")',
    stats: { persons: '3 : 3', time: '60 MIN', focus: 'MIXED' },
    used: 'Czech / Slovak / Polish student debate; IDEA-sponsored international tournaments',
  },
  {
    name: 'Korean Educational',
    en: 'KR-EDU',
    origin: 'Korea (schools and textbooks)',
    sub: '2:2 · ~30 min · introductory',
    desc: 'A simplified format commonly used in Korean middle and high schools. Constructive → rebuttal → counter-rebuttal → closing, with short speech times and intuitive rules — great for beginners.',
    topics: 'Textbook prompts (e.g. "Mobile phone use should be banned in schools")',
    stats: { persons: '2 : 2', time: '30 MIN', focus: 'BEGINNER' },
    used: 'Most Korean school classes and clubs',
  },
  {
    name: 'DebateBattle',
    en: 'DB',
    origin: 'This service',
    sub: '1:1 · ~15 min · AI moderator',
    desc: 'The format this service uses. A simple 1v1 round moderated by AI, decided by audience voting + AI qualitative evaluation. Simplified to one constructive and one rebuttal per side so beginners can start instantly.',
    topics: 'Free choice (resolutions with clear pro/con sides recommended)',
    stats: { persons: '1 : 1', time: '15 MIN', focus: 'SIMPLE' },
    used: 'This service (DebateBattle)',
  },
];

export function FormatsView({
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
    lang === 'en' ? 'Debate Formats Guide — DebateBattle' : '토론 형식 도감 — 토론배틀',
    lang === 'en'
      ? `${FORMATS.length} major debate formats worldwide — Lincoln–Douglas, Public Forum, Policy, Parliamentary, Karl Popper, Korean Education and more. (Body content in Korean.)`
      : `세계 주요 토론 양식 ${FORMATS.length}종 — 링컨-더글라스, Public Forum, Policy, Parliamentary, Karl Popper, 한국 교육식까지. 각 양식의 규칙·평가 기준·자주 다루는 주제 정리.`,
    '/formats',
  );

  return (
    <ContentLayout
      theme="library"
      lang={lang}
      onBackToLearn={onBackToLearn}
      onNav={onNav}
      onGoLobby={onGoLobby}
      crumbLabel={lang === 'ko' ? '토론 형식 도감' : 'Formats'}
      eyebrow={lang === 'en' ? `FORMATS · ${FORMATS.length}+` : `FORMATS · 토론 형식 ${FORMATS.length}+`}
      title={lang === 'en' ? (
        <>
          The world's
          <br />
          <span className="hand">debate formats.</span>
        </>
      ) : (
        <>
          세계의
          <br />
          <span className="hand">토론 양식들.</span>
        </>
      )}
      subtitle={lang === 'en' ? (
        <>
          DebateBattle uses simple 1v1 rounds, but the world has many longer, more structured
          formats. Compare <b>{FORMATS.length} formats</b> side by side — speakers, time, judging
          focus. Essential reading if you're preparing for tournaments or college applications.
          (Body content currently in Korean.)
        </>
      ) : (
        <>
          토론배틀은 1:1 단순 라운드를 쓰지만, 세계엔 더 길고 복잡한 정식 포맷이
          많습니다. <b>{FORMATS.length}개 양식</b>의 인원·시간·평가 초점을
          한눈에 비교하세요. 대회 참가나 진학을 준비한다면 꼭 알아둘 자료.
        </>
      )}
      hint={lang === 'en' ? '🎓 Different schools, different formats — start with the key differences' : '🎓 학교·대회마다 다른 양식, 핵심 차이부터 정리'}
    >
      <div className="formats-list">
        {(lang === 'en' ? FORMATS_EN : FORMATS).map((f) => (
          <article key={f.name} className="format-card">
            <div className="format-card__head">
              <div>
                <h3 className="format-card__name">
                  {f.name} <span className="format-card__en">({f.en})</span>
                </h3>
                <div className="format-card__sub">{f.sub}</div>
              </div>
              <div className="format-card__origin">{f.origin}</div>
            </div>
            <p className="format-card__desc">{f.desc}</p>
            <div className="format-card__topics">
              <span className="format-card__lbl">{lang === 'en' ? 'Common topics' : '자주 다루는 주제'}</span>
              <span>{f.topics}</span>
            </div>
            <div className="format-card__stats">
              <div className="format-card__stat">
                <div className="format-card__stat-k">PERSONS</div>
                <div className="format-card__stat-v">{f.stats.persons}</div>
              </div>
              <div className="format-card__stat">
                <div className="format-card__stat-k">TIME</div>
                <div className="format-card__stat-v">{f.stats.time}</div>
              </div>
              <div className="format-card__stat">
                <div className="format-card__stat-k">FOCUS</div>
                <div className="format-card__stat-v">{f.stats.focus}</div>
              </div>
            </div>
            <div className="format-card__used">
              <span className="format-card__lbl">{lang === 'en' ? 'Mostly used in' : '주로 쓰이는 곳'}</span>
              <span>{f.used}</span>
            </div>
          </article>
        ))}
      </div>
    </ContentLayout>
  );
}
