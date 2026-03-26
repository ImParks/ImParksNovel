# 인증 페이지 컴포넌트 구조

## Atomic Design 계층 분류

### Templates (템플릿)
```
AuthLayout (서버 컴포넌트)
├── 역할: (auth) 라우트 그룹의 공용 레이아웃
├── 책임: 중앙 정렬, 배경, max-width 제어
├── Props: children
├── Metadata: 기본 인증 페이지 메타데이터
└── 위치: apps/web/src/app/(auth)/layout.tsx
```

### Pages (페이지)
```
LoginPage (클라이언트 컴포넌트)
├── 역할: /login 라우트 페이지
├── 상태: email, password, error, isLoading
├── 자식:
│   ├── 로고 (Link to /)
│   ├── 제목 ("로그인")
│   ├── Input × 2 (이메일, 비밀번호)
│   ├── 에러 메시지 (조건부 렌더링)
│   ├── Button (로그인)
│   ├── 구분선 + "또는" 텍스트
│   ├── Button × 3 (Google, Kakao, Naver)
│   └── 링크 × 2 (비밀번호 재설정, 회원가입)
├── GraphQL: SIGN_IN_MUTATION
└── 위치: apps/web/src/app/(auth)/login/page.tsx

SignupPage (클라이언트 컴포넌트)
├── 역할: /signup 라우트 페이지
├── 상태: email, nickname, password, passwordConfirm, agreeTerms, agreePrivacy, errors, serverError, isLoading
├── 자식:
│   ├── 로고 (Link to /)
│   ├── 제목 ("회원가입")
│   ├── Input × 4 (이메일, 닉네임, 비밀번호, 확인)
│   ├── 체크박스 × 2 (이용약관, 개인정보)
│   ├── 에러 메시지 (조건부)
│   ├── Button (회원가입)
│   ├── 구분선 + "또는" 텍스트
│   ├── Button × 3 (Google, Kakao, Naver)
│   └── 링크 × 2 (로그인)
├── GraphQL: SIGN_UP_MUTATION
├── 검증: 클라이언트 사이드 폼 검증
└── 위치: apps/web/src/app/(auth)/signup/page.tsx
```

### Molecules (분자)
**현재 없음** — 폼이 간단하므로 atoms를 직접 조합

예시 (향후 필요시):
```
FormField (오류 메시지 + Input 조합)
AuthSocialButtons (소셜 로그인 버튼 3개 조합)
CheckboxWithLabel
```

### Atoms (원자)
```
Button (기존, 확장됨)
├── Props: variant, size, disabled, children
├── Variants: primary, secondary, ghost
├── 사용: 로그인, 회원가입, 소셜 로그인
└── 위치: apps/web/src/components/atoms/Button/index.tsx

Input (기존, 그대로 사용)
├── Props: label, error, hint, placeholder, type, value, onChange
├── 특징: aria-invalid, aria-describedby 지원
└── 위치: apps/web/src/components/atoms/Input/index.tsx
```

## 렌더링 전략 다이어그램

```
┌─ (auth)/layout.tsx (Server Component) ──────────────────┐
│                                                           │
│  ├─ Metadata 설정                                         │
│  ├─ HTML 구조: min-h-screen flex center                  │
│  │                                                        │
│  └─ {children}                                            │
│      │                                                    │
│      ├─ /login/page.tsx (Client Component)              │
│      │   ├─ useState (이메일, 비밀번호, 에러, 로딩)    │
│      │   ├─ useRouter (리다이렉트)                       │
│      │   ├─ useAuthStore (로그인 후 상태 저장)          │
│      │   ├─ gql<SignInResponse> (GraphQL 요청)          │
│      │   └─ 렌더링: Input, Button, Link, error message  │
│      │                                                    │
│      └─ /signup/page.tsx (Client Component)             │
│          ├─ useState (8개 상태)                          │
│          ├─ validateForm() (클라이언트 검증)             │
│          ├─ gql<SignUpResponse> (GraphQL 요청)          │
│          └─ 렌더링: Input×4, Checkbox×2, Button, Link  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 서버/클라이언트 컴포넌트 분류

| 컴포넌트 | 타입 | 이유 | 데이터 페칭 | 인터랙션 |
|---------|------|------|-----------|---------|
| AuthLayout | 서버 | 메타데이터, 정적 마크업 | X | X |
| LoginPage | 클라이언트 | useState, useRouter 필요 | GraphQL | 폼 제출 |
| SignupPage | 클라이언트 | useState, 폼 검증 필요 | GraphQL | 폼 제출 |
| Button | 클라이언트 | onClick 이벤트 | X | 클릭 |
| Input | 클라이언트 | onChange 필요 | X | 입력 |

## 상태 관리 설계

### Zustand (전역 상태)
```typescript
useAuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login(user, token)
  logout()
  updateUser(partial)
}
```
- **사용 위치**: LoginPage, SignupPage (로그인 후 상태 저장)
- **Persist**: localStorage ("vibe-auth")
- **목적**: 전체 앱에서 인증 상태 공유

### React State (로컬 상태)
```typescript
// LoginPage
email: string
password: string
error: string
isLoading: boolean

// SignupPage
email: string
nickname: string
password: string
passwordConfirm: string
agreeTerms: boolean
agreePrivacy: boolean
errors: Record<string, string>
serverError: string
isLoading: boolean
```
- **사용 위치**: 각 페이지 내부
- **범위**: 폼 제출 전까지만 필요
- **목적**: 폼 입력값, 에러, 로딩 상태 추적

### URL State (없음)
- 로그인/회원가입은 쿼리 파라미터 필요 없음
- 리다이렉트 URL이 필요하면 나중에 `/login?redirect=/dashboard` 형식 추가 가능

## GraphQL 데이터 흐름

### 로그인 흐름
```
LoginPage (폼 제출)
  ↓
gql<SignInResponse>(SIGN_IN_MUTATION, { email, password })
  ↓
GraphQL Server
  ↓
SignInResponse { accessToken, refreshToken, user }
  ↓
useAuthStore.login(user, accessToken)
  ↓
router.push('/')
```

### 회원가입 흐름
```
SignupPage (폼 제출)
  ↓
validateForm() (클라이언트 검증)
  ↓
gql<SignUpResponse>(SIGN_UP_MUTATION, { email, nickname, password })
  ↓
GraphQL Server
  ↓
SignUpResponse { accessToken, refreshToken, user }
  ↓
useAuthStore.login(user, accessToken)
  ↓
router.push('/')
```

## 폼 검증 전략

### 로그인 (LoginPage)
- 필수: email, password
- 타입만 확인 (백엔드에서 자세한 검증)
- 에러: 단일 에러 문자열 ("이메일 또는 비밀번호가 올바르지 않습니다")

### 회원가입 (SignupPage)
- **이메일**: 필수 + 형식 검증 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **닉네임**: 필수 + 2~20자 검증
- **비밀번호**: 필수 + 8자 이상 검증
- **비밀번호 확인**: 필수 + 비밀번호와 일치 검증
- **이용약관**: 필수 체크 (checked === true)
- **개인정보처리방침**: 필수 체크 (checked === true)
- **에러**: 필드별 에러 객체 + 서버 에러 문자열

## 스타일 가이드

### 색상 (TailwindCSS)
```
기본 배경: bg-gray-50 / dark:bg-gray-950
카드: bg-white / dark:bg-gray-900
테두리: border-gray-300 / dark:border-gray-700
텍스트: text-gray-900 / dark:text-gray-100
에러: text-red-500 / dark:text-red-400
초점: ring-primary-500
```

### 소셜 버튼 색상
```
Google: secondary variant (회색)
Kakao: #FEE500 (노란색)
Naver: #00C73C (초록색)
```

### 간격
```
섹션 간: space-y-8
폼 필드: space-y-4
인라인: gap-2, gap-3
```

### 텍스트 크기
```
제목: text-2xl font-bold
라벨: text-sm font-medium
본문: text-sm
에러/힌트: text-xs
```

## 접근성 (A11y) 체크리스트

- [x] form 요소 사용
- [x] label과 input 연결 (htmlFor/id)
- [x] 에러 메시지 (role="alert")
- [x] aria-invalid (error 상태)
- [x] aria-describedby (error/hint)
- [x] 키보드 네비게이션 (Tab 이동)
- [x] 포커스 스타일 (focus-visible)
- [x] 시맨틱 HTML (form, input, button, label)
- [x] 다크 모드 지원 (dark: prefix)

## 성능 최적화

### 번들 크기
- Input, Button: Atomic Design 원칙으로 작음
- 폼 검증: 클라이언트 사이드만 (가벼움)
- GraphQL 요청: gql() 함수로 tree-shaking 가능

### 렌더링
- AuthLayout: 서버 컴포넌트 (SSR)
- LoginPage/SignupPage: 클라이언트 컴포넌트 (hydration)
- 상호작용 필요한 부분만 클라이언트로 분리

### 네트워크
- 초기 로드: HTML (서버) + JS 미니 (클라이언트)
- 폼 제출: GraphQL 요청 1개

## 라우팅 구조

```
/
├── (auth)
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx       → /login
│   └── signup/
│       └── page.tsx       → /signup
└── layout.tsx
```

- **(auth)**: 라우트 그룹 (URL에 영향 없음)
- 레이아웃 분리로 /login, /signup은 헤더/푸터 없음
- 홈(/), 소설 목록 등은 다른 레이아웃 사용

## 향후 확장 포인트

1. **소셜 로그인 구현**
   - next-auth 또는 직접 OAuth 처리
   - Google, Kakao, Naver 버튼에 onClick 핸들러 추가

2. **비밀번호 재설정**
   - /forgot-password 페이지
   - 이메일 검증 + 토큰 기반 재설정

3. **이메일 인증**
   - 회원가입 후 이메일 검증 단계 추가
   - 검증 완료까지 계정 기능 제한 (옵션)

4. **2FA (2-Factor Authentication)**
   - 로그인 후 2FA 코드 입력 페이지

5. **분자 컴포넌트 추출**
   - FormField (Input + error + hint 조합)
   - AuthSocialButtons (3개 소셜 버튼 조합)
   - 재사용성 증대
