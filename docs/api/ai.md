# AI 도메인 API

## REST SSE (스트리밍)

모든 AI SSE 엔드포인트 공통:
- 인증: 필수 | 권한: AUTHOR 이상
- Headers: Accept: text/event-stream, Authorization: Bearer {token}
- AI 토큰 부족 시 AI_001 에러

### POST /api/ai/continue
- AI 이어쓰기 스트리밍
- Body: { novelId, episodeId?, context, prompt, maxTokens?, temperature?, settingNoteIds[]? }
- SSE Events:
  - `token`: { content, tokenCount }
  - `done`: { totalTokens, tokensCharged, remainingTokens }
  - `error`: { code, message }

### POST /api/ai/improve
- AI 문장 개선 스트리밍
- Body: { text, style: "CONCISE"|"DESCRIPTIVE"|"DRAMATIC"|"FORMAL"|"CASUAL", instructions? }
- SSE Events: token → done

### POST /api/ai/generate-setting
- AI 설정(캐릭터/세계관) 생성 스트리밍
- Body: { type: "CHARACTER"|"WORLDVIEW"|"PLOT", prompt, novelId, existingSettingIds[]? }
- SSE Events: token → done

### POST /api/ai/suggest-plot
- AI 플롯 제안 스트리밍 (3개 제안 반환)
- Body: { novelId, currentPlot, direction?, settingNoteIds[]? }
- SSE Events:
  - `suggestion`: { index, content }
  - `done`: { totalSuggestions, totalTokens }

---

## GraphQL Queries

### aiTokenBalance: AIToken!
- 인증: 필수 | 권한: 모든 인증 사용자
- AI 토큰 잔액 조회

### aiTokenTransactions(type: AITokenTransactionType, first: Int, after: String): AITokenTransactionConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- AI 토큰 사용 내역

### settingNotes(novelId: ID!, category: String): [SettingNote!]!
- 인증: 필수 | 권한: 소설 작가 본인
- 설정 노트 목록

### settingNote(id: ID!): SettingNote
- 인증: 필수 | 권한: 소설 작가 본인
- 설정 노트 상세

---

## GraphQL Mutations

### createSettingNote(input: CreateSettingNoteInput!): SettingNote!
- 인증: 필수 | 권한: 소설 작가 본인
- Input: novelId!, category!, title!, content!

### updateSettingNote(id: ID!, input: UpdateSettingNoteInput!): SettingNote!
- 인증: 필수 | 권한: 소설 작가 본인

### deleteSettingNote(id: ID!): Boolean!
- 인증: 필수 | 권한: 소설 작가 본인

---

## Types

```graphql
type AIToken {
  balance: Int!
  totalCharged: Int!
  totalUsed: Int!
}

type AITokenTransaction {
  id: ID!
  type: AITokenTransactionType!
  amount: Int!
  balanceAfter: Int!
  description: String
  createdAt: DateTime!
}

type SettingNote {
  id: ID!
  novelId: String!
  category: String!
  title: String!
  content: String!
  isAIGenerated: Boolean!
  createdAt: DateTime!
}

enum AITokenTransactionType { CHARGE USE REFUND BONUS MEMBERSHIP }
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| AI_001 | 402 | AI 토큰 부족 |
| AI_002 | 503 | AI 서비스 일시 오류 |
| AI_003 | 400 | 컨텍스트 길이 초과 |
| AI_004 | 429 | AI 요청 횟수 제한 초과 |
| SETTING_001 | 404 | 설정 노트를 찾을 수 없음 |
| SETTING_002 | 403 | 설정 노트 접근 권한 없음 |
