# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

basemsg는 메신저 앱 서비스. 모바일(Android + iOS) + 웹 프론트엔드 + NestJS 백엔드로 구성된 npm workspaces 모노레포 프로젝트.

- **GitHub:** https://github.com/muje2002/basemsg-firebase-claude
- **Expo 계정:** `youngkihong`
- **도메인:** https://basemsg.duckdns.org

---

## 기능

### 채팅
- 채팅방에서 여러 명과 실시간 메시지 송수신 (Socket.io)
- 텍스트, 이미지, 동영상, 파일, 이모티콘(80개) 송수신
- 메시지 검색 (채팅방 내 텍스트 전문 검색)
- 페이지네이션 (limit + before 커서 기반)

### 채팅방 관리
- 채팅방 생성 (친구 선택 + 이름 설정)
- 채팅방 나가기 (빈 채팅방은 자동 삭제)
- 채팅방 목록 검색

### 친구 관리
- 전화번호부 기반 친구 일괄 추가
- 개별 친구 추가/삭제 (다중 선택 삭제 지원)
- 친구 검색

### 인증
- Clerk 기반 이메일/비밀번호 인증
- 로그인 시 백엔드 자동 사용자 동기화 (findOrCreateByClerk)
- Bearer 토큰 기반 API 인증

---

## Tech Stack

| 영역 | 기술 |
|------|------|
| Mobile | React Native (Expo SDK 54, Expo Router, New Architecture) |
| Web | Vite + React + react-router-dom |
| Backend | Node.js + NestJS |
| Shared | TypeScript types (`@basemsg/shared`) |
| DB | PostgreSQL (Neon) + Redis (Upstash) |
| ORM | TypeORM (synchronize: true, autoLoadEntities: true) |
| Real-time | Socket.io |
| Auth | Clerk (@clerk/clerk-expo, @clerk/react, Clerk Backend SDK) |
| Infra | OCI (Oracle Cloud), Cloudflare Pages, Expo EAS |
| CI/CD | GitHub Actions |
| Reverse Proxy | Nginx Proxy Manager (Docker) |

---

## Monorepo Structure

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
├── package.json         # npm workspaces 루트
├── docker-compose.yml   # 로컬 개발용 (PostgreSQL 16 + Redis 7)
├── CLAUDE.md            # 이 파일
└── dev_history.md       # 개발 히스토리
```

---

## SW Code Structure

### Backend (apps/backend/src/)
```
src/
├── main.ts                          # 앱 부트스트랩 (CORS, ValidationPipe, /api prefix)
├── app.module.ts                    # 루트 모듈 (TypeORM 듀얼 DB, 전체 모듈 import)
├── auth/
│   ├── auth.module.ts               # 인증 모듈 (Global)
│   ├── clerk-auth.guard.ts          # Clerk Bearer 토큰 검증 Guard
│   └── clerk-user.decorator.ts      # @ClerkUser() 데코레이터
├── users/
│   ├── user.entity.ts               # User 엔티티
│   ├── users.controller.ts          # POST /users, GET /users, GET /users/:id, POST /users/sync
│   ├── users.service.ts             # create, findAll, findOne, findByPhone, findByClerkId, findOrCreateByClerk
│   ├── users.module.ts
│   ├── dto/create-user.dto.ts
│   └── __tests__/
├── friends/
│   ├── friend.entity.ts             # Friend 엔티티 (Unique[user_id, friend_id])
│   ├── friends.controller.ts        # POST /friends, GET /friends, POST /friends/by-phones, DELETE /friends/:id
│   ├── friends.service.ts           # addFriend, removeFriend, addFriendsByPhones, getFriends
│   ├── friends.module.ts
│   ├── dto/add-friend.dto.ts
│   └── __tests__/
├── chat-rooms/
│   ├── chat-room.entity.ts          # ChatRoom 엔티티
│   ├── chat-room-participant.entity.ts  # ChatRoomParticipant 엔티티 (Unique[room, user])
│   ├── chat-rooms.controller.ts     # POST /chat-rooms, GET /chat-rooms, GET /chat-rooms/:id, DELETE /chat-rooms/:id/leave
│   ├── chat-rooms.service.ts        # create, findAllForUser, findOne, leave
│   ├── chat-rooms.module.ts
│   ├── dto/create-chat-room.dto.ts
│   └── __tests__/
├── messages/
│   ├── message.entity.ts            # Message 엔티티 (type: varchar)
│   ├── messages.controller.ts       # POST /chat-rooms/:roomId/messages, GET .../messages, GET /messages/search
│   ├── messages.service.ts          # create, findByRoom, searchMessages, findOne
│   ├── messages.module.ts
│   ├── dto/create-message.dto.ts
│   └── __tests__/
├── gateway/
│   ├── chat.gateway.ts              # Socket.io WebSocket Gateway
│   ├── gateway.module.ts
│   └── __tests__/
└── database/
    └── seed.ts                      # Seed 스크립트
```

### Mobile (apps/mobile/)
```
apps/mobile/
├── app/
│   ├── _layout.tsx                  # Root Layout (Auth, Clerk, Navigation Guard)
│   ├── login.tsx                    # 로그인/회원가입 화면
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Bottom Tab Navigator (채팅, 친구)
│   │   ├── index.tsx                # 채팅방 리스트
│   │   └── friends.tsx              # 친구 리스트
│   ├── chat/[id].tsx                # 채팅방 (동적 라우트)
│   ├── new-chat.tsx                 # 새 채팅방 생성 (Modal)
│   └── add-friend.tsx               # 친구 추가 (Modal)
├── components/
│   ├── chat-room-item.tsx           # 채팅방 목록 아이템
│   ├── message-bubble.tsx           # 메시지 버블
│   ├── friend-item.tsx              # 친구 목록 아이템
│   ├── emoji-picker.tsx             # 이모지 피커 (80개)
│   ├── search-bar.tsx               # 검색바
│   ├── themed-text.tsx / themed-view.tsx  # 테마 래퍼
│   └── ui/                          # 플랫폼별 아이콘 등
├── constants/theme.ts               # 테마 색상, 간격, 폰트
├── hooks/                           # useColorScheme, useThemeColor
├── services/
│   ├── api.ts                       # REST API 클라이언트
│   ├── socket.ts                    # Socket.io 클라이언트
│   ├── database.ts                  # SQLite 로컬 DB
│   └── auth.ts                      # Clerk 인증
└── __tests__/ & __mocks__/
```

### Web (apps/web/src/)
```
src/
├── main.tsx                         # 엔트리 (Clerk + React Router)
├── App.tsx                          # 메인 앱 (Auth, Sync, Tab 관리)
├── pages/Login.tsx                  # 로그인 페이지
├── components/
│   ├── Sidebar.tsx                  # 좌측 사이드바 (채팅/친구 탭)
│   ├── ChatList.tsx                 # 채팅방 목록 패널
│   ├── ChatRoom.tsx                 # 채팅방 (메시지, 이모지, 파일)
│   └── FriendsList.tsx              # 친구 관리 패널
├── services/
│   ├── api.ts                       # REST API (Bearer 토큰)
│   ├── socket.ts                    # Socket.io
│   └── env.ts                       # 환경변수 설정
└── styles/                          # CSS (3-panel 레이아웃, 로그인 등)
```

### Shared (packages/shared/src/)
```typescript
interface User { id, name, phone, avatarUrl?, createdAt }
interface Friend { id, userId, name, phone, avatarUrl?, addedAt }
interface ChatRoom { id, name, participants, lastMessage?, lastMessageAt?, unreadCount, createdAt }
interface Message { id, chatRoomId, senderId, text, type('text'|'image'|'file'|'video'|'emoji'), fileUri?, fileName?, createdAt }
```

---

## Commands

### Root (monorepo)
- `npm install` — Install all workspace dependencies
- `npm run mobile` — Start mobile Expo dev server
- `npm run mobile:android` / `npm run mobile:ios` — Platform-specific mobile dev
- `npm run mobile:lint` — Lint mobile app
- `npm run backend` — Start backend dev server
- `npm run web` — Start web dev server

### Mobile (`apps/mobile/`)
- `npm start` / `npm run android` / `npm run ios` — Dev server
- `npm run lint` — ESLint
- `npm test` — Unit tests

### Backend (`apps/backend/`)
- `npm run start:dev` — Dev mode
- `npm run build` — Production build
- `npm test` — Unit tests
- `npm run test:e2e` — E2E tests

---

## Backend API List

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

## Socket.io Events

| Event | Direction | Payload | 설명 |
|-------|-----------|---------|------|
| `room:join` | Client→Server | roomId | 채팅방 입장 |
| `room:leave` | Client→Server | roomId | 채팅방 퇴장 |
| `message:send` | Client→Server | { chatRoomId, senderId, text, type?, fileUri?, fileName? } | 메시지 전송 |
| `message:receive` | Server→Room | Message object | 메시지 브로드캐스트 |

- 연결 시 `handshake.auth.userId`로 사용자 식별
- 멀티 디바이스 지원: userId → Set\<socketId\> 매핑

---

## DB Schema (TypeORM Entities)

### users
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| clerk_id | VARCHAR | UNIQUE, nullable |
| name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | UNIQUE, NOT NULL |
| avatar_url | VARCHAR | nullable |
| created_at | TIMESTAMP | auto |

### friends
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| user_id | UUID | FK→users, CASCADE |
| friend_id | UUID | FK→users, CASCADE |
| added_at | TIMESTAMP | auto |
| | | UNIQUE(user_id, friend_id) |

### chat_rooms
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| created_at | TIMESTAMP | auto |

### chat_room_participants
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| chat_room_id | UUID | FK→chat_rooms, CASCADE |
| user_id | UUID | FK→users, CASCADE |
| joined_at | TIMESTAMP | auto |
| | | UNIQUE(chat_room_id, user_id) |

### messages
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| chat_room_id | UUID | FK→chat_rooms |
| sender_id | UUID | FK→users |
| text | TEXT | NOT NULL |
| type | VARCHAR(10) | default 'text' |
| file_uri | VARCHAR | nullable |
| file_name | VARCHAR | nullable |
| created_at | TIMESTAMP | auto |

### 듀얼 DB 지원
- **Production:** PostgreSQL (Neon, `DB_TYPE=postgres`)
- **Development/Test:** SQLite (better-sqlite3, `DB_TYPE=better-sqlite3`)

---

## DB Strategy

**로컬 저장 (모바일/웹):**
- 채팅방 목록, 메시지 히스토리 (최근 1000개), 친구 목록

**서버 저장 (PostgreSQL — Neon):**
- User 목록, 친구 목록, 채팅방 목록 및 참여자, 메시지 히스토리

**캐시 (Redis — Upstash):**
- 실시간 소켓 세션 관리, 온라인 상태 추적

---

## Deployment

### 운영 환경
| 서비스 | 플랫폼 | 상태 |
|--------|--------|------|
| Backend | OCI Docker (https://basemsg.duckdns.org) | 배포 완료 |
| PostgreSQL | Neon (ap-southeast-1) | 연동 완료 |
| Redis | Upstash | 연동 완료 |
| Auth | Clerk | Mobile + Web 연동 완료 |
| Web | Cloudflare Pages | 대기 |
| Mobile | Expo EAS Build | 대기 |

### OCI 서버 구성
```
ubuntu@instance-20260317-0924:~/services/
├── basemsg/              # Git clone된 프로젝트 코드
├── basemsg-backend.env   # 백엔드 환경변수
├── docker-compose.yml    # NPM + Backend 컨테이너
├── npm-data/             # Nginx Proxy Manager 데이터
└── npm-letsencrypt/      # SSL 인증서
```
- basemsg.duckdns.org → Nginx Proxy Manager → basemsg-backend:3000

### Backend Dockerfile (Multi-stage)
- Stage 1 (Builder): node:20-alpine → npm ci → nest build
- Stage 2 (Runtime): node:20-alpine → production deps only → `node dist/main`

### CI/CD (.github/workflows/ci.yml)
```
push/PR to main →
  test-backend (Unit 70 + Feature 11 + E2E 10)
  test-mobile (Unit 42)
  test-web (Unit 22)
    ↓ 모든 테스트 통과
  build (nest build + vite build)
    ↓ main push only
  deploy-backend (SSH → OCI → git pull → docker compose up)
  deploy-web (Cloudflare Pages webhook)
```

---

## Test Policy

**3계층 테스트 구조:**
- **Layer 1 (Unit):** 모듈별 독립 단위 테스트, 외부 의존성 전부 mock
- **Layer 2 (Feature):** 다수 모듈 연동 테스트
- **Layer 3 (Scenario):** 사용자 여정 E2E 테스트 (SQLite in-memory)

**6가지 입력 카테고리 (필수):**
1. 정상 입력 (Happy Path)
2. 경계값 (빈 문자열, 최대 길이, 0 등)
3. 코너 케이스 (이모지, 유니코드, 특수문자, RTL)
4. 잘못된 입력 (null, undefined, 잘못된 타입, 인젝션)
5. 랜덤 입력 (@faker-js/faker, seed 고정, 최소 3회 반복)
6. 동시성 (Promise.all 동시 호출)

**테스트 현황 (Total: 155)**
| 영역 | 개수 |
|------|------|
| Backend Unit | 70 |
| Backend Feature | 11 |
| Backend E2E | 10 |
| Mobile Unit | 42 |
| Web Unit | 22 |

---

## UX Structure

### Mobile (React Native)
```
Login (Clerk 인증)
  ↓
Bottom Tabs
├── 채팅 탭 (index.tsx)
│   ├── 채팅방 목록 + 검색
│   ├── → [+] → new-chat.tsx (Modal: 친구 선택, 방 이름)
│   └── → 채팅방 탭 → chat/[id].tsx (메시지, 이모지, 파일)
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

---

## UI Theme

밝고 파스텔톤 색상. Light/Dark 모드 지원.

### Light Mode
| 용도 | 색상 |
|------|------|
| Primary | `#A29BFE` (Purple) |
| Secondary | `#81ECEC` (Cyan) |
| Accent | `#FDA7DF` (Pink) |
| Success | `#55EFC4` (Green) |
| Warning | `#FFEAA7` (Yellow) |
| Error | `#FAB1A0` (Red) |
| Message Own | `#D5D0FE` (Light Purple) |
| Message Other | `#F1F2F6` (Light Gray) |
| Background | `#FEFEFE` |
| Surface | `#F8F9FA` |

### Dark Mode
| 용도 | 색상 |
|------|------|
| Primary | `#A29BFE` (동일) |
| Background | `#151718` |
| Surface | `#1E2022` |
| Message Own | `#4A4580` |
| Message Other | `#2D3436` |

### Spacing & Border Radius
- Spacing: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32)
- Border Radius: sm(8), md(12), lg(16), xl(24), full(9999)

---

## Path Alias

- Mobile: `@/*` → `apps/mobile/` root
- Shared types: `@basemsg/shared`

---

## Code Management

- **소규모 개발:** 완료 시마다 테스트 pass 확인 후 git commit
- **중규모 개발:** 별도 branch → PR → merge
- **gitignore:** node_modules, .expo, dist 등

## Coding Convention

- TypeScript strict mode
- ESLint 설정 준수

## Future Considerations

- AI 에이전트 연동 가능한 설계
- 플러그인 시스템으로 비즈니스별 기능 확장 가능한 구조
