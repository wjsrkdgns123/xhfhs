# OVERNIGHT-RESULT.md — auto/polish-sweep 브랜치 작업 결과

> 생성일: 2026-06-06 | 브랜치: auto/polish-sweep | 베이스: 094df1e

---

## (1) 요약

DESIGN-SYSTEM.md §4의 "현재↔폐기" 대조표를 기준으로 총 28개 커밋을 통해 다음을 완료했습니다.

- **T01~T11**: 폐기 어휘(점선 dashed·일반카드 먹색 하드오프셋·raw hex·rgba) 제거, 접근성(role=log aria-live, VoteBar ARIA, aria-label), 디자인 토큰 보강(dusk/dawn -dim/-tint/-ghost 5토큰)
- **T12~T16**: ARIA 접근성 완성(발언 textarea·검색 input), VoteBar lang prop, ObjectionOverlay 색 토큰화, 히어로 다크패널 저대비 개선, useLocale onboarding 배선
- **T17·T19·T20**: 콘텐츠 개수 정합화(Fallacies 56·Glossary 75·Topics 79), sitemap.xml /learn 추가, parseTopics 메타 필터 강화
- **E1~E5**: /learn 직접접속 soft-404 수정, useDocumentMeta canonical/OG 동적 갱신, 토론방 i18n(StatusBadge·PHASE_LABEL·ChatPanel), App.tsx toast·confirm·오버레이 i18n 전면 배선, 데드 레거시 CSS 3파일 삭제(1508 LOC 감소)
- **D1~D4**: landing.css·learn.css·learn-hub.css·ProfileViewV2·OnboardingView 일반 카드 정본화(soft shadow·헤어라인·둥근모서리). learn-mode__tab 정본 표본 보존. OnboardingView 입장선택 진영색 하드오프셋+한자 워터마크 적용.

---

## (2) 커밋 표

| ID | 제목 | 해시 | QA 판정 |
|----|------|------|---------|
| T01 | AIModCard 3변형 폐기 어휘 제거 | 5650981 | pass |
| T02 | 메가메뉴 드롭다운 먹색 하드오프셋 제거 | efced2c | pass |
| T03 | 로비 빈슬롯/폴백 점선→헤어라인 | f3cacbf | pass |
| T04 | 방 빈좌석/오픈노트 점선→솔리드 | 6650e46 | pass |
| T05 | 판정 군중카드 점선→솔리드 + gold rgba 토큰화 | 700126b | pass |
| T06 | 로비 카드/ENDED칩 라이트 하드코딩→토큰 | c83a6d8 | pass |
| T07 | 스티키 검색/필터 바 라이트 rgba→토큰 | 0eca2b8 | pass |
| T08 | LobbyRoomCard 플래그칩 배경 hex→vermillion-tint | 2cc3eca | pass |
| T09 | .input/.segment__btn 배경 #fff→var(--paper-light) | 2f7efc9 | pass |
| T10 | dusk/dawn -dim/-tint/-ghost 5토큰 명시 정의 | 084929e | pass |
| T11 | 발언석 role=log+aria-live, 중첩 live region 해소 | 7812597 | pass |
| T12 | 발언 textarea·로비 검색 input aria-label | 91ef2c1 | pass (minor: PHASE_LABEL EN 표시는 E3에서 수정됨) |
| T13 | VoteBar ARIA + lang prop | 0ea5bc7 | revise→E3 후 resolved (Labels KO고정 minor 잔존) |
| T14 | ObjectionOverlay raw hex→토큰 | 8ec84f2 | pass |
| T15 | 히어로 다크패널 저대비 텍스트 불투명도 | d0981b8 | pass |
| T16 | useLocale 합성 t에 onboarding 배선 | ada5f1d | pass |
| T17 | 콘텐츠 개수 표기 정합화 (56/75/79) | c8fcf5d | revise (AGENTS.md·content-writer.md·LearnView.tsx 동기화 미완) |
| T19 | sitemap.xml /learn 추가 | edff448 | pass |
| T20 | parseTopics 메타 필터 강화 | 8b5091d | pass |
| E1 | /learn 직접접속 soft-404 수정 | 1b50efe | pass |
| E2/T18 | useDocumentMeta canonical/OG/Twitter 동적 갱신 | 05e7f42 | pass (LegalPages/NotFoundView canonicalPath 미전달 minor) |
| E3 | StatusBadge·PHASE_LABEL·ChatPanel i18n 배선 | bfc604f | pass |
| E4 | App.tsx toast·confirm·오버레이·ProfileView i18n 전면 배선 | d6a4130 | pass |
| E5 | 데드 레거시 CSS 3파일 삭제 | 691a2cb | pass |
| D1 | landing.css 일반 카드 정본화 | 62ff397 | pass |
| D2 | learn.css/learn-hub.css 일반 카드 정본화 | 865cffd | pass |
| D3 | ProfileViewV2 폐기 어휘 제거 | 9f24059 | pass |
| D4 | OnboardingView 폐기 어휘+입장선택 진영색 | b331ace | pass |

---

## (3) 미해결 / 운영자 확인 필요

### E1 클릭 검증 (브라우저 직접 확인 필요)
- `ddatebattle.site/learn` 직접 주소창 입력 → 자료실 화면 표시 여부
- 자료실에서 뒤로가기(브라우저 Back) → URL `/` 복원 여부
- `public/_redirects`에 `/learn` → `index.html` 규칙이 없으면 Cloudflare Pages 서버사이드 404 발생 가능 — 확인 필요

### E2 메타 시각 확인 (브라우저 DevTools)
- /learn·/topics·/fallacies 이동 시 `link[rel=canonical].href`, `og:url` content 값이 해당 경로 URL로 바뀌는지 DevTools Elements에서 확인
- LegalPages 4개(/privacy·/terms·/about·/contact)와 NotFoundView는 canonicalPath 미전달 → canonical이 루트(/)로 세팅됨. 다음 세션 수정 필요

### T17 동기화 미완 (다음 세션 수정 권장)
- `AGENTS.md` 사이트맵 행: /topics(80+)·/fallacies(54)·/glossary(80+) → 79/56/75로 수정 필요
- `.claude/agents/content-writer.md` 13-14행 수치 구버전 → 56/75로 수정 필요
- `src/components/LearnView.tsx` 1066행 EN 문자열 'full 80+ glossary' → 'full 75-term glossary' 수정 필요

### T13 VoteBar Labels KO 고정 (minor, 다음 세션)
- VoteBar의 `<Labels />` 컴포넌트가 lang='en'에서도 한국어 레이블 출력
- `aria-hidden` 미부착으로 tug variant와 처리 방식 불일치
- 수정: Labels 컴포넌트에 lang prop 추가 + `aria-hidden="true"` 부착

### 시각 사인오프 (모든 항목)
- 4테마(paper/dusk/dawn/ink) × 라이트/다크에서 로비, 토론방, 자료실, 온보딩, 프로필 레이아웃 육안 확인
- 토론방에서 이의있음! 오버레이(ObjectionOverlay) 찬성/반대 진영색 확인
- EN 언어 전환 후 overlay 라벨(Objection!/Verdict!/Speak!) 표시 확인
- 온보딩 step2 입장선택 진영색 하드오프셋+한자 워터마크 육안 확인

---

## (4) git log --oneline 094df1e..HEAD

```
b331ace D4: OnboardingView 폐기 어휘+입장선택 진영색
9f24059 D3: ProfileViewV2 폐기 어휘 제거
865cffd D2: learn.css/learn-hub.css 일반 카드 정본화
62ff397 D1: landing.css 일반 카드 정본화
691a2cb chore(css): 데드 레거시 로비 CSS 3파일 삭제
d6a4130 feat(i18n/E4): App.tsx toast·confirm·label + ObjectionOverlay 라벨 i18n 배선
bfc604f feat(i18n/room): StatusBadge lang prop + ChatPanel KO→i18n + PHASE_LABEL→tRoom.phases
05e7f42 feat(seo): useDocumentMeta canonicalPath 추가 (T18)
1b50efe fix(routing): /learn 직접접속 soft-404 수정 (E1)
8b5091d feat(prompts): parseTopics 메타 필터 강화 (T20)
edff448 feat(seo): sitemap.xml에 /learn 항목 추가 (T19)
c8fcf5d fix(i18n): 콘텐츠 개수 표기 실측값으로 정합화 (T17)
ada5f1d feat(i18n): onboarding 문자열을 useLocale 합성 t에 배선 (T16)
d0981b8 fix(lobby): 히어로 다크패널 저대비 텍스트 불투명도 개선 (T15)
8ec84f2 refactor(T14): ObjectionOverlay raw hex → CSS 토큰 치환
0ea5bc7 a11y(T13): VoteBar ARIA + lang prop
91ef2c1 a11y(T12): 발언 textarea·로비 검색 input aria-label
7812597 a11y(room): T11 — 발언석 role=log+aria-live
084929e design(tokens): T10 — dusk/dawn 5토큰 명시 정의
2f7efc9 fix(T09): .input/.segment__btn 배경 #fff→var(--paper-light)
2cc3eca T08: LobbyRoomCard 플래그칩 배경 hex→vermillion-tint
0eca2b8 T07: 스티키 검색/필터 바 rgba→토큰
c83a6d8 T06: 로비 카드/ENDED칩 하드코딩→토큰
700126b T05: 판정 군중카드 점선→솔리드 + gold rgba 토큰화
6650e46 T04: 방 빈좌석/오픈노트 점선→솔리드
f3cacbf T03: 로비 빈슬롯/폴백 점선→헤어라인
efced2c T02: 메가메뉴 드롭다운 먹색 하드오프셋 제거
5650981 T01: AIModCard 3변형 폐기 어휘 제거
```

---

## (5) 최종 npm run build 결과

```
✓ built in 2.86s
(!) 일부 청크(index-DeK8FdJS.js, 876 kB)가 500 kB 초과 — 기존 사전 경고, 이번 작업 신규 아님
exit 0 (에러 없음)
```

---

## (6) 변경 파일 폐기 패턴 잔존 grep

| 패턴 | 잔존 건수 | 위치 |
|------|-----------|------|
| `border.*dashed` (일반 카드) | **1건** | `src/App.tsx:1782` — 방 만들기 폼 구분선 `borderTop: '1.5px dashed var(--color-ink-fade)'` |
| `0 var(--ink)` 먹색 하드오프셋 | 2건 | `src/learn-hub.css:268,296` — `.learn-mode__tab` hover/active 잉크 깊이. ★보존 대상(DESIGN-SYSTEM §3 정본 표본) |
| raw hex `#[0-9a-fA-F]{6}` (src/components) | ~30건 | `CharacterAvatar.tsx`(SVG fill fallback), `DebateSeal.tsx`(금속 질감 도장 전용), `LandingView.tsx`(히어로 ghost 버튼) — 일반 카드 밖 의도적 장식·SVG fallback으로 본 sweep 범위 외 |
| raw hex (src/App.tsx) | ~15건 | `.lb2-hero` 블록 — 항상-어두운 딥그린 패널 고정 색상(T15에서 근거 확인됨). 토큰 자동반전 시 가독성 깨지는 예외 구간 |

> 요약: 일반 카드 폐기 패턴 실질 잔존 = **1건** (App.tsx 방 만들기 폼 dashed 구분선). learn-hub.css 2건은 정본 표본이라 보존. 나머지는 SVG fallback/도장 장식/히어로 패널 예외 구간.

---

## (7) 다음 단계

**운영자 몫 (코드 없음):**
- P0 락버그(C2 막판 표 유실·H3 동시성) — 운영자 결정 필요
- 콘텐츠 사실검증 (Topics 79개·Fallacies 56개·Glossary 75개 내용 정확성)
- testimonials/partners 섹션 실제 데이터 교체 (현재 placeholder)
- 테마 명명 확정 (paper/dusk/dawn/ink → 사용자 노출 이름 결정)
- Google Search Console에 sitemap.xml 재제출 (/learn 색인)
- 배포 전 Cloudflare Pages `public/_redirects`에 `/learn /index.html 200` 규칙 확인
- firestore.rules 수동 배포 (이번 sweep에서 미변경이나 이전 세션 수정분 미배포 상태)
- Cloudflare Rate Limit 설정 (이전 세션 보안 감사 권고사항)

**push/배포 안 함 — `git diff main..auto/polish-sweep` 리뷰 후 머지.**

79개 파일 변경, 3934줄 추가, 4464줄 삭제 (순 530줄 감소).
