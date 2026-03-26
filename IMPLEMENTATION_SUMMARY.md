# AI Service + SSE Controller + GraphQL Resolver 구현 완료

**작업 완료일**: 2026-03-22
**구현 범위**: AI 도메인 (Application, Presentation 계층)
**상태**: 완료 (스텁 구현)

---

## 1. 구현된 파일

### 1.1 Service (Application Layer)
**파일**: `apps/api/src/domains/ai/application/ai.service.ts`

#### 메서드 목록
| 메서드 | 반환 | 설명 |
|--------|------|------|
| `getAITokenBalance(userId)` | `AITokenBalanceObject` | AI 토큰 잔액 조회 |
| `getAITokenTransactions(userId, type?, first?, after?)` | `AITokenTransactionConnection` | 토큰 거래 내역 (Cursor Pagination) |
| `chargeTokens(userId, amount, description?)` | `Promise<void>` | 내부 헬퍼: 토큰 증가 |
| `useTokens(userId, tokensToUse, generationLogId?, description?)` | `Promise<{balance, totalUsed}>` | 내부 헬퍼: 토큰 차감 + 거래 기록 |
| `getSettingNotes(userId, novelId, category?)` | `SettingNoteObject[]` | 소설 설정 노트 조회 |
| `getSettingNote(userId, id)` | `SettingNoteObject \| null` | 단일 설정 노트 조회 |
| `createSettingNote(userId, input)` | `SettingNoteObject` | 설정 노트 생성 |
| `updateSettingNote(userId, id, input)` | `SettingNoteObject` | 설정 노트 수정 |
| `deleteSettingNote(userId, id)` | `boolean` | 설정 노트 삭제 |
| `generateContinuation(userId, dto)` | `AsyncGenerator<SSEEvent>` | AI 이어쓰기 (SSE 스트리밍) |
| `improveText(userId, dto)` | `AsyncGenerator<SSEEvent>` | AI 텍스트 개선 (SSE 스트리밍) |
| `generateSetting(userId, dto)` | `AsyncGenerator<SSEEvent>` | AI 설정 생성 (SSE 스트리밍) |
| `suggestPlot(userId, dto)` | `AsyncGenerator<SSEEvent>` | AI 플롯 제안 (SSE 스트리밍) |

#### 핵심 설계
- **토큰 관리**: 낙관적 잠금(Optimistic Locking)으로 동시성 제어
- **권한 검증**: 모든 설정 노트 작업에서 소설 작가 권한 확인
- **AI 생성 (SSE)**: AsyncGenerator 패턴으로 실시간 스트리밍 구현
- **스텁 구현**: 실제 OpenAI/Anthropic API 호출 대신 Mock 응답 생성
- **로깅**: 모든 생성 작업을 `AIGenerationLog`에 기록

---

### 1.2 SSE Controller (Presentation Layer)
**파일**: `apps/api/src/domains/ai/presentation/ai.controller.ts`

#### 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/ai/continue` | AI 이어쓰기 (SSE) |
| `POST` | `/api/ai/improve` | 텍스트 개선 (SSE) |
| `POST` | `/api/ai/generate-setting` | 설정 생성 (SSE) |
| `POST` | `/api/ai/suggest-plot` | 플롯 제안 (SSE) |

#### HTTP 헤더
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

#### 에러 처리
```javascript
{
  "event": "error",
  "data": {
    "code": "AI_001",  // AI_001 ~ AI_004
    "message": "에러 메시지"
  }
}
```

#### SSE 이벤트 형식
```javascript
// 생성 진행 중
event: token
data: {"content": "...", "tokenCount": 10}

// 완료
event: done
data: {
  "totalTokens": 10,
  "tokensCharged": 10,
  "remainingTokens": 90,
  "generationLogId": "..."
}
```

---

### 1.3 GraphQL Resolver (Presentation Layer)
**파일**: `apps/api/src/domains/ai/presentation/ai.resolver.ts`

#### Query
| 쿼리 | 반환 타입 | 설명 |
|------|----------|------|
| `aiTokenBalance` | `AITokenBalanceObject` | 토큰 잔액 |
| `aiTokenTransactions` | `AITokenTransactionConnection` | 거래 내역 (Pagination) |
| `settingNotes` | `[SettingNoteObject]` | 소설 설정 노트 목록 |
| `settingNote` | `SettingNoteObject \| null` | 단일 설정 노트 |

#### Mutation
| 뮤테이션 | 반환 타입 | 설명 |
|---------|----------|------|
| `createSettingNote` | `SettingNoteObject` | 설정 노트 생성 |
| `updateSettingNote` | `SettingNoteObject` | 설정 노트 수정 |
| `deleteSettingNote` | `boolean` | 설정 노트 삭제 |

#### GraphQL 쿼리 예시
```graphql
query {
  aiTokenBalance {
    balance
    totalCharged
    totalUsed
  }

  aiTokenTransactions(first: 20, type: USAGE) {
    edges {
      node {
        id
        type
        amount
        balanceAfter
        description
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }

  settingNotes(novelId: "...") {
    id
    novelId
    category
    title
    content
    isAIGenerated
    createdAt
  }
}
```

---

### 1.4 Module 수정
**파일**: `apps/api/src/domains/ai/ai.module.ts`

```typescript
@Module({
  controllers: [AiController],
  providers: [AiResolver, AiOrchestrator, AiService, AiRepository],
  exports: [AiService],
})
```

---

## 2. 의존성 및 레이어 구조

### 2.1 의존성 흐름
```
Presentation Layer
├── AiController (SSE)
└── AiResolver (GraphQL)
    ↓
Application Layer
└── AiService
    ↓
Infrastructure Layer
├── AiRepository
└── PrismaService
    ↓
Domain Layer
└── Repository/Wallet/Transaction 모델
```

### 2.2 의존성 규칙 준수
✅ Presentation → Application → Infrastructure → Domain (단방향)
✅ 같은 레이어 간 의존 없음
✅ Domain Layer는 외부 의존 없음
✅ 모든 Repository 접근은 Infrastructure를 통함

---

## 3. 주요 구현 패턴

### 3.1 토큰 관리 (낙관적 잠금)
```typescript
// Optimistic Locking with version check
const updatedWallet = await this.aiRepository.updateBalance(
  wallet.id,
  wallet.version,  // version 체크
  amount,
  totalChargedChange,
  totalUsedChange,
);
```

### 3.2 SSE 스트리밍 (AsyncGenerator)
```typescript
async *generateContinuation(userId: string, dto: ContinueWritingDto): AsyncGenerator<SSEEvent> {
  yield { event: 'token', data: { ... } };
  yield { event: 'done', data: { ... } };
}
```

### 3.3 권한 검증
```typescript
const novel = await this.prisma.novel.findFirst({
  where: { id: novelId, authorId: userId },  // 작가만 수정 가능
});
if (!novel) throw new NotFoundException();
```

### 3.4 트랜잭션 로깅
```typescript
const generationLog = await this.prisma.aIGenerationLog.create({
  data: {
    userId,
    featureType: AIFeatureType.CONTINUE_WRITING,
    tokensCharged: tokensUsed,
    // ...
  },
});
```

---

## 4. 데이터 흐름 (AI 생성 예시)

### AI 이어쓰기 요청
```
1. Client POST /api/ai/continue
   ├── Body: { novelId, episodeId, context, prompt, ... }
   └── Header: Authorization: Bearer <token>

2. AiController.continueWriting()
   ├── 인증 검증 (@JwtAuthGuard)
   └── AiService.generateContinuation() 호출

3. AiService.generateContinuation()
   ├── 토큰 잔액 확인
   ├── 설정 노트 로드 (있으면)
   ├── AI 모의 응답 생성 (스텁)
   ├── AIGenerationLog 기록
   ├── SSE 이벤트 yield (token)
   ├── 토큰 차감 + AITokenTransaction 기록
   └── SSE 이벤트 yield (done)

4. AiRepository (Infrastructure)
   ├── findWalletByUserId()
   ├── updateBalance()
   ├── createTransaction()
   ├── createGenerationLog()
   └── findSettingsByNovelId()

5. Client SSE 수신
   ├── event: token → 콘텐츠 표시
   └── event: done → 완료 표시
```

---

## 5. 스텁 구현 (Mock Response)

모든 AI 생성 메서드는 실제 API 호출 대신 Mock 응답을 반환합니다.

### 예시
```typescript
const tokensUsed = 10;
const mockContent = `[AI 이어쓰기 결과] ${dto.prompt}에 이어서 생성된 텍스트입니다.`;

yield {
  event: 'token',
  data: {
    content: mockContent,
    tokenCount: tokensUsed,
  },
};
```

### Phase 2에서 추가할 항목
- OpenAI GPT-4o 통합
- Anthropic Claude API 통합
- 실제 토큰 수 계산 (input/output)
- 스트리밍 청킹 처리
- 재시도 로직 (Exponential Backoff)

---

## 6. 테스트 시나리오

### 6.1 토큰 조회 (GraphQL)
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { aiTokenBalance { balance totalCharged totalUsed } }"
  }'
```

### 6.2 AI 이어쓰기 (SSE)
```bash
curl -X POST http://localhost:3000/api/ai/continue \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "novelId": "...",
    "episodeId": "...",
    "context": "이전 내용...",
    "prompt": "다음 장면 프롬프트...",
    "maxTokens": 1000,
    "temperature": 0.7
  }'
```

### 6.3 설정 노트 생성 (GraphQL)
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createSettingNote(input: { novelId: \"...\", category: \"CHARACTER\", title: \"주인공\", content: \"설정 내용\" }) { id title } }"
  }'
```

---

## 7. 파일 목록

| 파일 경로 | 상태 | 라인 수 |
|----------|------|--------|
| `apps/api/src/domains/ai/application/ai.service.ts` | 수정 | 600+ |
| `apps/api/src/domains/ai/presentation/ai.controller.ts` | 수정 | 150+ |
| `apps/api/src/domains/ai/presentation/ai.resolver.ts` | 신규 | 130+ |
| `apps/api/src/domains/ai/ai.module.ts` | 수정 | 13 |

**전체 추가/수정 코드**: 800+ 줄

---

## 8. 다음 단계 (Phase 2)

### 8.1 AI API 통합
- [ ] OpenAI GPT-4o 실제 API 호출
- [ ] Anthropic Claude API 호출
- [ ] 실제 토큰 수 계산
- [ ] 스트리밍 청킹

### 8.2 고급 기능
- [ ] 토큰 결제 연동 (Payment 도메인)
- [ ] 사용량 분석 (BullMQ 비동기 처리)
- [ ] 모델 선택 옵션
- [ ] 캐싱 (Redis)

### 8.3 에러 처리 강화
- [ ] Rate Limiting
- [ ] 재시도 로직 (Exponential Backoff)
- [ ] 타임아웃 처리
- [ ] 부분 실패 보상

---

## 9. 검증 체크리스트

- [x] Service: 토큰 관리 메서드 구현
- [x] Service: 설정 노트 CRUD 구현
- [x] Service: AI 생성 AsyncGenerator 구현
- [x] Controller: SSE 4개 엔드포인트 구현
- [x] Resolver: GraphQL Query 4개 구현
- [x] Resolver: GraphQL Mutation 3개 구현
- [x] Module: Resolver DI 등록
- [x] 의존성 규칙 준수 (Presentation → Application → Infrastructure)
- [x] 권한 검증 (작가만 설정 노트 수정)
- [x] 토큰 동시성 제어 (낙관적 잠금)
- [x] SSE 에러 처리

---

## 10. 노트

### 비고
- **스텁 구현**: 모든 AI 호출은 Mock 응답 사용. 실제 API는 Phase 2에서.
- **낙관적 잠금**: `aiTokenWallets` 테이블의 `version` 필드로 동시성 제어.
- **권한 검증**: 모든 설정 노트 작업에서 `Novel.authorId` 확인.
- **생성 로그**: 모든 AI 생성 작업은 `AIGenerationLog`에 기록되어 감시 및 분석에 사용됨.

---

**구현 완료**: 2026-03-22
**구현자**: Backend Specialist Agent
**다음 리뷰**: QC 검사 (설계 vs 구현 비교)
