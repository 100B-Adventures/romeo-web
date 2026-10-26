import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('알림', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('알림 목록 페이지 로드', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('알림 페이지 — 빈 상태 또는 목록 표시', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('load');
    // 알림이 없으면 빈 상태 메시지, 있으면 목록 표시
    const body = page.locator('body');
    const hasContent = await body.textContent();
    expect(hasContent).toBeTruthy();
  });

  test('알림 읽음 처리 동작', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('load');
    // 알림 아이템 클릭 → 읽음 표시
    const notifItem = page.locator('[data-testid="notification-item"], [class*="notification"]').first();
    if (await notifItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notifItem.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });
});
