---
name: agent-creator
description: 에이전트 및 스킬 생성/업데이트 도구. agent-manual의 규칙에 따라 새 에이전트나 스킬을 통일된 형식으로 생성하고, 기존 에이전트/스킬을 업데이트한다. "에이전트 만들어줘", "새 에이전트 필요해", "스킬 만들어줘", "에이전트 수정해줘", "에이전트 업데이트" 등의 맥락에서 트리거된다. 에이전트나 스킬의 생성/수정/삭제가 필요한 모든 상황에서 이 스킬을 사용한다.
---

# Agent Creator

에이전트 운영 매뉴얼(`.claude/skills/agent-manual/`)의 규칙에 따라 에이전트와 스킬을 생성하고 관리하는 도구이다.

이 스킬을 사용하기 전에 반드시 `.claude/skills/agent-manual/SKILL.md`를 읽어 전체 매뉴얼 구조를 파악하고, 필요한 참조 파일을 읽는다.

---

## 1. 에이전트 유형 참조

생성할 수 있는 에이전트 유형 13종. 상세 역할은 `agent-manual/references/01-organization-and-structure.md`를 참조한다.

| 부서 | 유형 | 역할 요약 |
|------|------|----------|
| management | **director** | 전체 파이프라인 흐름 조율 |
| management | **supervisor** | 각 단계 승인/반려 |
| management | **hr-manager** | 에이전트/스킬 생성, 업데이트, 폐기 판단 |
| design | **design-council** | 전문가 토론 조율, 합의 도출 |
| design | **specialist** | 특정 분야 전문가 (백엔드, 프론트, DB, 보안, UI/UX 등) |
| production | **producer** | 승인된 설계 기반으로 실제 생산 |
| quality | **qc-inspector** | 설계 vs 생산 비교, 품질 판정 |
| quality | **auditor** | QC 판단의 정당성 검증 |
| infrastructure | **rollback-manager** | 문제 시 이전 상태 복구 |
| infrastructure | **dependency-checker** | 파이프라인 간 의존성 추적 |
| infrastructure | **changelog-manager** | 변경 이력 추적 |
| infrastructure | **git-manager** | 커밋, 브랜치, PR 관리 |
| reporting | **reporter** | 사용자용 리포트 정리 |

---

## 2. 에이전트 생성 절차

### 2.1 요구사항 파악

사용자 요청에서 다음을 파악한다:

1. **어떤 역할이 필요한지** — 위 13종 중 해당하는 유형을 선택한다
2. **기존 유형에 없는 역할인지** — 없으면 가장 가까운 유형을 기반으로 커스텀 에이전트를 만든다
3. **specialist인 경우 분야** — 어떤 전문 분야인지 (예: 백엔드, 결제, 인프라 등)

사용자가 모호하게 요청하면 질문하여 명확히 한다. 예를 들어 "코딩하는 에이전트 만들어줘"라면 → "어떤 분야의 코딩인지, Producer인지 Specialist인지" 확인한다.

### 2.2 에이전트 파일 작성

`.claude/agents/[이름]/AGENT.md` 경로에 Claude Code 네이티브 AGENT.md 형식으로 작성한다.

```markdown
---
name: [에이전트 이름 (영문, 하이픈 구분)]
description: [한 줄 역할 설명. Claude가 위임 판단에 사용한다.]
model: [sonnet / opus / haiku]
tools: [사용 가능 도구 (쉼표 구분)]
disallowedTools: [금지 도구 (선택)]
permissionMode: [default / acceptEdits / plan / dontAsk]
memory: project
skills:
  - agent-manual
  - [추가 스킬]
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
```

### 2.3 작성 시 주의사항

- **역할은 구체적으로** — "코드를 작성한다"가 아니라 "설계 문서의 API 명세에 따라 Express.js 라우터와 컨트롤러를 작성한다"처럼 이 프로젝트에 맞게 구체화한다
- **입출력 경로를 명시** — "파일을 읽는다"가 아니라 "`docs/designs/design-xxx-v1.md`를 읽는다"처럼 정확한 경로를 쓴다
- **매뉴얼 참조를 포함** — 에이전트가 작업 시 참고해야 할 매뉴얼 섹션을 명시한다. 에이전트는 자신의 파일만 읽을 수도 있으므로, 어떤 매뉴얼을 봐야 하는지 알려줘야 한다
- **왜를 설명** — 각 작업 절차에서 왜 이 단계가 필요한지 이유를 포함한다. 에이전트(LLM)가 맥락을 이해해야 더 잘 수행한다

---

## 3. 디렉토리 구조

에이전트는 `.claude/agents/[이름]/AGENT.md` 경로에 저장한다. 디렉토리가 없으면 자동으로 생성한다.

```
.claude/agents/
├── director/
│   └── AGENT.md
├── producer/
│   └── AGENT.md
├── specialist-backend/
│   └── AGENT.md
└── ...
```

에이전트 이름은 부서가 아닌 역할 기반으로 짓는다. specialist는 `specialist-[분야]` 형식을 사용한다.

---

## 4. roster.json 관리

에이전트를 생성/수정/삭제할 때마다 `logs/hr/roster.json`을 업데이트한다.
이 파일이 없으면 새로 생성한다.

### 생성 시 추가

```json
{
  "agents": [
    {
      "name": "에이전트 이름",
      "department": "소속 부서",
      "type": "에이전트 유형",
      "status": "active",
      "created_at": "YYYY-MM-DD",
      "created_by": "hr-proposal-XXX",
      "file_path": ".claude/agents/이름/AGENT.md"
    }
  ],
  "skills": []
}
```

### 업데이트 시 수정

기존 항목의 정보를 갱신하고, `updated_at` 필드를 추가한다.

### 삭제 시

`status`를 `"retired"`로 변경하고, `retired_at`과 `retired_reason`을 추가한다. 실제 파일은 삭제하지 않고 보존한다.

---

## 5. HR 제안서 작성

에이전트를 생성/업데이트/삭제할 때마다 `logs/hr/proposals/`에 제안서를 기록한다.
디렉토리가 없으면 자동 생성한다.

### 생성 제안서

파일명: `hr-proposal-[순번3자리]-[날짜].md`

```markdown
# HR 제안서: [에이전트명] 생성

- **제안자**: agent-creator
- **유형**: 신규 생성
- **날짜**: YYYY-MM-DD

## 배경
왜 이 에이전트가 필요한지

## 에이전트 정보
- **이름**: [이름]
- **부서**: [부서]
- **유형**: [유형]
- **역할**: [한 줄 설명]

## 파일 경로
- 에이전트 파일: .claude/agents/[이름]/AGENT.md
- roster.json 업데이트: 완료

## 승인
- **승인자**: [메인 Claude(Director 역할) 또는 사용자]
- **승인 일시**: YYYY-MM-DD
```

### 업데이트 제안서

```markdown
# HR 제안서: [에이전트명] 업데이트

- **제안자**: agent-creator
- **유형**: 업데이트
- **날짜**: YYYY-MM-DD

## 변경 사유
왜 업데이트가 필요한지

## 변경 내용
### 변경 전
(기존 내용)

### 변경 후
(수정된 내용)

## 영향 분석
이 변경이 다른 에이전트/파이프라인에 미치는 영향
```

---

## 6. 스킬 생성

에이전트뿐 아니라 스킬도 이 도구로 생성할 수 있다.

### 스킬 생성 절차

1. **스킬 목적 파악** — 무엇을 자동화하려는지, 어떤 상황에서 트리거되는지
2. **디렉토리 생성** — `.claude/skills/[스킬이름]/` 디렉토리를 만든다
3. **SKILL.md 작성** — frontmatter(name, description)과 본문을 작성한다
4. **필요시 references/ 생성** — 내용이 길면 하위 참조 파일로 분할한다
5. **roster.json 업데이트** — skills 배열에 추가한다
6. **HR 제안서 기록** — 스킬 생성 제안서를 기록한다

### 스킬 SKILL.md 템플릿

```markdown
---
name: [스킬 이름]
description: [트리거 조건과 역할을 포함한 설명. 어떤 상황에서 이 스킬이 호출되어야 하는지 구체적으로 작성한다.]
---

# [스킬 이름]

[스킬이 하는 일에 대한 개요]

## 작업 절차
[단계별 수행 작업]

## 출력 형식
[결과물의 형식과 저장 위치]
```

### 스킬 업데이트 절차

1. 기존 SKILL.md와 references/ 파일을 읽는다
2. 변경 필요 부분을 파악한다
3. 업데이트 제안서를 작성한다 (에이전트 업데이트와 동일한 형식)
4. 파일을 수정한다
5. roster.json을 업데이트한다

---

## 7. 일괄 생성

여러 에이전트를 한 번에 생성해야 할 때 (예: 프로젝트 초기 세팅), 사용자에게 필요한 에이전트 목록을 먼저 제시하고 확인받은 후 일괄 생성한다.

### 절차

1. 프로젝트 성격에 따라 필요한 에이전트 목록을 제안한다
2. 사용자 확인을 받는다
3. 각 에이전트를 순서대로 생성한다 (병렬 가능한 것은 병렬로)
4. roster.json을 한 번에 업데이트한다
5. 일괄 생성 HR 제안서를 하나 작성한다

---

## 8. 체크리스트

에이전트/스킬 생성 완료 후 아래 항목을 확인한다:

- [ ] 에이전트/스킬 파일이 올바른 경로에 생성되었는가
- [ ] frontmatter(name, department, type, description)가 올바른가
- [ ] 역할, 입력, 작업 절차, 출력, 기록 규칙이 모두 작성되었는가
- [ ] 매뉴얼 참조 섹션이 포함되었는가
- [ ] roster.json이 업데이트되었는가
- [ ] HR 제안서가 기록되었는가
- [ ] 네이밍 컨벤션을 따르는가 (소문자 + 하이픈, 한글 파일명 금지)
