# AI Provider Adapters

This directory contains Infrastructure Layer implementations of Domain-level AI Provider Port Interface.

## Structure

- `openai/` - OpenAI provider adapter (Responses API)
- `anthropic/` - (Future) Anthropic provider adapter

## How It Works

### Architecture Pattern

```
Domain Layer
  ↓
AIProviderPort (abstract interface)
  ↑
Infrastructure Layer
  ↓
OpenAiProvider (concrete implementation)
```

### DI Binding (in ai.module.ts)

```typescript
{
  provide: AI_PROVIDER_PORT,
  useClass: OpenAiProvider,
}
```

When AiService needs to inject the port:

```typescript
constructor(
  @Inject(AI_PROVIDER_PORT) private aiProvider: AIProviderPort,
) {}
```

## OpenAI Provider

### Configuration

Environment variables (from ConfigService):

```env
OPENAI_API_KEY="sk-proj-..."
OPENAI_DEFAULT_MODEL="gpt-4o"
OPENAI_PREMIUM_MODEL="gpt-4-turbo"
OPENAI_ECONOMY_MODEL="gpt-4o-mini"
```

### Usage

```typescript
const response = await this.aiProvider.generate({
  model: AIModelType.DEFAULT,
  systemPrompt: "You are a creative writing assistant",
  userPrompt: "Continue this story: ...",
  maxOutputTokens: 1000,
  reasoning: 'low',
  verbosity: 'medium',
});

// Response contains:
// - text: generated content
// - inputTokens, outputTokens, totalTokens: token usage
// - modelId: actual model used
```

### Mock Mode

When:
- OPENAI_API_KEY not set
- openai package not installed

The provider automatically returns mock responses for development/testing without breaking the application.

## Adding New Providers

1. Create directory: `adapters/new-provider/`
2. Implement `AIProviderPort` abstract class
3. Register in `ai.module.ts`:
   ```typescript
   {
     provide: AI_PROVIDER_PORT,
     useClass: NewProvider,
   }
   ```
4. Add configuration variables to `.env`

## Dependency Rules

- ✅ Domain Port in `domain/ports/`
- ✅ Infrastructure Adapter in `infrastructure/adapters/`
- ✅ No bidirectional dependencies
- ✅ Application/Coordination layer injects via DI token
- ✅ No direct imports of concrete providers from other domains
