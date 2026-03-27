import { test, expect } from '@playwright/test';

/**
 * 소설 열람 시나리오 E2E 테스트
 * - 메인 페이지 소설 목록
 * - 소설 상세 페이지
 * - 에피소드 목록
 * - 무료 에피소드 뷰어
 */

test.describe('소설 열람', () => {
  test('메인 페이지 소설 목록 렌더링 확인', async ({ page }) => {
    await page.goto('/');

    // 소설 목록이 렌더링되는지 확인 (시드 데이터: 10개 소설)
    // 실제 구현에 따라 선택자 조정 필요
    const novelItems = page.locator('[data-testid="novel-item"], .novel-card, article');
    await expect(novelItems.first()).toBeVisible({ timeout: 5000 });

    // 최소 1개 이상의 소설이 표시되는지 확인
    const count = await novelItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('소설 상세 페이지 접근 및 정보 표시 확인', async ({ page }) => {
    // 메인 페이지에서 첫 번째 소설 클릭
    await page.goto('/');

    const firstNovel = page.locator('[data-testid="novel-item"], .novel-card, article').first();
    await firstNovel.waitFor({ state: 'visible', timeout: 5000 });
    await firstNovel.click();

    // 소설 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/novel\/\d+/, { timeout: 5000 });

    // 소설 정보 표시 확인 (제목, 작가, 장르 등)
    // 실제 구현에 따라 선택자 조정 필요
    await expect(page.locator('h1, [data-testid="novel-title"]')).toBeVisible();
  });

  test('에피소드 목록 표시 확인', async ({ page }) => {
    // 소설 상세 페이지로 직접 이동 (ID=1 가정, 시드 데이터 참조)
    await page.goto('/novel/1');

    // 에피소드 목록 확인 (시드 데이터: 소설당 여러 에피소드)
    const episodeItems = page.locator('[data-testid="episode-item"], .episode-card, li');
    await expect(episodeItems.first()).toBeVisible({ timeout: 5000 });

    const count = await episodeItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('무료 에피소드 뷰어 접근 확인', async ({ page }) => {
    // 첫 번째 소설의 첫 번째 에피소드로 이동 (ID=1, episodeId=1 가정)
    await page.goto('/novel/1/episode/1');

    // 에피소드 뷰어가 렌더링되는지 확인
    // 실제 구현에 따라 선택자 조정 필요
    await expect(page.locator('[data-testid="episode-content"], .episode-viewer, article')).toBeVisible({ timeout: 5000 });

    // 에피소드 제목 또는 내용이 표시되는지 확인
    await expect(page.locator('h1, h2, [data-testid="episode-title"]')).toBeVisible();
  });
});
