// v39.5 회귀: 커뮤니티는 복원하고 폐기된 /live, /meeting만 /home으로 보낸다.

import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('R21-REDIR: Web 폐기 페이지 redirect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('R21-REDIR-01: /live → /home (Apple 4.3(b) 회피)', async ({ page }) => {
    await page.goto('/live');
    await expect(page).toHaveURL(/\/home$/);
  });

  test('R21-REDIR-02: /meeting → /home', async ({ page }) => {
    await page.goto('/meeting');
    await expect(page).toHaveURL(/\/home$/);
  });
});

test.describe('R21-RES: 잔해 키워드 UI 노출 0건 (Apple 4.3b 안전)', () => {
  test('랜딩 페이지에 "12명 심사위원" 노출 없음', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toContainText('12명의 큐피트');
    await expect(page.locator('body')).not.toContainText('12명의 여성 심사위원');
    await expect(page.locator('body')).not.toContainText('심사위원 자격 부여');
  });

  test('랜딩 메타 description에 "강남 프리미엄" 노출 없음', async ({ page }) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).not.toContain('강남 프리미엄');
    expect(desc).toContain('Cupid');
  });
});
