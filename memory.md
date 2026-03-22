# memory.md — 상태 & 히스토리

> AI가 현재 프로젝트 진행 상태를 파악하는 저장소. 세션 끊김 대비.
> 작업 시작/완료 시마다 이 파일을 업데이트할 것.

---

## 현재 상태 (2026-03-22)

- **Backend:** OCI에 배포 완료, Neon/Upstash/Clerk 연동 완료
- **Web:** Cloudflare Pages 대기 (대시보드에서 프로젝트 생성 필요)
- **Mobile:** Dev Build APK 설치 완료, Metro 서버 연결 성공, 로그인 동작 확인
- **테스트:** 155개 전체 pass (Backend 91 + Mobile 42 + Web 22)
- **Sentry:** 연동 완료, API 토큰으로 에러 조회 가능
- **CI/CD:** GitHub Actions 테스트→빌드→배포 자동화 완료

---

## 미해결 사항

- [ ] Cloudflare Pages 프로젝트 생성 — 유저가 대시보드에서 진행
- [ ] ClerkAuthGuard 미적용 — friends/chat-rooms/messages 컨트롤러 (현재 userId 쿼리파라미터 방식 유지)
- [ ] Maestro E2E 테스트 자동화 설정

---

## 다음 작업 예정

- feat/friend-sync 브랜치 → main PR & merge
- 앱 기능 테스트 (전화번호 설정, 친구 동기화, 초성 검색)
- SW.md 업데이트 (새 API, DB 스키마 반영)

---

## 전체 개발 리스트

| Date | Task | Result |
|------|------|--------|
| 2026-03-14 | 프로젝트 초기화 - Expo SDK 54 기반 React Native 프로젝트 생성 | 완료 |
| 2026-03-14 | 프론트엔드 메신저 UI 구현 - 채팅 리스트, 채팅방, 친구 관리, 새 채팅 생성 화면 | 완료 |
| 2026-03-14 | 파스텔톤 테마 시스템 구축 - light/dark 모드, 확장된 색상 팔레트 | 완료 |
| 2026-03-14 | 로컬 DB 서비스 구현 - AsyncStorage 기반 채팅방/메시지/친구 CRUD + 검색 | 완료 |
| 2026-03-14 | Socket.io 클라이언트 서비스 구현 - 실시간 통신 기반 구조 | 완료 |
| 2026-03-14 | 타입 정의 생성 - User, ChatRoom, Message, Friend 인터페이스 | 완료 |
| 2026-03-14 | UI 컴포넌트 생성 - SearchBar, ChatRoomItem, MessageBubble, FriendItem | 완료 |
| 2026-03-14 | 패키지 설치 - expo-sqlite, AsyncStorage, socket.io-client, expo-contacts 등 | 완료 |
| 2026-03-15 | 모노레포 재구조화 - apps/mobile, apps/web, apps/backend, packages/shared | 완료 |
| 2026-03-15 | npm workspaces 설정 - 루트 package.json, @basemsg/shared 추출 | 완료 |
| 2026-03-15 | GitHub 연동 - remote: muje2002/basemsg-firebase-claude | 완료 |
| 2026-03-15 | Phase 1: Backend 인프라 (feat/phase1-backend → merged) | 완료 |
| 2026-03-15 | - Docker Compose, NestJS 5개 모듈, TypeORM, Socket.io Gateway, Seed, 테스트 70개 | 완료 |
| 2026-03-15 | Phase 2: Mobile 백엔드 연동 (feat/phase2-mobile-integration → merged) | 완료 |
| 2026-03-15 | - API 클라이언트, Socket.io 연동, 파일첨부, 이모티콘, 테스트 42개 | 완료 |
| 2026-03-15 | Phase 3: Web 프론트엔드 (feat/phase3-web-frontend → merged) | 완료 |
| 2026-03-15 | - Vite+React, 3-panel 레이아웃, 파스텔톤 테마, 테스트 22개 | 완료 |
| 2026-03-15 | Phase 4: 통합 테스트 & CI/CD (feat/phase4-testing-cicd → merged) | 완료 |
| 2026-03-15 | - Feature 11개, E2E 10개, GitHub Actions, 듀얼 DB 지원 | 완료 |
| 2026-03-18 | 배포 환경 설정 - OCI, Neon, Upstash, Clerk 연동 | 완료 |
| 2026-03-18 | Web Clerk 인증 연동 - @clerk/react, Bearer 토큰, 빌드 성공 | 완료 |
| 2026-03-21 | package-lock.json 동기화 (CI npm ci 실패 해결) | 완료 |
| 2026-03-21 | CI/CD 수정 — deploy timeout 60m, 고스트 컨테이너 정리 | 완료 |
| 2026-03-21 | react-native-reanimated 제거, React Compiler 비활성화 | 완료 |
| 2026-03-21 | React 중복 인스턴스 해결 — 루트 react 19.1.0 고정, metro.config.js | 완료 |
| 2026-03-21 | Expo EAS dev build — Android APK 빌드 성공, 스마트폰 설치 | 완료 |
| 2026-03-21 | Metro 서버 설정 — start-metro.bat, Windows 시작 프로그램, Tailscale | 완료 |
| 2026-03-21 | Sentry 에러 모니터링 연동 — @sentry/react-native, API 에러 캡처 | 완료 |
| 2026-03-22 | 로그인 디버깅 — Clerk needs_second_factor 해결, 에러 로깅 개선 | 완료 |
| 2026-03-22 | Jest Sentry mock 추가 — mobile 테스트 ESM 에러 해결 | 완료 |
| 2026-03-22 | MD 파일 체계 재구성 — 5개 파일 구조로 변경 | 완료 |
| 2026-03-22 | 친구 동기화 시스템 구현 (feat/friend-sync) | 완료 |
| 2026-03-22 | - phone.utils (정규화, 해시, 초성 추출) + 테스트 17개 | 완료 |
| 2026-03-22 | - ContactUpload, PendingFriend 엔티티, User 스키마 변경 | 완료 |
| 2026-03-22 | - POST /users/set-phone, POST /friends/sync-contacts API | 완료 |
| 2026-03-22 | - 미가입 친구 pending → 가입 시 자동 추가 로직 | 완료 |
| 2026-03-22 | - setup-phone.tsx 화면, 네비게이션 가드, 초성 검색 | 완료 |
| 2026-03-22 | - 전체 테스트 173개 pass (Backend 109 + Mobile 42 + Web 22) | 완료 |

---

## 테스트 현황 (Total: 155)

| 영역 | Layer | 개수 |
|------|-------|------|
| Backend Unit | Layer 1 | 88 |
| Backend Feature | Layer 2 | 11 |
| Backend E2E | Layer 3 | 10 |
| Mobile Unit | Layer 1 | 42 |
| Web Unit | Layer 1 | 22 |

---

## Git 브랜치 이력

| Branch | 내용 | 상태 |
|--------|------|------|
| `main` | 메인 브랜치 | 최신 |
| `feat/phase1-backend` | Backend 인프라 & API | merged |
| `feat/phase2-mobile-integration` | Mobile 백엔드 연동 | merged |
| `feat/phase3-web-frontend` | Web 프론트엔드 | merged |
| `feat/phase4-testing-cicd` | 통합 테스트 & CI/CD | merged |
