# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

basemsg는 메신저 앱 서비스로, 모바일(Android + iOS)과 웹 프론트엔드, 그리고 NestJS 백엔드로 구성된 npm workspaces 모노레포 프로젝트이다.

## Tech Stack

- **Frontend (Mobile):** React Native (Expo SDK 54, Expo Router) — `apps/mobile/`
- **Frontend (Web):** TBD — `apps/web/`
- **Backend:** Node.js + NestJS — `apps/backend/`
- **Shared:** TypeScript types — `packages/shared/`
- **Database:** PostgreSQL + Redis
- **Real-time:** Socket.io
- **Infrastructure:** Docker
- **Auth:** 아직 미구현; 향후 OAuth 2.0 기반 고려

## Monorepo Structure

```
basemsg/
├── apps/
│   ├── mobile/          # Expo (React Native) 모바일 앱
│   ├── web/             # 웹 프론트엔드 (TBD)
│   └── backend/         # NestJS 백엔드 API 서버
├── packages/
│   └── shared/          # 공유 타입 (ChatRoom, Message, User, Friend)
├── docker-compose.yml   # PostgreSQL, Redis, backend 컨테이너
├── package.json         # npm workspaces 루트
└── CLAUDE.md
```

## Commands

### Root (monorepo)
- `npm install` — Install all workspace dependencies
- `npm run mobile` — Start mobile Expo dev server
- `npm run mobile:android` / `npm run mobile:ios` — Platform-specific mobile dev
- `npm run mobile:lint` — Lint mobile app
- `npm run backend` — Start backend dev server
- `npm run web` — Start web dev server

### Mobile (`apps/mobile/`)
- `npm start` — Start Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — Platform-specific dev
- `npm run lint` — ESLint via Expo
- `npm test` — Run unit tests

### Backend (`apps/backend/`)
- `npm run start:dev` — Start NestJS in dev mode
- `npm run build` — Build for production
- `npm test` — Run unit tests
- `npm run test:e2e` — Run E2E tests

## Architecture

### Mobile App (`apps/mobile/`)
**Routing:** File-based via Expo Router in `apps/mobile/app/`. The `(tabs)/` group defines bottom tab navigation. `_layout.tsx` files configure navigators (Stack at root, Tabs inside the group).

**Theme system:** Light/dark mode supported throughout. Colors defined in `apps/mobile/constants/theme.ts`. `ThemedText` and `ThemedView` wrapper components apply theme colors automatically. `useThemeColor()` hook resolves colors based on current scheme.

**Platform-specific code:** Uses file extension conventions (e.g., `icon-symbol.ios.tsx` vs `icon-symbol.tsx` fallback for Android/Web). iOS uses SF Symbols; other platforms use MaterialIcons.

**Key enabled features:** New Architecture (`newArchEnabled`), React Compiler, typed routes.

### Backend (`apps/backend/`)
**Framework:** NestJS with modular architecture (기능 단위 모듈화, 마이크로서비스 전환 대비).

**Modules:**
- `users` — 사용자 등록/조회
- `friends` — 친구 추가/삭제/목록
- `chat-rooms` — 채팅방 생성/나가기/목록
- `messages` — 메시지 송수신 (REST + Socket.io)
- `gateway` — Socket.io 실시간 통신 게이트웨이

### Shared Package (`packages/shared/`)
Contains TypeScript type definitions shared across all apps: `ChatRoom`, `Message`, `User`, `Friend`. Import via `@basemsg/shared`.

## Path Alias

- Mobile: `@/*` maps to `apps/mobile/` root (configured in `apps/mobile/tsconfig.json`)
- Shared types: import from `@basemsg/shared`

## 서비스 기능

### 채팅
- 채팅방에서 여러 명과 메시지 송수신
- 텍스트, 이미지, 동영상, 파일, 이모티콘 송수신

### 채팅방 관리
- 채팅방 생성
- 채팅방 나가기

### 친구 관리
- 전화번호부 기반 친구 추가
- 친구 삭제

## UX Structure

3-tab navigation (bottom tabs):

1. **채팅방 리스트 (Chat Room List)**
   - 채팅방 목록 표시 및 새 채팅방 개설
   - 터치 시 해당 채팅방으로 이동
   - 상단 검색 기능 (채팅방 이름, 채팅방 내 텍스트 검색)

2. **채팅방 (Chat Room)**
   - 텍스트 메시지 송수신
   - 이모티콘 지원
   - 파일, 이미지, 동영상 첨부 가능

3. **친구 관리 (Friends)**
   - 친구 추가: 전화번호부 목록에서 추가
   - 친구 삭제: 리스트에서 선택하여 삭제 (다중 선택 가능)

## UI Theme

밝고 파스텔톤 색상을 주로 사용한다. background 포함 모든 component 색상에 적용.

## Backend API

- User 간 텍스트 메시지 송수신 API
- 친구 추가 API
- 친구 삭제 API
- 친구 목록 불러오기 API
- 채팅방 개설 API
- 채팅방 나가기 API
- 그 외 필요한 API는 자체 판단으로 추가

## DB Strategy

**로컬 저장 (모바일/웹):**
- 채팅방 목록
- 채팅방 별 메시지 히스토리 (최근 1000개)
- 친구 목록

**서버 저장 (PostgreSQL):**
- User 목록
- 각 User의 친구 목록
- 채팅방 목록 및 참여자
- 메시지 히스토리

**캐시 (Redis):**
- 실시간 소켓 세션 관리
- 온라인 상태 추적

## Folder Structure

기능 단위 모듈화 원칙 (향후 마이크로서비스 전환 대비).

## Test Policy

**3계층 테스트 구조:**
- **Layer 1 (Unit):** 모듈별 독립 단위 테스트
- **Layer 2 (Feature):** 하나의 기능을 구성하는 다수 모듈 연동 테스트
- **Layer 3 (Scenario):** 여러 기능이 연동된 사용자 여정 E2E 테스트

**테스트 디렉토리:** 모든 모듈은 `__tests__/` 디렉토리에 자체 단위 테스트를 포함. 외부 의존성은 전부 mock 처리하여 독립 실행 가능해야 함.

**6가지 입력 카테고리 (필수):**
1. 정상 입력 (Happy Path)
2. 경계값 (빈 문자열, 최대 길이, 0 등)
3. 코너 케이스 (이모지, 유니코드, 특수문자, RTL 텍스트)
4. 잘못된 입력 (null, undefined, 잘못된 타입, 인젝션 패턴)
5. 랜덤 입력 (@faker-js/faker 사용, seed 고정, 최소 3회 반복)
6. 동시성 (Promise.all로 동시 호출)

## Code Management

- **GitHub repo:** https://github.com/muje2002/basemsg-firebase-claude
- **gitignore:** node_modules, .expo, dist 등 외부 라이브러리/빌드 산출물은 커밋하지 않음
- **소규모 개발:** 완료 시마다 관련 테스트 전부 pass 확인 후 git commit. 실패 시 디버깅
- **중규모 개발:** 별도 branch에서 작업 → 완료 시 main으로 PR 생성 → merge
- 코드 수정 시 commit + PR 기반 관리

## Coding Convention

- 프로그래밍 언어 기본적인 코딩 룰을 따를 것
- TypeScript strict mode 사용
- ESLint 설정 준수

## Future Considerations

- AI 에이전트 연동 가능한 설계
- 플러그인 시스템으로 비즈니스별 기능 확장 가능한 구조
