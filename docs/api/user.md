# User 도메인 API

## GraphQL Queries

### me: User!
- 인증: 필수 | 권한: 모든 인증 사용자
- 현재 로그인한 사용자 정보 조회

### user(id: ID!): User
- 인증: 선택 | 권한: 없음
- 사용자 프로필 조회 (공개 정보)

### authorProfile(userId: ID!): AuthorProfile
- 인증: 선택 | 권한: 없음
- 작가 프로필 조회

### viewerSettings: ViewerSettings!
- 인증: 필수 | 권한: 모든 인증 사용자
- 뷰어 설정 조회 (글자 크기, 배경색, 줄간격)

### checkPermission(permission: String!): Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자
- RBAC 권한 체크

---

## GraphQL Mutations

### signUp(input: SignUpInput!): AuthPayload!
- 인증: 불필요 | 권한: 없음
- 이메일 회원가입
- Input: email, password, nickname, agreeToTerms, agreeToPrivacy, agreeToMarketing

### signIn(input: SignInInput!): AuthPayload!
- 인증: 불필요 | 권한: 없음
- 이메일 로그인
- Input: email, password

### refreshToken(refreshToken: String!): AuthPayload!
- 인증: 불필요 (refreshToken 사용) | 권한: 없음
- 토큰 갱신

### signOut: Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자
- 로그아웃

### requestPasswordReset(email: String!): PasswordResetResult!
- 인증: 불필요 | 권한: 없음
- 비밀번호 재설정 요청 → 이메일 발송

### resetPassword(input: ResetPasswordInput!): PasswordResetResult!
- 인증: 불필요 (토큰 사용) | 권한: 없음
- 비밀번호 재설정 완료
- Input: token, newPassword

### updateProfile(input: UpdateProfileInput!): User!
- 인증: 필수 | 권한: 모든 인증 사용자
- 프로필 수정 (닉네임 30일 1회 제한)
- Input: nickname?, profileImageUrl?, bio?

### updateAuthorProfile(input: UpdateAuthorProfileInput!): AuthorProfile!
- 인증: 필수 | 권한: AUTHOR 이상
- 작가 프로필 수정
- Input: authorName?, authorBio?

### applyForAuthor: User!
- 인증: 필수 | 권한: READER
- 작가로 전환 (역할 READER → AUTHOR)

### saveViewerSettings(input: ViewerSettingsInput!): ViewerSettings!
- 인증: 필수 | 권한: 모든 인증 사용자
- 뷰어 설정 저장
- Input: fontSize?, fontFamily?, lineHeight?, backgroundColor?, isNightMode?

---

## REST API

### POST /api/auth/callback/:provider
- 소셜 로그인 콜백 (Google/Kakao/Naver)
- Body: { code, state }
- Response: { accessToken, refreshToken, user }

### POST /api/auth/identity/init
- 인증: 필수 | 본인인증 시작 (PASS/KCB)
- Body: { provider, returnUrl }
- Response: { certUrl, txId }

### POST /api/auth/identity/verify
- 인증: 필수 | 본인인증 결과 검증
- Body: { txId, encData }
- Response: { success, isAdult, ageVerificationStatus }

---

## Types

```graphql
type User {
  id: ID!
  email: String!
  nickname: String!
  profileImageUrl: String
  bio: String
  role: UserRole!
  isAdultVerified: Boolean!
  createdAt: DateTime!
  authorProfile: AuthorProfile
}

type AuthorProfile {
  id: ID!
  authorName: String!
  authorBio: String
  totalNovels: Int!
}

type ViewerSettings {
  fontSize: Int!
  fontFamily: String!
  lineHeight: Float!
  backgroundColor: String!
  isNightMode: Boolean!
}

type AuthPayload {
  accessToken: String!
  refreshToken: String!
  user: User!
}

enum UserRole {
  READER
  AUTHOR
  ADMIN
  SUPER_ADMIN
}
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| AUTH_001 | 401 | 유효하지 않은 인증 정보 |
| AUTH_002 | 401 | 만료된 토큰 |
| AUTH_003 | 409 | 이미 가입된 이메일 |
| AUTH_004 | 400 | 유효하지 않은 비밀번호 형식 |
| AUTH_005 | 429 | 로그인 시도 횟수 초과 (10분 차단) |
| USER_001 | 400 | 유효하지 않은 닉네임 |
| USER_002 | 409 | 중복된 닉네임 |
| USER_003 | 400 | 닉네임 변경 30일 제한 |
| USER_004 | 403 | 권한 없음 |
| IDENTITY_001 | 408 | 본인인증 시간 초과 |
| IDENTITY_002 | 400 | 본인인증 실패 |
| IDENTITY_003 | 409 | 이미 인증된 사용자 |
