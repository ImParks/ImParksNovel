# Novel 도메인 API

## GraphQL Queries

### novel(id: ID!): Novel
- 인증: 선택 (성인 콘텐츠는 필수) | 권한: 없음
- 소설 상세 조회

### novelDetail(id: ID!): NovelDetail!
- 인증: 선택 | 권한: 없음
- 작품소개 페이지 데이터 (소설 + 최근 회차 + 유사 소설 + 작가 다른 작품)

### myNovels(status: NovelStatus, first: Int, after: String): NovelConnection!
- 인증: 필수 | 권한: AUTHOR 이상
- 내 소설 목록 (작가용)

### episodes(novelId: ID!, status: EpisodeStatus, first: Int, after: String, orderBy: EpisodeOrderBy): EpisodeConnection!
- 인증: 선택 | 권한: 없음
- 회차 목록 조회

### episode(id: ID!): Episode
- 인증: 선택 (유료 회차는 필수) | 권한: 구매자 또는 멤버십
- 회차 상세 조회 (열람) — 유료 미구매 시 첫 200자만 반환

### readingProgress(novelId: ID!): ReadingProgress
- 인증: 필수 | 권한: 모든 인증 사용자
- 이어보기 정보

### drafts(novelId: ID): [Draft!]!
- 인증: 필수 | 권한: AUTHOR 이상
- 임시저장 목록

---

## GraphQL Mutations

### createNovel(input: CreateNovelInput!): Novel!
- 인증: 필수 | 권한: AUTHOR 이상
- Input: title!, synopsis!, coverImageUrl?, genreId!, tags[], isAdultOnly!

### updateNovel(id: ID!, input: UpdateNovelInput!): Novel!
- 인증: 필수 | 권한: 소설 작가 본인

### deleteNovel(id: ID!): Boolean!
- 인증: 필수 | 권한: 소설 작가 본인
- 유료 회차가 구매된 소설은 삭제 불가

### updateNovelStatus(id: ID!, status: NovelStatus!): Novel!
- 인증: 필수 | 권한: 소설 작가 본인
- 연재 상태 변경 (연재중/휴재/완결)

### updateSerializationSchedule(novelId: ID!, input: SerializationScheduleInput!): SerializationSchedule!
- 인증: 필수 | 권한: 소설 작가 본인
- 연재 주기 설정
- Input: type! (DAILY/SPECIFIC_DAYS/WEEKLY_COUNT/BIWEEKLY/MONTHLY_COUNT/IRREGULAR), serialDays[]?, serialCount?, preferredTime?

### createEpisode(input: CreateEpisodeInput!): Episode!
- 인증: 필수 | 권한: 소설 작가 본인
- Input: novelId!, title!, content! (500~50,000자), isFree!, price? (1~10코인)

### updateEpisode(id: ID!, input: UpdateEpisodeInput!): Episode!
- 인증: 필수 | 권한: 소설 작가 본인
- 발행 후 가격 변경 불가

### deleteEpisode(id: ID!): Boolean!
- 인증: 필수 | 권한: 소설 작가 본인

### publishEpisode(id: ID!): Episode!
- 인증: 필수 | 권한: 소설 작가 본인
- 무료 회차 최소 3개 필요 (유료 발행 시)

### scheduleEpisode(id: ID!, scheduledAt: DateTime!): Episode!
- 인증: 필수 | 권한: 소설 작가 본인

### cancelSchedule(id: ID!): Episode!
- 인증: 필수 | 권한: 소설 작가 본인

### saveDraft(input: SaveDraftInput!): Draft!
- 인증: 필수 | 권한: AUTHOR 이상
- 수동 임시저장

### autoSaveDraft(input: SaveDraftInput!): Draft!
- 인증: 필수 | 권한: AUTHOR 이상
- 자동 임시저장 (Phase 2: 서버 동기화)

### saveReadingProgress(input: ReadingProgressInput!): ReadingProgress!
- 인증: 필수 | 권한: 모든 인증 사용자
- Input: novelId!, episodeId!, scrollPosition?

### createShareLink(novelId: ID!, platform: String!): ShareLink!
- 인증: 선택 | 권한: 없음
- 공유 링크 생성 (카카오톡/트위터/페이스북/URL)

---

## REST API

### POST /api/upload/presigned-url
- 인증: 필수 | 권한: AUTHOR 이상
- S3 Presigned URL 생성
- Body: { fileType, fileName, uploadType: "COVER"|"EPISODE_IMAGE"|"AUTHOR_PROFILE" }
- Response: { uploadUrl, fileUrl, expiresAt }

### POST /api/upload/complete
- 인증: 필수 | 권한: AUTHOR 이상
- 업로드 완료 알림
- Body: { fileUrl, uploadType }

---

## Types

```graphql
type Novel {
  id: ID!
  title: String!
  synopsis: String!
  coverImageUrl: String
  authorId: String!
  genreId: String!
  tags: [String!]!
  status: NovelStatus!
  isAdultOnly: Boolean!
  totalEpisodes: Int!
  totalViews: Int!
  totalLikes: Int!
  totalDislikes: Int!
  totalBookmarks: Int!
  totalFavorites: Int!
  serializationSchedule: SerializationSchedule
  serializationMark: SerializationMark
  createdAt: DateTime!
}

type Episode {
  id: ID!
  novelId: String!
  episodeNumber: Int!
  title: String!
  content: String!
  wordCount: Int!
  isFree: Boolean!
  price: Int
  status: EpisodeStatus!
  viewCount: Int!
  likeCount: Int!
  dislikeCount: Int!
  recommendCount: Int!
  commentCount: Int!
  aiContributionRatio: Float
  publishedAt: DateTime
  isEdited: Boolean!
  createdAt: DateTime!
}

type SerializationSchedule {
  type: SerializationType!
  serialDays: [String!]
  serialCount: Int
  preferredTime: String
}

type SerializationMark {
  markType: SerializationMarkType!
  daysOverdue: Int!
  isActive: Boolean!
}

type NovelDetail {
  novel: Novel!
  recentEpisodes: [Episode!]!
  similarNovels: [Novel!]!
  authorOtherNovels: [Novel!]!
}

type Draft {
  id: ID!
  novelId: String
  episodeId: String
  title: String
  content: String
  updatedAt: DateTime!
}

type ReadingProgress {
  novelId: String!
  lastEpisodeId: String!
  lastEpisodeNumber: Int!
  scrollPosition: Float
  lastReadAt: DateTime!
}

type ShareLink {
  url: String!
  shareCode: String!
}

enum NovelStatus { DRAFT SERIALIZING HIATUS COMPLETED HIDDEN }
enum EpisodeStatus { DRAFT SCHEDULED PUBLISHED }
enum SerializationType { DAILY SPECIFIC_DAYS WEEKLY_COUNT BIWEEKLY MONTHLY_COUNT IRREGULAR }
enum SerializationMarkType { DELAYED SUSPENDED }
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| NOVEL_001 | 404 | 소설을 찾을 수 없음 |
| NOVEL_002 | 403 | 소설 수정 권한 없음 |
| NOVEL_003 | 400 | 구매된 유료 회차가 있어 삭제 불가 |
| EPISODE_001 | 404 | 회차를 찾을 수 없음 |
| EPISODE_002 | 403 | 회차 수정 권한 없음 |
| EPISODE_003 | 402 | 유료 회차 구매 필요 |
| EPISODE_004 | 403 | 성인 인증 필요 |
| EPISODE_005 | 400 | 본문 500자 미만 |
| EPISODE_006 | 400 | 본문 50,000자 초과 |
| EPISODE_007 | 400 | 무료 회차 최소 3개 필요 |
| EPISODE_008 | 400 | 발행 후 가격 변경 불가 |
| UPLOAD_001 | 400 | 지원하지 않는 파일 형식 |
| UPLOAD_002 | 400 | 파일 크기 초과 (5MB) |
