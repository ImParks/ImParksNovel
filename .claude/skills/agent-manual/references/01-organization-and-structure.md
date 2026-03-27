# 1장. 조직 구조 및 파일 구조

## 1. 조직 구조

에이전트는 6개 부서로 나뉜다. 각 에이전트는 반드시 하나의 부서에 소속된다.

### 경영부 (Management)
| 에이전트 | 역할 |
|---------|------|
| **Director** | 전체 파이프라인 흐름 조율. 어떤 파이프라인을 언제 실행할지 결정하고, 병렬 실행 시 우선순위를 관리한다 **(메인 Claude가 직접 수행)** |
| **Supervisor** | 각 단계의 결과물을 확인하고 승인/반려한다. 반려 시 어떤 단계로 돌아갈지 판단한다 |
| **HR Manager** | 조직 확장/축소를 판단한다. 새 에이전트나 스킬이 필요한지, 기존 에이전트를 분할/통합/폐기해야 하는지 결정한다 |

### 설계부 (Design)
| 에이전트 | 역할 |
|---------|------|
| **Design Council** | 설계 주제에 대해 전문가 에이전트들의 토론을 조율하고, 합의를 도출한다 |
| **Specialist** | 특정 분야 전문가로서 설계 토론에 참여한다. 분야 예시: 백엔드, 프론트엔드, DB, 보안, UI/UX 디자인 |

### 생산부 (Production)
| 에이전트 | 역할 |
|---------|------|
| **Producer** | 승인된 설계를 기반으로 실제 코드/문서/설정 파일을 생산한다 |

### 품질관리부 (Quality)
| 에이전트 | 역할 |
|---------|------|
| **QC Inspector** | 생산된 결과물을 설계와 비교하여 일치 여부를 판단한다. 불일치 시 원인을 분석한다 |
| **Auditor** | QC Inspector의 판단이 올바른지 검증한다. 평가 절차와 근거가 타당한지 확인한다 |

### 인프라부 (Infrastructure)
| 에이전트 | 역할 |
|---------|------|
| **Rollback Manager** | 문제 발생 시 이전 안정 상태로 복구한다. 롤백 범위와 영향을 판단한다 |
| **Dependency Checker** | 파이프라인 간 의존성을 추적한다. "A가 끝나야 B 시작 가능" 같은 관계를 관리한다 |
| **Changelog Manager** | 모든 변경 이력을 추적한다. 설계 v1→v2→v3 변경 사유를 기록한다 |
| **Git Manager** | 완성된 결과물의 커밋, 브랜치 생성, PR 관리를 담당한다 |

### 보고부 (Reporting)
| 에이전트 | 역할 |
|---------|------|
| **Reporter** | 전체 작업 기록을 사용자가 읽기 쉬운 형태로 정리한다 |

---

## 2. 에이전트 파일 구조

Claude Code의 네이티브 에이전트 시스템을 활용한다. 모든 에이전트는 `.claude/agents/` 디렉토리에 AGENT.md 형식으로 저장한다. 이렇게 하면 Claude Code가 에이전트를 직접 인식하고, `@에이전트명`으로 호출하거나 `--agent 에이전트명`으로 세션 전체에 적용할 수 있다.

```
.claude/agents/
├── director/
│   └── AGENT.md
├── supervisor/
│   └── AGENT.md
├── hr-manager/
│   └── AGENT.md
├── design-council/
│   └── AGENT.md
├── specialist-backend/
│   └── AGENT.md
├── specialist-frontend/
│   └── AGENT.md
├── specialist-database/
│   └── AGENT.md
├── specialist-security/
│   └── AGENT.md
├── specialist-ui-ux/
│   └── AGENT.md
├── producer/
│   └── AGENT.md
├── qc-inspector/
│   └── AGENT.md
├── auditor/
│   └── AGENT.md
├── rollback-manager/
│   └── AGENT.md
├── dependency-checker/
│   └── AGENT.md
├── changelog-manager/
│   └── AGENT.md
├── git-manager/
│   └── AGENT.md
└── reporter/
    └── AGENT.md
```

### 에이전트 파일 템플릿 (AGENT.md)

모든 에이전트 파일은 Claude Code 네이티브 AGENT.md 형식을 따른다. frontmatter에서 모델, 도구, 권한, 메모리, 스킬을 설정할 수 있다.

```markdown
---
name: [에이전트 이름 (영문, 하이픈 구분)]
description: [한 줄 역할 설명. Claude가 이 에이전트에 작업을 위임할지 판단할 때 사용된다.]
model: [sonnet / opus / haiku — 작업 복잡도에 따라 선택]
tools: [사용 가능한 도구 목록 (쉼표 구분)]
disallowedTools: [사용 금지 도구 목록 (선택)]
permissionMode: [default / acceptEdits / plan / dontAsk]
memory: project
skills:
  - agent-manual
  - [추가 스킬명]
---

# [에이전트 이름]

## 소속
- **부서**: [management / design / production / quality / infrastructure / reporting]
- **유형**: [에이전트 유형]

## 역할
이 에이전트가 담당하는 업무를 구체적으로 서술한다.
단순히 유형의 설명을 복사하지 않고, 이 프로젝트에서의 구체적인 역할을 기술한다.

## 입력
이 에이전트가 작업을 시작하기 위해 필요한 것들.
- 어떤 파일을 읽는지 (경로 명시)
- 어떤 에이전트의 결과물을 받는지
- 어떤 조건이 충족되어야 시작하는지

## 작업 절차
단계별로 수행하는 작업을 기술한다.
1. 첫 번째 단계
2. 두 번째 단계
...
각 단계에서 왜 이 작업을 하는지 이유도 함께 설명한다.

## 출력
이 에이전트가 생산하는 결과물.
- 파일 경로와 형식 (정확한 경로 명시)
- 다음 에이전트에게 전달하는 내용

## 기록 규칙
이 에이전트가 남겨야 하는 기록의 종류와 형식.
agent-manual의 기록 체계(references/02-records-and-communication.md)를 참조하여 작성한다.
```

### frontmatter 설정 가이드

| 필드 | 설명 | 권장값 |
|------|------|--------|
| **model** | 작업에 사용할 모델 | 설계/판단: `opus`, 생산: `sonnet`, 탐색: `haiku` |
| **tools** | 사용 가능한 도구 | 역할에 맞는 최소한의 도구만 허용 |
| **disallowedTools** | 사용 금지 도구 | 읽기 전용 에이전트는 `Write, Edit` 금지 |
| **permissionMode** | 권한 모드 | 생산 에이전트: `acceptEdits`, QC: `plan` |
| **memory** | 에이전트별 메모리 | `project` (`.claude/agent-memory/`에 저장) |
| **skills** | 프리로드할 스킬 | 에이전트 시작 시 자동으로 스킬 내용이 컨텍스트에 주입됨 |
| **maxTurns** | 최대 실행 턴 | 작업 범위에 따라 설정. 기본 무제한 |

### 에이전트별 권장 설정

| 에이전트 | model | tools | permissionMode |
|---------|-------|-------|----------------|
| Director | opus | Read, Grep, Glob, Agent | default |
| Supervisor | opus | Read, Grep, Glob | plan |
| HR Manager | sonnet | Read, Write, Edit, Grep, Glob | default |
| Design Council | opus | Read, Grep, Glob, Agent | plan |
| Specialist | sonnet | Read, Grep, Glob, WebSearch, WebFetch | plan |
| Producer | sonnet | Read, Write, Edit, Bash, Grep, Glob | acceptEdits |
| QC Inspector | sonnet | Read, Grep, Glob, Bash | plan |
| Auditor | opus | Read, Grep, Glob | plan |
| Git Manager | sonnet | Read, Bash, Grep, Glob | default |
| Reporter | haiku | Read, Write, Grep, Glob | acceptEdits |

### 에이전트 호출 방법

Claude Code 네이티브 에이전트는 3가지 방법으로 호출한다:

1. **자동 위임** — Claude가 작업 설명을 읽고 적합한 에이전트에 자동 위임
2. **@멘션** — `@"producer (agent)" 이 API를 구현해줘`
3. **세션 전체 적용** — `claude --agent producer` (CLI에서)

---

## 20. HR Manager 운영 규칙

HR Manager는 조직의 에이전트와 스킬을 관리한다. 새로운 작업이 들어왔을 때 기존 조직으로 처리 가능한지, 아니면 조직 확장이 필요한지를 판단하는 역할이다.

### 20.1 HR Manager가 개입하는 시점

| 트리거 | 상황 | 예시 |
|--------|------|------|
| **새 파이프라인 시작** | Director가 새 파이프라인을 만들 때, 필요한 에이전트가 모두 있는지 HR Manager에게 확인 요청 | "결제 시스템 파이프라인을 시작하려는데, 결제 전문 Specialist가 있나?" |
| **반복 작업 감지** | Auditor나 Reporter가 같은 유형의 수작업이 반복됨을 보고 | "매번 API 문서를 수동으로 생성하고 있다 → 스킬로 자동화?" |
| **에이전트 과부하** | 하나의 에이전트 역할이 너무 넓어져서 성능이 떨어짐 | "Producer가 프론트/백엔드/인프라를 다 하고 있다 → 분리?" |
| **성능 평가 결과** | 에이전트 성능 평가에서 구조적 문제가 발견됨 | "특정 분야 전문성 부족 → 새 Specialist 필요?" |
| **에이전트 유휴** | 더 이상 사용되지 않는 에이전트가 있음 | "이전 프로젝트용 Specialist가 남아 있다 → 폐기?" |

### 20.2 판단 절차

```
트리거 발생 → 현황 분석 → 대안 검토 → 제안서 작성 → Director 승인 → 실행
```

1. **현황 분석** — 현재 에이전트/스킬 목록을 확인하고, 커버리지 갭을 파악한다
2. **대안 검토** — 다음 중 최선의 방법을 판단한다:

| 대안 | 언제 사용 |
|------|----------|
| **기존 에이전트 활용** | 기존 에이전트의 역할을 약간 확장하면 커버 가능할 때 |
| **새 에이전트 생성** | 전문성이 필요하거나, 기존 에이전트에 넣기엔 역할이 다를 때 |
| **새 스킬 생성** | 반복 작업을 자동화할 수 있을 때 |
| **에이전트 분할** | 하나의 에이전트 역할이 너무 비대할 때 |
| **에이전트 통합** | 역할이 겹치는 에이전트가 여럿일 때 |
| **에이전트 폐기** | 더 이상 필요 없는 에이전트일 때 |

3. **제안서 작성**

```markdown
# HR 제안서

- **제안자**: HR Manager
- **유형**: 신규 생성 / 업데이트 / 분할 / 통합 / 폐기 / 스킬 생성 / 스킬 업데이트
- **트리거**: 이 제안을 하게 된 이유

## 현황
현재 에이전트/스킬 구성과 문제점

## 제안
구체적으로 무엇을 하려는지

## 근거
왜 이 변경이 필요한지. 대안을 검토한 결과

## 영향
이 변경이 기존 파이프라인과 다른 에이전트에 미치는 영향

## 실행 계획
변경을 어떻게 적용할지 (agent-creator 스킬 활용 등)
```

4. **Director 승인** — Director가 제안을 검토하고 승인/반려한다
5. **실행** — 승인되면 agent-creator 스킬을 사용하여 에이전트를 생성/수정/삭제한다

### 20.3 에이전트 라이프사이클 관리

HR Manager는 에이전트의 전체 생명주기를 관리한다:

```
필요성 판단 → 생성 → 운영 → 성능 평가 → 개선/유지/폐기
```

- **생성**: agent-creator 스킬을 통해 매뉴얼 규격에 맞게 생성
- **운영**: 파이프라인에 배치되어 작업 수행
- **성능 평가**: Auditor의 정기 평가 결과를 HR Manager가 수신
- **개선/업데이트**: 지시사항 보완, 역할 재정의 (아래 20.4 참조)
- **폐기**: 더 이상 필요 없으면 `.claude/agents/` 에서 제거하고 기록에 폐기 사유를 남긴다

### 20.4 에이전트 업데이트 절차

운영 중인 에이전트의 지시사항, 역할, 작업 절차를 수정해야 할 때의 절차.

#### 업데이트 트리거

| 트리거 | 예시 |
|--------|------|
| **성능 평가 결과** | 정확도가 낮거나 재작업률이 높아서 지시사항 보완 필요 |
| **반복 실수** | 같은 유형의 실수가 3회 이상 반복됨 |
| **역할 변경** | 프로젝트 방향이 바뀌어 에이전트 역할 재정의 필요 |
| **매뉴얼 변경** | 운영 매뉴얼이 업데이트되어 에이전트도 맞춰야 함 |
| **사용자 피드백** | 사용자가 에이전트 동작 방식에 불만족 |
| **기술 스택 변경** | 프로젝트 기술이 바뀌어 Specialist 전문 분야 조정 필요 |

#### 업데이트 절차

```
업데이트 필요성 판단 → 변경 범위 분석 → 업데이트 제안서 → 승인 → 적용 → 검증
```

1. **변경 범위 분석** — HR Manager가 업데이트 대상 에이전트 파일을 읽고, 무엇을 바꿔야 하는지 정리한다
   - **경미한 변경**: 지시사항 문구 수정, 예시 추가 → Director 확인 후 바로 적용
   - **중대한 변경**: 역할 재정의, 작업 절차 변경, 입출력 형식 변경 → 전체 절차

2. **업데이트 제안서 작성**

```markdown
# 에이전트 업데이트 제안서

- **대상 에이전트**: [이름]
- **변경 규모**: 경미 / 중대
- **트리거**: 이 업데이트가 필요한 이유

## 현재 상태
에이전트의 현재 지시사항/역할 중 문제가 되는 부분

## 변경 내용
### 변경 전
(기존 내용)

### 변경 후
(수정된 내용)

## 변경 사유
왜 이렇게 바꾸는지, 어떤 문제가 해결되는지

## 영향 분석
- 이 에이전트와 협업하는 다른 에이전트에 미치는 영향
- 진행 중인 파이프라인에 미치는 영향
- 입출력 형식이 바뀌면 다른 에이전트의 수정도 필요한지
```

3. **승인** — Director가 검토한다. 중대한 변경의 경우 영향받는 에이전트의 Supervisor에게도 확인한다

4. **적용** — 에이전트 마크다운 파일을 수정한다. 변경 전 파일을 Changelog Manager가 이력으로 보존한다

5. **검증** — 업데이트된 에이전트가 다음 파이프라인에서 정상 동작하는지 확인한다. QC Inspector가 첫 실행 결과를 특별히 주의 깊게 검사한다

#### 업데이트 기록

```json
{
  "update_id": "update-001",
  "timestamp": "2026-03-21T17:00:00",
  "target_type": "agent",
  "target_name": "producer",
  "scale": "minor",
  "trigger": "반복 실수 - 테스트 없이 코드만 제출 3회",
  "changes": "작업 절차에 '테스트 작성 후 제출' 단계를 명시적으로 추가",
  "approved_by": "director",
  "verified": true
}
```

### 20.5 스킬 관리

에이전트뿐 아니라 스킬도 HR Manager의 관리 범위이다:

- **스킬 필요성 판단**: 반복 작업이 3회 이상 동일 패턴으로 발생하면 스킬화를 검토한다
- **스킬 생성 요청**: skill-creator 스킬을 통해 새 스킬을 생성한다
- **스킬 폐기**: 더 이상 사용되지 않는 스킬을 정리한다

### 20.6 스킬 업데이트 절차

운영 중인 스킬의 지시사항, 트리거 조건, 출력 형식 등을 수정해야 할 때의 절차.

#### 업데이트 트리거

| 트리거 | 예시 |
|--------|------|
| **스킬 결과 품질 저하** | 스킬을 사용한 결과물이 기대에 미치지 못함 |
| **트리거 오작동** | 스킬이 불필요하게 트리거되거나, 필요할 때 트리거되지 않음 |
| **프로젝트 변경** | 프로젝트 구조나 규칙이 바뀌어 스킬 내용도 맞춰야 함 |
| **매뉴얼 변경** | 운영 매뉴얼 업데이트로 스킬의 참조 내용이 달라짐 |
| **사용자 피드백** | 스킬 출력 형식이나 내용에 대한 개선 요청 |

#### 업데이트 절차

```
문제 파악 → 스킬 파일 분석 → 수정안 작성 → 테스트 → 승인 → 적용
```

1. **스킬 파일 분석** — HR Manager가 SKILL.md와 references/ 파일을 읽고 수정 필요 부분을 파악한다

2. **수정안 작성** — 에이전트 업데이트 제안서와 동일한 형식으로 작성하되, 대상이 스킬임을 명시한다

3. **테스트** — 수정된 스킬로 기존 테스트 케이스를 다시 실행하여 개선되었는지 확인한다. 새로운 문제가 생기지 않았는지도 확인한다

4. **승인 & 적용** — Director 승인 후 스킬 파일을 수정한다. 변경 전 파일을 Changelog Manager가 보존한다

#### 스킬 업데이트 기록

```json
{
  "update_id": "update-002",
  "timestamp": "2026-03-21T18:00:00",
  "target_type": "skill",
  "target_name": "agent-manual",
  "scale": "major",
  "trigger": "매뉴얼에 HR Manager 섹션이 추가되어 목차 업데이트 필요",
  "changes": "SKILL.md 목차에 20절 HR Manager 항목 추가, references/01 파일에 HR Manager 상세 규칙 추가",
  "approved_by": "director",
  "tested": true,
  "verified": true
}
```

### 20.7 기록

HR Manager의 모든 판단과 변경은 기록으로 남긴다:

```
logs/hr/
├── proposals/
│   └── hr-proposal-[순번3자리]-[날짜].md  ← 제안서
├── decisions/
│   └── hr-decision-[순번3자리]-[날짜].json ← 승인/반려 결과
└── roster.json                             ← 현재 에이전트/스킬 명단
```

**roster.json 형식:**

```json
{
  "agents": [
    {
      "name": "producer",
      "department": "production",
      "type": "producer",
      "status": "active",
      "created_at": "2026-03-21",
      "created_by": "hr-proposal-001"
    }
  ],
  "skills": [
    {
      "name": "agent-manual",
      "status": "active",
      "created_at": "2026-03-21"
    }
  ]
}
```
