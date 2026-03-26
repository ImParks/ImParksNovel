# Admin 도메인 API

모든 Admin API는 인증 필수, 권한 ADMIN 이상 (별도 명시 제외)

## GraphQL Queries

### adminDashboard: AdminDashboard!
- 관리자 대시보드 (대기 신고, 오늘 신규 가입, 오늘 매출 등)

### adminReports(status: ReportStatus, targetType: ReportTargetType, first: Int, after: String): ReportConnection!
- 신고 목록

### contentReviewHistory(targetType: String, targetId: ID): [ContentReview!]!
- 콘텐츠 검토 이력

### adminUsers(role: UserRole, status: UserStatus, search: String, first: Int, after: String): UserConnection!
- 사용자 목록 (검색 가능)

### userPenaltyHistory(userId: ID!): [UserPenalty!]!
- 사용자 제재 이력

### adminNotices(category: NoticeCategory, isPublished: Boolean, first: Int, after: String): NoticeConnection!
- 공지사항 목록 (관리자용)

### notices(category: NoticeCategory, first: Int, after: String): NoticeConnection!
- 공지사항 목록 (사용자용, 권한 없음)

### notice(id: ID!): Notice
- 공지사항 상세 (권한 없음)

### badges: [Badge!]!
- 배지/마크 목록

### userBadges(userId: ID!): [UserBadge!]!
- 사용자 배지 목록 (권한 없음)

---

## GraphQL Mutations

### takeContentAction(input: ContentActionInput!): ContentReview!
- 콘텐츠 조치 (숨김/삭제/경고/복원)
- Input: targetType!, targetId!, action!, reason!

### takeUserAction(input: UserActionInput!): UserPenalty!
- 사용자 제재 (경고/정지 1일~영구)
- Input: userId!, action!, reason!, duration?

### liftUserPenalty(userId: ID!): User!
- 사용자 제재 해제

### resolveReport(id: ID!, input: ReportResolutionInput!): Report!
- 신고 처리 (해결/기각)
- Input: status!, adminNote?

### createNotice(input: CreateNoticeInput!): Notice!
- 공지사항 생성
- Input: title!, content!, category!, isPinned?, targetRoles[]?

### updateNotice(id: ID!, input: UpdateNoticeInput!): Notice!
### deleteNotice(id: ID!): Boolean!
### publishNotice(id: ID!): Notice!

### awardBadge(input: AwardBadgeInput!): UserBadge!
- 배지/마크 부여
- Input: targetType! ("USER"|"NOVEL"), targetId!, badgeType!, customName?, reason!, expiresAt?

### revokeBadge(badgeId: ID!, reason: String!): Boolean!
- 배지/마크 회수

### changeUserRole(userId: ID!, role: UserRole!): User!
- 권한: SUPER_ADMIN만
- 사용자 역할 변경

---

## Types

```graphql
type AdminDashboard {
  pendingReports: Int!
  todayNewUsers: Int!
  todayNewNovels: Int!
  todayRevenue: Int!
  activeUsers: Int!
}

type ContentReview {
  id: ID!
  targetType: String!
  targetId: String!
  action: String!
  reason: String!
  adminId: String!
  createdAt: DateTime!
}

type UserPenalty {
  id: ID!
  userId: String!
  action: String!
  reason: String!
  duration: String
  expiresAt: DateTime
  createdAt: DateTime!
}

type Notice {
  id: ID!
  title: String!
  content: String!
  category: NoticeCategory!
  isPinned: Boolean!
  isPublished: Boolean!
  publishedAt: DateTime
  createdAt: DateTime!
}

type UserBadge {
  id: ID!
  targetType: String!
  targetId: String!
  badgeType: BadgeType!
  customName: String
  reason: String!
  expiresAt: DateTime
  isActive: Boolean!
  createdAt: DateTime!
}

enum NoticeCategory { ANNOUNCEMENT UPDATE MAINTENANCE EVENT POLICY }
enum BadgeType { EVENT_WINNER CONTEST_WINNER FEATURED_AUTHOR FEATURED_NOVEL CUSTOM }
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| ADMIN_001 | 403 | 관리자 권한 필요 |
| ADMIN_002 | 403 | SUPER_ADMIN 권한 필요 |
| ADMIN_003 | 404 | 대상을 찾을 수 없음 |
| ADMIN_004 | 409 | 이미 처리된 신고 |
| ADMIN_005 | 400 | 자기 자신 제재 불가 |
| NOTICE_001 | 404 | 공지사항을 찾을 수 없음 |
| BADGE_001 | 409 | 이미 부여된 배지 |
| BADGE_002 | 404 | 배지를 찾을 수 없음 |
