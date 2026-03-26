# 소설 연재 플랫폼 MVP 진행 상황

## 최종 업데이트: 2026-03-22

---

## 1. 전체 단계 현황

| 단계 | 설명 | 상태 |
|------|------|------|
| 1. 기술 스택 선정 | 3라운드 토론 | ✅ 완료 |
| 2. 아키텍처 원칙 확정 | DDD + Hexagonal, 5계층 | ✅ 완료 |
| 3. 에이전트/스킬 생성 | 14 에이전트, 15 스킬 | ✅ 완료 |
| 4. 기능 목록 작성 | 84개 (MVP 51 + Phase2 27 + Phase3 6) | ✅ 완료 |
| 5. DB 스키마 설계 | 43 테이블, 25 ENUM (Prisma) | ✅ 완료 |
| 6. API 엔드포인트 설계 | 8 도메인 API 스펙 | ✅ 완료 |
| 7. 프로젝트 초기 세팅 | 모노레포, Docker, ESLint, Prisma, NestJS DDD, Next.js Atomic | ✅ 완료 |
| 8. MVP 개발 | 도메인별 순차 구현 | 🔄 진행 중 |

---

## 2. MVP 개발 파이프라인 현황

### Pipeline-002: User + System + 공통 인프라 ✅ 완료

| 항목 | 상태 | 생성 파일 수 |
|------|------|------------|
| 의존성 설치 (pnpm install) | ✅ | - |
| Prisma Client 생성 | ✅ | - |
| 공통 인프라 (JWT, Guards, Filters) | ✅ | 10개 |
| User 도메인 (회원가입/로그인/JWT/프로필/작가전환/탈퇴) | ✅ | 6개 |
| System 도메인 (알림/장르/태그) | ✅ | 5개 |
| QC 빌드 검증 | ✅ | 73→0 에러 |

**작업 일지**: `logs/pipelines/pipeline-002/production/work-log.md`

### Pipeline-003: Novel + Content ✅ 완료

| 항목 | 상태 | 생성 파일 수 |
|------|------|------------|
| Novel 도메인 (소설CRUD/회차/연재주기/임시저장/열람) | ✅ | 6개 |
| Content 도메인 (댓글/좋아요/북마크/즐겨찾기/추천/신고) | ✅ | 6개 |
| QC 빌드 검증 | ✅ | 0 에러 (첫 빌드 통과) |

**작업 일지**: `logs/pipelines/pipeline-003/production/work-log.md`

### Pipeline-004: Payment + Discovery ❌ 미시작

| 항목 | 상태 |
|------|------|
| Payment 도메인 (코인충전/구매/멤버십/후원/정산) | ❌ 미시작 |
| Discovery 도메인 (검색/랭킹/추천/조회수통계) | ❌ 미시작 |

### Pipeline-005: AI + Admin ❌ 미시작

| 항목 | 상태 |
|------|------|
| AI 도메인 (이어쓰기/문장개선/설정생성/플롯제안) | ❌ 미시작 |
| Admin 도메인 (콘텐츠관리/사용자관리/공지/배지) | ❌ 미시작 |

---

## 3. 도메인별 구현 상태

### ✅ 구현 완료 (4개 도메인)

#### User 도메인
- **Resolver**: signUp, signIn, refreshToken, signOut, me, user, updateProfile, applyForAuthor, updateAuthorProfile, requestPasswordReset, resetPassword, deleteAccount
- **Service**: JWT 발급, bcrypt 해싱, 로그인 5회 실패 → 30분 잠금, 닉네임 30일 제한, Refresh Token Rotation, 소프트 삭제
- **Repository**: 12개 메서드
- **DTO**: 6개 Input + 3개 ObjectType

#### System 도메인
- **Resolver**: notifications, unreadNotificationCount, genres, tags, markAsRead, markAllAsRead, deleteNotification
- **Service**: Cursor pagination, 알림 ownership 체크, createNotification (다른 도메인 호출용)
- **Repository**: base64 cursor 인코딩

#### Novel 도메인
- **Resolver**: novel, novelDetail, myNovels, episodes, episode, readingProgress, drafts, createNovel, updateNovel, deleteNovel, updateNovelStatus, updateSerializationSchedule, createEpisode, updateEpisode, deleteEpisode, publishEpisode, scheduleEpisode, cancelSchedule, saveDraft, autoSaveDraft, saveReadingProgress
- **Service**: wordCount 자동 계산, 유료 발행 시 무료 3개 검증, 발행 후 가격 변경 금지
- **TODO**: 유료 회차 200자 절삭 (payment 연동 후), 유료 구매 회차 삭제 방지 (payment 연동 후)

#### Content 도메인
- **Resolver**: comments, myBookmarks, myFavorites, recentReads, isBookmarked, isFavorited, isLiked, createComment, createReply, updateComment, deleteComment, toggleLike, toggleDislike, toggleBookmark, toggleFavorite, recommendEpisode, report
- **Service**: 토글 패턴, 댓글 2단계 제한, 신고 3건 자동 숨김, Comment.likeCount 동기화

### ⬜ 스켈레톤만 존재 (4개 도메인)

#### Payment 도메인
- module, controller, resolver, service, repository, orchestrator, port 파일 존재
- 모두 빈 클래스 (TODO 주석만)
- **설계 문서**: `docs/api/payment.md` (충전/구매/멤버십/후원/정산/웹훅)
- **스키마**: `prisma/schema/payment.prisma` (7개 테이블: CoinWallet, CoinTransaction, EpisodePurchase, Membership, Support, Settlement, Payment)

#### Discovery 도메인
- module, resolver, service, repository, orchestrator, port 파일 존재
- 모두 빈 클래스
- **설계 문서**: `docs/api/discovery.md` (검색/랭킹/추천/조회수)
- **스키마**: `prisma/schema/discovery.prisma` (4개 테이블: ViewCount, Ranking, SearchKeyword, NovelShareLink)

#### AI 도메인
- module, controller, service, repository, orchestrator, port 파일 존재
- 모두 빈 클래스
- **설계 문서**: `docs/api/ai.md` (SSE 스트리밍, 토큰 관리)
- **스키마**: `prisma/schema/ai.prisma`

#### Admin 도메인
- module, resolver, service, repository, orchestrator, port 파일 존재
- 모두 빈 클래스
- **설계 문서**: `docs/api/admin.md` (콘텐츠 검토, 사용자 관리, 공지, 배지)
- **스키마**: `prisma/schema/admin.prisma`

---

## 4. 공통 인프라 현황

### 완료
- `common/auth/` - JWT Strategy + AuthModule (1시간 만료)
- `common/guards/` - JwtAuthGuard (GraphQL 지원), RolesGuard (RBAC 4단계)
- `common/decorators/` - @CurrentUser(), @Roles()
- `common/filters/` - GlobalExceptionFilter (HttpException, Prisma 에러, GraphQL 호환)
- `common/types/context.ts` - GqlContext, JwtPayload
- `common/prisma/` - PrismaService (@Global)

### 미완료
- Redis 캐싱 모듈 (Discovery 랭킹, 조회수 등에 필요)
- Socket.io 모듈 (실시간 알림)
- Elasticsearch 클라이언트 (검색)
- S3 Presigned URL (파일 업로드)
- 토스페이먼츠 SDK 연동

---

## 5. 프론트엔드 현황

### 완료 (스켈레톤)
- Next.js 14 App Router + TailwindCSS + shadcn/ui 설정
- Atomic Design 구조 (atoms/molecules/organisms/templates)
- 기본 컴포넌트: Button (3 variant, 3 size), Input (label, error 지원)
- Zustand auth store (persist)
- React Query + GraphQL client (graphql-request)
- Providers wrapper (QueryClientProvider)
- 홈 페이지 (Coming Soon)

### 미완료
- 실제 페이지 구현 (로그인, 회원가입, 소설 목록, 뷰어 등)
- 라우팅 구조
- 추가 컴포넌트

---

## 6. 기술 스택 요약

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, Zustand, React Query, TipTap |
| Backend | NestJS 10.4, GraphQL (Apollo, code-first), Prisma 5.22, BullMQ |
| DB | PostgreSQL 16, Redis 7, Elasticsearch 8.15 |
| Auth | JWT (access 1h + refresh rotation), bcrypt, Passport |
| Infra | Docker Compose, pnpm workspace, Turborepo, GitHub Actions |
| 결제 | 토스페이먼츠 (미연동) |
| AI | OpenAI GPT-4o + Claude (미연동) |

---

## 7. 에이전트 워크플로우

매뉴얼 기반 파이프라인 운영:
```
Director(파이프라인 생성) → Producer(코드 생산, 병렬) → QC Inspector(빌드 검증) → Reporter(작업 일지)
```

설계 단계는 pipeline-001에서 이미 완료 (API 스펙 + DB 스키마).
생산 단계에서 도메인별 Producer 에이전트를 병렬 실행하고 QC에서 빌드 검증.

---

## 8. 빌드 환경

```bash
# PATH 설정 (Git Bash에서 필요)
export PATH="/c/Program Files/nodejs:/c/Users/alovo/AppData/Roaming/npm:$PATH"

# 의존성 설치
cd C:\Users\alovo\job\vibe_coding && pnpm install

# Prisma Client 생성
pnpm --filter api prisma:generate

# 빌드 검증
pnpm --filter api build

# 현재 빌드 상태: 성공 (에러 0개)
```

---

## 9. 다음 작업: Pipeline-004

### Payment 도메인 구현 범위
- 코인 지갑 (CoinWallet) 생성/조회
- 코인 충전 준비/확인 (토스페이먼츠 - 일단 mock)
- 유료 회차 구매 (코인 차감, 낙관적 잠금)
- 멤버십 구독 (BASIC/PREMIUM/VIP)
- 작가 후원 (코인 후원 + 메시지)
- 정산 조회 (월별 정산 내역)
- 토스 웹훅 (REST endpoint)
- **참조**: `docs/api/payment.md`, `prisma/schema/payment.prisma`

### Discovery 도메인 구현 범위
- 소설 검색 (PostgreSQL LIKE 기반 - Elasticsearch는 나중에)
- 장르별 소설 목록
- 랭킹 조회 (DB 기반 - Redis 캐시는 나중에)
- 실시간 인기 / 신작 랭킹
- 인기 검색어
- 유사 소설 추천 (장르/태그 기반 간단 로직)
- 조회수 기록
- **참조**: `docs/api/discovery.md`, `prisma/schema/discovery.prisma`
