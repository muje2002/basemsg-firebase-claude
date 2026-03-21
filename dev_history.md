# Dev History

| Date | Task | Result |
|------|------|--------|
| 2026-03-14 | 프론트엔드 메신저 UI 구현 - 채팅 리스트, 채팅방, 친구 관리, 새 채팅 생성 화면 | 완료 |
| 2026-03-14 | 파스텔톤 테마 시스템 구축 - light/dark 모드, 확장된 색상 팔레트 | 완료 |
| 2026-03-14 | 로컬 DB 서비스 구현 - AsyncStorage 기반 채팅방/메시지/친구 CRUD + 검색 | 완료 |
| 2026-03-14 | Socket.io 클라이언트 서비스 구현 - 실시간 통신 기반 구조 | 완료 |
| 2026-03-14 | 타입 정의 생성 - User, ChatRoom, Message, Friend 인터페이스 | 완료 |
| 2026-03-14 | UI 컴포넌트 생성 - SearchBar, ChatRoomItem, MessageBubble, FriendItem | 완료 |
| 2026-03-14 | 패키지 설치 - expo-sqlite, AsyncStorage, socket.io-client, expo-contacts 등 | 완료 |
| 2026-03-14 | CLAUDE.md 업데이트 - 앱 스펙 반영 (기술스택, UX, DB, 테스트 정책 등) | 완료 |
| 2026-03-14 | dev_history.md 생성 - 개발 히스토리 추적 파일 신규 생성 | 완료 |
| 2026-03-14 | 프로젝트 초기화 - Expo SDK 54 기반 React Native 프로젝트 생성 | 완료 (Firebase Studio) |
| 2026-03-15 | 모노레포 재구조화 - apps/mobile, apps/web, apps/backend, packages/shared | 완료 |
| 2026-03-15 | npm workspaces 설정 - 루트 package.json, 공유 타입을 @basemsg/shared로 추출 | 완료 |
| 2026-03-15 | GitHub 연동 - remote: muje2002/basemsg-firebase-claude, 코드 관리 규칙 설정 | 완료 |
| 2026-03-15 | **Phase 1: Backend 인프라** (branch: feat/phase1-backend → merged) | 완료 |
| 2026-03-15 | - Docker Compose 구성 (PostgreSQL 16 + Redis 7) | 완료 |
| 2026-03-15 | - NestJS 백엔드 전체 구현 (5개 모듈: Users, Friends, ChatRooms, Messages, Gateway) | 완료 |
| 2026-03-15 | - TypeORM entities (User, Friend, ChatRoom, ChatRoomParticipant, Message) | 완료 |
| 2026-03-15 | - Socket.io Gateway 실시간 메시지 송수신 | 완료 |
| 2026-03-15 | - Seed 스크립트 (6명 사용자, 친구 관계, 4개 채팅방, 메시지) | 완료 |
| 2026-03-15 | - Backend 단위 테스트 70개 pass (6가지 입력 카테고리) | 완료 |
| 2026-03-15 | **Phase 2: Mobile 백엔드 연동** (branch: feat/phase2-mobile-integration → merged) | 완료 |
| 2026-03-15 | - API 클라이언트 서비스 (services/api.ts) - 모든 REST 엔드포인트 | 완료 |
| 2026-03-15 | - Socket.io 채팅 화면 실시간 연동 (join/leave/receive) | 완료 |
| 2026-03-15 | - 파일/이미지/동영상 첨부 (expo-image-picker, expo-document-picker) | 완료 |
| 2026-03-15 | - 이모티콘 피커 UI (80개 이모지) + emoji 타입 메시지 | 완료 |
| 2026-03-15 | - Mobile 단위 테스트 42개 pass (API 25 + Socket 17) | 완료 |
| 2026-03-15 | **Phase 3: Web 프론트엔드** (branch: feat/phase3-web-frontend → merged) | 완료 |
| 2026-03-15 | - Vite + React + react-router-dom 프로젝트 셋업 | 완료 |
| 2026-03-15 | - 3-panel 메신저 레이아웃 (사이드바 + 목록 + 채팅방) | 완료 |
| 2026-03-15 | - 채팅방 목록/검색, 메시지 송수신, 이모지 피커, 파일 첨부, 친구 관리 | 완료 |
| 2026-03-15 | - 파스텔톤 CSS 테마 (모바일과 동일 색상) | 완료 |
| 2026-03-15 | - Web API 서비스 + Socket.io 클라이언트 + Vite proxy 설정 | 완료 |
| 2026-03-15 | - Web 단위 테스트 22개 pass | 완료 |
| 2026-03-15 | **Phase 4: 통합 테스트 & CI/CD** (branch: feat/phase4-testing-cicd → merged) | 완료 |
| 2026-03-15 | - Layer 2 Feature 테스트: User→Friend, ChatRoom→Message, Gateway→Message (11 tests) | 완료 |
| 2026-03-15 | - Layer 3 E2E 시나리오 테스트: 전체 사용자 여정 SQLite in-memory (10 tests) | 완료 |
| 2026-03-15 | - GitHub Actions CI 파이프라인 (ci.yml) - test → build | 완료 |
| 2026-03-15 | - Message entity: enum → varchar (SQLite 호환) | 완료 |
| 2026-03-15 | - AppModule: PostgreSQL / SQLite 듀얼 DB 지원 (DB_TYPE 환경변수) | 완료 |
| 2026-03-15 | 실행 테스트 - 백엔드(SQLite) + 웹(Vite) + 모바일(Expo tunnel) 동시 구동 확인 | 완료 |
| 2026-03-18 | **배포 환경 설정** | |
| 2026-03-18 | - CLAUDE.md 배포 환경 업데이트 (OCI, Neon, Upstash, Clerk) | 완료 |
| 2026-03-18 | - Web Clerk 인증 연동 (@clerk/react v6, SignIn/SignUp 컴포넌트, 인증 가드) | 완료 |
| 2026-03-18 | - Web API 환경변수 적용 (VITE_API_URL, VITE_SOCKET_URL, VITE_CLERK_PUBLISHABLE_KEY) | 완료 |
| 2026-03-18 | - Web API Bearer 토큰 인증 추가 (Clerk getToken → Authorization 헤더) | 완료 |
| 2026-03-18 | - Web 빌드 성공 확인 (tsc + vite build) | 완료 |
| 2026-03-18 | - Expo EAS 로그인 | 대기 (계정 비밀번호 확인 필요) |
| 2026-03-18 | - Cloudflare Pages 연동 | 대기 (유저가 대시보드에서 프로젝트 생성) |

## 테스트 현황 (Total: 155 tests)

| 영역 | Layer | 개수 |
|------|-------|------|
| Backend Unit | Layer 1 | 70 |
| Backend Feature | Layer 2 | 11 |
| Backend E2E | Layer 3 | 10 |
| Mobile Unit | Layer 1 | 42 |
| Web Unit | Layer 1 | 22 |
| **Total** | | **155** |

## Git 브랜치 이력

| Branch | 내용 | 상태 |
|--------|------|------|
| `main` | 메인 브랜치 | 최신 |
| `feat/phase1-backend` | Backend 인프라 & API | merged → main |
| `feat/phase2-mobile-integration` | Mobile 백엔드 연동 | merged → main |
| `feat/phase3-web-frontend` | Web 프론트엔드 | merged → main |
| `feat/phase4-testing-cicd` | 통합 테스트 & CI/CD | merged → main |

## GitHub

- Repo: https://github.com/muje2002/basemsg-firebase-claude
- Expo 로그인 계정: `youngkihong`

## 배포 환경

| 서비스 | 플랫폼 | 상태 |
|--------|--------|------|
| Backend | OCI (https://basemsg.duckdns.org) | 배포 완료, Neon/Upstash/Clerk 연동 완료 |
| PostgreSQL | Neon | 연동 완료 |
| Redis | Upstash | 연동 완료 |
| Auth | Clerk | Mobile 연동 완료, Web 연동 완료 |
| Mobile | Expo EAS Build | 대기 (계정 로그인 필요) |
| Web | Cloudflare Pages | 대기 (대시보드에서 프로젝트 생성 필요) |

### Cloudflare Pages 설정 가이드

| 항목 | 값 |
|------|-----|
| Root directory | (비워두기 — 모노레포 루트) |
| Build command | `npm install && npm run build --workspace=@basemsg/web` |
| Build output directory | `apps/web/dist` |
| NODE_VERSION (환경변수) | `20` |
| VITE_API_URL | `https://basemsg.duckdns.org/api` |
| VITE_SOCKET_URL | `https://basemsg.duckdns.org` |
| VITE_CLERK_PUBLISHABLE_KEY | Clerk 대시보드에서 복사 |

## 2026-03-21~22 개발 내역

| Date | Task | Result |
|------|------|--------|
| 2026-03-21 | CLAUDE.md 전면 업데이트 — 프로젝트 전체 정보 통합 (코드구조, API, DB 스키마, 배포, 테마 등) | 완료 |
| 2026-03-21 | package-lock.json 동기화 — expo-dev-client 등 누락 패키지 추가 (CI npm ci 실패 해결) | 완료 |
| 2026-03-21 | CI/CD 수정 — deploy timeout 30m→60m, 고스트 컨테이너 정리 스크립트 추가 | 완료 |
| 2026-03-21 | react-native-reanimated 제거 — v4가 New Architecture 필수 + property is not writable 에러 유발 | 완료 |
| 2026-03-21 | React Compiler 비활성화 — useMemoCache null 에러 해결 | 완료 |
| 2026-03-21 | React 중복 인스턴스 해결 — 루트 package.json에 react 19.1.0 고정, metro.config.js 모노레포 설정 | 완료 |
| 2026-03-21 | Expo EAS dev build — Android APK 빌드 성공, 스마트폰 설치 완료 | 완료 |
| 2026-03-21 | Metro 서버 설정 — start-metro.bat + Windows 시작 프로그램 등록, Tailscale IP 연결 | 완료 |
| 2026-03-21 | Sentry 에러 모니터링 연동 — @sentry/react-native, _layout.tsx 초기화, api.ts 에러 캡처 | 완료 |
| 2026-03-22 | 로그인 에러 디버깅 — Clerk needs_second_factor 해결 (유저 삭제 후 재가입), 에러 로깅 개선 | 완료 |

## 미해결 사항

- Cloudflare Pages 프로젝트 생성 — 유저가 대시보드에서 진행
- 백엔드 friends/chat-rooms/messages 컨트롤러에 ClerkAuthGuard 미적용 (현재 userId 쿼리파라미터 방식 유지)
