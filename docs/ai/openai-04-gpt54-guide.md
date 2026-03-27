# GPT-5.4 Model Guide

## Key Improvements (vs GPT-5.2)
- Coding, document understanding, tool use, instruction following
- Image perception and multimodal tasks
- Long-running task execution and multi-step agent workflows
- Token efficiency on tool-heavy workloads
- Agentic web search and multi-source synthesis

## New Features
- **tool_search**: Deferred tool loading for large tool ecosystems
- **1M token context window**: Entire codebases in single request
- **Built-in computer use**: Build-run-verify-fix loop
- **Native compaction**: Longer agent trajectories

## Model Variants

| Variant | Best for |
|---------|----------|
| gpt-5.4 | General-purpose, complex reasoning, code-heavy agentic tasks |
| gpt-5.4-pro | Tough problems, deeper reasoning |
| gpt-5.4-mini | High-volume coding, agent workflows, strong reasoning |
| gpt-5.4-nano | Simple high-throughput, speed/cost priority |

## Reasoning Effort
- `none` (default for GPT-5.2+): No thinking, lowest latency
- `low`: Small accuracy gain, still fast
- `medium`: Good for research-heavy tasks
- `high`: Strong reasoning, higher cost
- `xhigh` (GPT-5.4 only): Maximum intelligence

```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  input: "question...",
  reasoning: { effort: "medium" }
});
```

## Verbosity Control
- `low`: Concise answers, simple code
- `medium` (default): Balanced
- `high`: Thorough explanations, extensive code

```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  input: "question...",
  text: { verbosity: "low" }
});
```

## Phase Parameter (Long-running Workflows)
- `commentary`: Intermediate assistant updates
- `final_answer`: Completed answer

```typescript
const response = await client.responses.create({
  model: "gpt-5.4",
  input: [
    { role: "assistant", phase: "commentary", content: "I'll inspect the logs..." },
    { role: "assistant", phase: "final_answer", content: "Root cause: cache invalidation race." },
    { role: "user", content: "Give me a fix plan." },
  ],
});
```

## Parameter Compatibility
- `temperature`, `top_p`, `logprobs`: Only with `reasoning.effort: "none"`
- Other reasoning efforts: Use `reasoning.effort`, `text.verbosity`, `max_output_tokens`

## Migration Guide
| From | To | Settings |
|------|----|----------|
| gpt-5.2 | gpt-5.4 | Match current reasoning effort |
| gpt-4.1 | gpt-5.4 | reasoning: none |
| o3 | gpt-5.4 | reasoning: medium or high |
| gpt-4.1-mini | gpt-5.4-mini | Prompt tuning |
| gpt-4.1-nano | gpt-5.4-nano | Prompt tuning |
