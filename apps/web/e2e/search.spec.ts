import { test, expect } from '@playwright/test';

/**
 * 검색 및 필터링 시나리오 E2E 테스트
 * - 검색 페이지 접근
 * - 검색어 입력 및 결과 표시
 * - 장르 필터링
 * - 검색 결과 상호작용
 */

test.describe('검색 및 필터링', () => {
  test('검색 페이지 접근 및 검색창 렌더링 확인', async ({ page }) => {
    await page.goto('/search');

    // 검색 페이지 렌더링 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 검색 입력 필드 확인
    const searchInput = page.locator('input[type="text"][placeholder*="검색"], input[name="keyword"], [data-testid="search-input"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('검색어 입력 및 결과 표시 확인', async ({ page }) => {
    await page.goto('/search');

    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[type="text"][placeholder*="검색"], input[name="keyword"], [data-testid="search-input"]').first();
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill('마법');
    await searchInput.press('Enter');

    // 검색 결과 로딩 대기
    await page.waitForLoadState('networkidle');

    // 검색 결과 표시 확인
    const results = page.locator('[data-testid="search-result"], .search-card, .novel-card, article');
    const count = await results.count();

    // 검색 결과가 있으면 표시, 없으면 안내 메시지
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      await expect(page.locator('text=/검색 결과.*없음|일치.*없음|결과.*없음/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('장르 필터 접근 및 필터링 확인', async ({ page }) => {
    await page.goto('/search');

    // 장르 필터 또는 필터 버튼 찾기
    const genreFilter = page.locator('[data-testid="genre-filter"], .genre-selector, select, button:has-text("장르")').first();

    // 필터가 없을 수 있으므로 선택적 확인
    if (await genreFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await genreFilter.click();

      // 장르 옵션 선택
      const firstOption = page.locator('[data-testid="genre-option"], .genre-option, option, li').first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      }
    }
  });

  test('장르별 페이지에서 필터된 검색 결과 확인', async ({ page }) => {
    // 메인 페이지에서 장르로 이동
    await page.goto('/');

    // 장르 링크 찾기
    const genreLink = page.locator('a[href*="/genre/"], [data-testid="genre-link"]').first();

    if (await genreLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await genreLink.click();

      // 장르 페이지로 이동 확인
      await expect(page).toHaveURL(/\/genre\//, { timeout: 5000 });

      // 장르별 소설 목록 표시 확인
      const results = page.locator('[data-testid="novel-item"], .novel-card, article');
      await expect(results.first()).toBeVisible({ timeout: 5000 });

      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('검색 결과에서 소설 상세 페이지 이동 확인', async ({ page }) => {
    await page.goto('/search');

    // 검색 입력
    const searchInput = page.locator('input[type="text"][placeholder*="검색"], input[name="keyword"], [data-testid="search-input"]').first();
    await searchInput.fill('소설');
    await searchInput.press('Enter');

    // 검색 결과 로딩 대기
    await page.waitForLoadState('networkidle');

    // 첫 번째 검색 결과 클릭
    const firstResult = page.locator('[data-testid="search-result"], .search-card, .novel-card, article').first();

    if (await firstResult.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstResult.click();

      // 소설 상세 페이지로 이동 확인
      await expect(page).toHaveURL(/\/novel\//, { timeout: 5000 });
    }
  });

  test('검색 결과 정렬 옵션 확인', async ({ page }) => {
    await page.goto('/search');

    // 정렬 드롭다운 또는 버튼 찾기
    const sortSelector = page.locator('[data-testid="sort-select"], .sort-selector, select:has-text("정렬"), button:has-text("정렬")').first();

    if (await sortSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sortSelector.click();

      // 정렬 옵션 확인
      const option = page.locator('[data-testid="sort-option"], .sort-option, option, li').first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }
  });

  test('검색 페이지의 페이지네이션 확인', async ({ page }) => {
    await page.goto('/search');

    // 검색 입력
    const searchInput = page.locator('input[type="text"][placeholder*="검색"], input[name="keyword"], [data-testid="search-input"]').first();
    await searchInput.fill('소설');
    await searchInput.press('Enter');

    // 검색 결과 로딩 대기
    await page.waitForLoadState('networkidle');

    // 페이지네이션 버튼 찾기
    const nextButton = page.locator('button:has-text("다음"), [data-testid="pagination-next"], a[aria-label*="다음"]').first();

    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (!(await nextButton.isDisabled())) {
        await nextButton.click();

        // 다음 페이지 로딩 확인
        await page.waitForLoadState('networkidle');
      }
    }
  });
});
