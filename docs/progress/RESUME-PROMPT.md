# 다음 세션 재개 프롬프트

아래 프롬프트를 그대로 복사하여 새 세션에서 사용하세요.

---

```
소설 연재 플랫폼(vibe_coding) MVP 개발을 이어서 진행해.

## 프로젝트 위치
C:\Users\alovo\job\vibe_coding

## 현재 진행 상황
`docs/progress/MVP-PROGRESS.md` 파일을 읽고 현재 상태를 파악해.

## 에이전트 워크플로우
`.claude/skills/agent-manual/` 매뉴얼에 따라 에이전트 기반으로 진행해.
- Pipeline 생성 → Producer 에이전트 병렬 실행 → QC 빌드 검증 → 작업 일지 기록
- 작업 일지: `logs/pipelines/pipeline-{번호}/production/work-log.md`
- 파이프라인 상태: `logs/pipelines/pipeline-{번호}/pipeline.json`

## 다음 작업: Pipeline-004 (Payment + Discovery 도메인)

### Payment 도메인
- 설계 문서: `docs/api/payment.md`
- Prisma 스키마: `apps/api/prisma/schema/payment.prisma`
- 기존 스켈레톤: `apps/api/src/domains/payment/` (빈 클래스들)
- 구현: DTO, Repository, Service, Resolver, Controller(웹훅), Module 업데이트

### Discovery 도메인
- 설계 문서: `docs/api/discovery.md`
- Prisma 스키마: `apps/api/prisma/schema/discovery.prisma`
- 기존 스켈레톤: `apps/api/src/domains/discovery/` (빈 클래스들)
- 구현: DTO, Repository, Service, Resolver, Module 업데이트

## 빌드 환경
export PATH="/c/Program Files/nodejs:/c/Users/alovo/AppData/Roaming/npm:$PATH"
빌드 검증: pnpm --filter api build

## 주의사항
- tsconfig: strictPropertyInitialization: false, noUnusedLocals: false
- Guards import: `../../../common/guards/jwt-auth.guard`
- Decorators import: `../../../common/decorators/current-user.decorator`
- PrismaService import: `../../../common/prisma/prisma.service`
- GraphQL code-first (@ObjectType, @Field, @InputType, registerEnumType)
- Cursor pagination 패턴: createdAt base64 인코딩

Pipeline-004 생성 후 Producer 에이전트 2개를 병렬로 실행해서 Payment, Discovery 도메인을 구현해.
완료 후 QC 빌드 검증까지 진행하고, 그 다음 Pipeline-005 (AI + Admin)도 이어서 진행해.
```
