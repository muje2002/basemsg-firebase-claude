# basemsg 개발 현황 및 계획

## 현재 구현 현황

| 영역 | 상태 | 상세 |
|------|------|------|
| Mobile UI | ✅ 완료 | 채팅방 목록, 메시지 화면, 친구 관리 (로컬 mock 데이터) |
| 로컬 저장소 | ✅ 완료 | AsyncStorage 기반 CRUD, 검색 |
| 테마 시스템 | ✅ 완료 | 라이트/다크 모드, 파스텔 톤 |
| Socket.io Client | ⚠️ 스텁 | 코드 존재, UI 미연결, 서버 없음 |
| 파일/이미지/동영상 | ❌ 스텁 | 타입만 정의, 실제 기능 없음 |
| 이모티콘 | ❌ 미구현 | 타입만 정의, 피커 UI 없음 |
| Backend API | ❌ 미구현 | package.json만 존재 |
| DB (PostgreSQL/Redis) | ❌ 미구현 | 설정 없음 |
| Docker | ❌ 미구현 | docker-compose 없음 |
| Web Frontend | ❌ 미구현 | package.json만 존재 |
| 테스트 | ❌ 미구현 | 테스트 파일 0개 |
| 인증 | ❌ 미구현 | 하드코딩된 user ID |

---

## Phase 1: 인프라 & 백엔드 기반 (중규모 — branch: `feat/phase1-backend`)

### 1-1. Docker 환경 구성
- [ ] `docker-compose.yml` 생성 (PostgreSQL, Redis)
- [ ] `.env.example` 환경변수 템플릿
- [ ] Docker 컨테이너 기동 확인

### 1-2. NestJS 백엔드 프로젝트 초기화
- [ ] NestJS 프로젝트 셋업 (`apps/backend/`)
- [ ] TypeORM + PostgreSQL 연결
- [ ] Redis 연결 (ioredis)
- [ ] 기본 모듈 구조 생성
- [ ] CORS, validation pipe 등 글로벌 설정

### 1-3. DB 스키마 & Entity
- [ ] `User` entity
- [ ] `Friend` entity (관계 테이블)
- [ ] `ChatRoom` entity
- [ ] `ChatRoomParticipant` entity
- [ ] `Message` entity
- [ ] TypeORM migration 생성/실행

### 1-4. Backend API 모듈
- [ ] **Users** — POST /users, GET /users/:id
- [ ] **Friends** — POST /friends, DELETE /friends/:id, GET /friends
- [ ] **ChatRooms** — POST /chat-rooms, DELETE /chat-rooms/:id/leave, GET /chat-rooms
- [ ] **Messages** — GET /chat-rooms/:id/messages, POST /chat-rooms/:id/messages

### 1-5. Socket.io Gateway
- [ ] NestJS WebSocket Gateway 구현
- [ ] 실시간 메시지 송수신 (message:send / message:receive)
- [ ] 채팅방 입장/퇴장 (room:join / room:leave)
- [ ] Redis 기반 소켓 세션 관리

### 1-6. Seed 데이터
- [ ] 테스트용 사용자 5명
- [ ] 친구 관계 설정
- [ ] 샘플 채팅방 4개 + 메시지
- [ ] `npm run seed` 명령으로 실행 가능

### 1-7. Backend 단위 테스트
- [ ] Users module 테스트 (controller + service)
- [ ] Friends module 테스트
- [ ] ChatRooms module 테스트
- [ ] Messages module 테스트
- [ ] Gateway 테스트
- [ ] 6가지 입력 카테고리 적용

---

## Phase 2: 모바일 앱 백엔드 연동 (중규모 — branch: `feat/phase2-mobile-integration`)

### 2-1. API 클라이언트
- [ ] REST API 호출 서비스 (`services/api.ts`)
- [ ] AsyncStorage mock → 실제 API 전환

### 2-2. Socket.io 실시간 연동
- [ ] 채팅 화면 Socket.io 이벤트 리스너 연결
- [ ] 실시간 메시지 수신 시 UI 업데이트
- [ ] 채팅방 입장/퇴장 이벤트

### 2-3. 파일/이미지/동영상 첨부
- [ ] expo-image-picker, expo-document-picker 연동
- [ ] 파일 업로드 API
- [ ] 미리보기 UI

### 2-4. 이모티콘
- [ ] 이모티콘 피커 UI
- [ ] 이모티콘 메시지 송수신

### 2-5. 모바일 테스트
- [ ] 컴포넌트 단위 테스트
- [ ] 서비스 레이어 단위 테스트

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
