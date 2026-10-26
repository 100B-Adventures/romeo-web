import { test, expect } from '@playwright/test';

test.describe('대시보드 페이지', () => {
  // 비로그인 상태에서는 /login으로 리다이렉트됨
  const DASHBOARD_OR_LOGIN = /\/dashboard|\/login/;

  test('대시보드 메인 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(DASHBOARD_OR_LOGIN);
  });

  test('추천 프로필 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard/profiles');
    await expect(page).toHaveURL(DASHBOARD_OR_LOGIN);
  });

  test('좋아요 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard/likes');
    await expect(page).toHaveURL(DASHBOARD_OR_LOGIN);
  });

  test('매칭 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard/matchings');
    await expect(page).toHaveURL(DASHBOARD_OR_LOGIN);
  });

  test('알림 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).toHaveURL(DASHBOARD_OR_LOGIN);
  });

  test('결제 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard/payment');
    await expect(page).toHaveURL(DASHBOARD_OR_LOGIN);
  });
});
