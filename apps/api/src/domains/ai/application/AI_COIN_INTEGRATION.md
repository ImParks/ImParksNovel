# AI 기능 코인 사전 차감 통합 가이드

## 개요

AI 기능 사용 시 코인을 **사전 차감(pre-deduction)** 하는 시스템입니다.
- Payment 도메인의 `CoinWallet`을 사용 (기존 `AITokenWallet` 유지)
- 기능별 고정 코인 가격 설정
- 낙관적 잠금으로 동시성 제어
- API 실패 시 자동 환불

## 기능별 코인 비용

| 기능 | 코인 | 상수명 |
|------|------|--------|
| 문장 개선 | 1 | TEXT_IMPROVEMENT |
| 설정 생성 | 3 | SETTING_GENERATION |
| 플롯 제안 | 3 | PLOT_SUGGESTION |
| 계속 쓰기 | 5 | CONTINUE_WRITING |
| 회차 분할 | 5 | EPISODE_SPLIT |
| 프리미엄 계속 쓰기 | 10 | PREMIUM_CONTINUE |
| 상세 분석 | 15 | DETAILED_ANALYSIS |

## 사용 방법

### 1. AiCoinService 주입

```typescript
import { AiCoinService } from './ai-coin.service';

@Injectable()
export class MyAiFeatureService {
  constructor(
    private readonly aiCoinService: AiCoinService,
    private readonly externalAPI: ExternalAPIClient,
  ) {}
}
```

### 2. 기본 흐름

```typescript
async generateWithCoinDeduction(userId: string, featureType: string): Promise<void> {
  // Step 1: 잔액 확인 (선택사항, UI에서 먼저 확인 가능)
  const balance = await this.aiCoinService.checkBalance(userId, featureType);

  if (!balance.sufficient) {
    throw new BadRequestException(
      `코인이 부족합니다. 필요: ${balance.required}, 보유: ${balance.balance}`,
    );
  }

  // Step 2: 코인 사전 차감
  let deductionResult: CoinDeductionResult;
  try {
    deductionResult = await this.aiCoinService.deductCoinsForAI(
      userId,
      featureType,
    );
  } catch (error) {
    // 코인 부족 또는 낙관적 잠금 충돌
    throw error;
  }

  // Step 3: 외부 API 호출 (ChatGPT, Claude 등)
  try {
    const result = await this.externalAPI.call(featureType, inputData);
    // API 성공 → 코인 차감 확정 (이미 차감됨)
    return result;
  } catch (error) {
    // API 실패 → 환불
    await this.aiCoinService.refundCoinsForAI(
      userId,
      deductionResult.amount,
      `API 호출 실패: ${error.message}`,
    );
    throw error;
  }
}
```

### 3. 상세 사용 패턴

#### Pattern A: 조건부 차감 (권장)

```typescript
async improveText(
  userId: string,
  text: string,
): Promise<ImprovedTextResult> {
  const featureType = 'TEXT_IMPROVEMENT';

  // 1. 잔액 사전 확인
  const balance = await this.aiCoinService.checkBalance(userId, featureType);

  if (!balance.sufficient) {
    return {
      success: false,
      message: `코인 부족. 필요: ${balance.required}개`,
      requiredCoins: balance.required,
      currentBalance: balance.balance,
    };
  }

  // 2. 코인 차감
  const deduction = await this.aiCoinService.deductCoinsForAI(userId, featureType);

  // 3. API 호출
  try {
    const improved = await this.openaiProvider.improveText(text);
    return {
      success: true,
      result: improved,
      coinsUsed: deduction.amount,
      remainingBalance: deduction.balanceAfter,
    };
  } catch (error) {
    // 환불
    await this.aiCoinService.refundCoinsForAI(
      userId,
      deduction.amount,
      `텍스트 개선 실패: ${error.message}`,
    );
    throw new InternalServerErrorException('AI 생성 중 오류가 발생했습니다.');
  }
}
```

#### Pattern B: 동기식 Try-Catch (단순)

```typescript
async generatePlot(userId: string): Promise<string> {
  let deduction: CoinDeductionResult | null = null;

  try {
    // 차감
    deduction = await this.aiCoinService.deductCoinsForAI(
      userId,
      'PLOT_SUGGESTION',
    );

    // API 호출
    const plot = await this.anthropicProvider.suggestPlot();
    return plot;
  } catch (error) {
    // 환불
    if (deduction) {
      await this.aiCoinService.refundCoinsForAI(
        userId,
        deduction.amount,
        error.message,
      );
    }
    throw error;
  }
}
```

#### Pattern C: 거래 추적 (로깅/모니터링)

```typescript
async continueWriting(
  userId: string,
  episodeId: string,
  prompt: string,
): Promise<{ content: string; transactionId: string }> {
  const deduction = await this.aiCoinService.deductCoinsForAI(
    userId,
    'CONTINUE_WRITING',
  );

  try {
    const content = await this.openaiProvider.continueEpisode(prompt);

    // 성공 로그
    this.logger.log({
      event: 'AI_GENERATION_SUCCESS',
      userId,
      featureType: 'CONTINUE_WRITING',
      transactionId: deduction.transactionId,
      coinsUsed: deduction.amount,
    });

    return {
      content,
      transactionId: deduction.transactionId,
    };
  } catch (error) {
    // 환불 + 오류 로그
    await this.aiCoinService.refundCoinsForAI(
      userId,
      deduction.amount,
      error.message,
    );

    this.logger.error({
      event: 'AI_GENERATION_FAILED',
      userId,
      featureType: 'CONTINUE_WRITING',
      transactionId: deduction.transactionId,
      error: error.message,
    });

    throw error;
  }
}
```

## GraphQL Resolver 예제

```typescript
@Resolver()
export class AiResolver {
  constructor(
    private readonly aiCoinService: AiCoinService,
    private readonly myAiFeatureService: MyAiFeatureService,
    @CurrentUser() user: UserPayload,
  ) {}

  @Mutation(() => String)
  async improveText(
    @Args('text') text: string,
  ): Promise<string> {
    try {
      // AiCoinService 호출은 내부 Service에서 처리
      return await this.myAiFeatureService.improveText(user.id, text);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new GraphQLError(error.message);
      }
      throw new GraphQLError('AI 생성 중 오류가 발생했습니다.');
    }
  }

  @Query(() => CoinBalanceObject)
  async checkAiFeatureCost(
    @Args('featureType') featureType: string,
  ): Promise<CoinBalanceObject> {
    const balance = await this.aiCoinService.checkBalance(
      user.id,
      featureType,
    );
    return {
      balance: balance.balance,
      totalCharged: 0,
      totalUsed: 0,
    };
  }
}
```

## REST Controller 예제

```typescript
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiCoinService: AiCoinService,
    private readonly myAiFeatureService: MyAiFeatureService,
  ) {}

  @Post('improve-text')
  async improveText(
    @Body() dto: ImproveTextDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ result: string; coinsUsed: number }> {
    const result = await this.myAiFeatureService.improveText(user.id, dto.text);
    return {
      result,
      coinsUsed: 1,
    };
  }

  @Get('feature-cost/:featureType')
  async getFeatureCost(
    @Param('featureType') featureType: string,
    @CurrentUser() user: UserPayload,
  ) {
    const balance = await this.aiCoinService.checkBalance(user.id, featureType);
    return {
      required: balance.required,
      balance: balance.balance,
      sufficient: balance.sufficient,
    };
  }
}
```

## 예외 처리

### BadRequestException

```typescript
// 코인 부족
try {
  await this.aiCoinService.deductCoinsForAI(userId, 'TEXT_IMPROVEMENT');
} catch (error) {
  if (error instanceof BadRequestException) {
    // UI에서 "코인이 부족합니다" 메시지 표시
    // 사용자에게 충전 유도
  }
}

// 유효하지 않은 기능 타입
try {
  await this.aiCoinService.deductCoinsForAI(userId, 'INVALID_FEATURE');
} catch (error) {
  // "유효하지 않은 AI 기능입니다" 에러
}
```

### InternalServerErrorException

```typescript
// 낙관적 잠금 충돌 (동시 요청)
try {
  await this.aiCoinService.deductCoinsForAI(userId, featureType);
} catch (error) {
  if (error instanceof InternalServerErrorException) {
    // 재시도(retry) 로직 추가 권장
    await this.retry(() => this.aiCoinService.deductCoinsForAI(userId, featureType));
  }
}
```

## 아키텍처 고려사항

### 도메인 분리

- **AI 도메인**: `AiCoinService` (이 파일)
  - 코인 차감/환불 로직
  - 기능별 가격 관리
  - Prisma를 통한 직접 CoinWallet 접근 (도메인 간 Port 미사용)

- **Payment 도메인**: `PaymentService`
  - 코인 충전/관리
  - 결제 처리
  - 기존 역할 유지

### 왜 PrismaService 직접 사용?

1. **도메인 경계 존중**: AI 도메인이 Payment 도메인의 Repository를 직접 사용하면 도메인 의존성 위반
2. **Port 미설정**: Payment 도메인에서 "AI 기능용 코인 차감" Port를 아직 정의하지 않음
3. **현실적 접근**: PrismaService가 @Global 이므로 직접 사용 가능
4. **향후 확장**: 나중에 Payment 도메인이 Port를 정의하면 변경 용이

### 낙관적 잠금 (Optimistic Locking)

```typescript
// version 필드로 동시성 제어
const updated = await tx.coinWallet.update({
  where: { id: wallet.id, version: wallet.version },
  data: {
    balance: { decrement: amount },
    version: { increment: 1 },
  },
});
```

동시에 같은 지갑을 수정하려고 하면:
- 첫 번째 요청: 성공 (version 1 → 2)
- 두 번째 요청: 실패 (version 1 조건 만족 안 함) → 재시도

## 테스트 예제

```typescript
describe('AiCoinService', () => {
  let aiCoinService: AiCoinService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AiCoinService, PrismaService],
    }).compile();

    aiCoinService = module.get(AiCoinService);
    prismaService = module.get(PrismaService);
  });

  describe('deductCoinsForAI', () => {
    it('should deduct coins successfully', async () => {
      const userId = 'test-user';

      // 사전: 지갑에 충분한 코인 보유
      await prismaService.coinWallet.create({
        data: {
          userId,
          balance: 100,
          totalCharged: 100,
          totalUsed: 0,
          totalRefunded: 0,
        },
      });

      // 실행
      const result = await aiCoinService.deductCoinsForAI(
        userId,
        'TEXT_IMPROVEMENT',
      );

      // 검증
      expect(result.amount).toBe(1);
      expect(result.balanceAfter).toBe(99);

      // 거래 기록 확인
      const transaction = await prismaService.coinTransaction.findUnique({
        where: { id: result.transactionId },
      });
      expect(transaction.type).toBe('AI_USAGE');
      expect(transaction.amount).toBe(-1);
    });

    it('should throw BadRequestException when coins insufficient', async () => {
      const userId = 'test-user';

      // 사전: 지갑에 코인 부족
      await prismaService.coinWallet.create({
        data: {
          userId,
          balance: 0,
          totalCharged: 0,
          totalUsed: 0,
          totalRefunded: 0,
        },
      });

      // 실행 & 검증
      await expect(
        aiCoinService.deductCoinsForAI(userId, 'CONTINUE_WRITING'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refundCoinsForAI', () => {
    it('should refund coins successfully', async () => {
      const userId = 'test-user';

      // 사전
      await prismaService.coinWallet.create({
        data: {
          userId,
          balance: 95,
          totalCharged: 100,
          totalUsed: 5,
          totalRefunded: 0,
        },
      });

      // 환불
      await aiCoinService.refundCoinsForAI(userId, 5, '테스트 환불');

      // 검증
      const wallet = await prismaService.coinWallet.findUnique({
        where: { userId },
      });
      expect(wallet.balance).toBe(100);
      expect(wallet.totalRefunded).toBe(5);
    });
  });
});
```

## 마이그레이션 및 배포

### 1. Prisma 마이그레이션 실행

```bash
npx prisma migrate dev --name add_ai_coin_types
```

### 2. 기존 AI Token 시스템 호환성

- 기존 `AITokenWallet` 유지 (마이그레이션 불필요)
- 신규 코인 차감은 `CoinWallet`만 사용
- 점진적 전환 가능 (기존 로직과 병행)

### 3. 배포 후 모니터링

```typescript
this.logger.warn({
  event: 'AI_COIN_DEDUCTION',
  userId,
  featureType,
  amount,
  timestamp: new Date(),
});
```

## 자주 묻는 질문

**Q: AITokenWallet과의 관계는?**
A: 독립적입니다. 기존 토큰 시스템 유지하면서 코인 과금을 추가합니다.

**Q: 만약 차감 후 API가 시간초과되면?**
A: `try-catch`에서 환불 처리. 사용자에게 환불 확인 메시지 표시.

**Q: 동시에 여러 요청이 오면?**
A: 낙관적 잠금으로 제어. 한 요청은 성공, 나머지는 재시도.

**Q: 환불 실패하면?**
A: `InternalServerErrorException` 발생. 관리자 수동 개입 필요.
