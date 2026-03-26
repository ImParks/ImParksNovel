# 소설 연재 플랫폼 DB 스키마 설계서

> **버전**: 1.0
> **작성일**: 2026-03-21
> **기준**: 기능 목록 84개 (MVP 51개 + Phase 2 27개 + Phase 3 6개)

---

## 1. 설계 원칙

### 1.1 DDD + Hexagonal Architecture 준수

| 원칙 | 적용 방식 |
|------|----------|
| 도메인 분리 | 8개 도메인별 테이블 그룹화 |
| ID 참조 | 도메인 간 FK 대신 String ID 참조 |
| 경계 컨텍스트 | 같은 도메인 내에서만 Prisma @relation 사용 |

### 1.2 공통 패턴

| 패턴 | 설명 |
|------|------|
| 타임스탬프 | 모든 테이블에 `createdAt`, `updatedAt` |
| 소프트 삭제 | 중요 테이블에 `deletedAt` (NULL = 활성) |
| CUID | 모든 PK는 `@id @default(cuid())` |
| 낙관적 잠금 | 동시성 제어가 필요한 테이블에 `version Int` |

---

## 2. 도메인별 엔티티 (43개 테이블)

| 도메인 | 테이블 수 | 핵심 테이블 |
|--------|----------|------------|
| **User** | 5 | users, user_identity_verifications, author_profiles |
| **Novel** | 5 | novels, episodes, novel_serialization_schedules, novel_serialization_marks |
| **AI** | 5 | ai_token_wallets, ai_generation_logs, episode_summaries, novel_settings |
| **Payment** | 7 | coin_wallets, episode_purchases, memberships, settlements, payments |
| **Content** | 9 | comments, bookmarks, favorites, reading_history, likes, dislikes |
| **Discovery** | 3 | view_counts, rankings, search_keywords |
| **Admin** | 6 | announcements, admin_actions, user_badges, events, popup_notices |
| **System** | 3 | notifications, genres, tags |

---

## 3. 핵심 설계 결정

### 3.1 도메인 간 참조: ID 참조 vs FK

```
같은 도메인 내: FK (@relation) 사용
  Episode → Novel (같은 Novel 도메인)

다른 도메인 간: String ID만 참조
  Novel.authorId → users.id (Novel → User 도메인 경계)
```

### 3.2 RBAC 역할 체계

```
UserRole ENUM:
  READER      → 소설 열람, 댓글, 코인 충전/구매
  AUTHOR      → Reader + 소설 작성, AI 기능, 정산
  ADMIN       → Author + 콘텐츠/사용자 관리, 공지사항
  SUPER_ADMIN → Admin + 시스템 설정, 정산 승인
```

### 3.3 연재 주기 설정

```
SerializationType ENUM:
  DAILY          → 매일
  SPECIFIC_DAYS  → 특정 요일 (serialDays: ["MON","WED","FRI"])
  WEEKLY_COUNT   → 주 N회 (serialCount: 3)
  BIWEEKLY       → 격주
  MONTHLY_COUNT  → 월 N회
  IRREGULAR      → 비정기 (30일 기준 지연 판정)
```

### 3.4 연재 마크 해제 조건

```
NovelSerializationMark:
  consecutiveReleases: Int  → 연속 연재 횟수 추적
  releaseConditionMet: Bool → 2주간 2회 이상 연속 연재 시 true
  마크 해제: releaseConditionMet = true일 때 isActive = false로 전환
```

### 3.5 대여권/소유권

```
EpisodePurchase:
  purchaseType: OWNERSHIP | RENTAL_3D | RENTAL_7D | RENTAL_14D
  expiresAt: NULL (영구소유) | DateTime (대여 만료일)
```

### 3.6 좋아요/싫어요 다형성

```
Like:
  targetType: NOVEL | EPISODE | COMMENT
  targetId: 대상의 CUID
  → 하나의 테이블로 소설/회차/댓글 좋아요 통합

Dislike:
  targetType: NOVEL | EPISODE
  targetId: 대상의 CUID
  → 공개 표시
```

### 3.7 북마크 vs 즐겨찾기

```
Bookmark: 연재 중 소설 추적, 새 회차 알림 O, 폴더 지원 (Phase 2)
Favorite: 완결작/나중에 볼 소설 보관, 새 회차 알림 X
```

---

## 4. ENUM 목록 (25개)

| ENUM | 값 수 | 용도 |
|------|-------|------|
| UserRole | 4 | RBAC 역할 |
| UserStatus | 3 | 계정 상태 |
| NovelStatus | 5 | 소설 상태 |
| EpisodeStatus | 3 | 회차 상태 |
| SerializationType | 6 | 연재 주기 유형 |
| SerializationMarkType | 2 | 연재 마크 유형 |
| CoinTransactionType | 7 | 코인 거래 유형 |
| AITokenTransactionType | 5 | AI 토큰 거래 유형 |
| PurchaseType | 4 | 구매 유형 |
| MembershipTier | 3 | 멤버십 등급 |
| MembershipStatus | 3 | 멤버십 상태 |
| SettlementStatus | 4 | 정산 상태 |
| LikeTargetType | 3 | 좋아요 대상 |
| DislikeTargetType | 2 | 싫어요 대상 |
| ReportTargetType | 4 | 신고 대상 |
| ReportStatus | 4 | 신고 상태 |
| NotificationType | 7 | 알림 유형 |
| AdminActionType | 10 | 관리자 조치 유형 |
| BadgeType | 5 | 배지 유형 |
| AIFeatureType | 8 | AI 기능 유형 |
| RankingType | 5 | 랭킹 유형 |
| RankingPeriod | 4 | 랭킹 기간 |
| PaymentStatus | 5 | 결제 상태 |
| PaymentMethod | 4 | 결제 수단 |
| SocialProvider | 3 | 소셜 로그인 |

---

## 5. 인덱스 전략

### 주요 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| novels | `[genreId, status, deletedAt]` | 장르별 소설 검색 |
| novels | `[tags]` (GIN) | 태그 배열 검색 |
| episodes | `[novelId, episodeNumber]` (UNIQUE) | 회차 조회 |
| episodes | `[novelId, publishedAt]` | 최신 회차 정렬 |
| coin_transactions | `[userId, createdAt]` | 거래 내역 조회 |
| comments | `[episodeId, deletedAt, createdAt]` | 댓글 목록 |
| likes | `[targetType, targetId]` | 대상별 좋아요 |
| rankings | `[rankingType, genreId, period]` | 랭킹 조회 |
| view_counts | `[episodeId, viewedAt]` | 조회수 집계 |
| notifications | `[userId, isRead, createdAt]` | 안읽은 알림 |

---

## 6. 성능 최적화

### 파티셔닝 후보 (대용량 데이터)

| 테이블 | 파티션 키 | 예상 데이터량 |
|--------|----------|-------------|
| view_counts | viewedAt (월별) | 수천만 건/월 |
| coin_transactions | createdAt (월별) | 수백만 건/월 |
| ai_generation_logs | createdAt (월별) | 수백만 건/월 |
| notifications | createdAt (월별) | 수백만 건/월 |

### Redis 캐싱 대상

| 데이터 | Redis 구조 | TTL |
|--------|-----------|-----|
| 코인 잔액 | String | 실시간 |
| AI 토큰 잔액 | String | 실시간 |
| 실시간 랭킹 | Sorted Set | 10분 |
| 조회수 카운터 | String (INCR) | 배치 정산 |
| 세션 | String | 세션 만료 |

---

## 7. 변경 이력

| 버전 | 일자 | 작성자 | 내용 |
|------|------|--------|------|
| 1.0 | 2026-03-21 | Design Council | 초기 스키마 설계 (43개 테이블, 25개 ENUM) |
