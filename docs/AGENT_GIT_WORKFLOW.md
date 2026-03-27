# 에이전트 Git 워크플로우

에이전트가 기능 개발 시 따라야 하는 Git 워크플로우.
`docs/GIT_POLICY.md`의 상위 정책을 기반으로, 에이전트 파이프라인에 특화된 절차를 정의한다.

---

## 1. 전체 흐름

```
Issue 생성 → 브랜치 생성 → 개발(커밋) → PR 생성 → 리뷰/승인 → Squash Merge → 브랜치 삭제
```

모든 기능 개발은 **Issue에서 시작**한다. Issue 없이 브랜치를 만들거나 커밋하지 않는다.

---

## 2. Issue 생성

### 2.1 언제 생성하는가

| 상황 | Issue 필요 여부 |
|------|---------------|
| 새 기능 개발 | O - Feature Request |
| 버그 수정 | O - Bug Report |
| 문서 작업 | O - Documentation |
| 설정/유지보수 | O - 제목에 `[Chore]` 접두사 |
| hotfix (긴급) | O - Bug Report + `priority:critical` 라벨 |

### 2.2 Issue 생성 규칙

- GitHub Issue Template 사용 (`.github/ISSUE_TEMPLATE/`)
- 라벨 필수 부착: 유형 + 패키지 + 도메인 (해당 시)
- 담당자(assignee) 지정
- 파이프라인 ID가 있으면 본문에 명시

### 2.3 에이전트의 Issue 생성

Git Manager가 `gh issue create` 명령으로 생성한다:

```bash
gh issue create \
  --title "[Feature] 에피소드 뷰어 구현" \
  --body "## 설명\n에피소드 뷰어 기능 구현\n\n## 파이프라인\npipeline-001" \
  --label "enhancement,pkg:web,domain:episode"
```

---

## 3. 브랜치 생성

Issue가 생성되면 해당 Issue 번호를 포함한 브랜치를 만든다.

### 3.1 브랜치 네이밍

**형식**: `{type}/{package}-{issue번호}-{description}`

```
feature/web-12-episode-reader
fix/api-15-auth-token-expiry
docs/root-20-api-documentation
chore/infra-25-docker-compose
```

### 3.2 브랜치 분기 규칙

| 브랜치 유형 | 분기 원본 | merge 대상 |
|------------|----------|-----------|
| feature/* | develop | develop |
| fix/* | develop | develop |
| docs/* | develop | develop |
| chore/* | develop | develop |
| hotfix/* | main | main + develop |

```bash
git checkout develop && git pull origin develop
git checkout -b feature/web-12-episode-reader
```

---

## 4. 커밋

### 4.1 커밋 메시지에 Issue 번호 포함

```
feat(web): 에피소드 뷰어 기본 레이아웃 구현

- 스크롤 기반 에피소드 콘텐츠 렌더링
- 이전/다음 에피소드 네비게이션

Refs #12
```

### 4.2 커밋 단위

- 논리적으로 독립적인 변경 단위로 커밋
- 하나의 커밋이 하나의 목적을 가져야 함
- WIP 커밋은 PR 전에 정리 (Squash Merge이므로 최종적으로 하나가 됨)

---

## 5. PR 생성

### 5.1 PR 제목

Conventional Commits 형식을 따른다. Squash Merge 시 이 제목이 최종 커밋 메시지가 된다.

```
feat(web): 에피소드 뷰어 구현 (#12)
```

### 5.2 PR 본문 템플릿

```markdown
## Summary
- 에피소드 뷰어 기능 구현
- 스크롤 기반 콘텐츠 렌더링

## Related Issue
Closes #12

## Pipeline
pipeline-001

## Quality Reports
- QC: logs/pipelines/001/quality/qc-report.md
- Audit: logs/pipelines/001/quality/audit-report.md

## Checklist
- [ ] 관련 이슈 링크
- [ ] 테스트 추가/수정
- [ ] 셀프 리뷰 완료
- [ ] Breaking Change 여부 확인
```

### 5.3 PR 생성 명령

```bash
gh pr create \
  --title "feat(web): 에피소드 뷰어 구현 (#12)" \
  --body "..." \
  --base develop \
  --label "enhancement,pkg:web,domain:episode"
```

---

## 6. Merge 및 정리

### 6.1 Merge 조건

- 감사 보고서 승인 완료 (파이프라인 경유 시)
- CI 통과
- 리뷰어 승인

### 6.2 Merge 후 자동 처리

- Squash and Merge로 병합
- PR에 `Closes #이슈번호`가 있으면 Issue 자동 닫힘
- feature/fix 브랜치 자동 삭제

---

## 7. 에이전트별 역할

| 에이전트 | Git 관련 역할 |
|---------|-------------|
| Director | 파이프라인 시작 시 Issue 생성 지시 |
| Git Manager | Issue 생성, 브랜치 생성, 커밋, PR 생성, merge 관리 |
| Producer | 코드 작성 (커밋은 Git Manager에게 위임) |
| QC Inspector | QC 보고서 작성 (PR에 첨부) |
| Supervisor | 감사 보고서 승인 (merge 조건) |
| Reporter | 최종 리포트에 PR/Issue 링크 포함 |

---

## 8. 간편 워크플로우 (소규모 작업)

파이프라인 없이 빠르게 처리하는 소규모 작업(설정 변경, 문서 수정 등)의 경우:

```
Issue 생성 → 브랜치 → 작업 → 커밋 → PR → Merge
```

QC/감사 단계를 생략할 수 있으나, Issue와 PR은 반드시 거친다.

---

**참조**: `docs/GIT_POLICY.md` — 브랜치 전략, 커밋 규칙, 라벨 체계 상세
**작성일**: 2026-03-26
