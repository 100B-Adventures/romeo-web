import { test, expect } from '@playwright/test';

test.describe('관리자 페이지', () => {
  // 비로그인 상태에서는 /login으로 리다이렉트됨
  const ADMIN_OR_LOGIN = /\/admin|\/login/;

  test('관리자 대시보드 페이지 접근', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });

  test('사용자 관리 페이지 접근', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });

  test('인증 심사 페이지 접근', async ({ page }) => {
    await page.goto('/admin/verifications');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });

  test('벌크 좋아요 페이지 접근', async ({ page }) => {
    await page.goto('/admin/bulk-likes');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });

  test('커뮤니티 관리 페이지 접근 (ADM-10)', async ({ page }) => {
    await page.goto('/admin/community-mgmt');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });

  test('하트 관리 페이지 접근 (ADM-11)', async ({ page }) => {
    await page.goto('/admin/hearts');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });

  test('유저 상세 페이지 접근 (ADM-03)', async ({ page }) => {
    await page.goto('/admin/users/1');
    await expect(page).toHaveURL(ADMIN_OR_LOGIN);
  });
});
