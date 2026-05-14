# 토론배틀 (Debate Battle) — Project Context

## Overview
한국어 1:1 실시간 토론 사이트. AI 사회자/토론자, 청중 투표, **50/50 (AI + 청중) 판정**.
- 사이트명: **토론배틀**
- 운영 도메인: **https://ddatebattle.site** (Cloudflare Pages auto-deploy from `main`)
- 저장소: GitHub `wjsrkdgns123/xhfhs`
- 운영자 이메일: **wjsrkdgns123a@gmail.com**

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
