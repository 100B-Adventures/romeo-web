import { expect, request, test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const WEB = process.env.QA_WEB_URL || 'https://stage.romeoncupid.art';
const API = 'https://stage-api.romeoncupid.art/api/v1';
const PHONE = process.env.QA_PHONE || '01010000081';
const OTP = '000000';
const OUT = path.resolve(
  __dirname,
  process.env.QA_EVIDENCE_DIR || '../../../docs/romeo-vnext/qa/evidence/2026-09-05-happy-send-single-run',
);

type Login = {
  accessToken: string;
  refreshToken?: string;
  userId: number;
  gender?: 'MALE' | 'FEMALE';
};

type Evidence = {
  startedAt: string;
  webUrl: string;
  phoneRequestHttp?: number;
  phoneVerifyHttp?: number;
  loginHttp?: number;
  homeSingleHero?: boolean;
  detailUrl?: string;
  targetProfileId?: number;
  actionBarBottom?: number;
  bottomTabTop?: number;
  overlapPx?: number;
  actionHitTarget?: string | null;
  sendHttp?: number;
  sendBody?: unknown;
  sendUiConfirmed?: boolean;
  sentListHttp?: number;
  sentListContainsTarget?: boolean;
  nextAssetUrls?: string[];
  pageErrors: string[];
  finishedAt?: string;
  failure?: string;
};

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

test('QA-GATE-E2E-HAPPY: 로그인부터 실제 발신과 발신함까지 한 실행', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(OUT, { recursive: true });
  const evidence: Evidence = {
    startedAt: new Date().toISOString(),
    webUrl: WEB,
    pageErrors: [],
  };
  const writeEvidence = () => {
    fs.writeFileSync(path.join(OUT, 'happy-send-single-run.json'), JSON.stringify(evidence, null, 2));
  };
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));

  try {
    const api = await request.newContext();
    if (!process.env.QA_REUSE_VERIFIED_OTP) {
      const requested = await api.post(`${API}/auth/phone/request`, {
        data: { phoneNumber: PHONE, purpose: 'LOGIN' },
      });
      evidence.phoneRequestHttp = requested.status();
      expect(requested.status()).toBe(200);

      const verified = await api.post(`${API}/auth/phone/verify`, {
        data: { phoneNumber: PHONE, otp: OTP, purpose: 'LOGIN' },
      });
      evidence.phoneVerifyHttp = verified.status();
      expect(verified.status()).toBe(200);
    }

    const loggedIn = await api.post(`${API}/auth/login`, {
      data: { phoneNumber: PHONE, verificationCode: OTP },
    });
    evidence.loginHttp = loggedIn.status();
    expect(loggedIn.status()).toBe(200);
    const auth = await loggedIn.json() as Login;
    await api.dispose();

    await page.setViewportSize({ width: 390, height: 844 });
    await authenticate(page, auth);
    await page.goto(`${WEB}/home`, { waitUntil: 'domcontentloaded' });
    const hero = page.getByTestId('today-profile-hero');
    await expect(hero).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('today-single-hero')).toHaveCount(1);
    evidence.homeSingleHero = true;
    evidence.nextAssetUrls = await page.locator('script[src*="/_next/"]').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLScriptElement).src).sort(),
    );
    await page.screenshot({ path: path.join(OUT, '01-home-390.png'), fullPage: true });

    const heading = (await hero.getByRole('heading').textContent()) || '';
    const nickname = heading.split(',')[0].trim();
    await page.getByRole('button', { name: new RegExp(`${nickname} 님의 지면 전체 읽기`) }).click();
    await expect(page).toHaveURL(/\/profiles\/\d+\?source=home/);
    evidence.detailUrl = page.url();
    evidence.targetProfileId = Number(new URL(page.url()).pathname.split('/').pop());
    await expect(page.getByTestId('detail-profile-hero')).toBeVisible({ timeout: 30_000 });

    const actionBar = page.getByTestId('profile-action-bar');
    const bottomTab = page.getByTestId('bottom-tab-bar');
    const actionBox = await actionBar.boundingBox();
    const tabBox = await bottomTab.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(tabBox).not.toBeNull();
    evidence.actionBarBottom = actionBox!.y + actionBox!.height;
    evidence.bottomTabTop = tabBox!.y;
    evidence.overlapPx = Math.max(0, evidence.actionBarBottom - evidence.bottomTabTop);

    const okButton = page.getByRole('button', { name: /^좋아요/ });
    await expect(okButton).toBeEnabled({ timeout: 30_000 });
    const okBox = await okButton.boundingBox();
    expect(okBox).not.toBeNull();
    evidence.actionHitTarget = await page.evaluate(({ x, y }) => {
      const node = document.elementFromPoint(x, y);
      return node?.closest('button')?.textContent?.trim() || node?.tagName || null;
    }, { x: okBox!.x + okBox!.width / 2, y: okBox!.y + okBox!.height / 2 });
    await page.screenshot({ path: path.join(OUT, '02-detail-overlap-zero-390.png'), fullPage: false });

    const sendResponsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/v1/matching/likes') && response.request().method() === 'POST',
    );
    await okButton.click();
    const sendResponse = await sendResponsePromise;
    evidence.sendHttp = sendResponse.status();
    evidence.sendBody = await sendResponse.json().catch(() => null);
    await page.waitForURL((url) =>
      url.pathname === '/ok-sent' || url.pathname.startsWith('/matchings/'),
    { timeout: 10_000 }).catch(() => undefined);
    const okSentConfirmed = await page.getByTestId('ok-sent-screen')
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    const matchedConfirmed = await page.getByText(/매칭이 성사되었습니다/).first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    evidence.sendUiConfirmed = okSentConfirmed || matchedConfirmed;

    const sentResponse = await page.request.get(`${API}/matching/likes/sent?page=0&size=20`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    evidence.sentListHttp = sentResponse.status();
    const sent = await sentResponse.json();
    const sentIds = (sent.content || []).map((item: { profileId?: number; userId?: number }) =>
      item.profileId ?? item.userId,
    );
    evidence.sentListContainsTarget = sentIds.includes(evidence.targetProfileId);
    await page.screenshot({ path: path.join(OUT, '03-send-confirmed-390.png'), fullPage: true });

    expect(evidence.overlapPx, '행동 바와 하단 탭바는 0px 겹쳐야 한다').toBe(0);
    expect(evidence.actionHitTarget).toContain('OK');
    expect(evidence.sendHttp, 'POST /matching/likes는 성공해야 한다').toBe(200);
    expect(evidence.sendUiConfirmed, '발신 완료 UI가 보여야 한다').toBe(true);
    expect(evidence.sentListHttp, '발신함 조회는 성공해야 한다').toBe(200);
    expect(evidence.sentListContainsTarget, '발신 대상이 발신함에 있어야 한다').toBe(true);
    expect(evidence.pageErrors).toEqual([]);
  } catch (error) {
    evidence.failure = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    evidence.finishedAt = new Date().toISOString();
    writeEvidence();
  }
});
