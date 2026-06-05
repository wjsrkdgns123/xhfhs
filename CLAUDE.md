# 토론배틀 (Debate Battle) — Project Context

## Overview
한국어 1:1 실시간 토론 사이트. AI 사회자/토론자, 청중 투표, **50/50 (AI + 청중) 판정**.
- 사이트명: **토론배틀**
- 운영 도메인: **https://ddatebattle.site** (Cloudflare Pages auto-deploy from `main`)
- 저장소: GitHub `wjsrkdgns123/xhfhs`
- 운영자 이메일: **wjsrkdgns123a@gmail.com**

## 🤝 협업 AI (Claude Code ↔ Codex)
이 저장소는 **Claude Code**와 **Codex(OpenAI)** 두 AI 코딩 도우미가 VS Code 안에서 함께 작업한다.
- **Claude Code**는 `CLAUDE.md` + `.claude/agents/*.md` + `.claude/commands/*.md` 를 읽는다.
- **Codex**는 `AGENTS.md` + `.codex/agents/*.toml` 을 읽는다.
- `CLAUDE.md` ↔ `AGENTS.md`, `.claude/agents/*` ↔ `.codex/agents/*` 는 **같은 내용으로 동기화**한다. 한쪽에서 프로젝트 사실(기술 스택·파일 경로·규칙)을 바꾸면 다른 쪽도 똑같이 고칠 것.
- ⚠️ **제품이 토론에 쓰는 AI는 Claude Haiku 4.5(`claude-haiku-4-5-20251001`)** 다. 이는 "어느 코딩 도우미가 문서를 읽느냐"와 무관한 제품 사실이므로, Codex가 읽는 문서에서도 절대 다른 모델명으로 치환하지 말 것. (실제 공통 호출 파일명은 `functions/_shared/claude.ts`, 함수는 `callClaude()`.)

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + Tailwind v4
- **Backend**: Cloudflare Pages Functions (`/functions/api/ai/*.ts`) + dev express(`server.ts`)
- **DB/Auth**: Firebase Firestore + Google Auth, `onSnapshot` 실시간 구독
- **AI**: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — Claude AI only
- **AdSense**: 게시자 ID `pub-6219520263101018` — 스크립트 + `ads.txt` 적용 완료

## Dev Workflow
```bash
npm run dev      # Vite + Express (concurrently)
npm run lint     # tsc --noEmit — .ts/.tsx 수정 후 매번 실행
```
Preview MCP server runs on port 5173.

## Site Map (현재 라우팅)

```
/                    ← 신규 방문자: 랜딩 / 재방문·로그인: 로비 (localStorage flag)
?room=<id>           ← 토론방 (1:1 + 사회자 + 관전석)
/learn               ← 자료실 (2-탭: 기본기 갖추기 / 더 배우기)
/topics              ← 토론 주제 100선 (80+)
/fallacies           ← 논리 오류 백과 (54)
/glossary            ← 용어 사전 (80+)
/famous              ← 명토론 아카이브 (20)
/samples             ← 샘플 토론 (4 full transcripts)
/formats             ← 토론 형식 도감 (7) — 학술
/resources           ← 자원 모음 (16) — 학술
/about /contact      ← 운영자 정보 / 문의
/privacy /terms      ← 법적 페이지
```

## Design Tokens
- paper `#f5ecd9` / paper-light `#fcf6e8` / paper-deep `#e8dcc0`
- ink `#1a0f08` / ink-soft `#3d2a1e` / ink-fade `#7a6450`
- vermillion `#c84b1f` / celadon `#2d4a5a` / gold `#b8842a`
- 한글: Black Han Sans (display) · Do Hyeon · Nanum Myeongjo (serif 900) · Gaegu (hand) · Noto Sans KR (body) · IBM Plex Mono
- 한글 줄바꿈: `word-break: keep-all`

## Page Architecture
- 페이지별 CSS scope: `.landing-page`, `.lobby-v3` (legacy lobby-v2 wrapper), `.learn-page-v2`, `.content-theme--{arena|caution|library|chronicle|stage}`
- `.wrap` 최대폭 1180px
- 헤더: 통합 메가메뉴(소개/토론장/자료실 3컬럼, 호버+탭/캐럿 분리)
- 우측 ScrollSpyNav (≥1280px, paper-light 반투명 카드, vermillion 글로우)
- 우하단 플로팅 CTA: `토론하기`(외부 페이지) / `방 만들기`(로비)
- 푸터: 정보 4 링크 단일 행

## Debate Flow
phases: `opening → pro_arg → con_arg → pro_rebut → con_rebut → closing`
- `plannedRounds` 기반 자동 연장: phase='pro_arg'로 재시작 (이전엔 pro_rebut 버그 — 수정 완료)
- 판정: 청중 투표 50% + AI 판단 50% (`<verdict>pro|con|tie</verdict>` 태그 파싱)

## Major Recent Changes (이번 세션)

### AdSense / SEO 인프라
- `/privacy /terms /about /contact` 법적 페이지 (Footer 노출)
- `public/{robots.txt, sitemap.xml, ads.txt, _headers, _redirects}` 모두 적용
- Open Graph + Twitter 카드 + JSON-LD (WebSite/Organization)
- 페이지별 동적 `<title>`/description (`useDocumentMeta` 훅)
- 404 페이지 자체 구현
- Cloudflare AI 봇 차단 모두 OFF 검증됨

### PWA
- `public/{manifest.webmanifest, sw.js, icon.svg, icon-maskable.svg, og-image.svg}`
- network-first HTML / stale-while-revalidate 정적, API/Firebase 제외
- Apple/Android 홈 화면 설치 가능

### 콘텐츠
- 자료실 본문: **실전 적용 가능 5챕터만** (원칙·논리 오류·준비 단계·평가 기준·실전 팁)
- 학술 정보는 별도 페이지(/formats /famous /resources)로 분리
- 2-탭 모드 (기본기 갖추기 / 더 배우기)

### UX 감사 적용 (NN/g·web.dev·WCAG 기반)
**1순위 (완료):**
- 첫 방문 랜딩 디폴트 (localStorage)
- 빈 상태 0/0/0 → "🔥 지금 무대를 열면 첫 토론자! →" 클릭형 호출
- 히어로 2차 CTA → ghost 텍스트 링크

**2순위 (완료):**
- `a11y.css` — `:focus-visible` 글로벌 링, 모바일 탭 타깃, `prefers-reduced-motion`
- 메가메뉴 탭/캐럿 split (터치 호환)
- 12 `alert()` → `ToastHost` 토스트
- 폼 라벨 12px / ink-soft (WCAG AA)
- 폰트 preconnect + 미사용 weight 제거
- AI 사회자 응답 indeterminate 프로그레스 바

**3순위 (미진행):**
- 사회적 증거 / CTA 카피 다듬기 / 모바일 진행 바 / 다크모드

## Key Files
| File | Purpose |
|------|------|
| `src/App.tsx` | 메인 앱, 라우팅, 헤더, 로비 |
| `src/types.ts` | Room/Message/UserProfile/Phase, AI_OPPONENT 상수 |
| `src/components/LandingView.tsx` + `src/landing.css` | 8섹션 랜딩 |
| `src/components/LearnView.tsx` + `src/learn.css` + `src/learn-hub.css` | 자료실 (2모드) |
| `src/components/content/*View.tsx` + `src/content.css/content-themes.css/content-formats.css` | 7개 콘텐츠 페이지 |
| `src/components/LegalPages.tsx` | privacy/terms/about/contact |
| `src/components/ScrollSpyNav.tsx` + `src/scrollspy.css` | 우측 세로 TOC |
| `src/components/FloatingLobbyBtn.tsx` + `src/float-lobby.css` | 우하단 CTA |
| `src/components/Toast.tsx` + `src/toast.css` | 알림 시스템 |
| `src/a11y.css` | 접근성 베이스라인 |
| `src/lobby-v3.css` + `src/lobby-v3-extras.css` | 로비 에디토리얼 디자인 |
| `functions/api/ai/{opening,transition,closing,argue,polish,topics}.ts` | AI 엔드포인트 |
| `firestore.rules` | 보안 |

## Firestore
- 기본 비인증 쓰기 거부
- 방 TTL: 생성 후 2시간 → 자동 숨김 + 본인 방 best-effort 삭제
- 스키마: Room (avatar/plannedRounds/finalProScore/aiPick 포함)

## Future TODOs (다음 세션에서 처리)

### 🌐 i18n 확장 — Lobby/Learn 완전 번역
현재 i18n은 **랜딩 페이지만** 적용됨 (`src/i18n/landing.ts`). 헤더의 한/영 토글은
모든 페이지에서 보이지만, 로비·자료실·콘텐츠 페이지·법적 페이지는 KO 전용이라
토글 클릭 시 그 페이지들은 한국어로 유지됨.

**해야 할 일:**
- `src/i18n/lobby.ts` — 토론장 마스트헤드/필터/카드/빈 상태 strings
- `src/i18n/learn.ts` — 자료실 hero/모드 탭/챕터 strings
- `src/i18n/content.ts` — 7개 콘텐츠 페이지 strings (또는 페이지별 분리)
- `src/i18n/legal.ts` — privacy/terms/about/contact
- 각 컴포넌트에서 `useLocale()` + `t.*` 참조로 변경
- `<html lang>`이 이미 동적 업데이트되므로 추가 라우팅 불필요

**규모:** 큰 작업. 페이지별로 점진 적용 권장 (lobby → learn → content → legal 순).

### 🎯 Placeholder 데이터 → 실데이터 연결

랜딩 페이지에 MVP placeholder가 3곳 있음:

1. **Champions 섹션** (`src/i18n/landing.ts` `champions.items`)
   - 현재: 홍길동/김토론/이서연/박지훈 가짜 토론자 4명
   - 해야 할 일: Firestore에서 지난 7일간 승률 top 4 쿼리 → 실시간 표시
   - Firestore 스키마에 `users/{uid}.weeklyStats` 같은 집계 필드 필요할 수 있음

2. **Testimonials 섹션** (`src/i18n/landing.ts` `testimonials.items`)
   - 현재: "K, 대학교 토론 동아리" 등 익명 placeholder 3개
   - 해야 할 일: 실제 사용자 인용으로 교체 (피드백 수집 후)

3. **Partners 섹션** (`src/i18n/landing.ts` `partners.items`)
   - 현재: "○○고등학교 토론반" 등 6개 placeholder
   - 해야 할 일: 등록된 학교·동아리 명 또는 로고 교체
   - 코드 주석에 명시: `MVP 단계 — 등록을 신청한 단체만 표시됩니다.`

### 🌙 다크 모드 검증
다크 모드 토글은 작동하지만 일부 페이지에서 색상 토큰이 어색할 수 있음.
- 모든 페이지 (lobby/learn/content/legal) 다크 모드 시각 검증
- 특히 새로 추가된 wordmark wall / marker / brush-under 유틸의 다크 톤 확인

### 📚 자료실 콘텐츠 i18n + 검색
자료실의 본문(원칙/논리오류/평가기준/실전팁 등)도 영어 버전 필요 시 큰 작업.

### 🎨 debate-battle-v2 디자인 패키지 — Phase 2 적용
Anthropic 디자인 도구로 만든 v2 디자인 핸드오프 (chat: 2026-05-16, file `debate-battle-v2.html`).
Phase 1 (디자인 시스템 + 랜딩 일부)은 이번 세션에 적용. **남은 작업**:

1. **로비 (Lobby) v2 재설계**
   - Editorial masthead → "이번 주의 챔피언" 강조
   - 방 카드를 newspaper-style 카드로 (제목 serif-display + status pill + vote bar)
   - 빈 상태에 stamp/ornament 활용
   - 참조: `screen-lobby.jsx`

2. **토론방 (Room) v2 HUD 재설계** — 가장 큰 작업
   - 상단 HUD strip (라운드 / 타이머 / 청중 수 / 투표 현황)
   - 좌우 faceoff portraits + "이의 있음!" 오버레이 (obj-pop 애니메이션)
   - AI 사회자 카드 (두루마리/아바타/미니멀 3 variants — Tweaks-driven)
   - 채팅 버블 (slide-in-l/r, msg--pro / msg--con / msg--mod)
   - Vote bar 4 variants (한 줄·분할·줄다리기·칸)
   - 라운드 타임라인 + 관전자 발언 composer
   - 참조: `screen-room.jsx`

3. **판정 (Verdict) v2 신규 화면**
   - Certificate-style verdict
   - 청중 → AI → 최종 staged blur reveal
   - confetti or stamp 폭발 effect
   - 참조: `screen-rest.jsx` (VerdictView)

4. **자료실 (Learn) v2 강화**
   - 두 탭 구조는 유지, 카드를 newspaper card로 (큰 number watermark + accent border)
   - 사이드 TOC 추가 가능
   - 참조: `screen-rest.jsx` (LearnView)

5. **온보딩 3-step + 프로필** 신규 화면 도입 가능
   - 주제 라이브러리 → 입장 선택 → 규칙
   - 참조: `screen-landing.jsx` (OnboardingView)
   - 프로필: 챔피언 leaderboard, 뱃지, 전적 — 참조: `screen-rest.jsx`

6. **4 테마 변형** (paper / dusk / dawn / ink)
   - 현재 light/dark만 — v2의 4-theme cycle 추가 가능
   - data-theme="dusk"/"dawn" 토큰 추가

7. **신규 컴포넌트 정식 추출**
   - `Stamp` (rotated bordered seal) — 글로벌 클래스 `.stamp`로 적용됨 ✓
   - `Eyebrow` — 글로벌 `.eyebrow` ✓
   - `Status` / `Chip` — 글로벌 ✓
   - `Ornament` (asterisk/dot3 SVG) — 미적용
   - `VSMark` — 미적용
   - `AIModCard` — 미적용

**원본 디자인 패키지 위치**: `/tmp/ddate-v2/` (압축 풀어둠) 또는 chat에서 받은 tarball 재추출.
