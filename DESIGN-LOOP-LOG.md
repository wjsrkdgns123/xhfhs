# DESIGN-LOOP-LOG.md — 토론배틀 디자인 완성도 루프

> 각 라운드는 DESIGN-SYSTEM.md §4 대조표 기준으로 폐기 어휘를 제거하고
> 시각 위계·여백 리듬·컴포넌트 일관성을 개선한다.
> "수렴" = 더 할 worthwhile 작업이 없거나 남은 항목이 운영자 취향 영역인 상태.

---

## Round 1

**실행일:** 2026-06-06

### 영역별 결과

| ID | 제목 | status | 커밋 해시 | 핵심 변경 | 운영자 시각확인 항목 |
|----|------|--------|-----------|-----------|---------------------|
| R1A | 콘텐츠 7페이지 시각 시스템 정교화 | committed | 9041889 | content.css/content-themes.css/content-formats.css: 토픽·명토론 진영 패널에 찬=vermillion/반=celadon 좌측 룰 추가, 모든 콘텐츠 페이지 진영색 일관 적용 | /topics /famous /fallacies /glossary 등 콘텐츠 페이지에서 찬반 패널 좌측 컬러 룰 확인 |
| R1B | 전역 푸터 정교화 | committed | 0647260 | footer.css: mono eyebrow 컬럼 제목, serif 태그라인, 2px 잉크 상단 구분선, solid 잉크 밑줄 hover, 여백 리듬 정비 | 랜딩/자료실/콘텐츠 페이지 하단 푸터 — 4테마·모바일 확인 |
| R1C | 우측 ScrollSpy TOC 정교화 | committed | 5327203 | scrollspy.css: '목차' 헤더 라벨+헤어라인 추가, 활성 틱 마커 visible화, 들여쓰기+prefers-reduced-motion 가드 | 자료실·논리오류·용어사전 페이지 ≥1280px 폭에서 우측 TOC 확인 |
| R1D | 랜딩 히어로·섹션 리듬/위계 | skipped-converged | — | landing.css의 셀렉터가 실제 LandingView.tsx에 미렌더 (dead CSS)로 판명 — LandingView.tsx 직접 수정 필요, 범위 초과로 skip | LandingView.tsx JSX의 인라인 style 속성 검토 후 후속 라운드에서 처리 권장 |
| R1E | 로비 히어로·HUD·카드 CSS 토큰화 | committed | fc59fc4 | App.tsx lb2-hero*/rm2-hud 인라인 `<style>` 블록 및 LobbyHeroSplit.tsx 내 raw hex 전면 `var(--color-*)` 토큰으로 교체: grad-lobby/grad-gold/glow-pro/glow-gold 적용, coral/sky/sun/paper-light/paper-deep/sage-light 토큰 사용, votebar 배경 paper-deep 토큰화 | 로비 히어로(초록 스테이지) — 4테마 전환 시 배경·CTA 버튼·눈금 색상 자동 변환 확인. dusk/dawn 테마에서 특히 확인 권장 |

### 금회 `npm run build` 결과

```
✓ built in 3.21s  (exit 0)
```

### 변경 파일 폐기패턴 잔존 grep

```
# dashed / 먹색 하드오프셋 검사
grep -n "border.*dashed\|3px 3px 0.*var(--ink)" src/App.tsx src/components/lobby/LobbyHeroSplit.tsx
→ 0건

# raw hex (non-#fff) 검사
grep -n "color:#[0-9a-fA-F]\|background:#[0-9a-fA-F]" src/App.tsx | grep -v "#fff"
→ 0건 (모두 var(--color-*)/var(--grad-*) 토큰으로 전환)
```

### 수렴 여부

**아직 수렴하지 않음.** 다음 라운드에서 처리할 가치 있는 영역이 남아 있음:

- **LandingView.tsx 인라인 style → CSS 토큰화**: R1D에서 dead CSS 판명. LandingView.tsx 의 인라인 `style=` 속성 내 raw hex/rgba 값이 남아 있으면 토큰화.
- **방 만들기 폼 (lb-create) CSS 미정의**: `lb-create`, `lb-cchip` 등 클래스가 어떤 CSS 파일에도 미정의 상태 — 기본 스타일만 동작 중. 폼 UI 완성도 개선 여지.
- **ChatPanel.tsx 메시지 버블 시각 개선**: rm2-bubble의 테두리 굵기·그라데이션 처리 추가 여지.
- **VerdictView.tsx 인라인 raw hex 점검**: 판정 화면 인라인 색상 토큰화 검토.
- **OnboardingView.tsx / ProfileViewV2.tsx**: 각각 이전 세션 D3/D4에서 기본 처리만 됨.

### 다음 라운드 추천 영역

1. **LandingView.tsx 인라인 style 토큰화** — 랜딩이 가장 많이 노출되는 페이지
2. **lb-create 폼 CSS 신규 정의** — 방 만들기 폼 시각 완성도
3. **VerdictView.tsx 판정 화면 인라인 hex 토큰화** — 판정 화면이 감정적으로 중요

---

## Round 2

**실행일:** 2026-06-06

### 영역별 결과

| ID | 제목 | status | 커밋 해시 | 핵심 변경 | 운영자 시각확인 항목 |
|----|------|--------|-----------|-----------|---------------------|
| R2A | 랜딩(LandingView.tsx) 인라인 토큰화 + 리듬/위계 | committed | e85b279 | raw hex/rgba 전면 var()/color-mix 토큰화·--shadow-*·--glow-pro·--on-accent 적용. CTA 2px 잉크 프레임+soft shadow. 섹션 헤더 여백 큰 섹션 56·FAQ 40으로 통일. 본문 카드 반경 --r-lg(18px) 수렴. 5단계 배지 동일 잉크 윤곽. FAQ border --line 별칭 정합. | `/` 랜딩 페이지 — hero CTA 버튼, 카드 모서리·여백 리듬, FAQ 구분선. 4테마(dusk/dawn/ink)+다크에서 색 자동 전환 확인 |
| R2B | 판정(VerdictView.tsx) 인증서 위계 정교화 | committed | 2878455 | faceoff 승자 사이드카드 진영색 풀채움 → paper+진영색 2px 보더+약한 tint로 낮춤(강조 경쟁 제거). AI 패널→최종 배너 여백 36→56px(모바일 40px). prefers-reduced-motion transition 완화. 모든 색/간격은 기존 토큰만, raw hex/rgba/dashed 0건. CornerOrn/stamp/eyebrow/serif 보존. | 토론 종료 후 판정 화면 — 승자 사이드카드 배경이 옅게 표시되고 최종 배너가 풀컬러 클라이맥스로 부각되는지 확인. 4테마·다크 자동전환 확인 |
| R2C | 방 만들기 폼(lb-create) 스타일/테마 정합 | committed | 7309b20 | `#create` 섹션 래퍼 인라인 style(고정 1216px/64px 거터) → `.lb2-section` 클래스로 정렬. 데스크톱 레이아웃 동일 유지, 1100px/760px 반응형 거터(32px/20px) 상속하여 모바일 폼 잘림 해소. 색/간격/폰트 토큰 유지, 4테마 자동전환. | 로비 '방 만들기' 클릭 → 폼 표시 시 모바일(760px 이하)에서 거터가 줄며 입력칸이 잘리지 않는지 확인. dusk/dawn/ink 테마에서 카드·CTA 색 자동전환 확인 |

### 금회 `npm run build` 결과

```
rm -rf node_modules/.vite 후 실행
✓ built in 4.62s  (exit 0)
```

### 변경 파일 폐기패턴 잔존 grep

```
# dashed / 먹색 하드오프셋 검사 (LandingView.tsx · VerdictView.tsx · App.tsx)
grep -n "border.*dashed|3px 3px 0.*var(--ink)" 3개 파일
→ 0건

# raw hex (non-#fff/#000) 검사
grep -n "color:#[0-9a-fA-F]|background:#[0-9a-fA-F]" LandingView.tsx VerdictView.tsx
→ 0건

# rgba 잔존 검사
grep -n "rgba(" LandingView.tsx VerdictView.tsx
→ LandingView.tsx:226 — 주석(설명 텍스트)에만 언급, 실행 코드 아님 → 0건 (유효)
```

### 수렴 여부

**아직 수렴하지 않음.** R2 3개 영역(랜딩·판정·폼 래퍼)은 완료됐으나 아래 영역이 남아 있음:

- **ChatPanel / 메시지 버블(rm2-bubble)**: 토론방 채팅 버블 테두리 굵기·진영색 시각 개선 여지.
- **OnboardingView.tsx / ProfileViewV2.tsx**: 이전 세션 기본 처리만 됨, 위계·여백 리듬 정교화 가능.
- **자료실(LearnView.tsx) 탭 영역**: `.learn-mode__tab` 보존 전제하에 섹션 헤더·카드 위계 추가 정교화 여지.
- **모바일 HUD/진행바(토론방)**: rm2-hud 모바일 가독성 개선 (3순위 미진행 UX 항목).

### 다음 라운드 추천 영역

1. **ChatPanel.tsx 메시지 버블 진영색 시각 정교화** — 토론의 핵심 인터랙션 영역
2. **OnboardingView.tsx 여백·위계 리듬** — 신규 사용자 첫인상
3. **ProfileViewV2.tsx 레이아웃 정합** — 뱃지·전적 위계 개선

---

## Round 3

**실행일:** 2026-06-06

### 영역별 결과

| ID | 제목 | status | 커밋 해시 | 핵심 변경 | 운영자 시각확인 항목 |
|----|------|--------|-----------|-----------|---------------------|
| R3A | 토론 메시지 버블(ChatPanel/MessageRow) 진영색 시각 정교화 | committed | 0c4574e | ChatPanel(관전석 채팅): 내 발언·주목 발언 색을 진영색(celadon/vermillion)→중립 gold로 교체 — 관전석 중립 제3자라 진영색 오용으로 인한 BX 충돌 해소. 헤더/입력 구분선 1.5px 먹색→1px 헤어라인(--color-line) 완화. 카운트 mono 라벨화. 본문 word-break:keep-all 추가. MessageRow: 찬성/반대 칩 라벨, aria-label, lang 속성 추가. App.tsx P0 락 파일이라 .rm2-bubble__chip 솔리드 스탬프 강화는 되돌림. | 토론방 채팅 패널 — 내가 보낸 메시지(관전석)가 gold 강조로 표시되고, 찬성/반대 라벨 칩이 선명하게 보이는지 확인. 4테마·다크 전환 시 gold 색상 자동 변환 확인 |
| R3B | 온보딩(OnboardingView) 여백·위계 리듬 | committed | f8eb960 | 활성 스텝 40px pill+shadow-md 강조, 토픽 선택 gold 잉크 밑줄, 2px 잉크 프레임 카드, 모바일 sticky 네비·VS 구분선, prefers-reduced-motion 가드. 스텝1 직접입력 카드 하단 여백 18→24px로 섹션 리듬 통일. 새 CSS 변수 추가 없이 기존 토큰만 사용. | 온보딩 첫 화면(주제 선택) — 현재 스텝 pill이 크고 선명하게 강조되는지, 선택한 토픽 카드에 gold 밑줄이 붙는지 확인. 모바일에서 스텝 네비가 하단에 고정되는지 확인 |
| R3C | 프로필(ProfileViewV2) 레이아웃 정합·위계 | committed | 0f450ae | 일반 카드(현재 시즌/강점 분석/개선 포인트/HistoryRow/RankRow/BadgeCard) 정본 .hub-card 어휘로 통일: 1px 헤어라인(--color-line)+--r-lg+--shadow-sm. 직각·--r-sm·1.5px 잉크 보더·그림자 누락 혼재 제거. 헤더/탭바 구분선 1.5px→1px 헤어라인. 헤더 'vs 사람' vermillion 강조 제거→수치만 굵게. RankRow 내 행만 vermillion 2px 프레임 강조 유지. | 프로필 페이지(/profile) — 카드 모서리가 모두 --r-lg로 통일됐는지, 내 랭킹 행만 빨간 프레임으로 강조되는지 확인. 4테마·다크 전환 시 헤어라인 색상 자동 변환 확인 |

### R3 시도 횟수

| ID | 통과 라운드 수 | 비고 |
|----|---------------|------|
| R3A | 1 | App.tsx P0 락으로 .rm2-bubble__chip 솔리드 스탬프 강화 되돌림 후 통과 |
| R3B | 2 | 스텝1 하단 여백 24px 추가 후 최종 통과 |
| R3C | 1 | 첫 시도 통과 |

### 금회 `npm run build` 결과

```
rm -rf node_modules/.vite 후 실행
✓ built in 4.51s  (exit 0)
```

### 변경 파일 폐기패턴 잔존 grep

```
# dashed / 먹색 하드오프셋 검사
grep -n "border.*dashed|0 var(--color-ink)" \
  src/components/ChatPanel.tsx \
  src/components/room/MessageRow.tsx \
  src/components/OnboardingView.tsx \
  src/components/ProfileViewV2.tsx
→ 0건

# raw hex (non-#fff/#000) + rgba 잔존 검사
grep -n "rgba(\|#[0-9a-fA-F]{6}" 위 4개 파일 | grep -v 주석
→ 0건
```

### 미커밋 잔여 파일 (git status 확인)

```
modified: src/design-system/components.css
modified: src/index.css
```

**내용:** 채팅 슬라이드인 애니메이션 타이밍 조정 (translateX -12→-8px, 0.35s→220ms). R3A 작업 중 발생한 무관 변경으로, 디자인 시스템 금지 패턴에 해당하지 않으나 Round 3 커밋 범위에 포함되지 않음. 다음 라운드 또는 별도 커밋으로 처리 가능.

### 수렴 여부

**아직 수렴하지 않음.** R3 3개 영역(메시지 버블·온보딩·프로필)은 완료됐으나 아래 영역이 남아 있음:

- **자료실(LearnView.tsx) 탭·섹션 위계**: `.learn-mode__tab` 보존 전제하에 카드 그리드·챕터 헤더 여백 추가 정교화 여지.
- **모바일 HUD/진행바(토론방)**: rm2-hud 모바일 가독성 — 타이머·라운드·투표바 밀집 해소.
- **미커밋 CSS 슬라이드인 타이밍**: components.css/index.css 채팅 슬라이드인 타이밍 변경(무관 변경) 커밋 또는 되돌리기 결정 필요.
- **사회적 증거·로비 빈 상태 카피**: 디자인보다 카피 영역이라 코드 변경 범위 아님.

### 다음 라운드 추천 영역

1. **LearnView.tsx 자료실 카드·챕터 위계** — 탭 보존 전제, 카드 그리드 헤어라인+shadow-sm 통일
2. **rm2-hud 모바일 레이아웃** — 타이머·투표바 밀집 개선 (3순위 UX)
3. **미커밋 CSS 슬라이드인 타이밍** — 단순 커밋 또는 git restore 결정
