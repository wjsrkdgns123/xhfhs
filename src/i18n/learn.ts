/** Learn page strings — TOC, chapter labels, hub cards. Article body text
 *  itself is intentionally not translated yet (long-form content rewrite). */
export const learnStrings = {
  ko: {
    pageTitle: '자료실',
    pageSub: '실전 적용 가능한 토론 원칙·도구·평가기준',
    eyebrow: '자료실 · LIBRARY',
    backToLobby: '← 로비로',
    modes: {
      basics: '기본기 갖추기',
      basicsSub: '5 챕터 · 실전',
      more: '더 배우기',
      moreSub: '7 영역 · 학술',
    },
    toc: {
      header: '5 챕터',
      categories: {
        기초: '기초',
        심화: '심화',
        참고: '참고',
      },
      readMinutes: (n: string) => `${n}`,
    },
    hub: {
      readMore: '펼쳐보기 →',
      count: (s: string) => s,
    },
    ctaApply: {
      eyebrow: '바로 적용하기',
      title: '방금 읽은 5원칙을, 실제 토론에서 적용해 보자.',
      btn: '🔥 연습 토론 시작',
    },
    timeline: {
      caption: '입론에서 판정까지 — 토론 한 판의 5단계 흐름',
      steps: [
        { label: '입론', sub: '주장 세우기' },
        { label: '반론', sub: '근거로 반박' },
        { label: '교차질의', sub: '서로 묻고 답하기' },
        { label: '최종변론', sub: '입장 정리' },
      ],
      verdictStep: 'STEP 05',
      verdictLabel: '판정',
      verdictSub: '투표 50% + AI 50%',
    },
  },
  en: {
    pageTitle: 'Library',
    pageSub: 'Principles, tools, and evaluation rubric — ready to use',
    eyebrow: 'LIBRARY · 자료실',
    backToLobby: '← Lobby',
    modes: {
      basics: 'Fundamentals',
      basicsSub: '5 chapters · practical',
      more: 'Go deeper',
      moreSub: '7 sections · academic',
    },
    toc: {
      header: '5 chapters',
      categories: {
        기초: 'Basics',
        심화: 'Advanced',
        참고: 'Reference',
      },
      readMinutes: (n: string) => n,
    },
    hub: {
      readMore: 'Read more →',
      count: (s: string) => s,
    },
    ctaApply: {
      eyebrow: 'Apply it now',
      title: 'Take the 5 principles you just read into a live debate.',
      btn: '🔥 Start practice debate',
    },
    timeline: {
      caption: 'From opening to verdict — the 5-stage flow of a single debate',
      steps: [
        { label: 'Opening', sub: 'Build your case' },
        { label: 'Rebuttal', sub: 'Counter with evidence' },
        { label: 'Cross-exam', sub: 'Q&A together' },
        { label: 'Closing', sub: 'Summarize your side' },
      ],
      verdictStep: 'STEP 05',
      verdictLabel: 'Verdict',
      verdictSub: 'Vote 50% + AI 50%',
    },
  },
} as const;
