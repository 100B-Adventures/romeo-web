import { test, expect } from '@playwright/test';
import fs from 'fs';

// ASO 심사 스크린샷 자동 캡처 (stage 웹, 6.9" 폰 뷰포트 = 1290×2796)
// 웹·모바일 100% parity → iOS 앱 화면과 동일 UI. 최종 ASC 업로드 전 회장 검토용.
// 출력: docs/aso-screenshots/*.png
// 로그인은 stage API 직접 호출(otp 필드 — 기존 fixture는 code 필드라 깨짐)

const OUT = '../docs/aso-screenshots';
const API = process.env.E2E_API_URL || 'https://stage-api.romeoncupid.art/api/v1';
const PHONE = process.env.ASO_PHONE || '01010000001';

test.use({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
test.setTimeout(60000);

test.beforeAll(() => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
});

async function shoot(page: any, name: string) {
  await page.waitForTimeout(2800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

// stage API로 실제 토큰 발급 (request → verify otp → login)
async function realLogin(page: any): Promise<{ token: string; userId: number }> {
  await page.request.post(`${API}/auth/phone/request`, { data: { phoneNumber: PHONE, purpose: 'LOGIN' } });
  await page.request.post(`${API}/auth/phone/verify`, { data: { phoneNumber: PHONE, otp: '000000', purpose: 'LOGIN' } });
  const res = await page.request.post(`${API}/auth/login`, { data: { phoneNumber: PHONE } });
  const d = await res.json();
  const token = d.accessToken || d.data?.accessToken || '';
  // JWT sub = userId
  let userId = d.userId || d.data?.userId || 0;
  if (!userId && token) {
    try { userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub * 1; } catch {}
  }
  return { token, userId };
}

test('01 랜딩 (로그아웃)', async ({ page }) => {
  await page.goto('/');
  await shoot(page, '01-landing');
});

test('02~ 로그인 화면들', async ({ page }) => {
  await page.goto('/');
  const { token, userId } = await realLogin(page);
  expect(token, '실 토큰 발급 실패').not.toBe('');
  console.log(`[aso] login token len=${token.length} userId=${userId}`);

  await page.evaluate(({ token, uid }) => {
    const authState = {
      // 01010000001 = 시드상 FEMALE(강남의여왕). 추천 카드는 API(실 DB gender) 기반이라 무관하나, mock gender 불일치가 동성노출 오인을 부르므로 실 gender로 맞춤.
      state: { accessToken: token, refreshToken: token, user: { userId: uid, nickname: '데모', gender: 'FEMALE', status: 'ACTIVE' }, isLoggedIn: true },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(authState));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', token);
  }, { token, uid: userId });

  const screens: [string, string][] = [
    ['/home', '02-today-one-person'],
    ['/profile/verification', '03-verification'],
    ['/profile', '04-profile'],
    ['/history', '05-history'],
    ['/more', '06-more'],
  ];

  for (const [route, name] of screens) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await shoot(page, name);
      console.log(`[aso] ${route} → ${page.url()}`);
    } catch (e) {
      console.log(`[skip] ${route}: ${(e as Error).message}`);
    }
  }
});
