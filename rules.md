# rules.md — 프로젝트 글로벌 규칙

> AI가 매번 읽어야 하는 절대 규칙. 모든 코드 작업에 이 규칙을 적용할 것.

---

## 코드 수정 시 필수 Action

1. 코드 수정 시 관련 테스트를 반드시 수행할 것
2. **모든 테스트 pass 시에만** GitHub에 반영할 것
3. 테스트 실패 시 원인 분석 → 수정 → 재테스트 → pass 후 반영
4. 기능이 추가/변경될 때마다 관련 테스트 코드도 반드시 수정/추가할 것
5. 작업 시작/완료 시 `memory.md` 업데이트
6. SW 구조/스펙 변경 시 `SW.md` 업데이트

---

## 코드 관리 규칙

### 소규모 개발 (단일 기능, 버그 수정)
- commit 단위로 관리
- 테스트 pass 확인 후 `git commit` → `git push`

### 중규모 개발 (기능 묶음, 리팩토링)
- 별도 branch에서 작업
- 완료 시 main으로 PR 생성 → merge

### gitignore 대상
- `node_modules/`, `.expo/`, `dist/`, `*.sqlite`, `.env`, `config_deploy.md`

---

## CI/CD 규칙

GitHub 반영(push/PR) 시 GitHub Actions (`ci.yml`)가 자동 실행:

### 테스트 단계
- `test-backend`: Unit (Layer 1) → Feature (Layer 2) → E2E (Layer 3)
- `test-mobile`: Unit tests
- `test-web`: Unit tests

### 빌드 단계 (모든 테스트 통과 후)
- Backend: `nest build`
- Web: `vite build`

### 배포 단계 (main push only, 빌드 통과 후)
- `deploy-backend`: SSH → OCI → git pull → docker compose up --build
- `deploy-web`: Cloudflare Pages webhook

### CI/CD 작성 원칙
- 새로운 테스트/빌드/배포 대상 추가 시 `ci.yml` 업데이트
- 배포 실패 시 자동 롤백 고려

---

## 코딩 컨벤션

- **TypeScript strict mode** 사용
- **ESLint 설정** 준수
- `any` 타입 사용 금지
- `console.log` 디버깅 코드 커밋 금지 (Sentry 또는 적절한 로거 사용)
- 하드코딩된 URL/포트 금지 (환경변수 사용)
- 에러 핸들링 필수 (try-catch + Sentry 캡처)
- Import 순서: 외부 패키지 → 내부 모듈 → 상대 경로
- 함수/변수명: camelCase, 컴포넌트명: PascalCase, 파일명: kebab-case
- Path Alias 사용: Mobile `@/*` → `apps/mobile/`, Shared `@basemsg/shared`

---

## 테스트 정책

### 3계층 테스트 구조
- **Layer 1 (Unit):** 모듈별 독립 단위 테스트, 외부 의존성 전부 mock
- **Layer 2 (Feature):** 다수 모듈 연동 테스트
- **Layer 3 (Scenario):** 사용자 여정 E2E 테스트 — 시나리오는 AI가 최대한 많이 만들 것 (Maestro 연동 시에도)

### 테스트 입력 카테고리 (모든 테스트에 필수 적용)
1. **정상 입력** — Happy Path
2. **경계값** — 빈 문자열, 최대 길이, 0, 음수 등
3. **코너 케이스** — 이모지, 유니코드, 특수문자, RTL 텍스트
4. **잘못된 입력** — null, undefined, 잘못된 타입, SQL/XSS 인젝션 패턴
5. **랜덤 입력** — @faker-js/faker 사용, seed 고정, 최소 3회 반복
6. **동시성** — Promise.all 동시 호출

### 테스트 디렉토리
- 모든 모듈은 `__tests__/` 디렉토리에 자체 단위 테스트 포함
- 외부 의존성은 전부 mock 처리하여 독립 실행 가능

---

## 디렉토리 구조 규칙

- **기능 단위 모듈화** 원칙 (향후 마이크로서비스 전환 대비)
- 백엔드: NestJS 모듈 단위 (users, friends, chat-rooms, messages, gateway)
- 모바일: Expo Router 파일 기반 라우팅
- 웹: 컴포넌트 단위 분리
- 공유 타입: `packages/shared/`에 정의, `@basemsg/shared`로 import
