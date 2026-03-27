# OpenAI Models Overview (2026)

## Flagship Models (Recommended)

| Model | Description | Best for |
|-------|-------------|----------|
| gpt-5.4 | Best intelligence at scale | General-purpose, coding, agentic workflows |
| gpt-5.4-pro | Smarter, more precise | Tough problems, deeper reasoning |
| gpt-5.4-mini | Strongest mini model | High-volume coding, computer use, subagents |
| gpt-5.4-nano | Cheapest GPT-5.4-class | Simple high-volume tasks |
| gpt-5-mini | Near-frontier | Cost sensitive, low latency, high volume |
| gpt-5-nano | Fastest, cheapest GPT-5 | Speed and cost priority |

## Coding Models
- gpt-5-codex, gpt-5.3-codex, gpt-5.2-codex, gpt-5.1-codex

## Key Facts
- SDK: `npm install openai`
- API: Responses API (`client.responses.create()`)
- 환경변수: `OPENAI_API_KEY` (SDK 자동 읽음)
- GPT-5.4 context window: 1M tokens
