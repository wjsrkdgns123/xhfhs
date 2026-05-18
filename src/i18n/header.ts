/** Header nav + footer strings. */
export const headerStrings = {
  ko: {
    nav: {
      intro: '소개',
      lobby: '토론장',
      learn: '자료실',
      profile: '내 기록',
    },
    header: {
      brand: '토론',
      brandSub: '배틀',
      createRoom: '방 만들기',
    },
    footer: {
      about: '소개',
      contact: '문의',
      privacy: '개인정보처리방침',
      terms: '이용약관',
      tag: '찬반 1:1 실시간 토론 · AI 사회자가 진행',
      poweredBy: 'Powered by Claude AI',
      copyright: (year: number) => `© ${year} 토론배틀`,
    },
    floating: {
      goLobby: '토론하기',
      openCreate: '방 만들기',
    },
  },
  en: {
    nav: {
      intro: 'Intro',
      lobby: 'Stadium',
      learn: 'Library',
      profile: 'My record',
    },
    header: {
      brand: 'Debate',
      brandSub: 'Battle',
      createRoom: 'Create room',
    },
    footer: {
      about: 'About',
      contact: 'Contact',
      privacy: 'Privacy',
      terms: 'Terms',
      tag: 'Live 1v1 debate · moderated by AI',
      poweredBy: 'Powered by Claude AI',
      copyright: (year: number) => `© ${year} DebateBattle`,
    },
    floating: {
      goLobby: 'Debate now',
      openCreate: 'Create room',
    },
  },
} as const;
