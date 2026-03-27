# AI Provider Integration Guide

This document explains how to integrate the OpenAI Provider into AiService.

## Current State

- ✅ AIProviderPort defined in Domain Layer (`domain/ports/ai-provider.port.ts`)
- ✅ OpenAiProvider implemented in Infrastructure Layer (`infrastructure/adapters/openai/openai.provider.ts`)
- ✅ Module configured with DI binding (`ai.module.ts`)
- 🔄 AiService generation methods use mock responses (awaiting integration)

## Integration Steps

### Step 1: Inject AIProviderPort into AiService

Update `application/ai.service.ts`:

```typescript
import { Inject } from '@nestjs/common';
import { AIProviderPort, AI_PROVIDER_PORT } from '../domain/ports';

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_PORT) private readonly aiProvider: AIProviderPort,
  ) {}

  // ... rest of service
}
```

### Step 2: Update generateContinuation() Method

Current stub:
```typescript
async *generateContinuation(
  userId: string,
  dto: ContinueWritingDto,
): AsyncGenerator<SSEEvent> {
  // Yields mock response with 10 tokens used
  const mockContent = `[AI 이어쓰기 결과]...`;
  const tokensUsed = 10;
  // ...
}
```

Integration version:
```typescript
async *generateContinuation(
  userId: string,
  dto: ContinueWritingDto,
): AsyncGenerator<SSEEvent> {
  // 1. Verify token balance
  const wallet = await this.aiRepository.findWalletByUserId(userId);
  if (!wallet || wallet.balance < 50) {
    throw new BadRequestException('AI 토큰이 부족합니다.');
  }

  // 2. Load setting notes for context
  const settingNotes = dto.settingNoteIds
    ? await Promise.all(
        dto.settingNoteIds.map((id) => this.aiRepository.findSettingById(id)),
      )
    : [];

  const settingContext = settingNotes
    .filter((s) => s !== null)
    .map((s) => `[${s.category}] ${s.title}: ${s.content}`)
    .join('\n\n');

  // 3. Build system prompt with context
  const systemPrompt = `You are a creative writing assistant for web novels.

Context:
${settingContext || 'No additional context provided.'}

Guidelines:
- Maintain narrative consistency
- Match the author's writing style
- Generate engaging content
- Keep within character limits`;

  // 4. Determine model based on feature type or user tier
  const model = AIModelType.DEFAULT; // or ECONOMY/PREMIUM based on user

  // 5. Call OpenAI Provider
  const response = await this.aiProvider.generate({
    model,
    systemPrompt,
    userPrompt: `${dto.context}\n\nContinue writing: ${dto.prompt}`,
    maxOutputTokens: dto.maxTokens ?? 1000,
    reasoning: 'low',
    verbosity: 'high',
  });

  // 6. Record generation log
  const generationLog = await this.prisma.aIGenerationLog.create({
    data: {
      userId,
      novelId: dto.novelId,
      episodeId: dto.episodeId,
      featureType: AIFeatureType.CONTINUE_WRITING,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      tokensCharged: response.totalTokens,
      inputText: `${dto.context}\n${dto.prompt}`,
      outputText: response.text,
      charCount: response.text.length,
      modelId: response.modelId,
      wasAccepted: true,
      request: {
        novelId: dto.novelId,
        episodeId: dto.episodeId,
        maxTokens: dto.maxTokens ?? 1000,
        temperature: dto.temperature ?? 0.7,
        settingCount: settingNotes.length,
      },
    },
  });

  // 7. Stream response via SSE
  yield {
    event: 'token',
    data: {
      content: response.text,
      tokenCount: response.totalTokens,
    },
  };

  // 8. Deduct tokens
  const remaining = await this.useTokens(
    userId,
    response.totalTokens,
    generationLog.id,
    `이어쓰기: ${dto.novelId}`,
  );

  yield {
    event: 'done',
    data: {
      totalTokens: response.totalTokens,
      tokensCharged: response.totalTokens,
      remainingTokens: remaining.balance,
      generationLogId: generationLog.id,
    },
  };
}
```

### Step 3: Update Other Generation Methods

Apply similar integration pattern to:
- `improveText()`
- `generateSetting()`
- `suggestPlot()`

Key differences per method:
- **improveText**: Use ECONOMY model, prompt focuses on style improvement
- **generateSetting**: Use DEFAULT model, prompt includes setting category and existing notes
- **suggestPlot**: Use DEFAULT model, prompt includes current plot and direction preferences

## Token Cost Estimation

Use these baseline costs (adjustable per feature):

```typescript
const tokenCosts = {
  CONTINUE_WRITING: 100,      // depends on length and model
  IMPROVE_SENTENCE: 20,
  GENERATE_SETTING: 50,
  SUGGEST_PLOT: 80,
};
```

## Error Handling

OpenAI errors are automatically mapped to mock responses by OpenAiProvider:

- Invalid API key → mock response
- Rate limit (429) → mock response (with logging)
- Network timeout → mock response (with logging)
- Package not installed → mock response (with logging)

Application can still log generation for analytics, token tracking, etc.

## Testing

### Unit Test Example

```typescript
describe('AiService.generateContinuation', () => {
  it('should call aiProvider.generate with correct parameters', async () => {
    const mockResponse: AIGenerateResponse = {
      text: 'Generated content',
      inputTokens: 10,
      outputTokens: 50,
      totalTokens: 60,
      modelId: 'gpt-4o',
    };

    jest.spyOn(aiProvider, 'generate').mockResolvedValue(mockResponse);

    const generator = aiService.generateContinuation(userId, dto);
    const event = await generator.next();

    expect(aiProvider.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: AIModelType.DEFAULT,
        systemPrompt: expect.stringContaining('creative writing'),
      }),
    );
  });
});
```

### Integration Test

```typescript
it('should generate continuation and deduct tokens', async () => {
  // Setup wallet with sufficient balance
  await aiRepository.createWallet(userId);
  await aiRepository.updateBalance(userId, 1, 500, 500, 0);

  // Generate
  const generator = aiService.generateContinuation(userId, dto);
  const events: SSEEvent[] = [];
  for await (const event of generator) {
    events.push(event);
  }

  // Verify token deduction
  const wallet = await aiRepository.findWalletByUserId(userId);
  expect(wallet.balance).toBeLessThan(500);
});
```

## Configuration

### Environment Variables Required

```env
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_PREMIUM_MODEL=gpt-4-turbo
OPENAI_ECONOMY_MODEL=gpt-4o-mini
```

### Optional: Add to app.config.ts

```typescript
export const aiConfig = {
  provider: process.env.AI_PROVIDER || 'openai',
  defaultModel: process.env.OPENAI_DEFAULT_MODEL,
  economyModel: process.env.OPENAI_ECONOMY_MODEL,
  premiumModel: process.env.OPENAI_PREMIUM_MODEL,
};
```

## Monitoring & Logging

OpenAiProvider uses Logger to track:
- Client initialization
- Model mapping
- API calls (with token counts)
- Fallback to mock mode
- Errors and rate limiting

Check application logs at `[OpenAI]` prefix.

## Next Steps

1. Update AiService methods to use AIProviderPort
2. Add environment variables to .env.example
3. Write integration tests
4. Consider Anthropic provider as fallback/alternative
5. Implement rate limiting with BullMQ
6. Add token estimation/chunking for large outputs
