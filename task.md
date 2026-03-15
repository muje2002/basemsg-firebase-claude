# basemsg 개발 현황 및 계획

## 현재 구현 현황

| 영역 | 상태 | 상세 |
|------|------|------|
| Mobile UI | ✅ 완료 | 채팅방 목록, 메시지 화면, 친구 관리 (로컬 mock 데이터) |
| 로컬 저장소 | ✅ 완료 | AsyncStorage 기반 CRUD, 검색 |
| 테마 시스템 | ✅ 완료 | 라이트/다크 모드, 파스텔 톤 |
| Socket.io Client | ✅ 완료 | 채팅 화면 연동, join/leave/receive |
| 파일/이미지/동영상 | ✅ 완료 | expo-image-picker, document-picker 연동 |
| 이모티콘 | ✅ 완료 | 80개 이모지 피커, emoji 타입 메시지 |
| Backend API | ✅ 완료 | NestJS — Users, Friends, ChatRooms, Messages, Gateway |
| DB (PostgreSQL/Redis) | ✅ 완료 | TypeORM entities, docker-compose 구성 |
| Docker | ✅ 완료 | PostgreSQL 16 + Redis 7 컨테이너 |
| Web Frontend | ❌ 미구현 | package.json만 존재 |
| 테스트 (Backend) | ✅ 완료 | 6 suites, 70 tests pass |
| 인증 | ❌ 미구현 | 하드코딩된 user ID |

---

## Phase 1: 인프라 & 백엔드 기반 (중규모 — branch: `feat/phase1-backend`)

### 1-1. Docker 환경 구성
- [x] `docker-compose.yml` 생성 (PostgreSQL, Redis)
- [x] `.env.example` 환경변수 템플릿
- [ ] Docker 컨테이너 기동 확인

### 1-2. NestJS 백엔드 프로젝트 초기화
- [x] NestJS 프로젝트 셋업 (`apps/backend/`)
- [x] TypeORM + PostgreSQL 연결
- [x] Redis 연결 (ioredis)
- [x] 기본 모듈 구조 생성
- [x] CORS, validation pipe 등 글로벌 설정

### 1-3. DB 스키마 & Entity
- [x] `User` entity
- [x] `Friend` entity (관계 테이블)
- [x] `ChatRoom` entity
- [x] `ChatRoomParticipant` entity
- [x] `Message` entity
- [x] TypeORM synchronize (dev mode)

### 1-4. Backend API 모듈
- [x] **Users** — POST /users, GET /users, GET /users/:id
- [x] **Friends** — POST /friends, DELETE /friends/:friendId, GET /friends
- [x] **ChatRooms** — POST /chat-rooms, DELETE /chat-rooms/:id/leave, GET /chat-rooms, GET /chat-rooms/:id
- [x] **Messages** — GET /chat-rooms/:roomId/messages, POST /chat-rooms/:roomId/messages

### 1-5. Socket.io Gateway
- [x] NestJS WebSocket Gateway 구현
- [x] 실시간 메시지 송수신 (message:send / message:receive)
- [x] 채팅방 입장/퇴장 (room:join / room:leave)
- [x] 인메모리 소켓 세션 관리

### 1-6. Seed 데이터
- [x] 테스트용 사용자 6명
- [x] 친구 관계 설정 (양방향)
- [x] 샘플 채팅방 4개 + 메시지
- [x] `npm run seed` 명령으로 실행 가능

### 1-7. Backend 단위 테스트
- [x] Users module 테스트 (controller + service)
- [x] Friends module 테스트
- [x] ChatRooms module 테스트
- [x] Messages module 테스트
- [x] Gateway 테스트
- [x] 6가지 입력 카테고리 적용 (6 suites, 70 tests pass)

---

## Phase 2: 모바일 앱 백엔드 연동 (중규모 — branch: `feat/phase2-mobile-integration`)

### 2-1. API 클라이언트
- [x] REST API 호출 서비스 (`services/api.ts`)
- [x] Users, Friends, ChatRooms, Messages 엔드포인트

### 2-2. Socket.io 실시간 연동
- [x] 채팅 화면 Socket.io 이벤트 리스너 연결
- [x] 실시간 메시지 수신 시 UI 업데이트 (중복 방지)
- [x] 채팅방 입장/퇴장 이벤트

### 2-3. 파일/이미지/동영상 첨부
- [x] expo-image-picker (사진/동영상 선택 + 카메라)
- [x] expo-document-picker (파일 선택)
- [x] MessageBubble 첨부파일 타입 아이콘 표시

### 2-4. 이모티콘
- [x] 이모티콘 피커 UI (80개 이모지)
- [x] 이모티콘 메시지 송수신

### 2-5. 모바일 테스트
- [x] API 클라이언트 단위 테스트 (25 tests)
- [x] Socket 서비스 단위 테스트 (17 tests)
- [x] 6가지 입력 카테고리 적용 (총 42 tests pass)

---

## Phase 3: 웹 프론트엔드 (중규모 — branch: `feat/phase3-web-frontend`)

### 3-1. 웹 프로젝트 초기화
- [ ] React (Next.js 또는 Vite) 셋업
- [ ] @basemsg/shared 타입 공유

### 3-2. 웹 UI 구현
- [ ] 3-tab 구조 (채팅방 목록, 채팅방, 친구 관리)
- [ ] 파스텔톤 UI 테마
- [ ] 반응형 레이아웃

### 3-3. 백엔드 연동
- [ ] API + Socket.io 연동
- [ ] 웹 로컬 저장소 (localStorage/IndexedDB)

### 3-4. 웹 테스트
- [ ] 컴포넌트 + 서비스 단위 테스트

---

## Phase 4: 통합 & 마무리

### 4-1. Feature 테스트 (Layer 2)
- [ ] 모듈 간 연동 테스트

### 4-2. Scenario 테스트 (Layer 3)
- [ ] E2E 사용자 여정 테스트

### 4-3. CI/CD
- [ ] GitHub Actions 파이프라인
