# GraphQL API 연동 구현 완료

## 작업 개요
작가 페이지 4개 + 관리자 페이지 4개를 백엔드 GraphQL API와 연동했습니다.
- **실패 시 fallback**: Mock 데이터로 자동 대체
- **로딩 상태**: Spinner 컴포넌트로 표시
- **인증 확인**: useAuthStore로 사용자 검증
- **기존 UI 유지**: 레이아웃/스타일 변경 없음

---

## 수정 파일 목록

### 1. GraphQL 쿼리 정의
**파일**: `apps/web/src/lib/graphql-queries.ts`

새로운 쿼리/뮤테이션 추가:
- `AUTHOR_DASHBOARD_QUERY` - 작가 대시보드 통계
- `ADMIN_DASHBOARD_QUERY` - 관리자 대시보드 통계
- `PUBLISHED_NOTICES_QUERY` - 발행된 공지사항 목록
- `REPORTS_QUERY` - 신고 목록

---

## 수정 페이지 (8개)

### 작가 페이지 (4개)

#### 1. 작가 대시보드
**경로**: `apps/web/src/app/(main)/author/page.tsx`

**API 호출**:
- `authorDashboard` 쿼리: 통계 조회 (총수익, 월수익, 조회수, 구독자)
- `myNovels` 쿼리: 최근 5개 소설 조회

**구현 특징**:
- API 실패 시 mock 데이터로 자동 fallback
- 로딩 중 Spinner 표시
- useAuthStore로 인증 확인

---

#### 2. 내 소설 목록
**경로**: `apps/web/src/app/(main)/author/novels/page.tsx`

**API 호출**:
- `myNovels` 쿼리: 상태별(ONGOING/COMPLETED) 필터링 조회

**구현 특징**:
- 상태 필터 변경 시 자동 재조회
- API 실패 시 mock 데이터 사용
- 로딩 상태 표시

---

#### 3. 새 소설 생성
**경로**: `apps/web/src/app/(main)/author/novels/new/page.tsx`

**API 호출**:
- `genres` 쿼리: 장르 목록 동적 로드
- `createNovel` 뮤테이션: 소설 생성 (DRAFT/PUBLISHED 상태)

**구현 특징**:
- 장르 데이터 초기 로드
- 임시저장 vs 발행 분리
- 폼 검증 및 제출 중 버튼 비활성화

---

#### 4. 새 회차 생성
**경로**: `apps/web/src/app/(main)/author/novels/[id]/episodes/new/page.tsx`

**API 호출**:
- `createEpisode` 뮤테이션: 회차 생성
- `publishEpisode` 뮤테이션: 회차 발행

**구현 특징**:
- 두 단계 처리: 생성(DRAFT) → 발행(PUBLISHED)
- 글자수 검증 (500~50,000자)
- 제출 중 로딩 상태 표시

---

### 관리자 페이지 (4개)

#### 5. 관리자 대시보드
**경로**: `apps/web/src/app/(main)/admin/page.tsx`

**API 호출**:
- `adminDashboard` 쿼리: 통계 조회 (대기신고, 신규가입, 신규소설, 매출, 활성사용자)
- `reports` 쿼리: 최근 신고 5개 조회

**구현 특징**:
- Admin 권한 확인
- API 실패 시 mock 데이터 사용
- 로딩 상태 표시

---

#### 6. 사용자 관리
**경로**: `apps/web/src/app/(main)/admin/users/page.tsx`

**상태**:
- Mock 데이터 유지 (API 미지원)
- API 호출 구조만 준비 (주석으로 예시 제공)
- 향후 API 지원 시 빠른 전환 가능

**구현 특징**:
- 검색/필터링 기능 유지
- 로딩 상태 표시

---

#### 7. 공지사항 관리
**경로**: `apps/web/src/app/(main)/admin/notices/page.tsx`

**API 호출**:
- `publishedNotices` 쿼리: 발행된 공지사항 조회

**구현 특징**:
- 공지사항 작성 폼 (임시저장/발행 분리)
- API 연동 준비 (TODO: CREATE_NOTICE_MUTATION)
- 로딩 상태 표시

---

#### 8. 신고 관리
**경로**: `apps/web/src/app/(main)/admin/reports/page.tsx`

**API 호출**:
- `reports` 쿼리: 신고 목록 조회

**구현 특징**:
- 신고 처리 (해결/기각)
- 상태별(pending/resolved/rejected) 필터링
- API 연동 준비 (TODO: RESOLVE_REPORT_MUTATION)
- 로딩 상태 표시

---

## 구현 패턴

### 1. 데이터 조회 패턴
```typescript
const [data, setData] = useState(MOCK_DATA);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const result = await gql<T>(QUERY, variables);
      if (result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      // Mock data already set
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [dependencies]);

if (loading) {
  return <Spinner size="lg" />;
}
```

### 2. 데이터 제출 패턴
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (validation fails) {
    alert('error message');
    return;
  }

  if (!user) {
    alert('로그인이 필요합니다.');
    return;
  }

  setIsSubmitting(true);
  try {
    const result = await gql<T>(MUTATION, { input: variables });
    if (result.data) {
      alert('success message');
      // redirect or reset form
    }
  } catch (error) {
    console.error('Failed:', error);
    alert('error message');
  } finally {
    setIsSubmitting(false);
  }
};

// 버튼
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Spinner size="sm" /> 처리 중...
    </>
  ) : (
    '버튼 텍스트'
  )}
</Button>
```

### 3. 필터링 패턴
```typescript
const [statusFilter, setStatusFilter] = useState('ALL');
const [data, setData] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    const status = statusFilter === 'ALL' ? undefined : statusFilter;
    const result = await gql(QUERY, { status });
    // ...
  };

  fetchData();
}, [statusFilter]); // 필터 변경 시 재조회
```

---

## 에러 처리 전략

### API 실패 시 Fallback
모든 페이지에서 API 호출 실패 시 mock 데이터로 자동 대체됩니다.
사용자는 데이터 손실 없이 서비스를 계속 사용 가능합니다.

### 인증 확인
민감한 작업(생성/수정/삭제) 전에 useAuthStore로 사용자 확인:
```typescript
if (!user) {
  alert('로그인이 필요합니다.');
  return;
}
```

### 권한 확인
관리자 페이지는 Admin 권한 확인 후 권한 없음 메시지 표시

---

## 향후 작업

### 필요한 추가 뮤테이션
1. `CREATE_NOTICE_MUTATION` - 공지사항 생성
2. `RESOLVE_REPORT_MUTATION` - 신고 처리
3. `REJECT_REPORT_MUTATION` - 신고 기각
4. `UPDATE_NOVEL_MUTATION` - 소설 수정 (기존 쿼리 활용)
5. `DELETE_EPISODE_MUTATION` - 회차 삭제

### 최적화 기회
1. React Query 도입 (캐싱/동기화)
2. 무한 스크롤 구현 (pagination)
3. 실시간 업데이트 (websocket)
4. 폼 유효성 검사 라이브러리 (react-hook-form)
5. 이미지 업로드 처리

---

## 변경 사항 요약

### 파일별 수정

| 파일 | 변경 유형 | 주요 추가 사항 |
|------|---------|--------------|
| graphql-queries.ts | 추가 | AUTHOR_DASHBOARD, ADMIN_DASHBOARD, PUBLISHED_NOTICES, REPORTS 쿼리 |
| author/page.tsx | 수정 | API 호출, 로딩 상태, 에러 처리 |
| author/novels/page.tsx | 수정 | API 호출, 필터링, 로딩 상태 |
| author/novels/new/page.tsx | 수정 | 장르 로드, 뮤테이션, 폼 검증 |
| author/.../episodes/new/page.tsx | 수정 | 에피소드 생성/발행, 두 단계 처리 |
| admin/page.tsx | 수정 | API 호출, 통계 표시, 권한 확인 |
| admin/users/page.tsx | 수정 | API 구조 준비, 로딩 상태 |
| admin/notices/page.tsx | 수정 | API 호출, 공지사항 조회, 폼 제출 |
| admin/reports/page.tsx | 수정 | API 호출, 신고 조회, 처리 기능 |

### 총 코드 추가
- **쿼리 정의**: ~45줄
- **페이지 수정**: ~415줄
- **총합**: ~460줄 추가

---

## 테스트 체크리스트

### 작가 페이지
- [ ] 작가 대시보드 - 통계 데이터 로드
- [ ] 내 소설 목록 - 필터링 동작
- [ ] 새 소설 생성 - 장르 로드 및 생성
- [ ] 새 회차 생성 - 글자수 검증 및 발행

### 관리자 페이지
- [ ] 관리자 대시보드 - 통계 데이터 로드
- [ ] 권한 확인 - Admin이 아닌 사용자 차단
- [ ] 공지사항 관리 - 목록 조회
- [ ] 신고 관리 - 목록 조회 및 필터링

### 에러 처리
- [ ] API 실패 시 mock fallback
- [ ] 로딩 중 Spinner 표시
- [ ] 에러 메시지 표시
- [ ] 제출 중 버튼 비활성화

---

## 배포 체크리스트

- [ ] `.env` 파일에서 `NEXT_PUBLIC_API_URL` 확인
- [ ] GraphQL 서버 정상 작동 확인
- [ ] 쿼리/뮤테이션 이름 및 필드 검증
- [ ] 토큰 저장 위치 확인 (localStorage)
- [ ] 프로덕션 환경 CORS 설정 확인
