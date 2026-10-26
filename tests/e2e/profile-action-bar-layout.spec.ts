import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const evidenceDir = path.resolve(__dirname, '../../test-results/profile-action-bar');

const profile = {
  profileId: 77,
  userId: 77,
  nickname: '하단 고정대 검증',
  birthYear: 1997,
  age: 29,
  gender: 'FEMALE',
  location: '서울',
  photoUrls: [],
  verified: false,
  alreadyLiked: false,
  receivedLike: false,
};

const pricing = {
  tier: 'BASE',
  gender: 'MALE',
  okSendCost: 10,
  superOkSendCost: 20,
  acceptCost: 0,
  pricingVersion: 'v1',
};

test.describe('QA-GATE-E2E-HAPPY 하단 고정대 회귀', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/profiles/77', (route) => route.fulfill({ json: profile }));
    await page.route('**/api/v1/me/pricing', (route) => route.fulfill({ json: pricing }));
    await page.route('**/api/v1/matching/likes', (route) => route.fulfill({
      json: {
        likeId: 1,
        fromProfileId: 1,
        toProfileId: 77,
        likeType: 'OK',
        matched: false,
      },
    }));

    await page.addInitScript(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          accessToken: 'layout-test-token',
          refreshToken: 'layout-test-refresh-token',
          user: {
            userId: 1,
            nickname: '검증 회원',
            gender: 'MALE',
            status: 'ACTIVE',
          },
          isLoggedIn: true,
        },
        version: 0,
      }));
      localStorage.setItem('accessToken', 'layout-test-token');
      localStorage.setItem('refreshToken', 'layout-test-refresh-token');
    });
  });

  for (const viewport of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-1024', width: 1024, height: 1366 },
    { name: 'desktop-1440', width: 1440, height: 1000 },
  ]) {
    test(`QA-GATE-LAYOUT-01 ${viewport.width}px에서 행동 버튼과 탭바가 겹치지 않는다`, async ({ page }) => {
      fs.mkdirSync(evidenceDir, { recursive: true });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/profiles/77');

      const actionBar = page.getByTestId('profile-action-bar');
      const bottomTabBar = page.getByTestId('bottom-tab-bar');
      const okButton = page.getByRole('button', { name: '좋아요 (♥10)' });
      await expect(actionBar).toBeVisible();
      await expect(bottomTabBar).toBeVisible();
      await expect(okButton).toBeEnabled();

      const actionBarBox = await actionBar.boundingBox();
      const navBox = await bottomTabBar.boundingBox();
      expect(actionBarBox).not.toBeNull();
      expect(navBox).not.toBeNull();

      const actionBarBottom = actionBarBox!.y + actionBarBox!.height;
      const bottomNavTop = navBox!.y;
      const boundaryDeltaPx = actionBarBottom - bottomNavTop;
      const overlapPx = Math.max(0, boundaryDeltaPx);
      expect(overlapPx, `${viewport.width}px 행동 바와 탭바 겹침`).toBe(0);

      await page.screenshot({
        path: path.join(evidenceDir, `${viewport.name}.png`),
        fullPage: false,
      });
      fs.writeFileSync(path.join(evidenceDir, `${viewport.name}.json`), JSON.stringify({
        width: viewport.width,
        actionBarBottom,
        bottomNavTop,
        boundaryDeltaPx,
        overlapPx,
      }, null, 2));
    });
  }

  test('QA-GATE-LAYOUT-02 행동 버튼 클릭은 탭바에 막히지 않고 발신 API를 호출한다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profiles/77');

    const sent = page.waitForRequest((request) =>
      request.url().endsWith('/api/v1/matching/likes') && request.method() === 'POST');
    await page.getByRole('button', { name: '좋아요 (♥10)' }).click();
    await sent;
    await expect(page.getByText('OK를 보냈습니다')).toBeVisible();
  });
});
