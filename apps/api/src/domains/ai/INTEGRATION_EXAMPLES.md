# Integration Examples - Copy & Paste Ready

## Example 1: Basic Integration into AiService

### Step 1: Add Import
```typescript
// At the top of ai.service.ts

import {
  AIProviderPort,
  AI_PROVIDER_PORT,
  AIModelType,
  AIGenerateRequest,
  AIGenerateResponse,
} from '../domain/ports';
```

### Step 2: Update Constructor
```typescript
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

## Example 2: Update generateContinuation() Method

### Current Code (Mock)
```typescript
async *generateContinuation(
  userId: string,
  dto: ContinueWritingDto,
): AsyncGenerator<SSEEvent> {
  // ... token check and setting notes loading ...

  const tokensUsed = 10;
  const mockContent = `[AI 이어쓰기 결과]\n${dto.prompt}에 이어서 생성된 내용입니다.`;

  // ... log and stream ...
}
```

### Updated Code (Real Provider)
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
        dto.settingNoteIds.map((id) =>
          this.aiRepository.findSettingById(id),
        ),
      )
    : [];

  // 3. Build system prompt with context
  const settingContext = settingNotes
    .filter((s) => s !== null)
    .map((s) => `[${s.category}] ${s.title}: ${s.content}`)
    .join('\n\n');

  const systemPrompt = `You are a creative writing assistant for web novels.

${
  settingContext
    ? `Context:\n${settingContext}`
    : 'No additional setting context provided.'
}

Guidelines:
- Maintain narrative consistency
- Match the author's writing style
- Generate engaging content
- Keep pacing natural`;

  // 4. Call AI Provider
  const response = await this.aiProvider.generate({
    model: AIModelType.DEFAULT,
    systemPrompt,
    userPrompt: `${dto.context}\n\nContinue writing in the same style:\n${dto.prompt}`,
    maxOutputTokens: dto.maxTokens ?? 1000,
    reasoning: 'low',
    verbosity: 'high',
  });

  // 5. Record generation log
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

  // 6. Stream content via SSE
  yield {
    event: 'token',
    data: {
      content: response.text,
      tokenCount: response.totalTokens,
    },
  };

  // 7. Deduct tokens from wallet
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

## Example 3: Update improveText() Method

```typescript
async *improveText(
  userId: string,
  dto: ImproveTextDto,
): AsyncGenerator<SSEEvent> {
  // 1. Token check
  const wallet = await this.aiRepository.findWalletByUserId(userId);
  if (!wallet || wallet.balance < 30) {
    throw new BadRequestException('AI 토큰이 부족합니다.');
  }

  // 2. Call AI Provider with ECONOMY model for quick improvement
  const response = await this.aiProvider.generate({
    model: AIModelType.ECONOMY,
    systemPrompt: `You are a professional writing editor. Improve the given text while maintaining the author's voice.

Style: ${dto.style || 'natural'}
${dto.instructions ? `Instructions:\n${dto.instructions}` : ''}`,
    userPrompt: dto.text,
    maxOutputTokens: 500,
    reasoning: 'none',
    verbosity: 'medium',
  });

  // 3. Record log
  const generationLog = await this.prisma.aIGenerationLog.create({
    data: {
      userId,
      featureType: AIFeatureType.IMPROVE_SENTENCE,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      tokensCharged: response.totalTokens,
      inputText: dto.text,
      outputText: response.text,
      charCount: response.text.length,
      modelId: response.modelId,
      wasAccepted: true,
      request: {
        style: dto.style,
        instructions: dto.instructions,
      },
    },
  });

  // 4. Stream
  yield {
    event: 'token',
    data: {
      content: response.text,
      tokenCount: response.totalTokens,
    },
  };

  // 5. Deduct tokens
  const remaining = await this.useTokens(
    userId,
    response.totalTokens,
    generationLog.id,
    `텍스트 개선: ${dto.style}`,
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

## Example 4: Update generateSetting() Method

```typescript
async *generateSetting(
  userId: string,
  dto: GenerateSettingDto,
): AsyncGenerator<SSEEvent> {
  // 1. Verify access
  const novel = await this.prisma.novel.findFirst({
    where: { id: dto.novelId, authorId: userId },
  });

  if (!novel) {
    throw new NotFoundException(
      '소설을 찾을 수 없거나 권한이 없습니다.',
    );
  }

  // 2. Check tokens
  const wallet = await this.aiRepository.findWalletByUserId(userId);
  if (!wallet || wallet.balance < 60) {
    throw new BadRequestException('AI 토큰이 부족합니다.');
  }

  // 3. Load existing settings for context
  const existingSettings = dto.existingSettingIds
    ? await Promise.all(
        dto.existingSettingIds.map((id) =>
          this.aiRepository.findSettingById(id),
        ),
      )
    : [];

  const existingContext = existingSettings
    .filter((s) => s !== null)
    .map((s) => `[${s.category}] ${s.title}: ${s.content}`)
    .join('\n\n');

  // 4. Call provider with DEFAULT model for quality
  const response = await this.aiProvider.generate({
    model: AIModelType.DEFAULT,
    systemPrompt: `You are a worldbuilding expert for fiction novels. Create detailed and consistent setting notes.

Type: ${dto.type}
Novel Context: ${novel.synopsis || 'No synopsis provided'}
${
  existingContext
    ? `\nExisting Settings to Consider:\n${existingContext}`
    : ''
}`,
    userPrompt: dto.prompt,
    maxOutputTokens: 1500,
    reasoning: 'medium',
    verbosity: 'high',
  });

  // 5. Record log
  const generationLog = await this.prisma.aIGenerationLog.create({
    data: {
      userId,
      novelId: dto.novelId,
      featureType: AIFeatureType.GENERATE_SETTING,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      tokensCharged: response.totalTokens,
      inputText: dto.prompt,
      outputText: response.text,
      charCount: response.text.length,
      modelId: response.modelId,
      wasAccepted: true,
      request: {
        type: dto.type,
        existingSettingCount: existingSettings.length,
      },
    },
  });

  // 6. Stream
  yield {
    event: 'token',
    data: {
      content: response.text,
      tokenCount: response.totalTokens,
    },
  };

  // 7. Deduct tokens
  const remaining = await this.useTokens(
    userId,
    response.totalTokens,
    generationLog.id,
    `설정 생성: ${dto.type}`,
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

## Example 5: Update suggestPlot() Method

```typescript
async *suggestPlot(
  userId: string,
  dto: SuggestPlotDto,
): AsyncGenerator<SSEEvent> {
  // 1. Verify access
  const novel = await this.prisma.novel.findFirst({
    where: { id: dto.novelId, authorId: userId },
  });

  if (!novel) {
    throw new NotFoundException(
      '소설을 찾을 수 없거나 권한이 없습니다.',
    );
  }

  // 2. Check tokens
  const wallet = await this.aiRepository.findWalletByUserId(userId);
  if (!wallet || wallet.balance < 50) {
    throw new BadRequestException('AI 토큰이 부족합니다.');
  }

  // 3. Load setting notes
  const settingNotes = dto.settingNoteIds
    ? await Promise.all(
        dto.settingNoteIds.map((id) =>
          this.aiRepository.findSettingById(id),
        ),
      )
    : [];

  const settingContext = settingNotes
    .filter((s) => s !== null)
    .map((s) => `[${s.category}] ${s.title}: ${s.content}`)
    .join('\n\n');

  // 4. Call provider
  const response = await this.aiProvider.generate({
    model: AIModelType.DEFAULT,
    systemPrompt: `You are a creative story consultant. Suggest engaging plot developments.

Direction: ${dto.direction || 'unexpected turn'}
Novel Context: ${novel.synopsis || 'No synopsis'}
${settingContext ? `\nWorldbuilding Context:\n${settingContext}` : ''}`,
    userPrompt: `Current plot:\n${dto.currentPlot}\n\nSuggest what happens next.`,
    maxOutputTokens: 1200,
    reasoning: 'medium',
    verbosity: 'high',
  });

  // 5. Record log
  const generationLog = await this.prisma.aIGenerationLog.create({
    data: {
      userId,
      novelId: dto.novelId,
      featureType: AIFeatureType.SUGGEST_PLOT,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      tokensCharged: response.totalTokens,
      inputText: dto.currentPlot,
      outputText: response.text,
      charCount: response.text.length,
      modelId: response.modelId,
      wasAccepted: true,
      request: {
        direction: dto.direction,
        settingCount: settingNotes.length,
      },
    },
  });

  // 6. Stream
  yield {
    event: 'token',
    data: {
      content: response.text,
      tokenCount: response.totalTokens,
    },
  };

  // 7. Deduct tokens
  const remaining = await this.useTokens(
    userId,
    response.totalTokens,
    generationLog.id,
    `플롯 제안: ${dto.novelId}`,
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

## Example 6: Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AIProviderPort, AI_PROVIDER_PORT, AIModelType } from '../domain/ports';
import { AiRepository } from '../infrastructure/ai.repository';

describe('AiService - generateContinuation', () => {
  let service: AiService;
  let mockProvider: jest.Mocked<AIProviderPort>;
  let mockRepository: jest.Mocked<AiRepository>;

  beforeEach(async () => {
    mockProvider = {
      generate: jest.fn().mockResolvedValue({
        text: 'Generated continuation content',
        inputTokens: 20,
        outputTokens: 100,
        totalTokens: 120,
        modelId: 'gpt-4o',
      }),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as any;

    mockRepository = {
      findWalletByUserId: jest.fn().mockResolvedValue({
        id: 'wallet-1',
        balance: 500,
        version: 1,
      }),
      findSettingById: jest.fn().mockResolvedValue(null),
      updateBalance: jest.fn(),
      createTransaction: jest.fn(),
      createGenerationLog: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AI_PROVIDER_PORT,
          useValue: mockProvider,
        },
        {
          provide: AiRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should call provider.generate with correct parameters', async () => {
    const userId = 'user-1';
    const dto = {
      novelId: 'novel-1',
      context: 'Previous chapter content...',
      prompt: 'Continue the story...',
    };

    const generator = service.generateContinuation(userId, dto);
    await generator.next();

    expect(mockProvider.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: AIModelType.DEFAULT,
        systemPrompt: expect.stringContaining('creative writing'),
        userPrompt: expect.stringContaining('Continue the story'),
      }),
    );
  });

  it('should deduct tokens after generation', async () => {
    // Test that useTokens was called with correct amount
    // Implementation depends on how useTokens works
  });
});
```

## Example 7: Environment Setup

### .env file
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_PREMIUM_MODEL=gpt-4-turbo
OPENAI_ECONOMY_MODEL=gpt-4o-mini
```

### .env.example
```env
# OpenAI Configuration
# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=your-api-key-here

# Model names - leave blank to use defaults
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_PREMIUM_MODEL=gpt-4-turbo
OPENAI_ECONOMY_MODEL=gpt-4o-mini
```

## Example 8: Model Selection by User Tier

```typescript
// Add to AiService if supporting user tiers
private selectModel(userTier?: string): AIModelType {
  switch (userTier) {
    case 'premium':
      return AIModelType.PREMIUM;
    case 'economy':
      return AIModelType.ECONOMY;
    case 'default':
    default:
      return AIModelType.DEFAULT;
  }
}

// Use in generator methods
const userTier = await this.getUserTier(userId);  // from database
const response = await this.aiProvider.generate({
  model: this.selectModel(userTier),
  // ... rest of request
});
```

## Migration Checklist

- [ ] Add imports to ai.service.ts
- [ ] Update constructor to inject AIProviderPort
- [ ] Update generateContinuation() method (copy Example 2)
- [ ] Update improveText() method (copy Example 3)
- [ ] Update generateSetting() method (copy Example 4)
- [ ] Update suggestPlot() method (copy Example 5)
- [ ] Create .env file with OPENAI_API_KEY
- [ ] Test in mock mode (no API key) first
- [ ] Test with real API key
- [ ] Write unit tests (Example 6 pattern)
- [ ] Verify token tracking in database
- [ ] Monitor generation logs

## Common Issues

### Provider returns mock responses
- Check if OPENAI_API_KEY is set in .env
- Check if openai package is installed (`npm ls openai`)
- Check logs for `[OpenAI]` prefix messages

### Tokens not deducting
- Verify wallet exists (should be created on first use)
- Check PrismaService connection
- Verify version checking in updateBalance (optimistic locking)

### Generation times out
- Increase maxOutputTokens limit
- Use ECONOMY model for faster response
- Check network connectivity to OpenAI API
