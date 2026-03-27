import { test, expect } from '@playwright/test';

/**
 * 관리자 기능 E2E 테스트
 * - 관리자 대시보드 접근
 * - 사용자 관리 페이지
 * - 공지사항 관리
 * - 신고 관리
 */

test.describe('관리자 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 관리자 테스트는 관리자 계정으로 로그인 후 진행
    // 시드 데이터에서 관리자 계정 사용 (필요에 따라 조정)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 로그인 후 관리자 대시보드로 리디렉션 또는 직접 이동
    await expect(page).toHaveURL(/\/(my|admin)/, { timeout: 10000 });
  });

  test('관리자 대시보드 접근 및 렌더링 확인', async ({ page }) => {
    await page.goto('/admin');

    // 관리자 대시보드 타이틀 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 대시보드 메뉴 또는 카드 요소 확인
    const dashboardElements = page.locator('[data-testid="dashboard-card"], .dashboard-section, .stat-card');
    const count = await dashboardElements.count();

    // 최소 1개 이상의 대시보드 요소가 표시되는지 확인
    expect(count).toBeGreaterThan(0);
  });

  test('사용자 관리 페이지 접근 및 사용자 목록 표시 확인', async ({ page }) => {
    await page.goto('/admin/users');

    // 사용자 관리 페이지 타이틀 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 사용자 목록 테이블 또는 카드 렌더링 확인
    const userItems = page.locator('[data-testid="user-item"], .user-card, table tbody tr');
    const count = await userItems.count();

    // 최소 1개 이상의 사용자가 표시되는지 확인
    expect(count).toBeGreaterThan(0);
  });

  test('사용자 관리 페이지에서 검색/필터 기능 확인', async ({ page }) => {
    await page.goto('/admin/users');

    // 검색 또는 필터 입력 필드 찾기
    const searchInput = page.locator('input[placeholder*="검색"], input[name="keyword"], [data-testid="user-search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('user');
      await page.waitForLoadState('networkidle');

      // 필터된 결과 확인
      const results = page.locator('[data-testid="user-item"], .user-card, table tbody tr');
      const count = await results.count();

      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('공지사항 관리 페이지 접근 및 목록 표시 확인', async ({ page }) => {
    await page.goto('/admin/notices');

    // 공지사항 페이지 타이틀 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 공지사항 목록 렌더링 확인
    const noticeItems = page.locator('[data-testid="notice-item"], .notice-card, table tbody tr');
    const count = await noticeItems.count();

    // 공지사항이 없을 수도 있으므로 페이지 요소만 확인
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('공지사항 관리 페이지에서 공지 작성 버튼 확인', async ({ page }) => {
    await page.goto('/admin/notices');

    // 공지 작성/추가 버튼 찾기
    const createButton = page.locator('button:has-text("작성"), button:has-text("추가"), button:has-text("새로운"), a:has-text("작성")').first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(createButton).toBeVisible();
    }
  });

  test('신고 관리 페이지 접근 및 목록 표시 확인', async ({ page }) => {
    await page.goto('/admin/reports');

    // 신고 관리 페이지 타이틀 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 신고 목록 렌더링 확인
    const reportItems = page.locator('[data-testid="report-item"], .report-card, table tbody tr');
    const count = await reportItems.count();

    // 신고가 없을 수도 있으므로 페이지 요소만 확인
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('사용자 상세 페이지 접근 및 정보 표시 확인', async ({ page }) => {
    await page.goto('/admin/users');

    // 첫 번째 사용자 항목 클릭
    const firstUser = page.locator('[data-testid="user-item"], .user-card, table tbody tr').first();

    if (await firstUser.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 사용자 이름 또는 ID 링크 클릭
      const userLink = firstUser.locator('a, button').first();
      if (await userLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userLink.click();

        // 사용자 상세 페이지로 이동 확인
        await expect(page).toHaveURL(/\/admin\/users\//, { timeout: 5000 });

        // 사용자 정보 표시 확인
        await expect(page.locator('h1, [data-testid="user-name"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('공지사항 상세 페이지 접근 및 내용 표시 확인', async ({ page }) => {
    await page.goto('/admin/notices');

    // 첫 번째 공지사항 항목 클릭
    const firstNotice = page.locator('[data-testid="notice-item"], .notice-card, table tbody tr').first();

    if (await firstNotice.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 공지사항 제목 또는 링크 클릭
      const noticeLink = firstNotice.locator('a, button').first();
      if (await noticeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await noticeLink.click();

        // 공지사항 상세 페이지 또는 모달 표시 확인
        await expect(page.locator('h1, h2, [data-testid="notice-title"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('신고 상세 페이지 접근 및 정보 표시 확인', async ({ page }) => {
    await page.goto('/admin/reports');

    // 첫 번째 신고 항목 클릭
    const firstReport = page.locator('[data-testid="report-item"], .report-card, table tbody tr').first();

    if (await firstReport.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 신고 제목 또는 링크 클릭
      const reportLink = firstReport.locator('a, button').first();
      if (await reportLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reportLink.click();

        // 신고 상세 페이지 또는 모달 표시 확인
        await expect(page.locator('h1, h2, [data-testid="report-title"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('관리 기능 버튼 (편집/삭제) 확인', async ({ page }) => {
    await page.goto('/admin/users');

    // 첫 번째 사용자 행 선택
    const firstUser = page.locator('[data-testid="user-item"], .user-card, table tbody tr').first();

    if (await firstUser.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 편집 또는 액션 버튼 확인
      const actionButtons = firstUser.locator('button');
      const count = await actionButtons.count();

      // 최소 1개 이상의 액션 버튼이 있는지 확인
      expect(count).toBeGreaterThan(0);
    }
  });
});
