import { expect, test } from '@playwright/test';
import path from 'node:path';

test.use({ viewport: { width: 390, height: 844 } });

test('승인 빈 홈 typography와 한글 단어 줄바꿈을 390x844로 캡처한다', async ({ page }) => {
  test.setTimeout(300_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.addInitScript(() => {
    const state = {
      state: {
        accessToken: 'visual-access',
        refreshToken: 'visual-refresh',
        user: { userId: 42, nickname: '정오', gender: 'MALE', status: 'ACTIVE', role: 'USER' },
        isLoggedIn: true,
        authGeneration: 1,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(state));
    localStorage.setItem('accessToken', 'visual-access');
    localStorage.setItem('refreshToken', 'visual-refresh');
  });

  await page.route('**/api/v1/hearts/balance*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ balance: 42 }),
  }));
  await page.route('**/api/v1/recommendations/today*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      currentSlot: '12',
      nextSlot: null,
      nextSlotTime: null,
      hasActiveMatching: false,
      slots: [],
      expiredCount: 0,
      pendingCount: 0,
      adultDeclarationRequired: false,
      emptyReason: 'MALE_VERIFICATION_REQUIRED',
    }),
  }));

  await page.goto('/home?aiConsentFallback=rules', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('home-empty')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('header-heart-balance')).toHaveText('42', { timeout: 90_000 });

  const headline = page.getByRole('heading', { level: 1 });
  const emphasis = headline.locator('em');
  await expect(headline).toHaveCSS('font-family', /Noto_Serif_KR/);
  await expect(headline).toHaveCSS('font-weight', '400');
  await expect(emphasis).toHaveCSS('font-style', 'normal');
  await expect(page.locator('[class*="noticeBody"]')).toHaveCSS('font-size', '12.5px');
  await expect(page.locator('[class*="editorBody"]')).toHaveCSS('font-size', '16px');
  await expect(page.locator('[class*="editorBody"]')).toHaveCSS('word-break', 'keep-all');

  await page.screenshot({
    path: path.resolve(__dirname, '../../docs/plan/romeo-vnext/review/empty-reason-visual-20261014/dev-home-verification-required-390x844-r3.png'),
  });
  expect(consoleErrors).toEqual([]);
});
