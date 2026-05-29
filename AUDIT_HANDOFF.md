# 감사 체크리스트 적용 — 작업 인계 문서

> `AUDIT_CHECKLIST.md`(51개 항목) 중 **코드로 안전하게 끝낼 수 있는 고레버리지 항목**을 이번 세션에 적용했습니다.
> 나머지는 ① 사용자님이 콘솔/결제에서 직접 해야 하는 것, ② 서버(Cloud Functions) 인프라가 필요한 것이라 아래에 순서·명령어와 함께 정리했습니다.
> **비개발자 기준으로 그대로 따라 할 수 있게** 적었습니다.

> **🔄 통합 상태:** 이 작업은 처음 옛 베이스(`582a719`, 라이브보다 35커밋 뒤)에서 만들어졌으나,
> 이후 **현재 `main`(`d9d7fbf`) 위로 재통합**했습니다. 충돌 5개 파일(App.tsx·index.html·index.css
> ·LearnView·LegalPages)은 main 최신본에 맞춰 재적용, 나머지는 그대로 적용. lint·test(8)·build
> ·cloud-functions·런타임 렌더 모두 확인. 재평가: **#14는 main에 이미 구현됨**(비공개 방 로비 숨김)
> → 미적용. **#42(onboarding→t)·#44(로비 EN 잔존 한국어 4건)는 통합 후 처리 완료.** #28(4테마 대비)
> ·#29(VoteBar 밀도 토큰화)·#44 잔여(room/profile/verdict 등 로그인·인룸 화면 EN 점검)는 시각·로그인
> 검증이 필요해 **사용자 확인 영역**. **#27(DESIGN.md)는 main에도 없음** → N/A 유지.

---

## ✅ 이번 세션에 끝낸 것 (코드 — 검토 후 배포만 하면 됨)

| 항목 | 내용 | 파일 |
|---|---|---|
| **#3 #10 #13** | Firestore 룰 강화: 남의 방 덮어쓰기 차단(참가자/빈좌석만 수정), 점유된 좌석 강탈 차단, 가짜 사회자 메시지 차단(`moderator`는 방장만) | `firestore.rules` |
| **#15 #39** | 보안 헤더(X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) + CSP(우선 Report-Only) + 에셋 캐시 정책 | `public/_headers` |
| **#21 #22** | 배포 인프라 파일 신규 생성(룰·인덱스 배포 경로) | `firebase.json`, `firestore.indexes.json`, `.firebaserc` |
| **#49 #50** | 아이폰 홈인디케이터/노치 가림 해결: 고정 버튼·토스트·앱 하단에 `safe-area-inset` 적용 | `float-lobby.css`, `toast.css`, `index.css`, `App.tsx` |
| **#31** | 토론 중 실시간 득표/% 숨김(편승 방지) → 참여 인원만 표시, 결과는 종료 후 공개 | `App.tsx` |
| **#32** | 승부 가중치 "관전자 50% + AI 50%" 화면 고지 | `App.tsx` |
| **#18** | 로비 구독에 `limit(100)` 추가(read 비용 폭증 방지) | `App.tsx` |
| **#14(부분)** | 비공개 방을 공개 로비 목록에서 제외(클라이언트) — 완전한 read 게이팅은 아래 참조 | `App.tsx` |
| **#45** | 광고 고지를 "향후 표시할 수 있습니다" → **현재형**("게재하고 있습니다")으로 수정 | `LegalPages.tsx` |
| **#46** | 개인정보처리방침에 "아동의 개인정보 보호"(만14세·법정대리인·AdSense 아동정책) 조항 추가 | `LegalPages.tsx` |
| **#30** | 폰트 `@import`(직렬 렌더블로킹) → `<head>`의 `<link>`로 이동(병렬 로드·display=swap 유지) | `index.html`, `index.css` |
| **#36** | `LearnView`의 `dangerouslySetInnerHTML` 제거 → 안전한 JSX 볼드 파서 | `LearnView.tsx` |
| **#37 #38** | 채팅·관전 채팅 `role="log"`/`aria-live`, 작동하는 skip-link + `<main id>` 랜드마크 | `App.tsx`, `ChatPanel.tsx` |
| **#23 #26** | 승부·verdict 로직을 순수 모듈로 분리 + 단위 테스트 8개(verdict 누락 명시 처리) | `lib/verdict.ts(.test)` |
| **STEP 2 (#4 #5 #9 #12 #19 #20)** | 서버 권위 종료/정리 함수 3종 작성·타입체크·빌드 완료 (**배포 대기**) | `cloud-functions/` |
| **#22(부분)** | CI 워크플로 — push/PR 시 lint·test·build·functions 타입체크 자동 게이트 | `.github/workflows/ci.yml` |
| **#24** | AI 프롬프트 6종을 `_shared/prompts.ts` **단일 소스**로 통합 — server.ts·Cloudflare 함수가 함께 import(글자단위 드리프트 제거) + verdict/topics 파서 공용화 | `functions/_shared/prompts.ts` + 7파일 |

> 타입체크(`npm run lint`)·빌드(`npm run build`)·테스트(`npm test`, 8 pass) 모두 통과. 코드 변경들은 **서로 의존 없이** 배포 순서와 무관하게 안전합니다.

---

## ⚠️ 지금 바로 하셔야 하는 일 (제가 못 하는 부분)

### 1) 🔴 Anthropic API 키 재발급 (#1) — 가장 급함

`.env`는 git에 커밋돼 있지 않지만(안전), 체크리스트에 키 유출 정황이 있어 **재발급이 안전합니다.**

1. https://console.anthropic.com → **Settings → API Keys**
2. 기존 키 옆 **⋯ → Revoke(폐기)**
3. **Create Key**로 새 키 발급 → 복사
4. 적용할 곳 **2군데**:
   - 로컬 `.env` 파일의 `ANTHROPIC_API_KEY=` 값 교체
   - **Cloudflare Pages** → 프로젝트 → Settings → **Environment variables** → `ANTHROPIC_API_KEY` 값 교체 → **Save** 후 재배포
5. ※ `VITE_FIREBASE_*` 키들은 **공개돼도 되는 값**이라 재발급 불필요합니다(혼동 주의).

### 2) Firestore 룰 + 인덱스 배포 (위 #3 #13 #21 적용)

코드(App.tsx 등)는 GitHub `main`에 push하면 Cloudflare가 자동 배포하지만, **Firestore 룰은 별도로 배포**해야 합니다.

```bash
# 최초 1회: Firebase CLI 설치 + 로그인
npm install -g firebase-tools
firebase login

# .firebaserc 의 "YOUR_FIREBASE_PROJECT_ID" 를 실제 프로젝트 ID로 교체
#   (Firebase 콘솔 → 프로젝트 설정 → 프로젝트 ID. 보통 ddatebattle 같은 형태)

# 룰 + 인덱스 배포
firebase deploy --only firestore
```

**배포 후 꼭 확인** (룰이 앱을 깨지 않았는지):
- [ ] 로그인 → 방 만들기 → 정상 생성
- [ ] 다른 계정/시크릿창으로 그 방에 입장(찬성/반대 좌석 잡기) → 정상
- [ ] 발언 전송 → 정상 / 관전자 투표 → 정상
- [ ] 토론 종료까지 진행 → 정상

문제가 생기면 즉시 롤백: 이전 `firestore.rules`로 되돌려 `firebase deploy --only firestore:rules` 재실행(git 이력에 있음).

### 3) CSP를 "감시(Report-Only)" → "차단"으로 승격 (#15)

지금 `public/_headers`의 CSP는 **Report-Only**라 아무것도 막지 않습니다(안전). 배포 후:
1. 사이트 접속 → 브라우저 F12 → Console에서 `Content-Security-Policy` 위반 경고가 있는지 확인
2. **Google 로그인 + 광고 + 폰트**가 정상인지 확인
3. 경고가 없으면 `_headers`에서 `Content-Security-Policy-Report-Only:` → `Content-Security-Policy:` 로 한 글자만 바꿔 차단 모드로 승격
   (위반 경고가 있으면 그 도메인을 해당 지시문에 추가 후 승격)

---

## 🏗️ STEP 2 — Cloud Functions (✅ 코드 작성 완료, 배포만 남음)

체크리스트의 **핵심**. 무결성 항목을 서버 권한으로 흡수합니다. **코드·타입체크·빌드까지 끝냈고**, 앱은 함수 배포 전에도 **폴백(기존 클라 로직)** 으로 정상 동작하도록 만들어 두었습니다 — 즉 **배포해도 안 깨지고, 배포 안 해도 안 깨집니다.**

### 작성된 함수 (`cloud-functions/src/index.ts`)
1. **`closeDebate`** (callable) — 서버가 `roomId`로 발언을 **직접 조회**(가짜 transcript 차단) → AI 판정 → 관전자 투표 서버 집계 → `winner`/`finalProScore` 확정 → **양측 전적을 Admin 권한으로 원자적 기록**. → **#5 #9 #12 #4 해결**
2. **`recursiveDeleteRoom`** (onDocumentDeleted 트리거) — 방 삭제 시 하위 컬렉션 cascade 삭제. → **#19**
3. **`cleanupExpiredRooms`** (스케줄, 매시간) — 2시간 지난 방 자동 정리. → **#20**

> 클라이언트(`App.tsx`)는 종료 시 `closeDebate`를 먼저 호출하고, 실패/미배포면 기존 로직으로 폴백합니다. 전적 effect엔 `statsRecorded` 가드를 넣어 서버가 기록하면 클라가 **이중 집계하지 않습니다.**

### 배포 절차 (순서대로)

```bash
# 1) Firebase 콘솔에서 Blaze(종량제) 요금제로 전환 (Functions 필수). 이 트래픽 규모면 사실상 무료.

# 2) 위 "2) Firestore 룰 배포"에서 firebase-tools 설치 + 로그인 + .firebaserc 프로젝트 ID 교체가 끝난 상태여야 함

# 3) Anthropic 키를 Functions 시크릿으로 등록 (재발급한 새 키 붙여넣기)
firebase functions:secrets:set ANTHROPIC_API_KEY

# 4) 함수 배포 (predeploy 로 자동 빌드됨)
firebase deploy --only functions
```

**배포 후 확인:**
- [ ] 토론을 끝까지 진행 → 마무리 사회자 멘트가 뜨고, 승부·점수가 표시되는지
- [ ] 양쪽 플레이어의 전적이 1씩 증가하는지 (프로필)
- [ ] Firebase 콘솔 → Functions → 로그에 `closeDebate` 정상 실행 기록
- [ ] 방 삭제 시 하위 발언/투표 문서까지 사라지는지(#19), 2시간 후 자동 정리(#20)
- ※ 함수 리전은 `us-central1`. 바꾸려면 `src/firebase.ts`의 `getFunctions(app, '<region>')`도 같이 바꿔야 함.

### 🔒 마지막 — 함수가 정상 동작 확인된 *후에만* 룰을 더 좁히기 (#4 완전 차단)

지금 룰은 폴백이 동작하도록 클라이언트의 승부/전적 쓰기를 **아직 허용**합니다. `closeDebate`가 잘 도는 걸 확인한 뒤, `firestore.rules`를 아래처럼 좁히고 `firebase deploy --only firestore:rules` 재배포하면 클라이언트의 전적/승부 위조가 **완전히** 막힙니다(이후 종료는 서버 함수만 가능).

```
// users — 전적 필드는 클라가 직접 못 바꾸게 (서버 함수만 Admin 권한으로 기록)
match /users/{uid} {
  allow read: if true;
  allow create: if isSignedIn() && request.auth.uid == uid;
  allow update: if isSignedIn() && request.auth.uid == uid
    && !request.resource.data.diff(resource.data).affectedKeys().hasAny([
         'winsVsHuman','lossesVsHuman','tiesVsHuman',
         'winsVsAi','lossesVsAi','tiesVsAi','totalDebates',
         'winsAsPro','winsAsCon','lossesAsPro','lossesAsCon','ties'
       ]);
  allow delete: if false;
}

// rooms update — 참가자 분기에 아래 두 줄을 AND 로 추가 (승부/종료는 서버만)
//   && !request.resource.data.diff(resource.data).affectedKeys()
//        .hasAny(['winner','aiPick','finalProScore','statsRecorded'])
//   && request.resource.data.status != 'ended'
```

### 아직 남은 STEP 2-B (별도, 더 큼)
- **#6 #7 #8** 진행 자체(phase 전이·AI 발언·타이머·AFK)를 서버 권위로 — `advanceDebate` 함수. 방장 브라우저 SPOF를 없애는 작업. closeDebate가 안정화된 뒤 진행 권장.

---

## 📋 아직 안 한 항목 (우선순위순)

### 서버 — ✅ 코드 작성 완료, **배포만** 하면 닫힘 (위 STEP 2)
- **#4 #5 #9 #12** 전적·판정 위조/누락 — `closeDebate` 배포 + 강화 룰 적용 시 완전 차단
- **#19 #20** 고아 문서·만료 방 정리 — `recursiveDeleteRoom`/`cleanupExpiredRooms` 배포 시 자동 동작

### 서버 — 아직 코드도 미작성 (STEP 2-B, 가장 큼)
- **#6 #7 #8** 진행 자체의 서버 권위화(SPOF 제거·턴 타이머·AFK·멱등) — `advanceDebate`. closeDebate 안정화 후 권장

### 코드로 가능하지만 위험/범위가 커 분리
- **#2** AI 엔드포인트 인증·레이트리밋: 브라우저가 Firebase ID 토큰을 함께 보내고 엣지(Functions)에서 검증 + uid/IP 제한 + 오리진 allowlist. 클라이언트·서버 양쪽 수정이라 별도 진행 권장.
- **#14(완전판)** 비공개 방 read 게이팅: 룰에서 참가자만 읽기 허용하려면 **로비 쿼리를 `where('isPrivate','==',false)`로 바꾸고 복합 인덱스 추가**가 함께 가야 함(안 그러면 로비가 통째로 깨짐). + 관전자가 비공개 방을 못 보게 되는 **동작 변경**이라 의도 확인 필요. (지금은 로비 목록에서 숨기는 것까지만 적용.)
- **#16** 동의 배너 → 광고 실제 게이팅 연결: 잘못 연결하면 광고 수익이 멈출 수 있어 신중히. (현 동의 배너는 장식 상태.)
- ✅ **#24 완료** — 프롬프트 6종을 `functions/_shared/prompts.ts` 단일 소스화(server.ts + Cloudflare 함수 공용). verdict/topics 파서도 통합. (verdict 정규식은 런타임이 다른 client `lib/verdict`·firebase `cloud-functions`에도 사본이 있으며 주석으로 동기화 표시 — 완전 통합은 공유 패키지 필요.)
- **#25** `App.tsx` 3,500줄 분해(상태머신/데이터/AI/라우팅).
- ✅ **#23 #26** 승부계산·verdict 파싱 단위 테스트 완료(`lib/verdict`). advancePhase 전체 테스트는 STEP 2-B 후속.

### 콘텐츠/디자인/접근성 (독립적)
- ✅ **#30 폰트 · #36 innerHTML · #37 #38 a11y** — 이번 세션 완료(위 표)
- ✅ **#43** landing.ts ko/en 키 1:1 대칭 — **점검 결과 이상 없음**(코드 변경 불필요)
- ⚪ **#42 #44 (이 브랜치 미적용)** — 이 브랜치엔 chrome i18n(`useLocale`의 `t`)·onboarding i18n이 **없음**(landing 전용). MEMORY의 i18n 시스템은 다른 브랜치 소속.
- ⚪ **#27 (이 브랜치 미적용)** — 이 브랜치엔 **`DESIGN.md`가 없음** → 문서–실제 불일치 항목 해당 없음. **#28**(4테마 AA 대비)는 테마 시스템 도입 시 검증.
- ⚪ **#29 (이 브랜치 거의 미적용)** — 이 브랜치엔 `--density` 토큰 시스템·`VoteBar` 컴포넌트가 없음(투표바는 App.tsx 인라인). 토큰 시스템 도입 시 함께.
- **#33 #34** 관전자 0명·AI 대전 시 판정 문구 분기 (서버 `closeDebate`에 0표→AI 단독 폴백 주석/로직 있음).

### 사용자 정보/법무
- **#47** 개인 Gmail 연락처 → 도메인 메일(예: `contact@ddatebattle.site`) 발급 후 `LegalPages.tsx`의 `CONTACT_EMAIL` 교체. (없는 주소로 바꾸면 문의가 끊기므로 **발급 후** 교체하세요.)
- **#48** 사업자/운영주체 정보 표기(AdSense 수익 발생 시) — 운영 형태 결정 후 About/Contact에 명시.

---

## 🚀 배포 순서 요약

1. (먼저) **API 키 재발급** + Cloudflare 환경변수 교체 → 재배포
2. 이 브랜치를 검토 후 `main`에 merge/push → **Cloudflare 자동 배포** (코드·_headers·CSS·법무·테스트)
3. **`firebase deploy --only firestore`** → 룰·인덱스 배포
4. (STEP 2) **Blaze 전환 → `firebase functions:secrets:set ANTHROPIC_API_KEY` → `firebase deploy --only functions`**
5. "배포 후 확인" 체크리스트로 로그인·방 생성·발언·투표·**종료(전적·마무리 멘트)** 점검
6. `closeDebate` 정상 확인 후 **강화 룰**(§🔒) 적용 → `firebase deploy --only firestore:rules`
7. CSP 위반 없으면 Report-Only → 차단 모드 승격

코드/룰/함수 배포는 **서로 의존 없이**(closeDebate는 폴백 내장) 어느 쪽을 먼저 해도 앱이 깨지지 않게 설계했습니다.

---

*적용: AUDIT_CHECKLIST.md 기준. 이번 세션 = 안전·고레버리지 코드 항목 + 인프라 파일. 다음 세션 후보 = STEP 2 Cloud Functions(가장 큰 레버리지).*
