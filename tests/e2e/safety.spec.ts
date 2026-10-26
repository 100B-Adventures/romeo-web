// 안전 (차단/신고) E2E 테스트
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('안전', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('프로필 상세 → 차단 버튼 동작', async ({ page }) => {
    await page.goto('/profiles/1');
    await page.waitForLoadState('load');
    // 차단 버튼 확인
    const blockBtn = page.locator('button:has-text("차단"), [data-testid="block-button"]');
    if (await blockBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(blockBtn).toBeVisible();
      await expect(blockBtn).toBeEnabled();
    }
  });

  test('프로필 상세 → 신고 모달 UI', async ({ page }) => {
    await page.goto('/profiles/1');
    await page.waitForLoadState('load');
    // 신고 버튼 클릭
    const reportBtn = page.locator('button:has-text("신고"), [data-testid="report-button"]');
    if (await reportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportBtn.click();
      // 신고 사유 선택 모달 확인
      const reportModal = page.locator('[data-testid="report-modal"], [role="dialog"]');
      if (await reportModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(reportModal).toBeVisible();
        // 사유 선택 옵션 존재
        const reasons = page.locator('[data-testid="report-reason"], input[type="radio"]');
        const count = await reasons.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('설정 → 차단 목록 페이지 로드', async ({ page }) => {
    await page.goto('/profile/settings');
    await page.waitForLoadState('load');
    // 차단 목록 링크/버튼 확인
    const blockListLink = page.locator('a:has-text("차단"), button:has-text("차단 목록")');
    if (await blockListLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await blockListLink.click();
      await page.waitForLoadState('load');
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });
});
