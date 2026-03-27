# AI Domain Architecture

## Overview

The AI domain implements DDD + Hexagonal Architecture with 5-layer structure for AI text generation features (continue writing, improve text, generate settings, suggest plots).

## Layer Structure

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - ai.resolver.ts (GraphQL)        │
│  - ai.controller.ts (REST SSE)     │
│  - dto/                            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Coordination Layer                  │
│  - ai.orchestrator.ts               │
│  (Saga orchestration for             │
│   token charging, logging)          │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Application Layer                   │
│  - ai.service.ts                    │
│  - ai-coin.service.ts (token mgmt)  │
│  - ports/                           │
│    (cross-domain communication)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Domain Layer                        │
│  ✨ Core business logic (pure)      │
│  - domain/                          │
│    - entities/                      │
│    - value-objects/                 │
│    - ports/ ◄─ AIProviderPort      │
│                                    │
│  Key Port:                          │
│  AIProviderPort: {                 │
│    generate(request): Promise      │
│    isAvailable(): Promise          │
│  }                                  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Infrastructure Layer                │
│  - infrastructure/                   │
│    - ai.repository.ts               │
│    - adapters/                      │
│      - openai/                      │
│        - openai.provider.ts ◄ impl  │
│      - anthropic/ (future)          │
└──────────────────────────────────────┘
```

## Port Pattern Implementation

### Port Definition (Domain Layer)

**File**: `domain/ports/ai-provider.port.ts`

```typescript
export abstract class AIProviderPort {
  abstract generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
  abstract isAvailable(): Promise<boolean>;
}

export const AI_PROVIDER_PORT = Symbol('AI_PROVIDER_PORT');
```

**Design Goals**:
- Abstracts external AI providers (OpenAI, Anthropic, etc.)
- Domain-agnostic request/response types
- Supports fallback to mock mode for development

### Adapter Implementation (Infrastructure Layer)

**File**: `infrastructure/adapters/openai/openai.provider.ts`

```typescript
@Injectable()
export class OpenAiProvider extends AIProviderPort {
  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // Maps domain request → OpenAI request format
    // Calls OpenAI Responses API
    // Maps OpenAI response → domain response format
    // Handles errors with fallback to mock
  }
}
```

**Features**:
- Uses OpenAI Responses API (NOT chat.completions)
- Model mapping: economy/default/premium → gpt-4o-mini/gpt-4o/gpt-4-turbo
- Environment variable configuration
- Graceful fallback to mock mode if API unavailable
- Token counting from response metadata
- Logging at Infrastructure level

### DI Binding (Module)

**File**: `ai.module.ts`

```typescript
{
  provide: AI_PROVIDER_PORT,
  useClass: OpenAiProvider,
}
```

**Injection in Service**:

```typescript
@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_PORT) private aiProvider: AIProviderPort,
  ) {}

  async *generateContinuation(userId, dto): AsyncGenerator<SSEEvent> {
    const response = await this.aiProvider.generate({
      model: AIModelType.DEFAULT,
      systemPrompt: '...',
      userPrompt: '...',
    });
    // Use response.text, response.totalTokens, etc.
  }
}
```

## Dependency Flow

```
Presentation (Controller)
  ↓ (depends on)
AiService (Application)
  ↓ (injects AIProviderPort via DI token)
AIProviderPort (Domain interface)
  ↑ (implemented by)
OpenAiProvider (Infrastructure)

✅ Correct: Dependencies point DOWN toward Domain
✅ Domain is pure: doesn't know about OpenAI, ConfigService, etc.
✅ Adapter owns external integration details
```

## Request/Response Flow

### Generate Continuation Example

```
1. Controller receives POST /api/ai/continue
   ↓
2. AiService.generateContinuation(userId, dto)
   ↓
3. Verify token balance (via AiRepository)
   ↓
4. Load setting notes (via AiRepository)
   ↓
5. Build AIGenerateRequest {
     model: 'default',
     systemPrompt: 'You are a creative...',
     userPrompt: 'Continue this: ...'
   }
   ↓
6. Call aiProvider.generate(request)
   ↓
7. OpenAiProvider receives domain request
   - Maps model type to OpenAI model ID
   - Maps domain prompts to Responses API format
   - Calls OpenAI endpoint
   - Extracts token counts from response
   - Returns domain response
   ↓
8. AiService receives AIGenerateResponse
   - Records generation log (Prisma)
   - Deducts tokens from wallet (pessimistic lock)
   - Streams content via SSE
   ↓
9. Client receives streaming response
```

## Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-proj-xxxxx

# Optional (defaults provided)
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_PREMIUM_MODEL=gpt-4-turbo
OPENAI_ECONOMY_MODEL=gpt-4o-mini
```

### How ConfigService is Used

```typescript
// In OpenAiProvider constructor
this.configService.get<string>('OPENAI_API_KEY');        // Required
this.configService.get<string>('OPENAI_DEFAULT_MODEL', 'gpt-4o');  // With default
```

## Error Handling & Fallback

**When API Key missing or package not installed**:
- OpenAiProvider initializes in "mock mode"
- `isAvailable()` returns false
- `generate()` returns mock response with estimated tokens
- Application doesn't break, tests can run offline
- Logs warning: `[OpenAI] OPENAI_API_KEY not configured. Using mock responses.`

**When API call fails**:
- Network timeout, rate limit, server error
- OpenAiProvider catches and returns mock response
- Logs error: `[OpenAI] Generation failed`
- Application continues gracefully

## Token Management Integration

AiService coordinates with token wallet:

```typescript
// Before generation
const wallet = await aiRepository.findWalletByUserId(userId);
if (wallet.balance < estimatedTokens) {
  throw new BadRequestException('Insufficient tokens');
}

// After successful generation
const tokensUsed = response.totalTokens;
await this.useTokens(userId, tokensUsed, generationLogId);
```

Token tracking:
- Input tokens from request
- Output tokens from response
- Total = input + output
- Charge = total (configurable per feature)

## Generation Logging

Every generation creates AIGenerationLog:

```typescript
{
  userId,
  novelId,
  episodeId,
  featureType,           // CONTINUE_WRITING, IMPROVE_SENTENCE, etc.
  inputTokens,           // From response.inputTokens
  outputTokens,          // From response.outputTokens
  totalTokens,           // From response.totalTokens
  tokensCharged,         // What user was charged
  inputText,             // Original prompt
  outputText,            // Generated content
  charCount,             // Length of output
  modelId,               // Actual model used (e.g., gpt-4o)
  wasAccepted,           // Did user keep the content?
  request: { ... },      // Full request metadata as JSON
  response: { ... },     // Full response metadata as JSON
}
```

Used for:
- Analytics (usage per feature)
- Cost tracking
- Quality analysis
- User audit trail

## Testing Strategy

### Unit Tests (AiService)

```typescript
// Mock the port
const mockProvider = {
  generate: jest.fn().mockResolvedValue({
    text: 'Generated content',
    inputTokens: 10,
    outputTokens: 50,
    totalTokens: 60,
    modelId: 'gpt-4o',
  }),
  isAvailable: jest.fn().mockResolvedValue(true),
};

// Inject and test
it('should stream response and deduct tokens', async () => {
  // ...
});
```

### Integration Tests

- Use real OpenAI API (with test key)
- Verify token tracking accuracy
- Confirm database logging

### E2E Tests

- Full request → response flow
- SSE streaming validation
- Token balance verification

## Future Enhancements

1. **Anthropic Provider**: Add `infrastructure/adapters/anthropic/`
2. **Provider Routing**: Load-balance between providers
3. **Streaming Support**: Implement real streaming (not just response)
4. **Rate Limiting**: Use BullMQ for async token-bucket
5. **Retry Logic**: Exponential backoff with circuit breaker
6. **Cost Tracking**: Track actual OpenAI costs vs charged tokens
7. **Model Selection**: Route by user tier/feature cost

## References

- Domain Layer: `domain/ports/ai-provider.port.ts`
- Infrastructure Layer: `infrastructure/adapters/openai/openai.provider.ts`
- Application Layer: `application/ai.service.ts`
- Presentation Layer: `presentation/ai.controller.ts`, `presentation/ai.resolver.ts`
- Integration Guide: `INTEGRATION_GUIDE.md`
- Adapter README: `infrastructure/adapters/README.md`
