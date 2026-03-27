# Quick Reference - AI Provider Integration

## 3-Minute Overview

### What Was Implemented
- Domain Port Interface for AI providers
- OpenAI Responses API adapter
- DI configuration in module
- Full documentation

### What You Need to Do
1. Inject `AIProviderPort` into `AiService`
2. Replace stub generation methods with real provider calls
3. Add OPENAI_API_KEY to .env
4. Test and verify

### Files You Need to Read
1. `INTEGRATION_EXAMPLES.md` — Copy-paste ready code
2. `INTEGRATION_GUIDE.md` — Step-by-step walkthrough
3. This file — Quick reference

---

## Code Patterns

### Pattern 1: Inject Provider
```typescript
// In ai.service.ts constructor
constructor(
  @Inject(AI_PROVIDER_PORT) private readonly aiProvider: AIProviderPort,
  private readonly aiRepository: AiRepository,
  private readonly prisma: PrismaService,
) {}
```

### Pattern 2: Call Provider
```typescript
const response = await this.aiProvider.generate({
  model: AIModelType.DEFAULT,
  systemPrompt: '...',
  userPrompt: '...',
  maxOutputTokens: 1000,
});

// response.text = generated content
// response.totalTokens = actual token count
// response.modelId = model used (e.g., 'gpt-4o')
```

### Pattern 3: Use Response
```typescript
// Record in database
await this.prisma.aIGenerationLog.create({
  data: {
    userId,
    outputTokens: response.outputTokens,
    inputTokens: response.inputTokens,
    totalTokens: response.totalTokens,
    outputText: response.text,
    modelId: response.modelId,
    // ... other fields
  },
});

// Deduct tokens
await this.useTokens(userId, response.totalTokens, logId);

// Stream to client
yield {
  event: 'token',
  data: { content: response.text, tokenCount: response.totalTokens },
};
```

---

## Environment Setup

### .env
```env
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_PREMIUM_MODEL=gpt-4-turbo
OPENAI_ECONOMY_MODEL=gpt-4o-mini
```

### Get API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to OPENAI_API_KEY

---

## Model Selection

```typescript
// By type
AIModelType.ECONOMY    → gpt-4o-mini (fast, cheap)
AIModelType.DEFAULT    → gpt-4o (balanced)
AIModelType.PREMIUM    → gpt-4-turbo (slow, expensive)

// By feature (recommended)
generateContinuation() → AIModelType.DEFAULT
improveText()         → AIModelType.ECONOMY
generateSetting()     → AIModelType.DEFAULT
suggestPlot()         → AIModelType.DEFAULT
```

---

## Response Types

### AIGenerateRequest
```typescript
{
  model: AIModelType;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  reasoning?: 'none' | 'low' | 'medium';
  verbosity?: 'low' | 'medium' | 'high';
}
```

### AIGenerateResponse
```typescript
{
  text: string;              // Generated content
  inputTokens: number;       // Tokens in prompt
  outputTokens: number;      // Tokens in response
  totalTokens: number;       // Sum
  modelId: string;           // e.g., 'gpt-4o'
}
```

---

## Integration Timeline

| Step | File | Time | Difficulty |
|------|------|------|-----------|
| 1 | Read INTEGRATION_EXAMPLES.md | 15 min | Easy |
| 2 | Update ai.service.ts constructor | 5 min | Easy |
| 3 | Replace generateContinuation() | 10 min | Easy |
| 4 | Replace improveText() | 5 min | Easy |
| 5 | Replace generateSetting() | 5 min | Easy |
| 6 | Replace suggestPlot() | 5 min | Easy |
| 7 | Add .env configuration | 5 min | Easy |
| 8 | Test without API key (mock) | 10 min | Easy |
| 9 | Test with API key (real) | 10 min | Easy |
| **Total** | | ~70 min | All Easy |

---

## Testing

### Mock Mode (No API Key)
```typescript
// Don't set OPENAI_API_KEY
// Provider automatically returns mock responses
const response = await aiProvider.generate({...});
// response.text = "[Mock AI Response]..."
// response.totalTokens = estimated
// ✅ Works offline, tests pass
```

### Real Mode (With API Key)
```typescript
// Set OPENAI_API_KEY=sk-proj-xxxxx
const response = await aiProvider.generate({...});
// response.text = real OpenAI content
// response.totalTokens = actual from API
// ✅ Real generation works
```

---

## Common Issues

### Issue: Getting mock responses
**Check**:
- Is OPENAI_API_KEY set in .env?
- Is openai package installed? (`npm ls openai`)
- Are there errors in logs starting with `[OpenAI]`?

**Solution**:
```bash
# Set API key
echo "OPENAI_API_KEY=sk-proj-..." >> .env

# Install package (if needed)
npm install openai
```

### Issue: Tokens not deducting
**Check**:
- Does wallet exist? (Check DB: AITokenWallet table)
- Is useTokens() being called?
- Check version field (optimistic locking)

**Solution**:
```typescript
// Create wallet on first use
let wallet = await aiRepository.findWalletByUserId(userId);
if (!wallet) {
  wallet = await aiRepository.createWallet(userId);
}
```

### Issue: Generation takes too long
**Solution**:
- Use AIModelType.ECONOMY for quick features
- Reduce maxOutputTokens
- Check network latency

---

## Architecture Diagram

```
┌──────────────────────────────────────────┐
│   Controller / Resolver (Presentation)  │
│   POST /api/ai/continue                 │
└─────────────────────┬────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────┐
│   AiService (Application)                │
│   @Inject(AI_PROVIDER_PORT)              │
│   - generateContinuation()               │
│   - improveText()                        │
│   - generateSetting()                    │
│   - suggestPlot()                        │
└─────────────────────┬────────────────────┘
                      │ calls
                      ↓
┌──────────────────────────────────────────┐
│   AIProviderPort (Domain Interface)      │
│   - generate(request)                    │
│   - isAvailable()                        │
└─────────────────────┬────────────────────┘
                      │ implements
                      ↓
┌──────────────────────────────────────────┐
│   OpenAiProvider (Infrastructure)        │
│   Uses:                                  │
│   - OpenAI SDK (openai package)          │
│   - ConfigService (OPENAI_API_KEY)       │
│   - Logger                               │
└──────────────────────────────────────────┘
```

---

## Dependency Injection

### How it Works
```
1. ai.module.ts registers:
   { provide: AI_PROVIDER_PORT, useClass: OpenAiProvider }

2. AiService constructor:
   @Inject(AI_PROVIDER_PORT) private aiProvider: AIProviderPort

3. NestJS wires them together:
   aiProvider = new OpenAiProvider(configService)
```

### Why This Pattern
✅ Domain doesn't depend on Infrastructure
✅ Easy to swap implementations (OpenAI → Anthropic)
✅ Easy to mock for testing
✅ Type-safe and clean

---

## Token Lifecycle

```
1. User requests generation
2. Check balance: wallet.balance > estimatedTokens?
3. Call aiProvider.generate()
4. Get actual tokenCount from response
5. Record AIGenerationLog (for analytics)
6. useTokens() to deduct from wallet
   - Updates balance: wallet.balance -= tokenCount
   - Creates AITokenTransaction record
   - Increments version (optimistic lock)
7. Stream response to client
```

---

## Response Streaming (SSE)

```typescript
// Current: Stub returns mock then streams
for await (const event of this.aiService.generateContinuation(userId, dto)) {
  res.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
}

// After integration: Real generation then streams
// - event: 'token' → {content, tokenCount}
// - event: 'done' → {totalTokens, remainingBalance, logId}
```

---

## File Locations

```
Project Root
└── apps/api/src/domains/ai/
    ├── domain/
    │   └── ports/
    │       ├── ai-provider.port.ts      ← Port interface
    │       └── index.ts                 ← Clean exports
    ├── infrastructure/
    │   └── adapters/openai/
    │       └── openai.provider.ts       ← Provider implementation
    ├── application/
    │   └── ai.service.ts                ← Update with @Inject
    ├── ai.module.ts                     ← Already configured
    ├── INTEGRATION_EXAMPLES.md           ← Copy code from here
    ├── INTEGRATION_GUIDE.md              ← Read first
    ├── ARCHITECTURE.md                  ← Understand design
    └── QUICK_REFERENCE.md               ← You are here
```

---

## Imports You'll Need

```typescript
// At top of ai.service.ts
import { Inject } from '@nestjs/common';
import {
  AIProviderPort,
  AI_PROVIDER_PORT,
  AIModelType,
} from '../domain/ports';
```

---

## Configuration Checklist

- [ ] Read INTEGRATION_EXAMPLES.md (15 min)
- [ ] Create/update .env with OPENAI_API_KEY
- [ ] Update ai.service.ts constructor with @Inject
- [ ] Update generateContinuation() method
- [ ] Update improveText() method
- [ ] Update generateSetting() method
- [ ] Update suggestPlot() method
- [ ] Test without API key (mock mode)
- [ ] Test with API key (real mode)
- [ ] Verify tokens deduct correctly
- [ ] Check generation logs in database

---

## Need Help?

1. **Code patterns**: See INTEGRATION_EXAMPLES.md
2. **Design questions**: See ARCHITECTURE.md
3. **Dependency questions**: See DEPENDENCIES.md
4. **Complete guide**: See INTEGRATION_GUIDE.md
5. **Overview**: See IMPLEMENTATION_SUMMARY.md

---

## Success Criteria

✅ AiService injects AIProviderPort
✅ All 4 generation methods call aiProvider.generate()
✅ Mock mode works (no API key needed)
✅ Real mode works (with OPENAI_API_KEY)
✅ Tokens deduct from wallet correctly
✅ Generation logs recorded in database
✅ SSE streaming works end-to-end

---

**Estimated Time to Complete**: 60-90 minutes
**Difficulty**: Low (mostly copy-paste from examples)
**Risk Level**: Low (provider is optional, system works in mock mode)
