# Git 관리 정책

소설 연재 플랫폼 모노레포 프로젝트를 위한 Git 관리 가이드

---

## 목차

1. [브랜치 전략](#1-브랜치-전략)
2. [커밋 메시지 가이드](#2-커밋-메시지-가이드)
3. [이슈 관리](#3-이슈-관리)
4. [Pull Request 정책](#4-pull-request-정책)
5. [서브모듈 정책](#5-서브모듈-정책)
6. [태그 및 릴리스 전략](#6-태그-및-릴리스-전략)
7. [CI/CD와 Git 연동](#7-cicd와-git-연동)
8. [브랜치 보호 규칙](#8-브랜치-보호-규칙)

---

## 1. 브랜치 전략

### 1.1 채택 전략: GitHub Flow + develop 변형

```
main                    ← 프로덕션 배포 브랜치 (항상 안정)
├── develop             ← 개발 통합 브랜치 (staging 환경)
│   ├── feature/xxx     ← 기능 개발 브랜치
│   ├── fix/xxx         ← 버그 수정 브랜치
│   ├── refactor/xxx    ← 리팩토링 브랜치
│   ├── docs/xxx        ← 문서 작업 브랜치
│   └── chore/xxx       ← 설정/유지보수 브랜치
└── hotfix/xxx          ← 긴급 수정 (main에서 직접 분기)
```

### 1.2 브랜치 네이밍 규칙

**형식**: `{type}/{package}-{description}`

| 구성요소 | 설명 | 예시 |
|---------|------|------|
| type | 작업 유형 | feature, fix, refactor, docs, chore, hotfix |
| package | 대상 패키지 | web, api, shared, infra |
| description | 작업 설명 (kebab-case) | episode-reader, auth-token-refresh |

**예시**:
```
feature/web-episode-reader
feature/api-payment-webhook
fix/api-auth-token-expiry
fix/web-mobile-navigation
refactor/shared-utils-types
docs/api-swagger-setup
chore/infra-docker-compose
hotfix/api-critical-security
```

**규칙**:
- 영문 소문자와 하이픈만 사용
- 50자 이내 권장
- 이슈 번호 포함 가능: `feature/web-123-episode-reader`

### 1.3 브랜치 생명주기

| 브랜치 | 생성 | 삭제 |
|--------|------|------|
| main | 초기 설정 | 삭제 금지 |
| develop | 초기 설정 | 삭제 금지 |
| feature/* | develop에서 분기 | merge 후 자동 삭제 |
| fix/* | develop에서 분기 | merge 후 자동 삭제 |
| hotfix/* | main에서 분기 | main + develop merge 후 삭제 |

---

## 2. 커밋 메시지 가이드

### 2.1 Conventional Commits 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2.2 타입 (Type)

| 타입 | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 추가 | 에피소드 뷰어 구현 |
| `fix` | 버그 수정 | 로그인 토큰 만료 오류 해결 |
| `refactor` | 코드 리팩토링 (기능 변경 없음) | 유틸 함수 분리 |
| `docs` | 문서 추가/수정 | API 문서 업데이트 |
| `style` | 코드 포맷팅, 세미콜론 등 | ESLint 규칙 적용 |
| `test` | 테스트 추가/수정 | 결제 API 단위 테스트 |
| `chore` | 빌드, 설정, 유지보수 | 의존성 업데이트 |
| `perf` | 성능 개선 | 이미지 lazy loading |
| `ci` | CI/CD 설정 변경 | GitHub Actions 워크플로우 |
| `revert` | 커밋 되돌리기 | feat(api): xxx 되돌림 |

### 2.3 스코프 (Scope)

| 스코프 | 설명 |
|--------|------|
| `api` | NestJS 백엔드 API |
| `web` | Next.js 프론트엔드 |
| `shared` | 공유 패키지 |
| `infra` | 인프라/배포 설정 |
| `root` | 루트 설정 (turbo, pnpm 등) |

### 2.4 제목 (Subject)

- **영어 타입, 한글 설명** 조합 권장
- 50자 이내
- 마침표 없음
- 명령형 사용

```
feat(api): 회원가입 API 구현
fix(web): 모바일 네비게이션 클릭 이슈 해결
refactor(shared): 공통 타입 분리
```

### 2.5 본문 (Body) - 선택

- **한글 사용**
- 무엇을, 왜 변경했는지 설명
- 72자마다 줄바꿈

### 2.6 푸터 (Footer) - 선택

```
BREAKING CHANGE: 인증 토큰 구조 변경으로 기존 토큰 무효화

Closes #123
Refs #456, #789
```

---

## 3. 이슈 관리

### 3.1 이슈 템플릿

3종 사용: Bug Report, Feature Request, Documentation

### 3.2 라벨 체계

#### 유형 (Type)
| 라벨 | 색상 | 설명 |
|------|------|------|
| `bug` | #d73a4a | 버그 |
| `enhancement` | #a2eeef | 기능 개선/추가 |
| `documentation` | #0075ca | 문서 |
| `refactor` | #7057ff | 리팩토링 |
| `performance` | #fbca04 | 성능 개선 |
| `security` | #b60205 | 보안 |

#### 패키지 (Package)
| 라벨 | 색상 | 설명 |
|------|------|------|
| `pkg:api` | #1d76db | NestJS API |
| `pkg:web` | #0e8a16 | Next.js 웹 |
| `pkg:shared` | #5319e7 | 공유 패키지 |
| `pkg:infra` | #006b75 | 인프라 |

#### 도메인 (Domain)
| 라벨 | 색상 | 설명 |
|------|------|------|
| `domain:auth` | #c5def5 | 인증/인가 |
| `domain:novel` | #bfd4f2 | 소설 |
| `domain:episode` | #d4c5f9 | 에피소드 |
| `domain:payment` | #fef2c0 | 결제 |
| `domain:ai` | #f9d0c4 | AI 기능 |
| `domain:search` | #c2e0c6 | 검색 |

#### 프론트엔드 전용
| 라벨 | 색상 | 설명 |
|------|------|------|
| `ui` | #d876e3 | UI 컴포넌트 |
| `ux` | #e99695 | 사용자 경험 |
| `accessibility` | #0052cc | 접근성 |
| `responsive` | #84b6eb | 반응형 |

#### 상태/우선순위
| 라벨 | 색상 | 설명 |
|------|------|------|
| `triage` | #ededed | 분류 필요 |
| `in-progress` | #fef2c0 | 진행 중 |
| `blocked` | #b60205 | 차단됨 |
| `priority:critical` | #b60205 | P0 - 즉시 처리 |
| `priority:high` | #d93f0b | P1 - 높음 |
| `priority:medium` | #fbca04 | P2 - 중간 |
| `priority:low` | #0e8a16 | P3 - 낮음 |

---

## 4. Pull Request 정책

### 4.1 Merge 전략: Squash and Merge

- PR 제목이 커밋 메시지가 됨
- PR 설명에 상세 변경 내역 기록

### 4.2 리뷰 정책

| 규칙 | 설명 |
|------|------|
| 최소 리뷰어 | 1명 이상 승인 필수 |
| 자동 할당 | CODEOWNERS 파일 기반 |
| 리뷰 기한 | 24시간 이내 첫 리뷰 권장 |

### 4.3 PR 체크리스트

- [ ] 관련 이슈 링크
- [ ] 테스트 추가/수정
- [ ] 셀프 리뷰 완료
- [ ] Breaking Change 여부 확인
- [ ] 스크린샷 (UI 변경 시)

---

## 5. 서브모듈 정책

### 결정: 서브모듈 사용 안 함

pnpm workspace + turborepo가 모노레포 관리를 담당하므로 서브모듈은 불필요한 복잡성만 추가한다.

---

## 6. 태그 및 릴리스 전략

### 6.1 Semantic Versioning

**형식**: `{package}@{major}.{minor}.{patch}`

| 버전 | 변경 시점 |
|------|----------|
| Major (1.0.0) | Breaking Change |
| Minor (0.1.0) | 새 기능 (하위 호환) |
| Patch (0.0.1) | 버그 수정 |

### 6.2 태그 형식

```
api@1.2.3
web@1.2.3
shared@1.0.5
```

---

## 7. CI/CD와 Git 연동

### 7.1 워크플로우 트리거

| 이벤트 | 워크플로우 | 동작 |
|--------|-----------|------|
| PR 생성/업데이트 | pr-check | lint, test, type-check |
| develop push | staging-deploy | staging 배포 |
| main push | production-deploy | production 배포 (수동 승인) |

---

## 8. 브랜치 보호 규칙

### main 브랜치

| 규칙 | 설정 |
|------|------|
| PR 필수 | O |
| 1명 이상 승인 | O |
| CI 통과 필수 | O |
| force push 금지 | O |
| 직접 push 금지 | O |

### develop 브랜치

| 규칙 | 설정 |
|------|------|
| PR 필수 | O |
| 1명 이상 승인 | O |
| CI 통과 필수 | O |
| force push 금지 | O |

---

## 부록: 빠른 참조

### 브랜치 생성
```bash
git checkout develop && git pull origin develop
git checkout -b feature/web-episode-reader
```

### 커밋
```bash
git commit -m "feat(api): 결제 웹훅 처리 구현"
git commit -m "fix(web): 모바일 네비게이션 클릭 이슈 해결"
```

---

**작성**: Design Council (backend, frontend, infra, git-manager)
**작성일**: 2026-03-26
