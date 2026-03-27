# GraphQL Codegen & E2E 테스트 구현 요약

## 프로젝트 상태
- **작성일:** 2026-03-27
- **상태:** 구현 완료, 설치 및 검증 대기

---

## 1. GraphQL Codegen 도입

### 설치된 파일
```
apps/web/
├── codegen.ts                    # 코드젠 설정 (TypeScript)
├── .graphqlconfig                # IDE 지원 설정
└── src/graphql/
    ├── queries/
    │   ├── novels.graphql        # 소설 검색, 상세, 랭킹 등
    │   ├── user.graphql          # 사용자 정보, 인증
    │   └── payment.graphql       # 결제, 월렛, 멤버십
    └── mutations/
        ├── auth.graphql          # 회원가입, 로그인, 로그아웃
        ├── novel.graphql         # 소설/에피소드 CRUD
        └── payment.graphql       # 결제 처리
```

### 주요 특징
- **스키마 소스:** `http://localhost:4000/graphql` (Introspection)
- **문서 포함:** `.graphql` 파일 + inline `gql()` 호출
- **생성 결과:** `src/generated/graphql.ts` (자동)
- **플러그인:**
  - `typescript` — 타입 정의
  - `typescript-operations` — 쿼리/뮤테이션 타입
  - `typescript-graphql-request` — graphql-request 호환 타입

### 사용 방법
```bash
cd apps/web
pnpm codegen          # 코드 생성
pnpm codegen --watch # 감시 모드
```

### 호환성
- 기존 `src/lib/graphql-queries.ts` 유지
- 기존 `gql()` 함수 호환
- 점진적 마이그레이션 가능

---

## 2. E2E 테스트 확장

### 새로 추가된 테스트 파일

#### payment.spec.ts (6개 테스트)
결제 및 결제 관련 UI 검증:
- 코인 충전 페이지 렌더링
- 코인 패키지 선택 UI
- 멤버십 페이지 렌더링
- 멤버십 플랜 선택 UI
- 구매 내역 페이지
- 월렛 정보 표시

**의존성:** 로그인 필요 (beforeEach에서 자동 처리)

#### search.spec.ts (7개 테스트)
검색 및 필터링 기능 검증:
- 검색 페이지 접근
- 검색어 입력 및 결과 표시
- 장르 필터 적용
- 장르별 페이지 필터
- 검색 결과 → 소설 상세 이동
- 정렬 옵션 (있으면)
- 페이지네이션

**특징:** 로그인 불필요 (공개 페이지)

#### admin.spec.ts (10개 테스트)
관리자 기능 검증:
- 관리자 대시보드
- 사용자 관리 (목록, 검색, 상세)
- 공지사항 관리 (목록, 상세, 작성)
- 신고 관리 (목록, 상세)
- 액션 버튼 (편집, 삭제)

**의존성:** 관리자 계정 로그인 필요 (beforeEach에서 자동 처리)

### 기존 테스트 (유지)
- **auth.spec.ts** (4개) — 회원가입, 로그인
- **novel.spec.ts** (4개) — 소설 목록, 열람

### 총 테스트 개수
- 기존: 8개
- 신규: 23개
- **합계: 31개 E2E 테스트**

---

## 3. 설정 및 문서

### 생성된 문서
1. **GRAPHQL_CODEGEN_SETUP.md** — 설치 및 사용 가이드
2. **E2E_TESTING_GUIDE.md** — 테스트 작성 및 실행 가이드
3. **GRAPHQL_E2E_IMPLEMENTATION.md** — 이 문서 (요약)

### package.json 업데이트
```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.ts"
  }
}
```

---

## 4. 설치 및 검증 절차

### 4.1 필수 패키지 설치
```bash
cd apps/web
pnpm add -D \
  @graphql-codegen/cli \
  @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations \
  @graphql-codegen/typescript-graphql-request
```

### 4.2 코드 생성
```bash
pnpm codegen
```

**확인 사항:**
- `src/generated/graphql.ts` 파일 생성 확인
- 파일 크기: 약 10~20KB (쿼리 개수에 따라)
- 타입 에러 없음

### 4.3 E2E 테스트 실행
```bash
# 백엔드 실행 (필수)
docker compose up api

# 프론트엔드 개발 서버 실행 (필수)
pnpm dev

# 테스트 실행
pnpm test:e2e

# 또는 UI 모드
pnpm test:e2e:ui
```

### 4.4 선택자 검증 (필수)
현재 E2E 테스트는 다음 선택자를 사용합니다:
```
[data-testid="*"]    # 권장
.class-name          # CSS 클래스
text=/pattern/i      # 텍스트 패턴
```

**각 페이지에서 실제 선택자 확인 후 테스트 파일 업데이트 필요:**
1. `/payment/coins`, `/payment/membership`
2. `/search`
3. `/admin`, `/admin/users`, `/admin/notices`, `/admin/reports`

---

## 5. 파일 목록 및 경로

### GraphQL 파일
| 파일 | 경로 | 역할 |
|------|------|------|
| codegen.ts | `apps/web/codegen.ts` | 코드젠 설정 |
| .graphqlconfig | `apps/web/.graphqlconfig` | IDE 설정 |
| novels.graphql | `apps/web/src/graphql/queries/novels.graphql` | 소설 쿼리 |
| user.graphql | `apps/web/src/graphql/queries/user.graphql` | 사용자 쿼리 |
| payment.graphql | `apps/web/src/graphql/queries/payment.graphql` | 결제 쿼리 |
| auth.graphql | `apps/web/src/graphql/mutations/auth.graphql` | 인증 뮤테이션 |
| novel.graphql | `apps/web/src/graphql/mutations/novel.graphql` | 소설 뮤테이션 |
| payment.graphql | `apps/web/src/graphql/mutations/payment.graphql` | 결제 뮤테이션 |

### E2E 테스트 파일
| 파일 | 경로 | 테스트 수 | 신규 |
|------|------|----------|------|
| auth.spec.ts | `apps/web/e2e/auth.spec.ts` | 4 | - |
| novel.spec.ts | `apps/web/e2e/novel.spec.ts` | 4 | - |
| payment.spec.ts | `apps/web/e2e/payment.spec.ts` | 6 | O |
| search.spec.ts | `apps/web/e2e/search.spec.ts` | 7 | O |
| admin.spec.ts | `apps/web/e2e/admin.spec.ts` | 10 | O |

### 문서
| 파일 | 경로 | 내용 |
|------|------|------|
| GRAPHQL_CODEGEN_SETUP.md | `docs/GRAPHQL_CODEGEN_SETUP.md` | 코드젠 설치 및 사용 |
| E2E_TESTING_GUIDE.md | `docs/E2E_TESTING_GUIDE.md` | E2E 테스트 작성 및 실행 |
| GRAPHQL_E2E_IMPLEMENTATION.md | `docs/GRAPHQL_E2E_IMPLEMENTATION.md` | 이 문서 |

---

## 6. 다음 단계

### Phase 1: 설치 및 검증 (개발자)
1. [ ] 패키지 설치: `pnpm add -D @graphql-codegen/...`
2. [ ] 코드 생성: `pnpm codegen`
3. [ ] 생성 파일 확인: `src/generated/graphql.ts`

### Phase 2: 테스트 선택자 업데이트 (QA/개발자)
1. [ ] 각 페이지의 실제 선택자 확인
2. [ ] E2E 테스트 파일의 선택자 일치성 확인
3. [ ] 필요시 테스트 파일 수정

### Phase 3: E2E 테스트 실행 (QA)
1. [ ] 백엔드 및 프론트엔드 실행
2. [ ] `pnpm test:e2e` 실행
3. [ ] 실패한 테스트 분석 및 보고

### Phase 4: CI/CD 통합 (DevOps)
1. [ ] GitHub Actions 워크플로우 추가
2. [ ] PR 빌드에 E2E 테스트 포함
3. [ ] 배포 전 E2E 테스트 자동 실행

---

## 7. 주의사항

### 1. GraphQL Codegen
- 백엔드 GraphQL 엔드포인트가 실행 중이어야 함
- Introspection 쿼리 활성화 필요
- `codegen.ts` 설정 변경 시 재실행 필요

### 2. E2E 테스트
- **실제 운영 환경에서 테스트 실행 금지**
- 테스트용 계정/데이터 필요
- 페이지 선택자 변경 시 테스트 파일도 함께 수정
- 네트워크 상태에 따라 타임아웃 조정 필요

### 3. .gitignore 관리
```bash
# src/generated/는 추적 대상
# (자동 생성 파일이지만 팀 동기화 필요)

# 추적 제외 대상
node_modules/
.turbo/
playwright-report/
test-results/
```

---

## 8. 문제 해결

### GraphQL Codegen 오류
**"schema 연결 실패"**
```
error Could not introspect schema from http://localhost:4000/graphql
```
→ 백엔드 서버가 실행 중인지 확인

### E2E 테스트 실패
**"element not found" 또는 "timeout"**
1. 스크린샷 확인: `test-results/`
2. 선택자 재확인: 브라우저 DevTools에서 검증
3. 대기 시간 조정: `timeout` 파라미터 증가

**"로그인 실패"**
→ 시드 데이터 확인 (`reader1@test.com`, `admin@test.com`)

---

## 9. 참고 자료

### GraphQL Codegen
- [공식 문서](https://the-guild.dev/graphql/codegen)
- [typescript-graphql-request](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-graphql-request)

### Playwright
- [공식 문서](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Trace Viewer](https://trace.playwright.dev/)

### 현재 프로젝트
- [프로젝트 README](../README.md)
- [Docker 설정](../docker-compose.yml)
- [프론트엔드 구조](../apps/web/)

---

## 10. 연락처 및 피드백

변경 사항, 오류 또는 개선 사항은 다음 경로로 보고해주세요:
- GitHub Issues: [이슈 생성](../../issues/new)
- 내부 메모: 프로젝트 마스터 참조

---

**마지막 업데이트:** 2026-03-27
