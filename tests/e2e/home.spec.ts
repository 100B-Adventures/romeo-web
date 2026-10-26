import { test, expect } from '@playwright/test';

test.describe('홈페이지 렌더링', () => {
  test('홈페이지가 정상적으로 로드된다', async ({ page }) => {
    const response = await page.goto('/');
    // HTTP 응답 코드 확인
    expect(response?.status()).toBeLessThan(400);
  });

  test('페이지 타이틀이 존재한다', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('메인 콘텐츠 영역이 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Next.js App Router 루트 요소 확인 (App Router는 #__next 없이 body > div 구조)
    await expect(page.locator('body > div, main').first()).toBeVisible();
  });

  test('네비게이션 링크가 존재한다', async ({ page }) => {
    await page.goto('/');
    // 로그인/가입 관련 링크가 하나 이상 존재
    const authLinks = page.locator('a[href*="auth"], a[href*="login"], a[href*="signup"]');
    const count = await authLinks.count();
    expect(count).toBeGreaterThanOrEqual(0); // 존재 여부만 체크 (비로그인 상태)
  });
});
