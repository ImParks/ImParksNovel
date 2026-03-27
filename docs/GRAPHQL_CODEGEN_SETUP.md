# GraphQL Codegen 설정 가이드

## 개요

본 문서는 Next.js 웹 앱에 GraphQL Codegen을 도입하는 방법을 설명합니다.

**버전:** 0.1.0
**작성일:** 2026-03-27
**상태:** 설치 및 구성 준비 완료

---

## 설치 명령어

```bash
# 프로젝트 루트에서 실행
pnpm add -D \
  @graphql-codegen/cli \
  @graphql-codegen/client-preset \
  @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations \
  @graphql-codegen/typescript-graphql-request
```

또는 개별 설치:

```bash
cd apps/web
pnpm add -D \
  @graphql-codegen/cli \
  @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations \
  @graphql-codegen/typescript-graphql-request
```

---

## 파일 구조

### 코드젠 설정
```
apps/web/
├── codegen.ts                      # GraphQL Codegen 설정 파일
├── .graphqlconfig                  # IDE 설정 (GraphQL plugin)
└── src/graphql/                    # GraphQL 쿼리/뮤테이션
    ├── queries/
    │   ├── novels.graphql          # 소설 목록, 검색, 상세
    │   ├── user.graphql            # 사용자 정보, 인증
    │   └── payment.graphql         # 결제, 월렛
    └── mutations/
        ├── auth.graphql            # 회원가입, 로그인, 로그아웃
        ├── novel.graphql           # 소설/에피소드 관리
        └── payment.graphql         # 결제 처리
```

### 생성 파일 (자동)
```
apps/web/
└── src/generated/
    └── graphql.ts                  # 타입 안전한 쿼리 및 훅 자동 생성
```

---

## codegen.ts 설정 상세

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // 1. GraphQL 스키마 소스
  schema: 'http://localhost:4000/graphql',

  // 2. 쿼리/뮤테이션 문서 경로
  documents: [
    'src/**/*.graphql',    // .graphql 파일
    'src/**/*.tsx',        // TSX 파일의 inline gql()
    'src/**/*.ts',         // TS 파일의 inline gql()
  ],

  // 3. 코드 생성 설정
  generates: {
    'src/generated/graphql.ts': {
      // 사용할 플러그인
      plugins: [
        'typescript',                    // 타입 생성
        'typescript-operations',         // 쿼리/뮤테이션 타입
        'typescript-graphql-request',    // graphql-request 클라이언트 타입
      ],
      config: {
        skipTypename: false,             // __typename 포함
        withHooks: true,                 // React hooks 생성
      },
    },
  },
};

export default config;
```

---

## 사용 방법

### 1. 코드 생성 실행

```bash
cd apps/web
pnpm codegen
```

생성된 `src/generated/graphql.ts` 확인:
- GraphQL 타입 정의
- 쿼리/뮤테이션 타입
- Optional: graphql-request 클라이언트 훅

### 2. 쿼리/뮤테이션 작성 (src/graphql/)

**예시 1: queries/novels.graphql**
```graphql
query SearchNovels($keyword: String!, $limit: Int) {
  searchNovels(keyword: $keyword, limit: $limit) {
    id
    title
    coverImageUrl
    authorName
  }
}
```

**예시 2: mutations/auth.graphql**
```graphql
mutation SignIn($input: SignInInput!) {
  signIn(input: $input) {
    accessToken
    user {
      id
      email
      role
    }
  }
}
```

### 3. 생성된 타입 활용

```typescript
// src/lib/graphql-client.ts (기존 유지)
import { graphqlClient, gql } from '@/lib/graphql-client'
import type { SearchNovelsQuery } from '@/generated/graphql'

// 타입 안전한 요청
const data = await gql<SearchNovelsQuery>(SEARCH_NOVELS_QUERY, {
  keyword: '마법',
  limit: 10,
})
```

---

## 기존 코드와의 호환성

### 유지되는 파일
- `src/lib/graphql-client.ts` — graphql-request 클라이언트
- `src/lib/graphql-queries.ts` — 수동 쿼리 정의

### 마이그레이션 (선택적)

기존 쿼리를 새 시스템으로 점진적 이전 가능:

```typescript
// Before: 수동 타입 정의
const query = `query SearchNovels { ... }`
const data = await gql<SearchNovelsQuery>(query)

// After: 자동 생성된 타입
import type { SearchNovelsQuery } from '@/generated/graphql'
const data = await gql<SearchNovelsQuery>(SEARCH_NOVELS_QUERY)
```

---

## 주의사항

### 1. 스키마 URL
- 로컬 개발: `http://localhost:4000/graphql`
- 백엔드가 실행 중이어야 introspection 가능
- 백엔드 GraphQL 엔드포인트 URL 변경 시 `codegen.ts` 수정

### 2. .gitignore 관리
**`src/generated/` 폴더는 커밋 대상입니다** (코드 생성 폴더이지만 팀 동기화 필요)

```bash
# NOT in .gitignore
# src/generated/  ← 생성 파일도 추적

# .gitignore에 있어야 할 것
node_modules/
.turbo/
.next/
```

### 3. CI/CD 통합
배포 전에 codegen 실행:

```bash
# package.json scripts
pnpm codegen
pnpm build
```

---

## 트러블슈팅

### 문제: "schema 연결 실패"
```
error Could not introspect schema from http://localhost:4000/graphql
```

**해결:**
1. 백엔드 서버 실행 확인: `http://localhost:4000/graphql` 접근 가능한지 확인
2. GraphQL 엔드포인트 URL 재확인
3. 방화벽/프록시 설정 확인

### 문제: "unknown directive"
GraphQL 스키마에서 커스텀 지시어 사용 시 설정 추가:

```typescript
// codegen.ts
config: {
  customDirectives: {
    auth: { skipIntrospection: true },  // 예시
  },
}
```

### 문제: "generated 파일 타입 오류"
- 백엔드 스키마 변경 후 `pnpm codegen` 다시 실행
- 타입 캐시 삭제: `rm -rf src/generated/ && pnpm codegen`

---

## 다음 단계

1. **패키지 설치**: 위의 설치 명령어 실행
2. **코드 생성**: `pnpm codegen` 실행
3. **타입 확인**: `src/generated/graphql.ts` 생성 확인
4. **쿼리 마이그레이션**: 기존 `graphql-queries.ts`를 `.graphql` 파일로 점진적 이전
5. **배포 자동화**: CI/CD에 `pnpm codegen` 추가

---

## 참고 자료

- [GraphQL Codegen 공식 문서](https://the-guild.dev/graphql/codegen)
- [typescript-graphql-request 플러그인](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-graphql-request)
- [Apollo Client Code Generation](https://www.apollographql.com/docs/devtools/cli/)
