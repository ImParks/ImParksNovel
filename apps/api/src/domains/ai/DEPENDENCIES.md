# AI Domain Dependency Diagram

## Dependency Matrix

### Presentation Layer
```
ai.controller.ts ──→ AiService (Application)
ai.resolver.ts  ──→ AiService (Application)
```

### Coordination Layer
```
ai.orchestrator.ts ──→ AiService (Application)
                      + Token coordination
                      + Saga orchestration
```

### Application Layer
```
AiService ────────→ AIProviderPort (via @Inject AI_PROVIDER_PORT)
         ────────→ AiRepository (Infrastructure)
         ────────→ PrismaService (Infrastructure)

ai-coin.service.ts → Token wallet management
                     (depends on AiRepository)
```

### Domain Layer
```
AIProviderPort (abstract) ◄── No dependencies!
  - Pure interface
  - No external imports
```

### Infrastructure Layer
```
OpenAiProvider ──→ AIProviderPort (implements)
              ──→ ConfigService (@nestjs/config)

AiRepository ──→ PrismaService
           ──→ Prisma types
```

## Dependency Verification

### ✅ Correct Dependencies (pointing downward to Domain)

```
Presentation
    ↓
Coordination
    ↓
Application
    ↓
Domain  ◄─────── (Implementations from Infrastructure)
    ↑
Infrastructure
```

### ✅ No Same-Layer Dependencies

- Presentation: No other Presentation imports
- Coordination: No other Coordination imports
- Application: ai.service.ts ≠ ai-coin.service.ts (independent services)
- Domain: No domain-to-domain imports
- Infrastructure: Repository ≠ Provider (separate concerns)

### ✅ Domain Layer is Pure

AIProviderPort has NO imports from:
- ❌ @nestjs/config (ConfigService)
- ❌ @prisma/client
- ❌ openai
- ❌ Other infrastructure

Only imports from within Domain layer itself.

## Import Paths

### Good Examples (Correct)

```typescript
// In AiService (Application)
import { AIProviderPort, AI_PROVIDER_PORT } from '../domain/ports';
import { AiRepository } from '../infrastructure/ai.repository';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_PORT) private aiProvider: AIProviderPort,
    private aiRepository: AiRepository,
  ) {}
}
```

```typescript
// In OpenAiProvider (Infrastructure)
import { AIProviderPort, AIGenerateRequest } from '../../../domain/ports/ai-provider.port';

@Injectable()
export class OpenAiProvider extends AIProviderPort {
  constructor(private readonly configService: ConfigService) {
    super();
  }
}
```

### Bad Examples (Incorrect)

```typescript
// ❌ WRONG: AiService importing concrete provider
import { OpenAiProvider } from '../infrastructure/adapters/openai/openai.provider';
// Should use DI injection with AI_PROVIDER_PORT instead

// ❌ WRONG: Domain port importing from Infrastructure
import { ConfigService } from '@nestjs/config';  // IN DOMAIN PORT
// Infrastructure can use ConfigService, not Domain

// ❌ WRONG: Different Presentation layers importing each other
// ai.controller.ts importing from ai.resolver.ts
// Both should independently use AiService
```

## Cross-Domain Dependencies

### AI Domain ←→ Payment Domain

When user needs to charge tokens:
```
AI.AiService ──────→ PaymentPort (in Application layer)
              (via DI injection, not direct import)
```

Ports defined:
- `applications/ports/payment.port.ts` (AI domain exposes what it needs from Payment)

### AI Domain ←→ Novel Domain

When context needed for generation:
```
AI.AiService ──────→ NovelPort (in Application layer)
              (via DI injection)
```

Ports defined:
- `applications/ports/novel.port.ts` (AI domain exposes what it needs from Novel)

## File Structure Summary

```
ai/
├── domain/
│   └── ports/
│       ├── ai-provider.port.ts    ◄── DOMAIN INTERFACE
│       └── index.ts               (clean exports)
│
├── infrastructure/
│   ├── ai.repository.ts           (Prisma adapter)
│   └── adapters/
│       └── openai/
│           └── openai.provider.ts ◄── PORT IMPLEMENTATION
│
├── application/
│   ├── ai.service.ts              (main service)
│   ├── ai-coin.service.ts         (token wallet)
│   ├── ports/
│   │   └── ai.port.ts             (cross-domain ports)
│   └── dto/
│       ├── ai.input.ts
│       └── ai.object.ts
│
├── coordination/
│   └── ai.orchestrator.ts         (saga coordination)
│
├── presentation/
│   ├── ai.controller.ts           (REST)
│   ├── ai.resolver.ts             (GraphQL)
│   └── dto/ (dtos mirror Application dtos)
│
└── ai.module.ts                   ◄── DEPENDENCY WIRING
```

## Dependency Injection Flow

### Initialization (app.module.ts → AiModule)

```
1. Import AiModule
   ↓
2. AiModule registers providers:
   - AiService
   - AiCoinService
   - AiRepository
   - OpenAiProvider (bound to AI_PROVIDER_PORT)
   ↓
3. When AiService created:
   - Constructor receives OpenAiProvider instance (via AI_PROVIDER_PORT)
   - Constructor receives AiRepository instance
   ↓
4. OpenAiProvider created with:
   - ConfigService injected (@Global in ConfigModule)
```

### Runtime (Controller → Service → Port)

```
Controller.continueWriting()
  ↓ injects
AiService.generateContinuation()
  ↓ injects (AI_PROVIDER_PORT)
OpenAiProvider.generate()
  ↓ uses
ConfigService.get('OPENAI_API_KEY')
  ↓ calls
OpenAI.responses.create()
  ↓ returns
AIGenerateResponse
  ↓ yields
SSEEvent
  ↓ sends to
Client
```

## Token Lifecycle with DI

```
1. Controller receives request (userId, dto)
2. AiService.generateContinuation(userId, dto)
3. Check token balance
   → AiRepository.findWalletByUserId(userId)
   → PrismaService.aITokenWallet.findUnique()
4. Build generation request
5. Call AI Provider
   → AIProviderPort.generate(request)
   → OpenAiProvider.generate(request)
   → Uses ConfigService for API key
   → Calls OpenAI API
   → Returns token counts
6. Record log
   → AiRepository.createGenerationLog()
   → PrismaService.aIGenerationLog.create()
7. Deduct tokens
   → AiService.useTokens(userId, tokensUsed)
   → AiRepository.updateBalance()
   → PrismaService.aITokenWallet.update() (with version check)
8. Stream response to client
```

## Module Exports

```typescript
// ai.module.ts
@Module({
  imports: [ConfigModule],  // For ConfigService
  providers: [
    AiService,
    AiCoinService,
    AiRepository,
    {
      provide: AI_PROVIDER_PORT,
      useClass: OpenAiProvider,
    },
  ],
  exports: [
    AiService,              // For other domains to use
    AiCoinService,
    AI_PROVIDER_PORT,       // If needed by other domains
  ],
})
```

Only exported items can be imported by other domains.

## Circular Dependency Prevention

### Check: No circular imports

```typescript
// ✅ OK
AI domain imports from Payment domain
Payment domain does NOT import from AI domain
(unidirectional)

// ❌ BAD
AI domain imports PaymentPort
Payment domain imports AIPort
(circular - would cause issues)
```

### Pattern: Use DI injection instead

```typescript
// ✅ Correct: Use Port injection
@Injectable()
export class AiService {
  constructor(
    @Inject('PAYMENT_PORT') private paymentPort: PaymentPort,
  ) {}
}

// ❌ Wrong: Direct import
import { PaymentService } from '../../payment/application/payment.service';
```

## Testing Impact

### Unit Test Setup

```typescript
describe('AiService', () => {
  it('should use injected provider', async () => {
    const mockProvider = {
      generate: jest.fn().mockResolvedValue({...}),
      isAvailable: jest.fn().mockResolvedValue(true),
    };

    const service = new AiService(mockProvider, mockRepository);
    // Test with mock provider, no OpenAI API call
  });
});
```

### Integration Test Setup

```typescript
// Real provider, mock database
const testModule = await Test.createTestingModule({
  imports: [AiModule, PrismaModule],
  // ConfigModule provides real env vars from .env.test
}).compile();

const service = testModule.get(AiService);
const provider = testModule.get(AI_PROVIDER_PORT);
```

## Dependency Resolution Order

When app starts:

```
1. ConfigModule initializes (reads .env)
2. AiModule initializes:
   a. AiRepository created (depends on PrismaService)
   b. AiService created (depends on AiRepository)
   c. OpenAiProvider created (depends on ConfigService)
   d. AiService.aiProvider set to OpenAiProvider instance
3. Controllers/Resolvers created (depend on AiService)
4. Ready to accept requests
```

If ConfigService missing → OpenAiProvider fails
If PrismaService missing → AiRepository fails
If both → AiService fails

All caught at startup, not runtime.
