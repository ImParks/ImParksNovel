# Claude Code 기술 조사 보고서: 2026-03-21

## 조사 범위
Claude Code CLI 2.1.81의 전체 기능, 에이전트 시스템, 스킬 시스템, 훅, MCP, 메모리 시스템

## 핵심 발견: 프로젝트 적용 가능 기능

### 즉시 적용 (매뉴얼에 반영 완료)

1. **네이티브 에이전트 시스템 (`.claude/agents/AGENT.md`)** — Claude Code가 직접 인식/실행
2. **에이전트 전용 메모리 (`memory: project`)** — 에이전트별 학습 내용 자동 저장
3. **스킬 프리로드 (`skills:` frontmatter)** — 에이전트 시작 시 스킬 자동 주입
4. **규칙 디렉토리 (`.claude/rules/`)** — 경로별 코딩 규칙 자동 적용
5. **훅 시스템** — 자동 포맷팅, 파일 보호, 위험 명령 차단
6. **CronCreate** — 반복 작업 스케줄링

### 추가 검토 필요

1. **에이전트 팀 (실험 기능)** — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
2. **`/batch` 스킬** — 5~30개 에이전트 병렬 worktree 실행
3. **채널 (Channels)** — MCP 서버의 메시지 푸시

### 현재 불필요
- Remote Control / Web Sessions
- Chrome 연동
