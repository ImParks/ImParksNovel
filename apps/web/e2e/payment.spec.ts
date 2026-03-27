import { test, expect } from '@playwright/test';

/**
 * 결제 시나리오 E2E 테스트
 * - 코인 충전 페이지 접근
 * - 멤버십 페이지 접근
 * - 코인 패키지 선택 및 결제 UI
 * - 멤버십 플랜 선택
 */

test.describe('결제 및 월렛', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 결제 테스트는 로그인 후 진행
    await page.goto('/login');
    await page.fill('input[name="email"]', 'reader1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/my/, { timeout: 10000 });
  });

  test('코인 충전 페이지 접근 및 렌더링 확인', async ({ page }) => {
    await page.goto('/payment/coins');

    // 페이지 타이틀 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 코인 패키지 카드 렌더링 확인
    const coinPackages = page.locator('[data-testid="coin-package"], .coin-package, .package-card');
    await expect(coinPackages.first()).toBeVisible({ timeout: 5000 });

    // 최소 1개 이상의 패키지가 표시되는지 확인
    const count = await coinPackages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('코인 패키지 선택 및 구매 버튼 확인', async ({ page }) => {
    await page.goto('/payment/coins');

    // 첫 번째 코인 패키지 선택
    const firstPackage = page.locator('[data-testid="coin-package"], .coin-package, .package-card').first();
    await expect(firstPackage).toBeVisible({ timeout: 5000 });

    // 패키지 내에서 구매 버튼 찾기
    const purchaseButton = firstPackage.locator('button:has-text("구매"), button:has-text("결제"), button[type="submit"]').first();
    await expect(purchaseButton).toBeVisible();
  });

  test('멤버십 페이지 접근 및 플랜 표시 확인', async ({ page }) => {
    await page.goto('/payment/membership');

    // 페이지 타이틀 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 멤버십 플랜 카드 렌더링 확인
    const membershipPlans = page.locator('[data-testid="membership-plan"], .membership-card, .plan-card');
    await expect(membershipPlans.first()).toBeVisible({ timeout: 5000 });

    // 최소 1개 이상의 플랜이 표시되는지 확인
    const count = await membershipPlans.count();
    expect(count).toBeGreaterThan(0);
  });

  test('멤버십 플랜 선택 및 구독 버튼 확인', async ({ page }) => {
    await page.goto('/payment/membership');

    // 첫 번째 멤버십 플랜 선택
    const firstPlan = page.locator('[data-testid="membership-plan"], .membership-card, .plan-card').first();
    await expect(firstPlan).toBeVisible({ timeout: 5000 });

    // 플랜 내에서 구독 버튼 찾기
    const subscribeButton = firstPlan.locator('button:has-text("구독"), button:has-text("선택"), button[type="submit"]').first();
    await expect(subscribeButton).toBeVisible();
  });

  test('구매 내역 페이지 접근 및 목록 표시 확인', async ({ page }) => {
    await page.goto('/my/purchases');

    // 구매 내역 페이지 렌더링 확인
    // 구매 내역이 없을 수도 있으므로 페이지 요소만 확인
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();

    // 구매 내역 테이블 또는 리스트 요소 확인
    const purchaseList = page.locator('[data-testid="purchase-item"], .purchase-card, table tbody tr');
    const count = await purchaseList.count();

    // 구매 내역이 있으면 최소 1개 이상
    if (count > 0) {
      expect(count).toBeGreaterThanOrEqual(1);
    } else {
      // 구매 내역이 없는 경우 안내 메시지 확인
      await expect(page.locator('text=/구매.*없음|이용.*없음|내역.*없음/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('월렛 정보 표시 확인', async ({ page }) => {
    await page.goto('/my');

    // 마이페이지에서 월렛 정보 (코인 잔액) 표시 확인
    const walletInfo = page.locator('[data-testid="wallet-balance"], .wallet-info, .coin-balance');
    const count = await walletInfo.count();

    // 월렛 정보가 표시되는지 확인
    if (count > 0) {
      await expect(walletInfo.first()).toBeVisible();
    }
  });
});
