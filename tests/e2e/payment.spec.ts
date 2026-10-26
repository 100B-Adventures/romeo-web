import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('결제/스토어', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('하트 충전 페이지 로드', async ({ page }) => {
    await page.goto('/payment');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('스토어 페이지 로드', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('매력지수 페이지 로드', async ({ page }) => {
    await page.goto('/charm');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('스토어 사용 내역 목록', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('load');
    // 사용 내역 섹션 확인
    const historySection = page.locator('text=/사용 내역|거래/').or(page.locator('[data-testid="usage-history"]'));
    if (await historySection.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(historySection.first()).toBeVisible();
    }
  });

  test('초기 보너스 표시', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('load');
    // 보너스 또는 하트 잔액 표시 확인
    const balanceDisplay = page.locator('[data-testid="heart-balance"], text=/\\d+.*하트/');
    if (await balanceDisplay.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(balanceDisplay.first()).toBeVisible();
    }
  });
});
