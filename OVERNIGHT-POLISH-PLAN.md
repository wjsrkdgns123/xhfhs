# 새벽 무인 완성도 작업 계획 (Overnight Polish Plan)

> 생성: 2026-06-05 · 근거: 9개 차원 병렬 감사(74개 발견) → 합성 백로그(20과제) → 적대적 비평
> 목적: **새벽에 사람 없이 안전하게 돌릴 수 있는** 디자인·콘텐츠 완성도 작업 큐.
> 정본: `DESIGN-SYSTEM.md` · `CLAUDE.md` · `src/design-system/colors_and_type.css`

---

## 0. 종합 진단

사이트는 **기능·콘텐츠·i18n chrome·4테마 토큰 코어가 성숙 단계**다(콘텐츠 7뷰 KO/EN 완비, 프롬프트 인젝션 방어·50/50 합산·verdict 파싱 견고). 다만 세 부류의 부채가 겹쳐 있다:

1. **[P0 회귀]** `plannedRounds≥2` 방이 2라운드부터 영구 정지 — 자동연장 분기가 락 ref를 미초기화 (`src/App.tsx:2304` 근방). **무인 부적합, 아침 최우선 사람 검증.**
2. **[디자인 부채]** 진행중 리팩터로 새 인라인 로비(`lb2-`)·레거시 lazy 뷰(ProfileViewV2/OnboardingView/AIModCard)에 **폐기 어휘**(먹색 하드오프셋·점선·라이트 하드코딩 색)가 정본(soft-round)과 혼재.
3. **[도달성 부채]** `/learn` 라우트 3중 누락 → 직접접속 soft-404 + SPA canonical/OG 미갱신.

폐기 패턴 치환·a11y 보강·메타 정정은 검증 가능한 안전 작업이나, **회귀위험 큰 P0 락버그·라우팅·디자인 강조위계 판단은 사람 검증이 필요**하다.

---

## 1. ⚠️ 새벽 무인 실행 안전 프로토콜 (먼저 깔지 않으면 실행 금지)

적대적 비평이 잡아낸 두 가지 **치명적 안전공백**을 먼저 메운다.

### 1-1. 브랜치 격리 (필수)
현재 `main` + **미커밋 28개 + untracked 8개**(진행중 리팩터)인 더티 트리 위에서 돈다. 자동 변경이 운영자 WIP와 섞이면 분간·롤백 불가.

```bash
# 작업 시작 시 1회
git checkout -b auto/polish-sweep            # 현재 워킹트리째 새 브랜치로
git add -A && git commit -m "baseline: operator WIP before overnight sweep"
# 이후 모든 task = 1 commit. main 직접 커밋·push·배포 절대 금지.
```

### 1-2. 검증 게이트 보강 (필수 — `npm run lint`만으론 부족)
`npm run lint` = `tsc --noEmit && tsc -p tsconfig.functions.json` = **타입체크 전용**. CSS·인라인 스타일 문자열·토큰명 오타·ARIA는 **1바이트도 검증 못 한다.** 따라서 각 task 후 아래 3중 게이트를 모두 통과해야 커밋:

```
G1  npm run build        # tsc -b && vite build — CSS 파싱오류·임포트 깨짐 포착
G2  토큰 존재 검증        # 새로 쓴 var(--…) 가 index.css / colors_and_type.css / v2-system.css 에 실제 정의됐는지 grep
G3  폐기 패턴 0건 검증    # 손댄 파일/규칙에 dashed · "0 var(--color-ink)" · "0 var(--ink)" 가 0건인지 grep
```
하나라도 실패하면 **해당 task 변경을 되돌리고(`git checkout -- <file>`) 스킵 로그에 기록**, 다음 task로.

### 1-3. 파일 화이트리스트 (이 목록 밖은 건드리지 않음)
```
허용:  src/App.tsx(로비 lb2-/방 rm2- 스타일 블록 한정), src/components/common/AIModCard.tsx,
       src/components/VerdictView.tsx, src/components/common/VoteBar.tsx,
       src/components/ObjectionOverlay.tsx, src/components/lobby/LobbyRoomCard.tsx,
       src/learn-dropdown.css, src/design-system/components.css, src/index.css,
       src/hooks/useLocale.ts, src/i18n/learn.ts, public/sitemap.xml,
       functions/_shared/prompts.ts(parseTopics 순수함수 한정), CLAUDE.md(개수 표기 동기화 한정)

금지:  firestore.rules, server.ts, functions/api/ai/*(로직), functions/_shared/claude.ts,
       src/types.ts, 인증·Firestore 쿼리 로직, App.tsx:2300~2310(P0 락 영역), untracked 리팩터 디렉터리
```
> **보안/서버/AI 동작 로직은 무인 범위 밖.** `firestore.rules`(현재 M 상태)는 절대 자동수정 금지.

### 1-4. 원자성·정지 조건
- **task = 1 commit** (`git commit -m "Txx: <title>"`). App.tsx 집중 7과제는 반드시 개별 커밋이라야 부분 롤백 가능.
- 연속 **2개 task가 G1(build) 실패** → 전체 중단하고 보고서만 남긴다(환경/베이스 문제 가능성).
- 모든 작업 후 `npm run build` 최종 1회 + 변경 요약 `OVERNIGHT-RESULT.md` 생성. **push·PR·배포는 사람이 아침에.**

---

## 2. 🟢 자동 실행 큐 (사람 없이 진행 — 18과제)

> 모든 항목 `verify`는 **§1-2의 G1+G2+G3 3중 게이트**를 의미(표엔 핵심만 표기). 순서대로, 파일 겹침 적은 것부터.

### 배치 1 — 폐기 디자인 어휘 → 정본 토큰 (저위험·기계 치환)

| ID | 제목 | 파일 | 변경 요지 | 완료 기준 |
|---|---|---|---|---|
| T01 | AIModCard 3변형 폐기 어휘 제거 | `common/AIModCard.tsx` | scroll/avatar: `1.5px solid var(--color-ink)`→`1px solid var(--color-line)`, `2px 2px 0 var(--color-ink)`→`var(--shadow-sm)`, `borderRadius:var(--r-lg)` 추가. minimal: `dashed`→`1px solid var(--color-line)`. gold 좌측선·아바타 테두리 유지 | `dashed` 0건, `0 var(--color-ink)` 0건 |
| T02 | 메가메뉴 드롭다운 먹색 하드오프셋 제거 | `learn-dropdown.css:84` | `6px 6px 0 var(--color-ink)`→`var(--shadow-lg)`, `--r-lg` 확인 | `0 var(--color-ink)` 0건 |
| T03 | 로비 빈슬롯/폴백 점선→헤어라인 | `App.tsx:1276,1142` | `2px dashed`→`1px solid`(골드톤 유지). **`lb2-empty-stage`(이미 정본) 미변경** | 두 규칙 `dashed` 0건 |
| T04 | 방 빈좌석/오픈노트 점선→솔리드 | `App.tsx:2468-2469,2491` | emptyseat `2px dashed`→`2px solid` 진영색, open-note→`1px solid var(--color-line)` | 해당 규칙 `dashed` 0건 |
| T05 | 판정 군중카드 점선→솔리드 + gold rgba 토큰화 | `VerdictView.tsx:147,119` | `1px dashed`→`1px solid`. gold raw rgba→`color-mix(... var(--color-gold) …)`. **CornerOrn(인증서 장식) 보존** | `dashed` 0건, gold `rgba(184,132,42` 0건 |
| T06 | 로비 카드/ENDED칩 라이트 하드코딩→토큰 | `App.tsx:1209,1218,1235,1242` | `#fff`→`var(--color-paper-light)`, `#cdbf9f`→`var(--color-paper-darker)`, `#ece4d3`→`var(--color-paper-deep)` | dark/ink에서 카드 어두워짐 |
| T07 | 스티키 검색/필터 바 라이트 rgba→토큰 | `App.tsx:1171,1182,1193` | `rgba(246,240,226,.97)`→`color-mix(… var(--color-paper) 97% …)`, `#fff`→`paper-light`, `#e3d9c2`/`#d9cdb4`→`var(--color-line)` | dark에서 바 어두워짐 |
| T08 | LobbyRoomCard 플래그칩 배경→토큰 | `lobby/LobbyRoomCard.tsx:98,109,121` | `#fff1ea`→`var(--color-vermillion-tint)` | dark에서 칩 어두워짐 |
| T09 | `.input/.segment__btn` 배경→토큰 | `design-system/components.css:151,167` | `#fff`→`var(--color-paper-light)` | dark에서 입력칸 어두워짐 |
| T10 | dusk/dawn에 -dim/-tint/-ghost 토큰 명시 | `index.css:124,141` | `gold-dim·vermillion-tint·celadon-tint·gold-tint·ink-ghost` 명시 정의(폴스루 제거) | dusk/dawn에 토큰 존재, light/dark 회귀 0 |

### 배치 2 — 접근성 + raw-color 토큰화 (속성/색 추가만)

| ID | 제목 | 파일 | 변경 요지 | 완료 기준 |
|---|---|---|---|---|
| T12 | 발언 textarea + 로비 검색 input에 aria-label | `App.tsx:2818,1378` | 각 `aria-label`(KO/EN 분기, placeholder 유지) | 두 컨트롤 접근명 노출 |
| T14 | ObjectionOverlay raw hex→토큰 | `ObjectionOverlay.tsx` | `#c84b1f`→`var(--color-vermillion)`, `#2d4a5a`→`var(--color-celadon)`, `#1a0f08`→`var(--color-ink)`, `#fcf6e8`→`var(--color-paper-light)` | `#` 색 리터럴 0건 |
| T15 | 히어로 다크패널 저대비 텍스트 불투명도 상향 | `App.tsx:1150,1076` | fallback-sub `0.45`→`≥0.7`, pulse-txt `0.5`→`≥0.62`(다크패널 한정) | 대비 ≥4.5:1 |

### 배치 3 — i18n 미배선 + 개수 정합 + 색인 진입로

| ID | 제목 | 파일 | 변경 요지 | 완료 기준 |
|---|---|---|---|---|
| T16 | useLocale 합성 t에 onboarding 배선 | `hooks/useLocale.ts` | `t`에 `onboarding: onboardingStrings[lang]` 한 줄. 기존 직접 import 불변 | `t.onboarding` 접근 가능 |
| T17 | 콘텐츠 개수 표기 정합화 | `i18n/learn.ts`, `CLAUDE.md` | **선결**: FallaciesView/GlossaryView/TopicsView가 `.length` 동적인지 grep 확인. 그 뒤 hubCards: fallacies `54`→`56`, glossary `80+`→`75+`, topics `9개·80+`→`8개·79+`. CLAUDE.md 사이트맵 수치 동기화 | 허브카드·View·CLAUDE.md 수치 일치 |
| T19 | sitemap.xml에 `/learn` 추가 | `public/sitemap.xml` | `<loc>…/learn</loc>` (weekly, 0.85) | XML 유효, loc 존재 |

### 배치 4 — AI 엔진 안전 보강 (순수함수)

| ID | 제목 | 파일 | 변경 요지 | 완료 기준 |
|---|---|---|---|---|
| T20 | parseTopics 메타 서두/꼬리 필터 강화 | `functions/_shared/prompts.ts:210` | `:`로 끝나는 줄·"다음/추천/주제입니다" 서두·60자 초과 제외 | 메타 6줄 입력→논제 5개만, 정상 입력 회귀 0 |

---

## 3. 🔴 사람 검토 큐 (아침에 — 무인 부적합)

> 회귀위험·강조위계 판단·외부서비스·사실검증이 섞여 **lint/build로 검증 불가**.

1. **[P0·최우선] 자동연장 락버그** — `App.tsx:2304~2310`이 phase를 `pro_arg`로 되돌리고 return하나 `argueTriggeredFor.current`/`advancingFor.current`를 리셋하지 않음. 락 키에 라운드번호 없어(`'${room.id}:pro_arg'`) **2라운드부터 argue/advance가 막혀 영구 정지**. 수정은 2줄(합의연장 경로 2268-2269와 동일하게 두 ref=null)이나 `plannedRounds=2` 방 2라운드 **실주행 검증** 필요.
2. **landing.css / learn.css 일반카드 먹색 하드오프셋 정본 치환** — `.feat/.topic-card/.cta-block`(~12곳)·`.hub-card/.lpbtn/.format`. **어떤 요소를 진영색 강조로 승격할지 강조위계 판단** 개입 → 기계 치환 불가. (정본 `.learn-mode__tab`·신문강조와 구분 필수.)
3. **ProfileViewV2 + OnboardingView 폐기 어휘 치환** — 입장선택 pro/con을 진영색(vermillion/celadon)으로 승격할지, 미획득 뱃지 처리 등 디자인 의도 판단 + 시각 회귀 확인.
4. **`/learn` 라우트 3중 누락 수정** — `STATIC_PATH_MAP`+`KNOWN_PATHS`+`onLearn` pushState. 라우팅 디스패치 변경 → 메가메뉴/직접접속/뒤로가기 검증. (T19 sitemap·T18 canonical과 묶어야 도달성 완성.)
5. **T18 — useDocumentMeta 페이지별 canonical/OG/Twitter 갱신** (9파일) — *비평이 human으로 재분류.* verify가 tsc뿐이라 메타 원복누락·중복태그·stale canonical 회귀 못 잡고(SEO 직타격), `/learn`이 soft-404인 채 canonical 박는 모순. **라우팅(#4)과 묶어 검증.**
6. **T13 — VoteBar ARIA** — *비평이 human으로 재분류.* `VoteBar`에 `lang` prop 부재 → 자율 시 KO 하드코딩(i18n 파손) 또는 prop 전파(공용 컴포넌트 4변형·전 호출처 회귀)뿐. 방향 결정 필요.
7. **T11 — 발언석 aria-live** — *비평이 human으로 재분류.* `rm2-floor__body`(2772) 자식 `.ai-progress`(2796)에 이미 `aria-live=polite` → nested live region 중복낭독. 자식 live 제거/분리 설계 선결.
8. **검색엔진 verification + GSC/네이버 등록 + robots AI봇 정책** — `index.html:27-31` 주석처리된 verification 메타. 외부 콘솔·도메인 소유권·운영 정책.
9. **Testimonials placeholder + 히어로 카피 위계** — 익명 가공 후기(AdSense 품질 리스크) 숨김 vs 교체는 운영자 콘텐츠 판단.
10. **콘텐츠 깊이·사실검증** — 샘플 2~4편 라운드 보강, 자원 16건 outbound link, 명토론 후반 장르 정합, 본문 인용 통계(서울대 2019 1.8배 등) 출처 검증. **허위 통계 노출 위험 → 사실확인 필수.**
11. **i18n 미배선 본문** — StatusBadge(모집중/종료)·레거시 프로필 패널 13곳·toast/confirm 15곳·ObjectionOverlay 라벨·`PHASE_LABEL`→`tRoom.phases`·ChatPanel 4문자열. 신규 키 KO/EN 카피 + prop 전파 + 레이아웃 회귀.
12. **useTheme 'ink' 명명 불일치 + 데드 CSS 정리** — `CYCLE`이 ink 미세팅 → `[data-theme=ink]` 죽은코드. `lobby.css/lobby-v3*` 데드 CSS 제거는 키프레임/토큰 부수참조 grep + 전 페이지 시각검증.
13. **HUD 타이머(phaseStartedAt 스키마)·진행바 3중 중복·verdict 막판표 재조회(C2)** — DB 스키마/정책/동시성 판단.

---

## 4. 누락 차원 메모 (비평 지적)
- **성능**: VoteBar/AIModCard/ObjectionOverlay inline-style 매 렌더 재생성, lazy 청크 경계, 폰트 로딩 — 별도 차원 감사 필요(이번 큐엔 없음).
- **보안**: `firestore.rules`가 미커밋(M) — 무인 범위에서 **명시적 격리**. 자동수정이 보안룰/서버에 닿지 않게 §1-3 화이트리스트로 차단.

---

## 5. 실행 방법

새벽 무인 실행은 아래 한 단락을 자율 에이전트(또는 `/loop`)에 그대로 지시하면 된다:

> **지시문(복붙용):** "`OVERNIGHT-POLISH-PLAN.md`의 §1 안전 프로토콜을 먼저 실행(작업 브랜치 생성·베이스라인 커밋)한 뒤, §2 자동 실행 큐의 T01→T20을 순서대로 처리하라. **각 task마다** ①변경 적용 ②§1-2의 3중 게이트(`npm run build` + 토큰 존재 grep + 폐기 패턴 0건 grep) ③통과 시 `Txx: 제목`으로 단일 커밋, 실패 시 `git checkout -- <file>`로 되돌리고 스킵 로그. §1-3 화이트리스트 밖 파일은 절대 수정 금지. §3 사람 검토 큐는 **건드리지 말 것**. 전부 끝나면 `OVERNIGHT-RESULT.md`에 task별 적용/스킵·커밋해시·최종 build 결과를 정리. **push·PR·배포는 하지 말 것.**"

예상 소요: 자동 큐 18과제 ≈ 누적 작업 3~4시간(게이트 포함), 대부분 저위험 토큰 치환.
```
```
