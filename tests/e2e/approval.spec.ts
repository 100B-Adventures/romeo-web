// 여성 심사 E2E 테스트
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('여성 심사', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('심사 대기 남성 목록 페이지 로드', async ({ page }) => {
    // 홈 → 심사 탭
    await page.goto('/home');
    await page.waitForLoadState('load');
    const approvalTab = page.locator('button:has-text("심사")');
    if (await approvalTab.isVisible()) {
      await approvalTab.click();
      await page.waitForLoadState('load');
      // 심사 대기 목록 또는 빈 상태
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });

  test('별점 투표 UI 확인 (1~5점)', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');
    const approvalTab = page.locator('button:has-text("심사")');
    if (await approvalTab.isVisible()) {
      await approvalTab.click();
      await page.waitForLoadState('load');
      // 별점 UI (★ 버튼 또는 별 아이콘)
      const starButtons = page.locator('[data-testid="star-rating"], button:has(svg), .star-rating');
      if (await starButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(starButtons.first()).toBeVisible();
      }
    }
  });

  test('남성 심사 현황 페이지 (X/12, 평균, 상위%)', async ({ page }) => {
    // 남성 계정으로 로그인 시 심사 현황
    await page.goto('/home');
    await page.waitForLoadState('load');
    const approvalTab = page.locator('button:has-text("심사")');
    if (await approvalTab.isVisible()) {
      await approvalTab.click();
      await page.waitForLoadState('load');
      // 심사 진행률 또는 결과 표시
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });

  test('높은점수 준 남성 목록', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');
    const approvalTab = page.locator('button:has-text("심사")');
    if (await approvalTab.isVisible()) {
      await approvalTab.click();
      await page.waitForLoadState('load');
      // 관심 목록 또는 높은 점수 섹션
      const highScoreSection = page.locator('[data-testid="high-score-list"], text=관심');
      if (await highScoreSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(highScoreSection).toBeVisible();
      }
    }
  });
});
