# 바이브코딩 (소설 연재 플랫폼)

## 프로젝트 개요

소설 연재와 AI 작성 지원을 제공하는 플랫폼. 작가와 독자를 연결하고, AI 기반 창작 도구와 결제 시스템을 통합한다.

- **모노레포 구조**: pnpm workspace + Turborepo
- **백엔드**: `apps/api` — NestJS, GraphQL (Code-First), Prisma, BullMQ
- **프론트엔드**: `apps/web` — Next.js 14+ App Router, TailwindCSS, shadcn/ui, Zustand, React Query

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 백엔드 | TypeScript, NestJS, GraphQL, Prisma, BullMQ, PostgreSQL |
| 프론트엔드 | TypeScript, Next.js 14+, TailwindCSS, shadcn/ui, Zustand, React Query |
| 캐시/검색 | Redis, Elasticsearch (nori 한글 형태소) |
| 인프라 | Docker, AWS ECS Fargate, S3+CloudFront |
| 결제 | 토스페이먼츠 REST API (빌링키 정기결제) |
| AI | OpenAI / Claude API (SSE 스트리밍) |

## 디렉토리 구조

```
apps/
  api/          — NestJS 백엔드 (DDD+Hexagonal, GraphQL, Prisma, BullMQ)
  web/          — Next.js 14+ 프론트엔드 (App Router, Atomic Design)
packages/       — 공유 패키지 (types, utils 등)
docs/           — 프로젝트 문서
  GIT_POLICY.md           — Git 브랜치/커밋/PR 정책
  AGENT_GIT_WORKFLOW.md   — 에이전트 Git 워크플로우
.claude/
  agents/       — 에이전트 정의 파일
  skills/       — 스킬 정의 파일
  rules/        — 경로별 규칙 (확장 예비용)
logs/           — 파이프라인 기록 (hr, pipeline 등)
```

## 메인 Claude의 역할 (Director)

**메인 Claude가 Director 역할을 직접 수행한다.** Director 서브에이전트를 별도로 호출하지 않는다 (중첩 방지).

메인 Claude의 책임:
- 사용자와의 소통 및 요구사항 파악
- 파이프라인 단계 조율 및 판단
- 서브에이전트 위임 및 결과 검토

### 파이프라인 위임 구조

```
메인 Claude (Director 역할)
  ├── @design-council  — 전문가 토론, 설계 합의
  ├── @supervisor      — 단계별 승인/반려
  ├── @producer        — 코드/문서 생산
  ├── @qc-inspector    — 품질 검사
  ├── @git-manager     — 커밋, 브랜치, PR
  └── @reporter        — 사용자용 리포트
```

소규모 작업(간편 워크플로우)도 Issue 생성 → 브랜치 → 커밋 → PR 절차를 준수한다.

## 에이전트 시스템

- **운영 매뉴얼**: `.claude/skills/agent-manual/` — 파이프라인 흐름, 조직 구조, 기록 체계 등 모든 규칙
- **에이전트 생성 도구**: `.claude/skills/agent-creator/`
- **에이전트 파일**: `.claude/agents/` — 각 에이전트 AGENT.md
- **조직 명단**: `logs/hr/roster.json`

에이전트별 규칙은 각 AGENT.md에, 스킬별 규칙은 각 SKILL.md에 있다. 이 파일에서는 경로만 안내한다.

## Git 워크플로우

- **브랜치 전략**: `docs/GIT_POLICY.md` 참조 (main ← develop ← feature/*)
- **에이전트 Git 절차**: `docs/AGENT_GIT_WORKFLOW.md` 참조
- **커밋**: Conventional Commits (feat, fix, docs, refactor, test, chore)
- **PR**: develop 브랜치로 머지, main은 배포 시에만

## 개발 명령어

```bash
# 로컬 전체 실행 (Docker)
docker compose up -d

# 개발 서버
pnpm dev                  # 전체
pnpm --filter api dev     # 백엔드만
pnpm --filter web dev     # 프론트엔드만

# 빌드
pnpm build

# 테스트
pnpm test
pnpm --filter api test:e2e
```

## 환경변수

`.env.example` 파일을 기준으로 `.env` 파일을 구성한다. 환경변수 관리 규칙은 agent-manual 7장(보안 규칙)을 참조한다.

## 코딩 규칙 요약

- **아키텍처**: DDD + Hexagonal (백엔드), Atomic Design (프론트엔드)
- **언어**: TypeScript strict mode
- **포맷팅**: Prettier + ESLint (pnpm lint)
- **테스트**: 단위 테스트 필수, 통합 테스트 권장
- 상세 규칙은 각 specialist 스킬 파일 참조
