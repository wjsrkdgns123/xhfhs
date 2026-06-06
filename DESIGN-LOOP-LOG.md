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

---

## Round 4

**실행일:** 2026-06-06

### 영역별 결과

| ID | 제목 | status | 커밋 해시 | 핵심 변경 | 운영자 시각확인 항목 |
|----|------|--------|-----------|-----------|---------------------|
| R4A | 자료실(LearnView) 카드·챕터 위계 정합 | committed | a08df55 | ChapterBand에 챕터별 고유 액센트 부여: CH01·CH02·CH04=celadon, CH03=gold, CH05=vermillion. eyebrow 라벨·hand 강조·카드 상단선이 한 색으로 흐르게 통일(이전엔 eyebrow 전 챕터 celadon 고정, 카드 accent는 제각각). PrinciplesGrid/ChecklistGrid/CriteriaList/TipsGrid에 accent prop 추가, borderTop·tag·tint·weight 숫자 적용. 새 CSS 변수 없이 기존 토큰(--celadon/--gold/--vermillion)만 사용. learn.css에 lib-*/chapter-band 클래스 신규 정의. | /learn 자료실 — 챕터별로 색이 달라(celadon/gold/vermillion)지며, 같은 챕터 안에서 eyebrow 라벨·카드 상단선·hand 강조가 같은 색으로 흐르는지 확인. 4테마·다크 전환 시 색 자동변환 확인 |
| R4B | 토론방 HUD 모바일 레이아웃 + 버블칩 정교화 | committed | e703d5b | HUD ≤760px: 3셀 그리드(좌 LIVE칩+라운드/페이즈 인라인, 우 관중수, 하단 한 줄 논제)로 재배치, 페이즈 카운터·이름 baseline 한 줄+ellipsis 묶음. 채팅 버블 진영 칩: inset 헤어라인+진영색 하드오프셋으로 도장 느낌 추가, 색 #fff→var(--color-paper-light) 토큰화, 모바일 텍스트 색 raw rgba→color-mix 토큰 기반 전환. App.tsx P0 락 구역 외 스타일/className 마크업만 변경. | ?room= 토론방 모바일(760px 이하)에서 HUD가 3셀 레이아웃으로 정리되는지, 채팅 버블 찬성/반대 칩이 도장 느낌으로 선명한지 확인. 4테마·다크 전환 시 paper-light/vermillion/celadon 칩 색 자동변환 확인 |

### R4 시도 횟수

| ID | 통과 라운드 수 | 비고 |
|----|---------------|------|
| R4A | 2 | LearnView.tsx + learn.css 챕터 액센트 통일 후 통과 |
| R4B | 1 | 첫 시도 통과 (App.tsx P0 락 준수, gpt-design judge 환경 버그로 DESIGN-SYSTEM.md §4 직접 검증) |

### 금회 `npm run build` 결과

```
rm -rf node_modules/.vite 후 실행
✓ built in 4.22s  (exit 0)
```

### 변경 파일 폐기패턴 잔존 grep

```
# dashed / 먹색 하드오프셋 검사 (R4 수정 파일)
grep -n "border.*dashed|0 var(--color-ink)" \
  src/components/LearnView.tsx \
  src/learn.css \
  src/App.tsx
→ 0건

# raw 6자리 hex 잔존 검사 (R4 수정 파일)
grep -n "#[0-9a-fA-F]{6}" src/components/LearnView.tsx src/learn.css
→ 0건

# rgba 잔존 검사 (R4 수정 파일)
grep -n "rgba(" src/components/LearnView.tsx src/learn.css
→ 0건

# App.tsx rgba 잔존: 1054~1149 lb2-hero 인라인 스타일 내 알파 겹침용 rgba 다수 존재.
# 이는 R1E에서 이미 파악된 영역(어두운 배경 위 반투명 레이어) — R4B 신규 추가 없음, 기존분 유지.
```

### 미커밋 잔여 파일 (git status 확인)

```
?? .claude/scheduled_tasks.lock
```

도구 자동 생성 파일(.claude/scheduled_tasks.lock) 1건. 작업 무관, 커밋 대상 아님.
R4A·R4B 커밋에 포함되지 않은 미수정·미스테이지 파일 없음.

### 수렴 여부

**아직 수렴하지 않음.** R4 2개 영역(자료실 챕터 위계·토론방 HUD 모바일)은 완료됐으나 아래 영역이 남아 있음:

- **App.tsx lb2-hero rgba 잔존**: 로비 히어로 인라인 `<style>` 블록(1054~1149) 내 알파 겹침용 rgba. 어두운 무대 배경 특성상 완전 토큰화가 어려운 부분이나, color-mix로 부분 치환 가능성 검토 여지.
- **랜딩(LandingView.tsx) 섹션 리듬 추가 정교화**: R2A에서 기본 토큰화 완료, 하지만 히어로·5단계·FAQ 등 개별 섹션 여백 리듬 추가 다듬기 여지.
- **토론방 진행바(phase progress)**: 모바일에서 라운드 진행 상황 시각화 미완 (R3 미진행 UX 3순위 항목).
- **사회적 증거·빈 상태 카피**: 디자인 외 카피 영역.

### 다음 라운드 추천 영역

1. **App.tsx lb2-hero rgba → color-mix 부분 토큰화** — 로비 히어로가 가장 많이 노출되는 페이지
2. **랜딩 섹션 리듬 추가 정교화** — 5단계·CTA·FAQ 여백/위계 미세 조정
3. **토론방 phase progress 모바일** — 진행 상황 한눈에 파악 UX

---

## Round 5

**실행일:** 2026-06-06

### 영역별 결과

| ID | 제목 | status | 커밋 해시 | 핵심 변경 | 운영자 시각확인 항목 | GPT 자문 실사용 |
|----|------|--------|-----------|-----------|---------------------|----------------|
| R5A | 로비 히어로 raw rgba → color-mix 토큰화 | committed | f93c2db | App.tsx lb2- scope 인라인 `<style>` 내 남은 raw rgba 4종(pill live glow=vermillion 70%, open ring=gold 40%, ended ring=ink-fade 25%, empty-card hover=celadon 4%)을 정확한 토큰 color-mix로 전환. card/bar elevation·optical edge는 그림자 geometry 보존하며 forest/ink 기반 color-mix로 전환. dark-on-green 히어로 표면·흰 live glow·검정 드롭섀도·votebar track은 의도적 테마-불변으로 intentional 주석 명시하며 유지. | 로비(/lobby 또는 `/`) — pill 상태 glow·ring·카드 hover 효과가 dusk/dawn/ink 테마에서도 토큰 색으로 자동 변환되는지 확인. 히어로 무대(어두운 초록 배경)는 테마와 무관하게 동일하게 유지되는지 확인 | 실사용 O (A~D 토큰화·E/F 처리·퍼센트 보존 판단 반영) |
| R5B | 토론방 phase progress / RoundTimeline 모바일·위계 | committed | 4a188c4 | PhaseProgress: active 무게를 진영 틴트 12%+진영색 ring 마크+살짝 띄움으로 강화, done 배경 틴트 제거해 차분히 후퇴, idle 후퇴 강화로 현재 단계 명료화. 모바일 720px에서 마크+본문 한 줄·56px 탭타깃·380px 이하 타이포 축소. RoundTimeline: done/idle pill 배경 틴트 제거로 후퇴, active 배지 굵기 강화. 모바일 640px에서 줄바꿈 대신 한 줄 가로 스크롤+스냅으로 현재 라운드 위치 고정, 탭타깃 44px 보존. reduced-motion에서 transform/스냅 해제. 토큰/var()만(신규 토큰 없음), 헤어라인+soft shadow 정본 유지. 수정 파일 4종(PhaseProgress.tsx/.css, RoundTimeline.tsx/.css)만 스테이지. | ?room= 토론방 — (1) 현재 진행 중인 phase가 진영색 ring+옅은 tint로 또렷이 강조되고 완료된 phase는 차분히 후퇴하는지 확인. (2) 모바일에서 라운드 타임라인이 한 줄 가로 스크롤로 표시되며 현재 라운드가 뷰포트 내에 유지되는지 확인. 4테마·다크 전환 시 자동변환 확인 | 실사용 O (판정 반영) |

### R5 시도 횟수

| ID | 통과 라운드 수 | 비고 |
|----|---------------|------|
| R5A | 2 | (passed:false → rounds:2) 토큰 color-mix 퍼센트·의도적 예외 분류 검토 후 최종 통과 |
| R5B | 1 | (passed:true → rounds:0) 첫 시도 통과 |

### 금회 `npm run build` 결과

```
rm -rf node_modules/.vite 후 실행
✓ built in 2.88s  (exit 0)
```

### 변경 파일 폐기패턴 잔존 grep

```
# dashed / 먹색 하드오프셋 검사 (R5 수정 파일)
grep -n "border.*dashed|[0-9]px [0-9]px 0.*var(--ink)" \
  src/App.tsx \
  src/components/common/RoundTimeline.css \
  src/components/common/RoundTimeline.tsx \
  src/components/room/PhaseProgress.css \
  src/components/room/PhaseProgress.tsx
→ 0건

# raw 6자리 hex 잔존 검사
grep -n "#[0-9a-fA-F]{6}" \
  src/components/common/RoundTimeline.css \
  src/components/room/PhaseProgress.css
→ 0건

# rgba 잔존 검사 (R5 수정 파일)
grep -n "rgba(" \
  src/components/common/RoundTimeline.css \
  src/components/common/RoundTimeline.tsx \
  src/components/room/PhaseProgress.css \
  src/components/room/PhaseProgress.tsx
→ 0건

# App.tsx rgba 잔존 (R5A 범위)
grep -n "rgba(" src/App.tsx | grep -v "intentional\|//"
→ rm2-hud 인라인 스타일 영역(2469~2504줄) 내 rgba 다수 존재.
  이는 어두운 HUD 배경 위 반투명 레이어 특성으로 intentional 예외.
  R5A에서 lb2- scope 내 신규 rgba는 0건 추가됨.
```

### 미커밋 잔여 파일 (git status 확인)

```
?? .claude/scheduled_tasks.lock
```

도구 자동 생성 파일(.claude/scheduled_tasks.lock) 1건. 작업 무관, 커밋 대상 아님.
R5A·R5B 커밋에 포함되지 않은 미수정·미스테이지 파일 없음.

### 수렴 여부

**아직 수렴하지 않음.** R5 2개 영역(로비 rgba 토큰화·진행바 위계)은 완료됐으나 아래 영역이 남아 있음:

- **App.tsx rm2-hud rgba 잔존**: 토론방 HUD 인라인 `<style>` 블록(2469~2504줄) 내 반투명 레이어 rgba. 어두운 무대 배경 위 HUD 특성상 완전 토큰화가 어려우나, color-mix 부분 치환 여지 있음.
- **랜딩(LandingView.tsx) 섹션 여백 미세 조정**: R2A에서 기본 토큰화 완료, 히어로·5단계·CTA 섹션 여백 리듬 추가 정교화 가능성.
- **App.tsx P0 락 외 .rm2-bubble\_\_chip 스탬프 강화**: R3A에서 되돌렸던 항목 — P0 락 구역 밖 별도 CSS 파일로 이동 시 가능.
- **사회적 증거·빈 상태 카피**: 디자인 외 카피 영역.

### 다음 라운드 추천 영역

1. **rm2-hud rgba → color-mix 부분 토큰화** — 토론방 HUD 진행 표시 반투명 색상
2. **랜딩 섹션 여백 리듬 미세 조정** — 히어로·5단계 CTA·FAQ 간격 마지막 정교화
3. **rm2-bubble\_\_chip 스탬프 강화** — App.tsx P0 락 밖 별도 CSS로 분리하여 처리

---

## Round 6

**실행일:** 2026-06-06

### 영역별 결과

| ID | 제목 | status | 커밋 해시 | 핵심 변경 | 운영자 시각확인 항목 | GPT 자문 실사용 |
|----|------|--------|-----------|-----------|---------------------|----------------|
| R6A | 토론방 HUD rgba 토큰화 + 버블칩 스탬프 | committed | 5dde8d3 | App.tsx lb2-/rm2- scope 내 진영색 솔리드 위 raw `#fff`·다크에서 잉크로 뒤집히던 `--color-paper-light`를 전용 토큰 `var(--color-on-accent)`로 일원화. 버블칩 스탬프 inset 하이라이트도 on-accent 적용해 음각 반전 방지. 사이드카드 아바타 링은 paper-light(종이 컷아웃), 히어로 라이브닷 글로우는 color-mix(on-accent)로 정리. 위저드 로딩 폴백 #fff도 토큰화. 마크업·로직·기능 무변경. | 토론방 채팅 버블 찬성/반대 칩 위 텍스트가 다크 테마에서도 밝게 유지되는지 확인. dusk/dawn/ink 테마 전환 시 on-accent 색 자동변환 확인 | 실사용 여부 불명 (입력 결과로 전달됨) |
| R6B | 플로팅 CTA 정교화 | committed | 4d7afc9 | `src/float-lobby.css`만 수정. 아이콘을 paper-light 20% 반투명 원형 칩에 담아 아이콘칩-라벨-화살표 위계 정리. 변형별 진영색을 로컬 `--fl-accent`로 토큰화(go-lobby=vermillion/open-create=gold). GPT 자문 반영: gold 위 ink 텍스트로 AA 대비 확보+focus 외곽링 ink 교체. 좌측 패딩 축소·화살표 opacity 0.82. safe-area·focus-visible·reduced-motion·탭타깃 48px 유지. | 우하단 플로팅 CTA 버튼 — 아이콘칩-라벨-화살표 시각 위계 확인. gold 변형(방 만들기)에서 잉크 텍스트 대비 확인. dusk/dawn/ink 테마에서 색 자동전환 확인 | 실사용 O (gold 위 텍스트 대비·focus 링 판단 반영) |
| R6C | 토스트 알림 정교화 | committed | 35c1c29 | `src/components/Toast.tsx` + `src/toast.css` 수정. dot-in-ring 마크 → 잉크 도장(mono 글자: 알/완/!) 교체(색만 의존 a11y 개선+브랜드 시그니처). 자동 닫힘 1초 전 얇은 인쇄선 타이머(`toast__timer`) 추가(상시 진행바 아닌 절제된 신호, reduced-motion 정적). kind별 표시 시간 분리(오류 7s/안내 5s/완료 4.2s). eyebrow+본문 타이포 위계, 본문 3줄 line-clamp. 스택 최대 3개·폭 통일(min 360px). `showToast` API 시그니처 무변경. | 어느 화면에서든 토스트 발생 시(방 만들기 완료/오류 등) 우하단 알림 — 도장 글자(알/완/!) 표시 확인. 마지막 1초 인쇄선이 줄어드는지 확인. 모바일·다크/4테마에서 도장·인쇄선 색 자동전환 확인 | 실사용 O (절제된 타이머 vs 상시 진행바·표시 시간 판단 반영) |

### R6 시도 횟수

| ID | 통과 라운드 수 | 비고 |
|----|---------------|------|
| R6A | 0 | 외부 입력으로 전달됨 (passed:true) |
| R6B | 0 | 외부 입력으로 전달됨 (passed:true) |
| R6C | 1 | 외부 입력: passed:true, rounds:1 (첫 시도 후 1라운드 재시도) |

### 금회 `npm run build` 결과

```
rm -rf node_modules/.vite 후 실행
✓ built in 2.85s  (exit 0)
```

### 변경 파일 폐기패턴 잔존 grep

```
# dashed / 먹색 하드오프셋 검사 (R6 수정 파일)
grep -n "border.*dashed|[0-9]px [0-9]px 0.*var(--ink)" \
  src/App.tsx src/float-lobby.css src/components/Toast.tsx src/toast.css
→ 0건

# raw 6자리 hex 잔존 검사 (R6 수정 파일)
grep -n "#[0-9a-fA-F]{6}" \
  src/float-lobby.css src/components/Toast.tsx src/toast.css
→ 0건

# rgba 잔존 검사 (R6 수정 파일)
grep -n "rgba(" src/float-lobby.css src/components/Toast.tsx src/toast.css
→ 0건

# App.tsx rgba 잔존 (R6A 범위)
grep -n "rgba(" src/App.tsx
→ 5건 — 모두 lb2-hero 어두운 무대 배경 위 반투명 레이어 (R5A 이후 의도적 예외 intentional 분류):
  L1070: --lb2-hero-card-bg:rgba(16,38,30,0.86)  — forest 기반 무대 스크림
  L1101: rgba(0,0,0,0.4)  — 카드 드롭섀도 geometry
  L1129: rgba(0,0,0,0.6)  — 히어로 대배경 드롭섀도
  L1191: rgba(0,0,0,0.3)  — 투표바 트랙
  L1874: rgba(0,0,0,0.55) — rm2-hud 배경 스크림
  R6A 신규 추가 0건.
```

### 미커밋 잔여 파일 (git status 확인)

```
?? .claude/scheduled_tasks.lock
```

도구 자동 생성 파일(.claude/scheduled_tasks.lock) 1건. 작업 무관, 커밋 대상 아님.
R6A·R6B·R6C 커밋에 포함되지 않은 미수정·미스테이지 파일 없음.

### 수렴 여부

**아직 수렴하지 않음.** R6 3개 영역(HUD 토큰화·플로팅 CTA·토스트 알림)은 완료됐으나 아래 영역이 남아 있음:

- **App.tsx rgba 5건(lb2-hero/rm2-hud 어두운 배경 스크림)**: 의도적 예외로 분류됐으나 black 기반 rgba를 `color-mix(in srgb, transparent, var(--color-ink) N%)` 패턴으로 추가 토큰화 여지 있음. 다만 forest/black 계열 어두운 표면 전용이라 테마 영향 낮음.
- **랜딩(LandingView.tsx) 섹션 여백 리듬 미세 조정**: R2A에서 기본 토큰화 완료, 히어로·5단계·CTA 섹션 추가 정교화 가능성.
- **rm2-bubble\_\_chip 스탬프 강화**: R3A 되돌렸던 항목 — App.tsx P0 락 밖 별도 CSS 파일로 분리 시 처리 가능.
- **모바일 토스트 safe-area 검증**: env(safe-area-inset-bottom) 적용됐으나 실 기기 검증 필요.

### 다음 라운드 추천 영역

1. **랜딩 섹션 여백 리듬 추가 정교화** — 히어로·5단계·CTA·FAQ 간격 마지막 다듬기
2. **rm2-bubble\_\_chip 스탬프 강화** — App.tsx P0 락 밖 별도 CSS로 분리하여 R3A 되돌린 항목 재적용
3. **App.tsx 잔존 rgba(0,0,0) 토큰화** — black 기반 그림자/스크림을 color-mix(ink) 패턴으로 전환
