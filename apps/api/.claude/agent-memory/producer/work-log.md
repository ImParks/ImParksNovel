# 작업 일지: 소설 상세/에피소드 페이지 GraphQL API 연동

## 작업 환경
- 프로젝트: C:\Users\alovo\job\vibe_coding
- 작업 유형: 기존 파일 수정 (mock → API 연동)
- 시작 시각: 2026-03-26T현재시각

## 사전 점검 결과
1. **설계 문서**: 사용자가 직접 요구사항 명시 (비공식 파이프라인)
2. **GraphQL 클라이언트**: `apps/web/src/lib/graphql-client.ts` 존재 확인 ✓
3. **대상 파일 존재 확인**:
   - apps/web/src/app/(main)/novel/[id]/page.tsx ✓
   - apps/web/src/app/(main)/novel/[id]/episode/[episodeId]/page.tsx ✓
4. **현재 상태**: 두 파일 모두 mock 데이터 사용 중
5. **요구사항 명확성**: API 쿼리 스펙 명시됨 ✓

## 작업 단위 분해

### WU-1: Novel Detail Page API 연동
- **파일**: apps/web/src/app/(main)/novel/[id]/page.tsx
- **구현 내용**:
  - novelDetail 쿼리 추가
  - episodes 쿼리 추가 (전체 회차 목록)
  - authorProfile 쿼리 추가
  - useEffect로 데이터 로딩
  - 로딩 상태 표시
  - API 실패 시 mock 데이터 fallback
- **의존성**: 없음

### WU-2: Episode Viewer Page API 연동
- **파일**: apps/web/src/app/(main)/novel/[id]/episode/[episodeId]/page.tsx
- **구현 내용**:
  - episode 쿼리 추가
  - comments 쿼리 추가
  - useEffect로 데이터 로딩
  - 로딩 상태 표시
  - API 실패 시 mock 데이터 fallback
- **의존성**: 없음

## 작업 내역

### WU-1: Novel Detail Page API 연동
- **파일**: apps/web/src/app/(main)/novel/[id]/page.tsx
- **구현 내용**:
  1. useEffect + useState 패턴으로 API 호출 구현
  2. 3개 GraphQL 쿼리 통합:
     - novelDetail: 소설 기본 정보, 최근 에피소드, 유사 작품
     - episodes: 전체 회차 목록 (first: 100)
     - authorProfile: 작가 정보
  3. 로딩 상태 표시 (스피너 + "로딩 중..." 텍스트)
  4. API 실패 시 mock 데이터로 자동 fallback (try-catch)
  5. 데이터 변환 로직:
     - episodes.edges -> 배열 평탄화 + 날짜 포맷팅
     - similarNovels -> NovelGrid 컴포넌트 형식 변환
  6. 커버 이미지 소스를 novelCard → novelData로 변경 (API 데이터 우선)
- **설계 일치 여부**: 일치
- **특이사항**:
  - genreId를 genreName으로 변환하는 로직 필요 (TODO 주석 추가)
  - 작가의 총 작품 수를 API에서 가져오는 기능 필요 (TODO 주석 추가)
- **완료 시각**: 2026-03-26T(현재시각)

### WU-2: Episode Viewer Page API 연동
- **파일**: apps/web/src/app/(main)/novel/[id]/episode/[episodeId]/page.tsx
- **구현 내용**:
  1. useEffect + useState 패턴으로 API 호출 구현
  2. 2개 GraphQL 쿼리 통합:
     - episode: 에피소드 상세 정보
     - comments: 댓글 목록 (first: 50)
  3. 로딩 상태 표시 (스피너 + "로딩 중..." 텍스트)
  4. API 실패 시 mock 데이터로 자동 fallback (try-catch)
  5. 데이터 변환 로직:
     - comments.edges -> 배열 평탄화
  6. 이전/다음 에피소드 ID를 별도 state로 관리
- **설계 일치 여부**: 일치
- **특이사항**:
  - 소설 제목(novelTitle)을 API에서 가져오는 로직 필요 (TODO 주석 추가)
  - 이전/다음 에피소드 ID를 Episode API가 직접 제공하도록 개선 필요 (TODO 주석 추가)
  - 현재는 episodeNumber ±1로 임시 계산 중
- **완료 시각**: 2026-03-26T(현재시각)

## 환경변수 추가 사항
없음 (기존 NEXT_PUBLIC_API_URL 사용)

## 보안 체크 결과
✓ SQL 인젝션: GraphQL 쿼리는 변수 바인딩 사용
✓ XSS: React의 기본 이스케이핑 적용
✓ CSRF: GraphQL은 POST 요청, 토큰 기반 인증 사용
✓ 민감 정보 하드코딩: 없음
✓ 인증/인가: graphql-client에서 토큰 자동 첨부

## 특이사항

### API 개선 제안
1. **Genre 정보**: genreId만 제공되므로, genreName을 함께 반환하도록 API 개선 필요
2. **작가 통계**: authorProfile에 총 작품 수(totalWorks) 필드 추가 필요
3. **Novel Title in Episode**: episode 쿼리 응답에 novelTitle 포함 필요
4. **이전/다음 에피소드**: episode 쿼리 응답에 prevEpisodeId, nextEpisodeId 포함 필요

### Fallback 동작
- 모든 API 호출은 try-catch로 래핑
- 실패 시 기존 MOCK_NOVEL_DETAILS, MOCK_EPISODES 사용
- 콘솔 에러 로깅으로 디버깅 지원
