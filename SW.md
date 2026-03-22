# SW.md — 시스템 구조 & 개발 규약

> AI가 개발할 때 반드시 참조하는 기술 문서.

---

## 1. 요구사항 정의서 (PRD)

### 핵심 기능
- **채팅:** 채팅방에서 여러 명과 실시간 메시지 송수신 (텍스트, 이미지, 동영상, 파일, 이모티콘)
- **채팅방 관리:** 생성 (친구 선택 + 이름), 나가기 (빈 방 자동 삭제), 검색
- **친구 관리:** 전화번호부 기반 일괄 추가, 개별 추가/삭제, 검색
- **인증:** Clerk 기반 이메일/비밀번호 인증, Bearer 토큰 API 인증
- **메시지 검색:** 채팅방 내 텍스트 전문 검색, 페이지네이션 (limit + before 커서)

### 비기능 요구사항
- 실시간 통신 (Socket.io)
- 크로스플랫폼 (Android, iOS, Web)
- 오프라인 지원 (로컬 DB 캐시)
- 에러 모니터링 (Sentry)

---

## 2. 전체 SW 아키텍처

### 모노레포 구조
```
basemsg_vs/
├── apps/
│   ├── mobile/          # Expo (React Native) 모바일 앱
│   ├── web/             # Vite + React 웹 프론트엔드
│   └── backend/         # NestJS 백엔드 API 서버
├── packages/
│   └── shared/          # 공유 타입 (@basemsg/shared)
├── .github/workflows/
│   └── ci.yml           # CI/CD 파이프라인
├── CLAUDE.md            # 프로젝트 개요 + 문서 안내
├── config_deploy.md     # 설정/인증 정보 (gitignore)
├── rules.md             # 글로벌 규칙
├── memory.md            # 상태 & 히스토리
├── SW.md                # 이 파일
├── package.json         # npm workspaces 루트
├── docker-compose.yml   # 로컬 개발용 (PostgreSQL 16 + Redis 7)
└── start-metro.bat      # Metro 서버 시작 스크립트
```

### SW Code 구조

#### Backend (apps/backend/src/)
```
src/
├── main.ts                          # 앱 부트스트랩 (CORS, ValidationPipe, /api prefix, 0.0.0.0 바인딩)
├── app.module.ts                    # 루트 모듈 (TypeORM 듀얼 DB, 전체 모듈 import)
├── auth/
│   ├── auth.module.ts               # 인증 모듈 (Global)
│   ├── clerk-auth.guard.ts          # Clerk Bearer 토큰 검증 Guard
│   └── clerk-user.decorator.ts      # @ClerkUser() 데코레이터
├── users/
│   ├── user.entity.ts
│   ├── users.controller.ts          # POST /users, GET /users, GET /users/:id, POST /users/sync
│   ├── users.service.ts             # create, findAll, findOne, findByPhone, findByClerkId, findOrCreateByClerk
│   ├── users.module.ts
│   ├── dto/create-user.dto.ts
│   └── __tests__/
├── friends/
│   ├── friend.entity.ts
│   ├── friends.controller.ts        # POST /friends, GET /friends, POST /friends/by-phones, DELETE /friends/:id
│   ├── friends.service.ts           # addFriend, removeFriend, addFriendsByPhones, getFriends
│   ├── friends.module.ts
│   ├── dto/add-friend.dto.ts
│   └── __tests__/
├── chat-rooms/
│   ├── chat-room.entity.ts
│   ├── chat-room-participant.entity.ts
│   ├── chat-rooms.controller.ts     # POST, GET, GET/:id, DELETE/:id/leave
│   ├── chat-rooms.service.ts        # create, findAllForUser, findOne, leave
│   ├── chat-rooms.module.ts
│   ├── dto/create-chat-room.dto.ts
│   └── __tests__/
├── messages/
│   ├── message.entity.ts
│   ├── messages.controller.ts       # POST, GET (pagination), GET /messages/search
│   ├── messages.service.ts          # create, findByRoom, searchMessages, findOne
│   ├── messages.module.ts
│   ├── dto/create-message.dto.ts
│   └── __tests__/
├── gateway/
│   ├── chat.gateway.ts              # Socket.io WebSocket Gateway
│   ├── gateway.module.ts
│   └── __tests__/
└── database/
    └── seed.ts
```

#### Mobile (apps/mobile/)
```
├── app/
│   ├── _layout.tsx                  # Root Layout (Sentry, Clerk, Navigation Guard)
│   ├── login.tsx                    # 로그인/회원가입
│   ├── (tabs)/_layout.tsx           # Bottom Tab Navigator
│   ├── (tabs)/index.tsx             # 채팅방 리스트
│   ├── (tabs)/friends.tsx           # 친구 리스트
│   ├── chat/[id].tsx                # 채팅방
│   ├── new-chat.tsx                 # 새 채팅방 (Modal)
│   └── add-friend.tsx               # 친구 추가 (Modal)
├── components/                      # UI 컴포넌트
├── constants/theme.ts               # 테마 색상, 간격, 폰트
├── hooks/                           # useColorScheme, useThemeColor
├── services/
│   ├── api.ts                       # REST API + Sentry 에러 캡처
│   ├── socket.ts                    # Socket.io
│   ├── database.ts                  # SQLite 로컬 DB
│   └── auth.ts                      # Clerk 인증
├── metro.config.js                  # 모노레포 모듈 해석 설정
└── __tests__/ & __mocks__/
```

#### Web (apps/web/src/)
```
├── main.tsx                         # 엔트리 (Clerk + React Router)
├── App.tsx                          # Auth, Sync, Tab 관리
├── pages/Login.tsx
├── components/                      # Sidebar, ChatList, ChatRoom, FriendsList
├── services/                        # api.ts, socket.ts, env.ts
└── styles/                          # CSS
```

#### Shared (packages/shared/src/)
```typescript
interface User { id, name, phone, avatarUrl?, createdAt }
interface Friend { id, userId, name, phone, avatarUrl?, addedAt }
interface ChatRoom { id, name, participants, lastMessage?, lastMessageAt?, unreadCount, createdAt }
interface Message { id, chatRoomId, senderId, text, type('text'|'image'|'file'|'video'|'emoji'), fileUri?, fileName?, createdAt }
```

---

## 3. 기술 스택 명세

| 영역 | 기술 | 버전 |
|------|------|------|
| Mobile | React Native (Expo, Expo Router, New Architecture) | Expo SDK 54, RN 0.81.5 |
| Web | Vite + React + react-router-dom | Vite 6, React 19.1.0 |
| Backend | Node.js + NestJS | Node 20, NestJS 10 |
| Shared | TypeScript types (`@basemsg/shared`) | TS 5.9 |
| DB | PostgreSQL (Neon) + Redis (Upstash) | PG 16, Redis 7 |
| ORM | TypeORM | synchronize: true, autoLoadEntities: true |
| Real-time | Socket.io | 4.x |
| Auth | Clerk | @clerk/clerk-expo 2.x, @clerk/react 6.x |
| Error Monitoring | Sentry | @sentry/react-native 8.x |
| Infra | OCI (Oracle Cloud), Cloudflare Pages, Expo EAS | - |
| CI/CD | GitHub Actions | Node 20, ubuntu-latest |
| Reverse Proxy | Nginx Proxy Manager (Docker) | - |
| Container | Docker (multi-stage build) | node:20-alpine |

---

## 4. Backend API 스펙

### Users (Public: POST/GET, Protected: POST /users/sync)
| Method | Route | Guard | 설명 |
|--------|-------|-------|------|
| POST | `/api/users` | - | 사용자 등록 (name, phone) |
| GET | `/api/users` | - | 전체 사용자 목록 |
| GET | `/api/users/:id` | - | 사용자 조회 |
| POST | `/api/users/sync` | ClerkAuthGuard | Clerk 로그인 후 사용자 동기화 |

### Friends (All Protected: ClerkAuthGuard)
| Method | Route | 설명 |
|--------|-------|------|
| POST | `/api/friends` | 친구 추가 (friendId) |
| GET | `/api/friends` | 내 친구 목록 |
| POST | `/api/friends/by-phones` | 전화번호 배열로 친구 일괄 추가 |
| DELETE | `/api/friends/:friendId` | 친구 삭제 |

### Chat Rooms (All Protected: ClerkAuthGuard)
| Method | Route | 설명 |
|--------|-------|------|
| POST | `/api/chat-rooms` | 채팅방 생성 (name, participantIds[]) |
| GET | `/api/chat-rooms` | 내 채팅방 목록 |
| GET | `/api/chat-rooms/:id` | 채팅방 상세 (참여자 포함) |
| DELETE | `/api/chat-rooms/:id/leave` | 채팅방 나가기 |

### Messages (All Protected: ClerkAuthGuard)
| Method | Route | 설명 |
|--------|-------|------|
| POST | `/api/chat-rooms/:roomId/messages` | 메시지 전송 (text, type?, fileUri?, fileName?) |
| GET | `/api/chat-rooms/:roomId/messages` | 메시지 히스토리 (?limit=100&before=ISO) |
| GET | `/api/messages/search` | 메시지 검색 (?q=query&limit=50) |

### Health Check
| Method | Route | 응답 |
|--------|-------|------|
| GET | `/` | `{ status: 'ok', service: 'basemsg', api: '/api', version: '1.0.0' }` |

---

## 5. DB 정책 & 스키마

### DB 전략
- **로컬 저장 (모바일/웹):** 채팅방 목록, 메시지 히스토리 (최근 1000개), 친구 목록
- **서버 저장 (PostgreSQL):** User, 친구, 채팅방, 참여자, 메시지 히스토리
- **캐시 (Redis):** 실시간 소켓 세션 관리, 온라인 상태 추적
- **듀얼 DB:** Production=PostgreSQL (`DB_TYPE=postgres`), Development/Test=SQLite (`DB_TYPE=better-sqlite3`)

### TypeORM Entities

#### users
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| clerk_id | VARCHAR | UNIQUE, nullable |
| name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | UNIQUE, NOT NULL |
| avatar_url | VARCHAR | nullable |
| created_at | TIMESTAMP | auto |

#### friends
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| user_id | UUID | FK→users, CASCADE |
| friend_id | UUID | FK→users, CASCADE |
| added_at | TIMESTAMP | auto |
| | | UNIQUE(user_id, friend_id) |

#### chat_rooms
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| created_at | TIMESTAMP | auto |

#### chat_room_participants
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| chat_room_id | UUID | FK→chat_rooms, CASCADE |
| user_id | UUID | FK→users, CASCADE |
| joined_at | TIMESTAMP | auto |
| | | UNIQUE(chat_room_id, user_id) |

#### messages
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| chat_room_id | UUID | FK→chat_rooms |
| sender_id | UUID | FK→users |
| text | TEXT | NOT NULL |
| type | VARCHAR(10) | default 'text' ('text','image','file','video','emoji') |
| file_uri | VARCHAR | nullable |
| file_name | VARCHAR | nullable |
| created_at | TIMESTAMP | auto |

---

## 6. Socket.io Events

| Event | Direction | Payload | 설명 |
|-------|-----------|---------|------|
| `room:join` | Client→Server | roomId | 채팅방 입장 |
| `room:leave` | Client→Server | roomId | 채팅방 퇴장 |
| `message:send` | Client→Server | { chatRoomId, senderId, text, type?, fileUri?, fileName? } | 메시지 전송 |
| `message:receive` | Server→Room | Message object | 메시지 브로드캐스트 |

- 연결 시 `handshake.auth.userId`로 사용자 식별
- 멀티 디바이스: userId → Set\<socketId\> 매핑

---

## 7. UX/UI 화면 설계

### Mobile (React Native)
```
Login (Clerk 인증: 이메일/비밀번호, 이메일 인증 코드)
  ↓
Bottom Tabs (2탭)
├── 채팅 탭 (index.tsx)
│   ├── 채팅방 목록 + 검색바
│   ├── → [+] → new-chat.tsx (Modal: 친구 선택, 방 이름)
│   └── → 채팅방 터치 → chat/[id].tsx (메시지, 이모지, 파일첨부)
└── 친구 탭 (friends.tsx)
    ├── 친구 목록 + 검색 + 다중 선택 삭제
    └── → [+] → add-friend.tsx (Modal: 연락처 동기화)
```

### Web (React)
```
Login (Clerk SignIn/SignUp)
  ↓
3-Panel Layout
├── Sidebar (좌측 고정) — 채팅/친구 탭 전환
├── Panel (400px) — ChatList 또는 FriendsList
└── Main (flex) — /chat/:id → ChatRoom
```

### UI 테마
밝고 파스텔톤 색상. Light/Dark 모드 지원.

| 용도 | Light | Dark |
|------|-------|------|
| Primary | `#A29BFE` | `#A29BFE` |
| Secondary | `#81ECEC` | - |
| Accent | `#FDA7DF` | - |
| Background | `#FEFEFE` | `#151718` |
| Surface | `#F8F9FA` | `#1E2022` |
| Message Own | `#D5D0FE` | `#4A4580` |
| Message Other | `#F1F2F6` | `#2D3436` |

Spacing: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32)
Border Radius: sm(8), md(12), lg(16), xl(24), full(9999)

---

## 8. 테스트 구성

### 현황 (Total: 155)
| 영역 | 개수 |
|------|------|
| Backend Unit (Layer 1) | 70 |
| Backend Feature (Layer 2) | 11 |
| Backend E2E (Layer 3) | 10 |
| Mobile Unit (Layer 1) | 42 |
| Web Unit (Layer 1) | 22 |

### 실행 명령
```bash
# Backend
cd apps/backend && npm test                    # Unit
cd apps/backend && npx jest test/feature/      # Feature
cd apps/backend && npx jest test/e2e/          # E2E

# Mobile
cd apps/mobile && npm test

# Web
cd apps/web && npm test
```

### CI/CD 파이프라인
```
push/PR to main →
  test-backend (Unit → Feature → E2E)
  test-mobile (Unit)
  test-web (Unit)
    ↓ 모든 테스트 통과
  build (nest build + vite build)
    ↓ main push only
  deploy-backend (SSH → OCI → docker compose up)
  deploy-web (Cloudflare Pages webhook)
```

### Dockerfile (Backend)
- Stage 1 (Builder): node:20-alpine → npm ci → nest build
- Stage 2 (Runtime): production deps only → `node dist/main`
