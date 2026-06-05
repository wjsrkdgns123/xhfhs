# DESIGN-SYSTEM.md — 토론배틀 디자인 정본(正本)

> **이 문서가 디자인의 단일 진실 공급원(Single Source of Truth)입니다.**
> 디자인 작업(섹션 리디자인·컴포넌트 스타일링·CSS 수정·색/여백/타이포)을 시작하기 전,
> 모든 디자이너(Claude `/디자인`, GPT `/디자인지피티`)는 **반드시 이 문서를 먼저 읽습니다.**
>
> **왜 이 문서가 생겼나:** 이 저장소에는 디자인이 여러 시대로 겹쳐 쌓여 있습니다
> (neo-brutal · editorial-magazine `lobby-v3` · soft-round design-system · 인라인 `lb2-`).
> 기준 문서들은 "브랜드 톤"만 적고 **"코드의 어떤 구현이 현재 것이고 어떤 게 옛것인지"는 적지 않아서**,
> 디자이너가 "사이트에 맞춰줘"라는 요청을 받으면 **주변 코드의 옛 구현(점선·코너브래킷·먹색 하드섀도우)을 그대로 베끼는** 사고가 반복됐습니다.
> 그래서 이 문서의 핵심은 **§4 "현재(정본) ↔ 폐기(베끼지 마) 패턴 대조표"** 입니다.

---

## 0. 수정 시 동기화 대상 (이 문서를 바꾸면 같이 본다)

이 문서가 마스터입니다. 아래는 **이 문서를 가리키는 위성 문서**들 — 디자인 사실(톤·토큰·현재/폐기 패턴)을 바꾸면 여기를 먼저 고치고 위성에도 반영:

- 디자이너가 실제 로드하는 정본 프롬프트(현재/폐기 대조표 **임베드됨**): `scripts/claude-designer.md` · `scripts/gpt-designer.md` *(둘은 동기화 쌍)*
- 에이전트 정의: `.claude/agents/claude-designer.md` · `.claude/agents/ui-ux-designer.md` · `.codex/agents/ui-ux-designer.toml`
- 슬래시 명령: `.claude/commands/디자인.md` · `.claude/commands/디자인지피티.md`
- 프로젝트 컨텍스트: `CLAUDE.md` · `AGENTS.md` (Design Tokens 섹션)

> `CLAUDE.md`↔`AGENTS.md`, `.claude/*`↔`.codex/*` 는 **같은 내용으로 동기화**합니다(한쪽 바꾸면 다른 쪽도).

---

## 1. 브랜드 톤 — "에디토리얼 디베이트 리그" (게임 + 교육)

- **한 줄 합격 기준:** "신문 편집국에서 열리는 지적 결투." `newspaper editorial × 전략 보드게임 × 학습 리포트`.
- 종이 질감 위에 **잉크 선·도장(stamp)·소제목 라벨(eyebrow)·스코어카드·랭크 뱃지·라운드 진행바**.
- **찬성 = vermillion / 반대 = celadon / 성취·보상·AI 중립 = gold.** 기존 팔레트는 **버리지 말고 진화**시킨다.
- **금지(엄수):** 마스코트·만화풍 캐릭터·네온·번쩍이는 모바일게임 톤·SF 홀로그램·광택 3D·파란 그라데이션·글래스모피즘.
  "모바일 게임 광고"나 "일반 SaaS 앱"처럼 보이면 실패.

> 전체 톤·게임화·UX/BX 최대치·이미지 규칙 원문은 `scripts/claude-designer.md`(가장 상세) / `scripts/gpt-designer.md`에 있습니다. 이 문서는 그 위에 **"무엇이 현재/옛것인지"** 를 더합니다.

---

## 2. 디자인 토큰 — 정의 위치만 가리킴 (여기서 중복 정의하지 않음)

색은 **반드시 토큰**으로. `#f5ecd9` 같은 raw hex를 코드에 직접 박지 말 것.

| 무엇 | 어디서 정의 |
|---|---|
| 색(`--color-paper`·`--color-ink`·`--color-vermillion`…) | `src/index.css` 의 `@theme` 블록 + 4-테마(dusk/dawn/ink)/다크 |
| bare-name 별칭(`--paper`·`--ink`·`--vermillion`…) + 유틸 클래스(`.serif-display`…) | `src/v2-system.css` |
| 반경·그림자·라인 토큰(`--r-lg:18px`, `--shadow-sm/md/lg`, `--color-line`) | `src/design-system/colors_and_type.css` |
| 컴포넌트(`.btn`·`.card`·`.chip`·`.stamp`·`.eyebrow`) | `src/design-system/components.css` · `src/index.css` |

핵심 팔레트(참고용, 정의는 위 파일): paper `#f5ecd9` / paper-light `#fcf6e8` / paper-deep `#e8dcc0` ·
ink `#1a0f08` / ink-soft `#3d2a1e` / ink-fade `#7a6450` ·
vermillion `#c84b1f`(찬성/CTA) / celadon `#2d4a5a`(반대) / gold `#b8842a`(포인트).

타이포: 헤드라인 `.serif-display`(Nanum Myeongjo) / 본문 `var(--font-body)` / 손글씨 악센트 `var(--font-hand)`(Gaegu, 소량) / 라벨·수치 `var(--font-mono)`(IBM Plex Mono). **새 폰트 추가 금지.** 한글엔 항상 `word-break: keep-all`.

---

## 3. 현재 정본의 기준 표본 (★ "이렇게 생긴 게 지금 스타일")

새 섹션을 만들 때 **베낄 모범**은 가장 최근에 리디자인된 자료실 입구입니다:

- **`src/learn-hub.css` 의 `.learn-mode__tab`** — 솔직한 2px 잉크 프레임 + **진영색 하드 오프셋 그림자**
  (`box-shadow: 6px 6px 0 0 var(--accent)`, 찬=vermillion/반=celadon) + **거대한 한자 워터마크**(基/深, opacity≈0.1)
  + hover 시 진영색이 카드를 채우고 글자가 종이색으로 반전.
- 일반 카드·버튼은 **`src/design-system/components.css` 의 `.btn`/`.card`** — 둥근 모서리(`--r-lg`/`--r-pill`) + **soft blur 그림자**(`--shadow-sm/md`).

즉 현재 정본은 **하이브리드**다: 일반 UI는 둥글고 부드럽게, 신문 강조 섹션은 진영색 하드 오프셋·한자 워터마크로 무게감.

---

## 4. ★ 현재(정본) ↔ 폐기(베끼지 마) 패턴 대조표

| 항목 | 현재(정본) — 이렇게 | 폐기(지양) — 베끼지 마 |
|---|---|---|
| **테두리** | 솔리드 2px 잉크 프레임 **또는** 1px 헤어라인 `var(--color-line)` | **점선** `border: …dashed`, **ㄱㄴ 코너브래킷 span** |
| **그림자(일반 UI)** | soft blur `var(--shadow-sm/md/lg)` | 먹색 하드오프셋 `3px 3px 0 var(--ink)` |
| **그림자(신문 강조 섹션)** | **진영색** 하드오프셋 `Npx Npx 0 var(--accent)` (찬=vermillion/반=celadon) | 일반 카드에까지 먹색 하드오프셋 남발 |
| **모서리** | 일반 카드·버튼 `--r-lg(18px)`~`--r-pill`; 신문 프레임 강조는 4px | 무근거 0 / 임의 값 |
| **워터마크** | 큰 한자·숫자 진영색, opacity≈0.1 (스케일·위계용) | 없음(밋밋) |
| **시그니처** | 도장(`.stamp`)·eyebrow 라벨·잉크 밑줄·serif-display 헤드라인 — **화면당 1~2개 절제** | 본문·태그에 `rotate()` 데코 남발 · **점선 프레임으로 빈 상태 전체를 감싸기** |
| **찬/반** | 색 + "찬성/반대" 라벨 + 좌우 위치 고정 | 색만으로 구분 |

### 정확성 주의 (오분류 방지)
- `.stamp`·eyebrow·serif 헤드라인 **요소 자체는 브랜드 자산이라 유지**한다. 스크린샷 빈 상태에서 옛 것은
  **점선 프레임 + 코너브래킷 컨테이너**이지 도장이 아니다. 위 표는 "프레임/그림자/테두리 어휘"를 겨눈다.
- 하드 오프셋 그림자 자체가 금지가 아니다 — **신문 강조 섹션에선 진영색 하드 오프셋이 정본**이다.
  폐기 대상은 **일반 카드의 먹색 하드 오프셋 + 점선/코너브래킷 프레임**이다.
- 분류가 애매하면 **코드에 "폐기" 주석을 달지 말고** 이 표에 정보로만 남긴다(현재 스타일을 잘못 폐기 처리하지 않기 위해).

### 폐기 예시 — 새 작업에 베끼지 마 (파일 앵커)
- `src/App.tsx` 의 `.lb2-empty-stage*` 블록(로비 방 0건 빈 상태): 점선 테두리 + ㄱㄴ 코너브래킷 + 흐릿한 잉크 프레임 = **옛 어휘**.
- `src/lobby-v3.css` · `src/lobby-v3-extras.css`: 레거시 editorial-magazine 로비(`3px double` 보더 등). 현재 로비는 App.tsx 인라인 `lb2-`로 대체됨 — **클래스 미렌더**.

---

## 5. 일관성·접근성 (반드시 지킴)

- **4-테마:** `data-theme="paper|dusk|dawn|ink"` + 다크에서 **토큰으로 자동 전환**. 라이트 전용 하드코딩 색 금지.
- **scope:** 페이지별 CSS scope 안에서만 변경 — `.landing-page` / `.lobby-v3`(legacy) / `.learn-page-v2` / `.content-theme--*`. `.wrap` 최대폭 1180px.
- **a11y(`src/a11y.css`):** `:focus-visible` 링 유지 · 모바일 탭 타깃 ≥44×44px · 본문 대비 WCAG AA(연한 paper 위 작은 `ink-fade` 금지 → 라벨은 `ink-soft`) · `prefers-reduced-motion` 존중 · 색만으로 의미 전달 금지(찬/반 = 색+라벨).

---

## 6. 이미지 규칙 (요약 — 원문은 정본 프롬프트)

- **SVG/CSS 우선**(아이콘·도장·씰·뱃지·구분선·OG 카드): 토큰 변수·`currentColor`로 4-테마/다크 자동 전환. 시안 `design-output/`, 확정 `public/`.
- **래스터(PNG)가 꼭 필요할 때만** `node scripts/gpt-design.mjs image "<영어 프롬프트>" --quality medium`. 화질 기본 medium, high는 운영자 명시 때만. 프롬프트는 브랜드 고정 문장 + hex 팔레트 + `no extra colors` + `text-free` 포함.
- 자세한 규칙: `scripts/claude-designer.md` / `scripts/gpt-designer.md`.

---

## 7. 자가검증 체크리스트 (디자인 종료 전)

- [ ] **§4 대조표의 "폐기" 패턴을 베끼지 않았는가** (점선·ㄱㄴ 코너브래킷·일반 카드의 먹색 하드오프셋)
- [ ] 신문 강조 섹션이면 **진영색 하드오프셋 + 한자/숫자 워터마크** 같은 현재 어휘를 썼는가 (표본: `learn-hub.css`)
- [ ] 색·간격·폰트를 **토큰/`var()`/Tailwind 토큰 클래스**로 적용(raw hex 없음)했는가
- [ ] 한글 `word-break: keep-all` · 4-테마/다크 토큰 자동 전환 · a11y(focus-visible·탭타깃·대비·reduced-motion)
- [ ] 수정이 해당 페이지 CSS scope 안에 머무는가
- [ ] `.tsx`를 건드렸다면 `npm run lint`(`tsc --noEmit`) 통과했는가
- [ ] 기능·백엔드(AI 엔드포인트·Firestore·토론 흐름)는 건드리지 않았는가
