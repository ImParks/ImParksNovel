# OpenAI Realtime API

> 소설 플랫폼에서는 당장 필요하지 않지만, 향후 음성 기반 기능 확장 시 참고.

## 개요
- 저지연 멀티모달 LLM 통신 (audio, images, text)
- Speech-to-speech 상호작용
- 실시간 오디오 전사

## Voice Agent (Agents SDK)
```typescript
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

const agent = new RealtimeAgent({
  name: "Assistant",
  instructions: "You are a helpful assistant.",
});

const session = new RealtimeSession(agent);

await session.connect({
  apiKey: "<client-api-key>",
});
```

## 연결 방식
| 방식 | 적합한 경우 |
|------|-------------|
| WebRTC | 브라우저/클라이언트 사이드 |
| WebSocket | 서버 사이드, 일관된 저지연 |
| SIP | VoIP 전화 연결 |

## 가격 (1M 토큰)
| Model | Audio Input | Audio Output | Text Input | Text Output |
|-------|------------|-------------|------------|-------------|
| gpt-realtime-1.5 | $32.00 | $64.00 | $4.00 | $16.00 |
| gpt-realtime-mini | $10.00 | $20.00 | $0.60 | $2.40 |

## 소설 플랫폼 적용 가능성
- 음성으로 소설 읽어주기 (TTS)
- 작가 음성 입력 → 텍스트 변환 (STT)
- Phase 3+ 에서 검토
