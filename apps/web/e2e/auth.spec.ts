import { test, expect } from '@playwright/test';

/**
 * 인증 시나리오 E2E 테스트
 * - 회원가입/로그인 페이지 접근
 * - 로그인 폼 제출 및 에러 처리
 * - 로그인 후 마이페이지 리디렉션
 */

test.describe('회원가입 및 로그인', () => {
  test('회원가입 페이지 접근 및 폼 렌더링 확인', async ({ page }) => {
    await page.goto('/signup');

    // 회원가입 폼 요소 확인
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="nickname"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('로그인 페이지 접근 및 폼 렌더링 확인', async ({ page }) => {
    await page.goto('/login');

    // 로그인 폼 요소 확인
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('잘못된 로그인 시 에러 메시지 표시 확인', async ({ page }) => {
    await page.goto('/login');

    // 존재하지 않는 계정으로 로그인 시도
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 에러 메시지 확인 (텍스트는 실제 구현에 따라 조정 필요)
    await expect(page.locator('text=/로그인.*실패|잘못된.*정보|인증.*실패/i')).toBeVisible({ timeout: 5000 });
  });

  test('로그인 후 마이페이지 리디렉션 확인', async ({ page }) => {
    await page.goto('/login');

    // 시드 데이터로 로그인
    await page.fill('input[name="email"]', 'reader1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 로그인 성공 후 마이페이지로 리디렉션 확인
    await expect(page).toHaveURL(/\/my/, { timeout: 10000 });
  });
});
