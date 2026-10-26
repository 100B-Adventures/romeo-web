import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('설정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('설정 페이지 로드', async ({ page }) => {
    await page.goto('/profile/settings');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('선호도 설정 페이지 로드', async ({ page }) => {
    await page.goto('/profile/preferences');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('인증 관리 페이지 로드', async ({ page }) => {
    await page.goto('/profile/verification');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('커플 등록 페이지 로드', async ({ page }) => {
    await page.goto('/couple');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('친구 초대 페이지 로드', async ({ page }) => {
    await page.goto('/invite');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('고객센터 페이지 로드', async ({ page }) => {
    await page.goto('/support');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
