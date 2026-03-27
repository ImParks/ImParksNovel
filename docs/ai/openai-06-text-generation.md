# OpenAI Text Generation & Responses API

## Basic Text Generation
```typescript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
  model: "gpt-5.4",
  input: "Write a one-sentence bedtime story about a unicorn."
});

console.log(response.output_text);
```

## Response Structure
```json
{
  "id": "resp_...",
  "object": "response",
  "output": [
    {
      "type": "reasoning",
      "content": [],
      "summary": []
    },
    {
      "type": "message",
      "status": "completed",
      "content": [
        {
          "type": "output_text",
          "text": "생성된 텍스트..."
        }
      ],
      "role": "assistant"
    }
  ]
}
```

**주의**: output 배열에 여러 항목 포함 가능 (tool calls, reasoning tokens 등). `output[0].content[0].text` 가정 금지. `response.output_text` 헬퍼 사용 권장.

## Instructions Parameter
```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  reasoning: { effort: "low" },
  instructions: "한국어 소설 작가처럼 답변하세요.",
  input: "주인공이 숲에 들어가는 장면을 묘사해줘.",
});
```

## Message Roles
```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  input: [
    { role: "developer", content: "소설 이어쓰기 AI입니다. 문체를 유지하세요." },
    { role: "user", content: "다음 문단을 이어서 써줘..." },
  ],
});
```

### Role 우선순위
| Role | 설명 |
|------|------|
| developer | 앱 개발자 지시 (최우선) |
| user | 최종 사용자 입력 |
| assistant | 모델 생성 응답 |

## Multi-turn Conversations
```typescript
// 방법 1: previous_response_id (권장)
const res1 = await client.responses.create({
  model: "gpt-5.4",
  input: "프랑스의 수도는?"
});

const res2 = await client.responses.create({
  model: "gpt-5.4",
  previous_response_id: res1.id,
  input: "인구는?"
});

// 방법 2: 수동 컨텍스트 관리
const response = await client.responses.create({
  model: "gpt-5.4",
  input: [
    { role: "user", content: "프랑스의 수도는?" },
    { role: "assistant", content: "파리입니다." },
    { role: "user", content: "인구는?" },
  ],
});
```

## Chat Completions → Responses API 마이그레이션

### 핵심 차이점
| Chat Completions | Responses API |
|-----------------|---------------|
| `client.chat.completions.create()` | `client.responses.create()` |
| `messages: [...]` | `input: [...]` 또는 `input: "string"` |
| `response.choices[0].message.content` | `response.output_text` |
| `role: "system"` | `role: "developer"` 또는 `instructions` |
| `response_format` | `text.format` |
| 수동 상태 관리 | `previous_response_id` |
| `functions: [{ function: {...} }]` | `tools: [{ type: "function", name: "...", ... }]` |
| non-strict by default | **strict by default** |

### Function Definition 변경
```typescript
// Chat Completions (OLD)
{ type: "function", function: { name: "get_weather", parameters: {...} } }

// Responses API (NEW)
{ type: "function", name: "get_weather", parameters: {...} }
```

### Structured Outputs 변경
```typescript
// Chat Completions (OLD)
response_format: { type: "json_schema", json_schema: {...} }

// Responses API (NEW)
text: { format: { type: "json_schema", schema: {...} } }
```

## Responses API 이점
- **더 나은 성능**: SWE-bench 3% 향상
- **낮은 비용**: 캐시 활용 40~80% 개선
- **Agentic 루프**: 한 요청에서 여러 도구 호출
- **Stateful 컨텍스트**: `store: true`로 상태 유지
- **유연한 입력**: string 또는 message 배열
- **암호화 추론**: ZDR 호환

## Statefulness 비활성화 (ZDR)
```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  input: "...",
  store: false,
  include: ["reasoning.encrypted_content"],
});
```
