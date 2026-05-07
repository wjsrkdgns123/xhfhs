# 🔥 맞짱토론 (Matjjang-Toron)

찬반 1:1 실시간 온라인 토론 + 관전자 투표 MVP.

## 기술 스택
- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Firebase (Google Auth + Firestore)

## 빠른 시작

```bash
npm install
cp .env.example .env   # Firebase 키 입력
npm run dev
```

`http://localhost:5173` 열림.

## Firebase 셋업

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. **웹 앱 추가** → 설정값을 `.env`에 복사
3. **Authentication → Sign-in method**에서 **Google** 활성화
4. **Firestore Database** 생성 (프로덕션 모드)
5. `firestore.rules`의 내용을 **Rules** 탭에 붙여넣고 게시

## 기능

- Google 로그인
- 토론방 생성 (주제 입력)
- 찬성/반대 입장 선점 → 둘 다 모이면 LIVE
- 토론자만 메시지 발송, 관전자는 투표만 가능
- 방 생성자가 종료 → 득표 많은 쪽 승리

## 스크립트

- `npm run dev` — 개발 서버 (Vite + Express 동시 실행)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — TypeScript 타입 체크 (src + functions)

## 배포 (Cloudflare Pages)

프론트엔드는 Cloudflare Pages, 백엔드는 같은 프로젝트의 Pages Functions(`functions/api/ai/*`)로 배포됩니다. 로컬 개발에서는 `server.ts`(Express)가 같은 엔드포인트를 제공합니다.

### 배포 절차

1. GitHub에 저장소 연결
2. Cloudflare Dashboard → Workers & Pages → Pages 프로젝트 생성 → GitHub 연결
3. 빌드 설정:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 환경변수 (Settings → Environment variables, Production):
   - `ANTHROPIC_API_KEY` (시크릿)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
5. Firebase Console → Authentication → Settings → 승인된 도메인에 `*.pages.dev` (또는 정확한 Pages 도메인) 추가
