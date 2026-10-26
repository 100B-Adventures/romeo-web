import { test, expect, request, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const WEB = process.env.QA_WEB_URL || 'https://stage.romeoncupid.art';
const API = 'https://stage-api.romeoncupid.art/api/v1';
const PHONE = process.env.QA_PHONE || '01010000081';
const OTP = '000000';
const OUT = path.resolve(
  __dirname,
  process.env.QA_EVIDENCE_DIR || '../../../docs/romeo-vnext/qa/evidence/2026-09-04-gate5',
);

type Login = { accessToken: string; refreshToken?: string; userId: number; gender?: 'MALE' | 'FEMALE' };

async function login(): Promise<Login> {
  const api = await request.newContext();
  const requested = await api.post(`${API}/auth/phone/request`, {
    data: { phoneNumber: PHONE, purpose: 'LOGIN' },
  });
  expect(requested.status()).toBe(200);
  const verified = await api.post(`${API}/auth/phone/verify`, {
    data: { phoneNumber: PHONE, otp: OTP, purpose: 'LOGIN' },
  });
  expect(verified.status()).toBe(200);
  const response = await api.post(`${API}/auth/login`, {
    data: { phoneNumber: PHONE, verificationCode: OTP },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  await api.dispose();
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    userId: body.userId,
    gender: body.gender,
  };
}

async function authenticate(page: Page, auth: Login) {
  await page.goto(WEB, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, refreshToken, userId, gender }) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        accessToken: token,
        refreshToken: refreshToken || token,
        user: { userId, nickname: '현서', gender: gender || 'MALE', status: 'ACTIVE' },
        isLoggedIn: true,
      },
      version: 0,
    }));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken || token);
  }, { token: auth.accessToken, refreshToken: auth.refreshToken, userId: auth.userId, gender: auth.gender });
}

test.describe.serial('Romeo vNext QA 관문 5종 stage 실화면', () => {
  test.setTimeout(120_000);
  let auth: Login;

  test.beforeAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    auth = await login();
  });

  for (const viewport of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-1024', width: 1024, height: 1366 },
    { name: 'desktop-1440', width: 1440, height: 1000 },
  ]) {
    test(`3폭 ${viewport.name}: 오늘의 추천 렌더와 가로 넘침 0`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await authenticate(page, auth);
      await page.goto(`${WEB}/home`, { waitUntil: 'load' });
      // 홈은 오늘의 한 분 단일 큐레이션 지면이다(기획 2026-06-05 결정, design-spec-v39.md 25 홈).
      // 예전 단언은 '소개' 라는 글자가 홈에 단독으로 있다고 봤는데 그런 요소는 없다.
      // 시안이 홈에서 보여주기로 한 것은 큐레이션 지면 자체이므로 그것을 확인한다.
      await expect(page.getByTestId('home-single-curation')).toBeVisible();
      // 홈이 제공하는 행동은 OK 와 슈퍼 OK 다(TodayHeroCard.tsx:44-45, design-spec-v39.md 25 홈).
      // 예전 단언은 제목을 품은 단추를 찾았는데 그건 개편 전 카드 목록의 구조다.
      await expect(page.getByRole('button', { name: /^OK/ }).first()).toBeVisible();
      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));
      expect(overflow.document).toBeLessThanOrEqual(0);
      expect(overflow.body).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
      await page.screenshot({ path: path.join(OUT, `responsive-${viewport.name}.png`), fullPage: true });
    });
  }

  test('정상 경로: 로그인 상태에서 오늘의 인물을 열고 OK를 실제 발신한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await authenticate(page, auth);
    await page.goto(`${WEB}/home`, { waitUntil: 'load' });
    const profileCard = page.locator('main').getByRole('button').filter({ has: page.locator('h3') }).first();
    await expect(profileCard).toBeVisible();
    const nickname = (await profileCard.locator('h3').textContent())?.trim() || '';
    await profileCard.click();
    await expect(page).toHaveURL(/\/profiles\/\d+$/);
    await expect(page.getByRole('heading', { name: nickname })).toBeVisible();
    const targetProfileId = Number(page.url().split('/').pop());
    const okButton = page.getByRole('button', { name: /^좋아요/ });
    await expect(okButton).toBeEnabled();
    const actionBox = await okButton.boundingBox();
    const navBox = await page.locator('nav.fixed.bottom-0').boundingBox();
    const overlapPx = actionBox && navBox ? Math.max(0, actionBox.y + actionBox.height - navBox.y) : -1;
    if (overlapPx > 0) {
      await page.screenshot({ path: path.join(OUT, 'happy-send-blocked-mobile-390.png'), fullPage: false });
      fs.writeFileSync(path.join(OUT, 'happy-send-blocked-result.json'), JSON.stringify({
        loginHttp: 200,
        homeRendered: true,
        nickname,
        targetProfileId,
        actionButtonBottom: actionBox!.y + actionBox!.height,
        bottomNavTop: navBox!.y,
        overlapPx,
        sendRequestObserved: false,
        pageErrors: errors.length,
      }, null, 2));
    }
    expect(overlapPx, '하단 내비게이션이 좋아요 버튼을 덮으면 실제 발신할 수 없다').toBe(0);
    const sent = page.waitForResponse((response) =>
      response.url().endsWith('/api/v1/matching/likes') && response.request().method() === 'POST');
    await okButton.click();
    const response = await sent;
    expect(response.status()).toBe(200);
    const body = await response.json();
    await expect(page.getByText(/OK를 보냈습니다|매칭/).first()).toBeVisible();
    expect(errors).toEqual([]);
    await page.screenshot({ path: path.join(OUT, 'happy-send-mobile-390.png'), fullPage: true });
    fs.writeFileSync(path.join(OUT, 'happy-send-result.json'), JSON.stringify({
      loginHttp: 200,
      homeRendered: true,
      nickname,
      targetProfileId,
      sendHttp: response.status(),
      matched: Boolean(body.matched),
      pageErrors: errors.length,
    }, null, 2));
  });
});
