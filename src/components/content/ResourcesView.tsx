import '../../landing.css';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { ContentLayout } from './ContentLayout';

interface Resource {
  cat: string;
  region: 'KR' | 'WORLD' | 'BOOK' | 'ONLINE';
  name: string;
  desc: string;
  link?: string;
}

const RESOURCES: Resource[] = [
  // 국내 대회
  {
    cat: '대회',
    region: 'KR',
    name: '대한토론협회 (KDA)',
    desc: '국내 대학·고교 토론 대회를 주관. 정책토론(Policy)과 의회식 토론(Parliamentary) 양식 모두 운영하며, 매년 전국 대회를 개최합니다.',
  },
  {
    cat: '대회',
    region: 'KR',
    name: '청소년 토론대회 (KIDA)',
    desc: '중·고교생 대상 한국어 토론 대회. 사회 이슈 중심으로 운영되며 입문자에게 가장 좋은 진입로. 한국어로 진행되어 영어 부담 없이 시작할 수 있습니다.',
  },
  {
    cat: '대회',
    region: 'KR',
    name: 'EBS 학생 토론 배틀',
    desc: '방송 토론 형식. 전국 고교생이 팀으로 참가, 시사 주제를 다룹니다. 미디어 노출이 많아 실제 청중 앞에서의 토론 경험을 쌓을 수 있습니다.',
  },
  // 세계 대회
  {
    cat: '대회',
    region: 'WORLD',
    name: 'WSDC (World Schools Debating Championship)',
    desc: '세계학생토론대회. 매년 60여 개국 고교생이 참가하며 영연방·아시아권에서 가장 권위 있는 학생 대회. 한국 대표팀도 매년 출전.',
  },
  {
    cat: '대회',
    region: 'WORLD',
    name: 'WUDC (World Universities Debating Championship)',
    desc: '세계대학토론대회. BP(British Parliamentary) 양식으로 4팀이 동시 토론. 매년 1월 약 400팀 참가. 영어 토론의 올림픽.',
  },
  {
    cat: '대회',
    region: 'WORLD',
    name: 'Oxford Union / Cambridge Union',
    desc: '200년 이상 역사를 가진 영국 대학 토론 클럽. 처칠·간디·달라이라마·오바마 등이 거쳐 갔습니다. "This House Believes…" 양식.',
  },
  {
    cat: '대회',
    region: 'WORLD',
    name: 'NSDA (National Speech & Debate Association)',
    desc: '미국 고교 토론 협회. LD, PF, Policy 등 다양한 양식을 표준화·운영. 매년 미국 전역 약 14만 명이 참가합니다.',
  },

  // 추천 도서
  {
    cat: '도서',
    region: 'BOOK',
    name: '"논증의 탄생" — 조셉 윌리엄스',
    desc: '주장–근거 구조를 처음 배우기에 가장 표준적인 책. 토론·글쓰기 공통 입문서. 한국어 번역본 있음.',
  },
  {
    cat: '도서',
    region: 'BOOK',
    name: '"Thinking, Fast and Slow" — 대니얼 카너먼',
    desc: '인지 편향과 판단 오류를 다룬 노벨상 수상자의 대표작. 논리 오류 챕터의 배경 이론을 깊게 보고 싶을 때.',
  },
  {
    cat: '도서',
    region: 'BOOK',
    name: '"Rhetoric" — 아리스토텔레스',
    desc: '토론·수사학의 고전. 에토스/파토스/로고스 3요소 개념의 원전. 짧은 분량으로 토론의 본질을 다룹니다.',
  },
  {
    cat: '도서',
    region: 'BOOK',
    name: '"Asking the Right Questions" — Browne & Keeley',
    desc: '비판적 사고 입문서. "이 주장의 가정은 무엇인가?", "근거는 충분한가?" 같은 질문을 체계적으로 배웁니다.',
  },
  {
    cat: '도서',
    region: 'BOOK',
    name: '"Debating: A Brief Introduction" — Patrick Stewart',
    desc: '영어 토론 입문서. 형식별 차이와 평가 기준을 짧게 정리. WSDC·WUDC 준비자가 자주 보는 책.',
  },

  // 온라인 자원
  {
    cat: '온라인',
    region: 'ONLINE',
    name: 'Intelligence Squared (IQ²) 유튜브',
    desc: '청중 사전·사후 투표 방식의 공개 토론 시리즈. 전문가들의 토론 실전을 1시간 분량 영상으로 시청 가능. 영어.',
  },
  {
    cat: '온라인',
    region: 'ONLINE',
    name: 'Munk Debates',
    desc: '캐나다 토론트 기반 공개 토론 시리즈. 시대적 이슈(AI 위험, 자본주의 등)를 4인이 격돌. 한국어 자막 일부 있음.',
  },
  {
    cat: '온라인',
    region: 'ONLINE',
    name: 'IDEA (International Debate Education Association)',
    desc: '국제 토론 교육 비영리. 주제별 핵심 논거, 양식별 가이드, 무료 자료 제공.',
  },
  {
    cat: '온라인',
    region: 'ONLINE',
    name: 'ProCon.org',
    desc: '논쟁적 주제 100+의 양측 논거를 중립적으로 정리. 토론 준비 시 출발점으로 자주 쓰입니다.',
  },
];

const REGION_LABEL: Record<Resource['region'], string> = {
  KR: '국내',
  WORLD: '세계',
  BOOK: '도서',
  ONLINE: '온라인',
};

export function ResourcesView() {
  useDocumentMeta(
    '토론 자원 모음 — 토론배틀',
    `국내·세계 토론 대회, 추천 도서, 온라인 자원 ${RESOURCES.length}개. 학교 토론에서 한 단계 더 나아가고 싶다면.`,
  );

  const grouped: Record<Resource['region'], Resource[]> = {
    KR: [],
    WORLD: [],
    BOOK: [],
    ONLINE: [],
  };
  RESOURCES.forEach((r) => grouped[r.region].push(r));

  return (
    <ContentLayout
      theme="chronicle"
      eyebrow={`RESOURCES · 자원 ${RESOURCES.length}+`}
      title={
        <>
          더 깊이 가고
          <br />
          <span className="hand">싶다면, 바깥으로.</span>
        </>
      }
      subtitle={
        <>
          토론배틀에서 기본기를 쌓았다면 다음 단계 — 실제 대회·도서·온라인
          자원으로. 국내 대회 <b>3개</b>, 세계 대회 <b>4개</b>, 추천 도서{' '}
          <b>5권</b>, 온라인 자원 <b>4개</b>를 정리했습니다.
        </>
      }
      hint="📚 학교 너머의 토론 세계 — 첫걸음으로 좋은 곳들"
    >
      {(['KR', 'WORLD', 'BOOK', 'ONLINE'] as Resource['region'][]).map((region) => (
        <section key={region} className="resources-section">
          <h2 className="resources-section__head">
            <span className="resources-section__num">
              {String(grouped[region].length).padStart(2, '0')}
            </span>
            <span className="resources-section__label">{REGION_LABEL[region]}</span>
          </h2>
          <div className="resources-grid">
            {grouped[region].map((r) => (
              <article key={r.name} className="resource-card">
                <div className="resource-card__cat">{r.cat}</div>
                <h3 className="resource-card__name">{r.name}</h3>
                <p className="resource-card__desc">{r.desc}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </ContentLayout>
  );
}
