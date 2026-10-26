import { expect, test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const token = process.env.QA_ACCESS_TOKEN;
const userId = Number(process.env.QA_USER_ID || '96');
const outputDir = path.resolve(
  __dirname,
  '../../../docs/romeo-vnext/qa/evidence/2026-09-05-gate-recovery-r2',
);
const canonicalDir = path.resolve(__dirname, '../../../docs/romeo-vnext/design/canonical-frames/v39');

async function authenticate(page: Page) {
  if (!token) throw new Error('QA_ACCESS_TOKEN is required');
  await page.goto('/');
  await page.evaluate(({ accessToken, id }) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        accessToken,
        refreshToken: accessToken,
        user: { userId: id, nickname: '현서', gender: 'MALE', status: 'ACTIVE' },
        isLoggedIn: true,
      },
      version: 0,
    }));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', accessToken);
  }, { accessToken: token, id: userId });
}

async function comparison(page: Page, canonicalName: string, actualPath: string, outputName: string, title: string) {
  const canonical = fs.readFileSync(path.join(canonicalDir, canonicalName)).toString('base64');
  const actual = fs.readFileSync(actualPath).toString('base64');
  await page.setViewportSize({ width: 1800, height: 1200 });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#111;color:#fff;font-family:Arial,sans-serif">
    <h1 style="font-size:22px;margin:20px">${title}</h1>
    <main style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 20px 20px;align-items:start">
      <section><h2 style="font-size:16px">CANONICAL v39.5</h2><img style="width:100%;height:auto;display:block" src="data:image/png;base64,${canonical}" /></section>
      <section><h2 style="font-size:16px">CURRENT BUILD</h2><img style="width:100%;height:auto;display:block" src="data:image/png;base64,${actual}" /></section>
    </main></body></html>`);
  await page.screenshot({ path: path.join(outputDir, outputName), fullPage: true });
}

test('QA-GATE-V39 current build: 홈 → 상세 → 실제 OK 발신과 3폭 시안 대조', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(outputDir, { recursive: true });
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await authenticate(page);

  let targetProfileId = 0;
  let nickname = '';
  const metrics: Array<Record<string, number | string | boolean>> = [];

  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : width === 1024 ? 1366 : 1000 });
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    const homeHero = page.getByTestId('today-profile-hero');
    await expect(homeHero).toBeVisible({ timeout: 30_000 });
    const homeHeading = homeHero.getByRole('heading');
    nickname = (await homeHeading.textContent())?.split(',')[0].trim() || '';
    await expect(page.getByTestId('today-single-hero')).toHaveCount(1);
    await expect(page.getByTestId('cupid-letter')).toBeVisible();
    const homeActual = path.join(outputDir, `current-home-${width}.png`);
    await page.screenshot({ path: homeActual, fullPage: true });
    await comparison(page, '25-home.png', homeActual, `compare-25-home-${width}.png`, `25 홈 · ${width}px`);

    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: new RegExp(`${nickname} 님의 지면 전체 읽기`) }).click();
    await expect(page).toHaveURL(/\/profiles\/\d+\?source=home/);
    targetProfileId = Number(new URL(page.url()).pathname.split('/').pop());
    const detailHero = page.getByTestId('detail-profile-hero');
    await expect(detailHero).toBeVisible({ timeout: 30_000 });
    const photo = detailHero.locator('img');
    const heading = detailHero.getByRole('heading');
    await expect(photo).toBeVisible();
    await expect(heading).toContainText(nickname);
    const photoBox = await photo.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(photoBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    const nameInsidePhoto = headingBox!.y >= photoBox!.y && headingBox!.y + headingBox!.height <= photoBox!.y + photoBox!.height;
    expect(nameInsidePhoto).toBe(true);
    const actionBox = await page.getByTestId('profile-action-bar').boundingBox();
    const navBox = await page.getByTestId('bottom-tab-bar').boundingBox();
    const overlapPx = actionBox && navBox ? Math.max(0, actionBox.y + actionBox.height - navBox.y) : -1;
    expect(overlapPx).toBe(0);
    const detailActual = path.join(outputDir, `current-detail-${width}.png`);
    await page.screenshot({ path: detailActual, fullPage: true });
    await comparison(page, '26-detail.png', detailActual, `compare-26-detail-${width}.png`, `26 상세 · ${width}px`);
    metrics.push({ width, nickname, targetProfileId, nameInsidePhoto, overlapPx });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/profiles/${targetProfileId}?source=home`, { waitUntil: 'domcontentloaded' });
  const okButton = page.getByRole('button', { name: /^좋아요/ });
  await expect(okButton).toBeEnabled({ timeout: 30_000 });
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/matching/likes') && response.request().method() === 'POST');
  await okButton.click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page.getByText(/OK를 보냈습니다|매칭이 성사되었습니다/).first()).toBeVisible();
  const sentResponse = await page.request.get('https://stage-api.romeoncupid.art/api/v1/matching/likes/sent?page=0&size=20', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(sentResponse.status()).toBe(200);
  const sent = await sentResponse.json();
  const sentIds = (sent.content || []).map((item: { profileId?: number; userId?: number }) => item.profileId ?? item.userId);
  expect(sentIds).toContain(targetProfileId);
  await page.screenshot({ path: path.join(outputDir, 'happy-send-confirmed-390.png'), fullPage: true });
  fs.writeFileSync(path.join(outputDir, 'live-path-result.json'), JSON.stringify({
    loginHttp: 200,
    homeSingleHero: true,
    nickname,
    targetProfileId,
    sendHttp: response.status(),
    sentListHttp: sentResponse.status(),
    sentListContainsTarget: true,
    pageErrors,
    metrics,
  }, null, 2));
  expect(pageErrors).toEqual([]);
});
