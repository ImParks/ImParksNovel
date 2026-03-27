# E2E 테스트 가이드

## 개요

본 문서는 Playwright를 사용한 프론트엔드 E2E 테스트 구성을 설명합니다.

**테스트 도구:** Playwright
**설정 파일:** `apps/web/playwright.config.ts`
**테스트 디렉토리:** `apps/web/e2e/`
**작성일:** 2026-03-27
**상태:** 테스트 파일 작성 완료

---

## 테스트 구조

### 테스트 파일 목록
```
apps/web/e2e/
├── auth.spec.ts                    # 인증 (회원가입/로그인) - 4개 테스트
├── novel.spec.ts                   # 소설 열람 - 4개 테스트
├── payment.spec.ts                 # 결제 및 월렛 - 6개 테스트 (신규)
├── search.spec.ts                  # 검색 및 필터링 - 7개 테스트 (신규)
└── admin.spec.ts                   # 관리자 기능 - 10개 테스트 (신규)
```

**총 테스트 개수:** 31개

### 테스트 카테고리별 설명

#### 1. auth.spec.ts (인증)
- 회원가입 페이지 폼 렌더링
- 로그인 페이지 폼 렌더링
- 잘못된 로그인 에러 처리
- 로그인 후 리디렉션

**목표:** 인증 흐름이 올바르게 작동하는지 확인

---

#### 2. novel.spec.ts (소설 열람)
- 메인 페이지 소설 목록 렌더링
- 소설 상세 페이지 접근
- 에피소드 목록 표시
- 무료 에피소드 뷰어

**목표:** 소설 검색 및 열람 주요 흐름 작동 확인

---

#### 3. payment.spec.ts (결제/월렛) — 신규
- 코인 충전 페이지 접근 및 렌더링
- 코인 패키지 선택 및 구매 UI
- 멤버십 페이지 접근 및 플랜 표시
- 멤버십 플랜 선택 및 구독 UI
- 구매 내역 페이지 및 목록
- 월렛 정보 표시

**목표:** 결제 UI 및 워크플로우 정상 작동 확인

---

#### 4. search.spec.ts (검색/필터링) — 신규
- 검색 페이지 접근 및 검색창 렌더링
- 검색어 입력 및 결과 표시
- 장르 필터 적용
- 장르별 페이지 필터 검색
- 검색 결과에서 소설 상세 이동
- 검색 결과 정렬 옵션
- 검색 결과 페이지네이션

**목표:** 검색 기능과 필터링이 올바르게 작동하는지 확인

---

#### 5. admin.spec.ts (관리자) — 신규
- 관리자 대시보드 접근
- 사용자 관리 페이지 및 사용자 목록
- 사용자 검색/필터
- 공지사항 관리 페이지
- 공지사항 작성 버튼
- 신고 관리 페이지
- 사용자 상세 페이지
- 공지사항 상세 페이지
- 신고 상세 페이지
- 관리 액션 버튼 (편집/삭제)

**목표:** 관리자 기능 UI 접근성과 기본 상호작용 확인

---

## 실행 방법

### 전체 테스트 실행
```bash
cd apps/web
pnpm test:e2e
```

### 특정 파일만 테스트
```bash
pnpm test:e2e auth.spec.ts
pnpm test:e2e payment.spec.ts
pnpm test:e2e search.spec.ts
```

### UI 모드로 실행 (대화형)
```bash
pnpm test:e2e:ui
```

### 헤드 모드로 실행 (브라우저 표시)
```bash
pnpm test:e2e:headed
```

---

## 테스트 환경 설정

### playwright.config.ts
```typescript
export default defineConfig({
  testDir: './e2e',                  // 테스트 파일 디렉토리
  baseURL: 'http://localhost:3000',  // 테스트 대상 URL
  use: {
    trace: 'on-first-retry',         // 실패 시 추적 로그 생성
    screenshot: 'only-on-failure',   // 실패 시 스크린샷
  },
  projects: [
    { name: 'chromium', ... }        // Chrome 사용
  ],
});
```

### 선행 조건
1. **백엔드 API 실행 중**
   ```bash
   docker compose up api
   ```

2. **프론트엔드 개발 서버 실행 중**
   ```bash
   pnpm dev
   ```

3. **테스트 데이터 준비**
   - 시드 데이터 필요한 경우 미리 로드
   - 예: `reader1@test.com` / `password123` (회원가입/로그인 테스트용)

---

## 테스트 작성 가이드

### 기본 구조
```typescript
import { test, expect } from '@playwright/test';

test.describe('기능명', () => {
  test('세부 테스트 설명', async ({ page }) => {
    // 1. Navigate
    await page.goto('/path');

    // 2. Act
    await page.fill('input[name="field"]', 'value');
    await page.click('button');

    // 3. Assert
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### 선택자 우선순위
1. **data-testid** (권장)
   ```typescript
   page.locator('[data-testid="novel-item"]')
   ```

2. **클래스명**
   ```typescript
   page.locator('.novel-card')
   ```

3. **시멘틱 요소**
   ```typescript
   page.locator('article')
   ```

4. **폴백 선택자** (정규식)
   ```typescript
   page.locator('text=/검색.*결과/i')
   ```

### 대기 전략
```typescript
// 명시적 대기
await expect(element).toBeVisible({ timeout: 5000 });

// 네트워크 로딩 대기
await page.waitForLoadState('networkidle');

// 특정 요소 대기
await element.waitFor({ state: 'visible', timeout: 3000 });
```

---

## 테스트 체크리스트

### payment.spec.ts 검증
- [ ] 로그인 후 결제 페이지 접근 가능
- [ ] 코인 패키지 UI 렌더링
- [ ] 멤버십 플랜 UI 렌더링
- [ ] 구매 내역 페이지 접근 가능
- [ ] 월렛 정보 표시 여부

**실제 테스트 실행 시 조정 필요한 부분:**
- 선택자 (`[data-testid]`, 클래스명) 정확화
- 페이지 로딩 시간 초과값 조정
- 에러 메시지 패턴 수정

### search.spec.ts 검증
- [ ] 검색 입력 필드 렌더링
- [ ] 검색어 입력 및 결과 표시
- [ ] 장르 필터 동작
- [ ] 정렬 옵션 (있으면)
- [ ] 페이지네이션

### admin.spec.ts 검증
- [ ] 관리자 로그인 및 대시보드 접근
- [ ] 사용자 관리 페이지 접근
- [ ] 사용자 검색 기능
- [ ] 공지사항 관리 페이지
- [ ] 신고 관리 페이지

---

## 주의사항

### 1. 선택자 관리
테스트 작성 시 선택자가 실제 UI와 일치해야 합니다.

```typescript
// ✗ 너무 일반적 (불안정)
page.locator('button').first()

// ✓ 구체적 (안정적)
page.locator('button[data-testid="submit"]')
```

### 2. 네트워크 대기
페이지 로드 시 네트워크 요청 대기:

```typescript
// 데이터 로딩이 있는 경우
await page.waitForLoadState('networkidle');

// 또는 특정 요소 표시 대기
await expect(page.locator('[data-testid="data"]')).toBeVisible({ timeout: 5000 });
```

### 3. 조건부 테스트
모든 페이지에서 모든 요소가 있을 수 없으므로 조건부 처리:

```typescript
// 요소가 없을 수도 있는 경우
const element = page.locator('selector');
if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
  await expect(element).toBeVisible();
}
```

### 4. 테스트 데이터
- 테스트용 계정: `reader1@test.com` / `password123`
- 관리자 계정: `admin@test.com` / `password123` (필요시)
- 시드 데이터는 Docker 환경에서 자동 로드

### 5. 스크린샷 및 트레이스
실패 시 자동으로 생성:
- **스크린샷**: `test-results/` 폴더
- **트레이스**: `.zip` 파일 (브라우저 DevTools에서 열 수 있음)

---

## 자동화 및 CI/CD

### GitHub Actions 예시
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: docker compose up -d api
      - run: pnpm --filter web dev &
      - run: pnpm --filter web test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

---

## 리포트 확인

테스트 실행 후 HTML 리포트 열기:
```bash
npx playwright show-report
```

또는 직접 열기:
```bash
open apps/web/playwright-report/index.html  # macOS
start apps/web/playwright-report/index.html # Windows
```

---

## 다음 단계

1. **실제 선택자 확인**
   - 각 페이지에서 `[data-testid]` 또는 클래스명 추가
   - 테스트 선택자 업데이트

2. **테스트 실행**
   ```bash
   pnpm test:e2e
   ```

3. **실패 분석**
   - 스크린샷 및 트레이스 확인
   - 선택자 또는 대기 시간 조정

4. **CI/CD 통합**
   - GitHub Actions 워크플로우 추가
   - PR 빌드 전에 E2E 테스트 실행

---

## 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)
- [Trace Viewer](https://trace.playwright.dev/)
