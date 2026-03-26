# Discovery 도메인 API

## GraphQL Queries

### searchNovels(query: String!, filters: SearchFilters, sort: SearchSort, first: Int, after: String): SearchResult!
- 인증: 선택 | 권한: 없음
- 소설 검색 (Elasticsearch nori 한글 형태소)
- 정렬: RELEVANCE, LATEST, VIEWS, LIKES, BOOKMARKS
- 필터: genreIds, tagIds, status, isAdultOnly, minEpisodes

### searchSuggestions(query: String!): [String!]!
- 인증: 선택 | 권한: 없음
- 검색어 자동완성

### popularSearchTerms(limit: Int): [PopularSearchTerm!]!
- 인증: 선택 | 권한: 없음
- 인기 검색어 (10분 갱신)

### genres: [Genre!]!
- 인증: 선택 | 권한: 없음
- 장르 목록

### novelsByGenre(genreId: ID!, sort: NovelSort, filters: GenreFilters, first: Int, after: String): NovelConnection!
- 인증: 선택 | 권한: 없음
- 장르별 소설 목록
- 정렬: LATEST, VIEWS, LIKES, BOOKMARKS
- 필터: status, minEpisodes

### ranking(type: RankingType!, period: RankingPeriod!, genreId: ID, limit: Int): Ranking!
- 인증: 선택 | 권한: 없음
- 랭킹 조회 (조회수/추천수/북마크수/복합)
- 기간: DAILY, WEEKLY, MONTHLY, ALL_TIME

### trendingNovels(limit: Int): [Novel!]!
- 인증: 선택 | 권한: 없음
- 실시간 인기 소설 (1시간 내 급상승, 10분 갱신)

### newReleases(genreId: ID, limit: Int): [Novel!]!
- 인증: 선택 | 권한: 없음
- 신작 랭킹 (30일 이내 연재 시작)

### personalizedRecommendations(limit: Int): [Recommendation!]!
- 인증: 필수 | 권한: 모든 인증 사용자
- 개인화 추천 (읽은 소설/북마크/추천 기록 분석)

### similarNovels(novelId: ID!, limit: Int): [Recommendation!]!
- 인증: 선택 | 권한: 없음
- 유사 소설 추천 (장르/태그/독자 행동 패턴)

### tagsByPopularity(limit: Int): [Tag!]!
- 인증: 선택 | 권한: 없음
- 인기 태그 목록

---

## Types

```graphql
type SearchResult {
  novels: NovelConnection!
  totalCount: Int!
  suggestions: [String!]!
}

type Ranking {
  type: RankingType!
  period: RankingPeriod!
  genre: Genre
  entries: [RankingEntry!]!
  updatedAt: DateTime!
}

type RankingEntry {
  rank: Int!
  previousRank: Int
  rankChange: Int
  novel: Novel!
  score: Float!
}

type Recommendation {
  novel: Novel!
  score: Float!
  reason: String!
}

type PopularSearchTerm {
  rank: Int!
  term: String!
  isNew: Boolean!
  isRising: Boolean!
}

input SearchFilters {
  genreIds: [ID!]
  tagIds: [ID!]
  status: NovelStatus
  isAdultOnly: Boolean
  minEpisodes: Int
}

enum SearchSort { RELEVANCE LATEST VIEWS LIKES BOOKMARKS }
enum NovelSort { LATEST VIEWS LIKES BOOKMARKS }
enum RankingType { GENRE REALTIME NEW_RELEASE COMPLETED SUPPORT }
enum RankingPeriod { DAILY WEEKLY MONTHLY ALL_TIME }
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| SEARCH_001 | 400 | 검색어 최소 2자 |
| SEARCH_002 | 400 | 유효하지 않은 필터 |
| GENRE_001 | 404 | 장르를 찾을 수 없음 |
| RANKING_001 | 400 | 유효하지 않은 랭킹 타입/기간 |
