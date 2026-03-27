# GPT-5.4 Prompt Guidance

## GPT-5.4 Strengths
- Strong personality/tone adherence, less drift
- Agentic workflow robustness, retries, end-to-end completion
- Evidence-rich synthesis in long-context workflows
- Instruction adherence in modular, block-structured prompts
- Batched/parallel tool calling with accuracy
- Spreadsheet, finance, Excel workflows

## Where Explicit Prompting Helps
- Low-context tool routing early in session
- Dependency-aware workflows
- Reasoning effort selection
- Research tasks requiring disciplined citations
- Irreversible/high-impact actions
- Terminal/coding-agent tool boundaries

## Core Prompt Patterns

### 1. Output Contract
```xml
<output_contract>
- Return exactly the sections requested, in order.
- Apply length limits only to intended section.
- If format required (JSON, Markdown, SQL), output only that format.
</output_contract>
```

### 2. Verbosity Controls
```xml
<verbosity_controls>
- Prefer concise, information-dense writing.
- Avoid repeating user's request.
- Keep progress updates brief.
</verbosity_controls>
```

### 3. Tool Persistence Rules
```xml
<tool_persistence_rules>
- Use tools whenever they improve correctness.
- Don't stop early when another tool call would help.
- If tool returns empty, retry with different strategy.
</tool_persistence_rules>
```

### 4. Completeness Contract
```xml
<completeness_contract>
- Treat task as incomplete until all items covered.
- Keep internal checklist of deliverables.
- For lists/batches, track processed items.
- If item blocked, mark [blocked] with reason.
</completeness_contract>
```

### 5. Verification Loop
```xml
<verification_loop>
Before finalizing:
- Check correctness: satisfies every requirement?
- Check grounding: claims backed by context/tools?
- Check formatting: matches schema/style?
- Check safety: external side effects need permission?
</verification_loop>
```

## Reasoning Effort Recommendations
- **none**: Execution-heavy (field extraction, triage, short transforms)
- **low**: Latency-sensitive + complex instructions
- **medium**: Research-heavy (synthesis, multi-doc review, conflict resolution)
- **high**: Long-horizon reasoning, critical accuracy
- **xhigh**: Only when evals show clear benefits

## Streaming Patterns for SSE
```typescript
const stream = await client.responses.create({
  model: "gpt-5.4-mini",
  input: [{ role: "user", content: "소설 이어쓰기..." }],
  stream: true,
  reasoning: { effort: "none" },
  text: { verbosity: "medium" }
});

for await (const event of stream) {
  // SSE event 처리
}
```

## Mini/Nano 모델 가이드
### gpt-5.4-mini
- 더 literal, 적은 가정
- 명확한 구조화 필요 (numbered steps, decision rules)
- 기본적으로 follow-up 질문 시도 → 억제 필요

### gpt-5.4-nano
- 좁고 명확한 작업만
- Closed outputs: labels, enums, short JSON
- Multi-step orchestration 피하기
