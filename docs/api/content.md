# Content 도메인 API

## GraphQL Queries

### comments(episodeId: ID!, orderBy: CommentOrderBy, first: Int, after: String): CommentConnection!
- 인증: 선택 | 권한: 없음
- 회차 댓글 목록 (최신순/좋아요순)

### myBookmarks(first: Int, after: String): BookmarkConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- 내 북마크 목록 (연재 추적용, 새 회차 N 배지)

### myFavorites(first: Int, after: String): FavoriteConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- 내 즐겨찾기 목록 (보관용, 알림 없음)

### recentReads(first: Int, after: String): ReadingHistoryConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- 최근 본 작품 (최대 50개)

### isBookmarked(novelId: ID!): Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자

### isFavorited(novelId: ID!): Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자

### isLiked(targetType: LikeTargetType!, targetId: ID!): Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자

---

## GraphQL Mutations

### createComment(input: CreateCommentInput!): Comment!
- 인증: 필수 | 권한: 모든 인증 사용자
- Input: episodeId!, content! (1~1,000자), isSpoiler?

### createReply(input: CreateReplyInput!): Comment!
- 인증: 필수 | 권한: 모든 인증 사용자 (2단계까지)
- Input: parentId!, content! (1~1,000자)

### updateComment(id: ID!, content: String!): Comment!
- 인증: 필수 | 권한: 댓글 작성자

### deleteComment(id: ID!): Boolean!
- 인증: 필수 | 권한: 댓글 작성자 또는 ADMIN
- "삭제된 댓글입니다" 표시, 대댓글 유지

### toggleLike(targetType: LikeTargetType!, targetId: ID!): LikeResult!
- 인증: 필수 | 권한: 모든 인증 사용자
- 좋아요 토글 (소설/회차/댓글)

### toggleDislike(targetType: DislikeTargetType!, targetId: ID!): DislikeResult!
- 인증: 필수 | 권한: 모든 인증 사용자
- 싫어요 토글 (소설/회차) — 공개 표시

### toggleBookmark(novelId: ID!): BookmarkResult!
- 인증: 필수 | 권한: 모든 인증 사용자
- 북마크 토글 (새 회차 알림 ON)

### toggleFavorite(novelId: ID!): FavoriteResult!
- 인증: 필수 | 권한: 모든 인증 사용자
- 즐겨찾기 토글 (알림 없음)

### recommendEpisode(episodeId: ID!): Boolean!
- 인증: 필수 | 권한: 회차 열람자
- 회차 추천 (1회만, 취소 불가)

### report(input: ReportInput!): Report!
- 인증: 필수 | 권한: 모든 인증 사용자
- Input: targetType!, targetId!, reason!, description?
- 동일 대상 3건 이상 신고 시 자동 숨김

---

## Types

```graphql
type Comment {
  id: ID!
  userId: String!
  episodeId: String!
  content: String!
  isSpoiler: Boolean!
  parentId: String
  depth: Int!
  likeCount: Int!
  isEdited: Boolean!
  isHidden: Boolean!
  isPinned: Boolean!
  createdAt: DateTime!
  replies: [Comment!]!
  isLikedByMe: Boolean
}

type LikeResult { isLiked: Boolean!, count: Int! }
type DislikeResult { isDisliked: Boolean!, count: Int! }
type BookmarkResult { isBookmarked: Boolean! }
type FavoriteResult { isFavorited: Boolean! }

enum LikeTargetType { NOVEL EPISODE COMMENT }
enum DislikeTargetType { NOVEL EPISODE }
enum CommentOrderBy { CREATED_AT_DESC LIKE_COUNT_DESC }
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| COMMENT_001 | 404 | 댓글을 찾을 수 없음 |
| COMMENT_002 | 403 | 댓글 수정 권한 없음 |
| COMMENT_003 | 400 | 댓글 내용 1~1,000자 제한 |
| COMMENT_004 | 400 | 대댓글 2단계 초과 |
| BOOKMARK_001 | 404 | 소설을 찾을 수 없음 |
| RECOMMEND_001 | 409 | 이미 추천한 회차 |
| REPORT_001 | 409 | 이미 신고한 대상 |
| REPORT_002 | 400 | 자기 자신 신고 불가 |
