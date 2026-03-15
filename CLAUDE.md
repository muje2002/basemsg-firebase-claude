# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

basemsg is a text-based messenger platform providing mobile (React Native/Expo) and web frontends with a NestJS backend. Organized as an npm workspaces monorepo.

## Tech Stack

- **Frontend (Mobile):** React Native (Expo SDK 54, Expo Router) — `apps/mobile/`
- **Frontend (Web):** TBD — `apps/web/`
- **Backend:** Node.js + NestJS — `apps/backend/`
- **Shared:** TypeScript types — `packages/shared/`
- **Database:** PostgreSQL + Redis
- **Real-time:** Socket.io
- **Infrastructure:** Docker
- **Auth:** Not yet implemented; OAuth 2.0 planned for future

## Monorepo Structure

```
basemsg/
├── apps/
│   ├── mobile/          # Expo (React Native) mobile app
│   ├── web/             # Web frontend (TBD)
│   └── backend/         # NestJS backend
├── packages/
│   └── shared/          # Shared types (ChatRoom, Message, User, Friend)
├── package.json         # Root workspace config
└── CLAUDE.md
```

## Commands

### Root (monorepo)
- `npm install` — Install all workspace dependencies
- `npm run mobile` — Start mobile Expo dev server
- `npm run mobile:android` / `npm run mobile:ios` — Platform-specific mobile dev
- `npm run mobile:lint` — Lint mobile app

### Mobile (`apps/mobile/`)
- `npm start` — Start Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — Platform-specific dev
- `npm run lint` — ESLint via Expo (`npx expo lint`)

## Architecture

### Mobile App (`apps/mobile/`)
**Routing:** File-based via Expo Router in `apps/mobile/app/`. The `(tabs)/` group defines bottom tab navigation. `_layout.tsx` files configure navigators (Stack at root, Tabs inside the group).

**Theme system:** Light/dark mode supported throughout. Colors defined in `apps/mobile/constants/theme.ts`. `ThemedText` and `ThemedView` wrapper components apply theme colors automatically. `useThemeColor()` hook resolves colors based on current scheme.

**Platform-specific code:** Uses file extension conventions (e.g., `icon-symbol.ios.tsx` vs `icon-symbol.tsx` fallback for Android/Web). iOS uses SF Symbols; other platforms use MaterialIcons.

**Key enabled features:** New Architecture (`newArchEnabled`), React Compiler, typed routes.

### Shared Package (`packages/shared/`)
Contains TypeScript type definitions shared across all apps: `ChatRoom`, `Message`, `User`, `Friend`. Import via `@basemsg/shared`.

## Path Alias

- Mobile: `@/*` maps to `apps/mobile/` root (configured in `apps/mobile/tsconfig.json`)
- Shared types: import from `@basemsg/shared`

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

밝고 파스텔톤 색상을 주로 사용한다.

## Backend API

- User 간 텍스트 메시지 송수신 API
- 친구 추가/삭제 API
- 채팅방 개설 API

## DB Strategy

**로컬 저장:**
- 채팅방 목록
- 채팅방 별 메시지 히스토리 (최근 1000개)
- 친구 목록

**서버 저장:**
- User 목록
- User의 친구 목록

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

## Future Considerations

- AI 에이전트 연동 가능한 설계
- 플러그인 시스템으로 비즈니스별 기능 확장 가능한 구조
