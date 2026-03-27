# OpenAI SDK Usage Guide (2026 Responses API)

## Installation
```bash
npm install openai
```

## Environment
```bash
export OPENAI_API_KEY="your_api_key_here"
```
SDK는 OPENAI_API_KEY 환경변수를 자동으로 읽음.

## Basic Usage (Responses API)
```typescript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
  model: "gpt-5.4-mini",
  input: "Write a one-sentence bedtime story about a unicorn."
});

console.log(response.output_text);
```

## Multi-turn Conversation
```typescript
const response = await client.responses.create({
  model: "gpt-5.4-mini",
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: "What is in this image?" },
        { type: "input_image", image_url: "https://..." },
      ],
    },
  ],
});
```

## Streaming (SSE)
```typescript
const stream = await client.responses.create({
  model: "gpt-5.4-mini",
  input: [
    { role: "user", content: "Say 'double bubble bath' ten times fast." },
  ],
  stream: true,
});

for await (const event of stream) {
  console.log(event);
}
```

## Function Calling / Tools
```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  tools: [{ type: "web_search" }],
  input: "What was a positive news story from today?",
});
```

## Custom Tools
```json
{
  "type": "custom",
  "name": "code_exec",
  "description": "Executes arbitrary python code"
}
```

## Key Differences from Chat Completions
- `client.responses.create()` (NOT `client.chat.completions.create()`)
- `input` (NOT `messages`)
- `response.output_text` (NOT `response.choices[0].message.content`)
- Supports passing chain of thought (CoT) between turns
- `previous_response_id` for multi-turn state
