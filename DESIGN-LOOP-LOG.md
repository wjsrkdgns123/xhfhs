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
