# 토론배틀 — 어도비 디자인 내보내기 (Adobe Export)

이 폴더의 파일은 **어도비 일러스트레이터(Adobe Illustrator)** 에서 바로 열어 편집할 수 있는
**SVG 벡터 파일**입니다. 사이트의 실제 디자인 토큰(색·폰트·간격·모서리·그림자)을 그대로 옮겼습니다.

> 출처(정본): [`DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) · `src/design-system/colors_and_type.css`
> 모든 색·치수는 위 파일의 값과 일치합니다.

---

## 무엇이 들어있나

| 파일 | 내용 |
|---|---|
| `design-system.svg` | **디자인 시스템 시트** — 색 팔레트(HEX 표기)·타이포 스케일·버튼/카드/도장/뱃지 컴포넌트. 디자이너에게 넘기는 표준 핸드오프. |
| `screens/01-landing.svg` | 랜딩(첫 방문) 화면 |
| `screens/02-lobby.svg` | 로비(토론장 목록) 화면 |
| `screens/03-room.svg` | 토론방(1:1 + 사회자 HUD) 화면 |
| `screens/04-verdict.svg` | 판정(승부 결과) 화면 |
| `screens/05-learn.svg` | 자료실 입구 화면 |
| `assets/logo-icon.svg` | 앱 아이콘 / 로고 (정사각) |
| `assets/logo-icon-maskable.svg` | 마스커블 아이콘 (PWA 안전영역) |
| `assets/og-card.svg` | 공유 카드(Open Graph, 1200×630) |

---

## 일러스트레이터에서 여는 법

1. Illustrator → **File ▸ Open** → `.svg` 파일 선택.
2. 열 때 대화상자가 뜨면 **"Cascading Style Sheets (CSS) ▸ Convert Styles to Attributes"** 를 권장합니다
   (스타일이 도형 속성으로 풀려 편집이 쉬워집니다).
3. 텍스트는 **편집 가능한 글자 객체**로 들어옵니다 — 더블클릭해 내용·크기·색을 바꿀 수 있습니다.
4. 색·도형도 모두 개별 벡터 객체라 자유롭게 수정·재배치할 수 있습니다.

### 폰트 안내 (중요)
SVG에는 폰트 **이름만** 들어있고 폰트 파일은 포함되지 않습니다. 똑같이 보이게 하려면
아래 무료 폰트를 시스템에 설치하세요. 없으면 일러스트레이터가 대체 글꼴로 보여줍니다(레이아웃은 유지).

| 용도 | 폰트 | 받는 곳 |
|---|---|---|
| 본문·UI | **Pretendard** | github.com/orioncactus/pretendard |
| 헤드라인(명조) | **Nanum Myeongjo** | Google Fonts |
| 손글씨 악센트 | **Gaegu** | Google Fonts |
| 라벨·수치 | **IBM Plex Mono** | Google Fonts |

---

## 솔직한 한계 (꼭 읽어주세요)

- 이 파일들은 **사이트의 실제 토큰으로 그린 정밀 목업**이지, 브라우저 화면을 그대로 떠낸 스크린샷이 아닙니다.
  (방·판정·로비는 실시간 Firebase 데이터로 그려지므로 자동 캡처가 불가능합니다 — 그래서 정본 토큰으로 재현했습니다.)
- `.psd`(포토샵)·`.ai`(일러스트레이터 원본)·`.xd` 같은 **바이너리 포맷은 코드에서 만들 수 없습니다.**
  SVG가 코드→어도비 편집의 가장 깔끔하고 정확한 경로입니다. 일러스트레이터에서 열어 `.ai`로 저장하면 됩니다.
- CSS의 `box-shadow`·`color-mix`·그라데이션 일부는 SVG에서 근사치로 표현됩니다(시각적으로는 거의 동일).

---

## 색·치수 빠른 참조

```
paper        #f6f0e2   페이지 배경(따뜻한 크림)
paper-light  #fcf6e8   카드 표면
paper-deep   #ece3d0   가라앉은 패널
line         #e3d9c2   헤어라인 1px
ink          #1a0f08   본문 글자
ink-soft     #3d2a1e   보조 글자
ink-fade     #7a6450   흐린 글자
vermillion   #c84b1f   찬성(PRO) · CTA
celadon      #2d4a5a   반대(CON)
gold         #b8842a   AI 사회자 · 보상
sage         #4f7a64   무대(stage) 패널 녹색
forest       #1f2a24   가장 깊은 패널

모서리   sm 8 · md 14 · lg 18 · xl 24 · pill 999
그림자   sm 0 2 8 / md 0 10 24 / lg 0 28 54 (warm blur)
```
