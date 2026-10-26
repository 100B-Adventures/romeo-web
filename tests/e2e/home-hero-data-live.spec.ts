import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const accessToken = process.env.QA_ACCESS_TOKEN;
const userId = Number(process.env.QA_USER_ID || '96');
const evidenceDir = path.resolve(__dirname, '../../test-results/home-hero-data');

test('ROMEO-HOME-HERO-DATA-03 정상 경로: 390폭 실 API 홈에 사진과 숫자 하트가 렌더된다', async ({ page }) => {
  test.skip(!accessToken, 'stage 일반회원 QA_ACCESS_TOKEN이 필요합니다.');
  fs.mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(({ token, id }) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        accessToken: token,
        refreshToken: token,
        user: { userId: id, nickname: '현서', gender: 'MALE', status: 'ACTIVE' },
        isLoggedIn: true,
      },
      version: 0,
    }));
    localStorage.setItem('accessToken', token!);
    localStorage.setItem('refreshToken', token!);
  }, { token: accessToken, id: userId });

  await page.goto('/home', { waitUntil: 'domcontentloaded' });

  const hero = page.getByTestId('today-profile-hero');
  await expect(hero).toBeVisible({ timeout: 30_000 });
  const portrait = hero.locator('img');
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await portrait.evaluate(async (image) => {
    await image.decode();
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });

  const photoUrl = await portrait.getAttribute('src');
  expect(photoUrl).toMatch(/^https:\/\//);

  const heartBalance = page.getByTestId('header-heart-balance');
  await expect(heartBalance).toHaveText(/^\d{1,3}(,\d{3})*$/, { timeout: 30_000 });

  await page.screenshot({
    path: path.join(evidenceDir, 'home-390-after.png'),
    fullPage: false,
  });
});
