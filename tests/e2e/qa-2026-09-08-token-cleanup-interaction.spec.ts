import { test, expect } from '@playwright/test';

// 디자인 토큰 정리(커밋 3bca037c) 후 stage 에서 실제 조작 증거를 남긴다.
// 렌더 확인이 아니다. 입력하고 누르고 끝까지 굴리고 좁은 폭에서 넘치는지 잰다.
const BASE = process.env.TOKEN_CLEANUP_BASE_URL || 'https://stage.romeoncupid.art';
const PHONES: Record<string, string> = { ipad: '01010000003', 'mobile-safari': '01010000006' };

test('토큰 정리 후 로그인 조작·스크롤·넘침', async ({ page }, testInfo) => {
  const phone = PHONES[testInfo.project.name];
  test.skip(!phone, `엔진 ${testInfo.project.name} 은 이 검사 대상이 아니다`);

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);

  // 1) 실제로 입력한다. 입력칸이 자동 서식을 넣으므로 숫자만 비교한다.
  const tel = page.locator('input[type="tel"]').first();
  await tel.fill(phone);
  const typedDigits = (await tel.inputValue()).replace(/\D/g, '');
  expect(typedDigits, '전화번호 입력이 반영되지 않았다').toBe(phone);

  // 2) 눌러서 다음 단계로 넘어간다.
  await page.getByText('계속하기', { exact: false }).first().click();
  await page.waitForTimeout(3000);
  const otp = page.locator('input[inputmode="numeric"]');
  const n = await otp.count();
  expect(n, '인증번호 입력칸이 나타나지 않았다').toBeGreaterThan(0);
  for (let i = 0; i < n; i++) await otp.nth(i).fill('0');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^로그인$/ }).first().click();
  await page.waitForTimeout(5000);
  await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
  expect(page.url(), '로그인이 되지 않았다').not.toContain('/login');

  // 3) 홈에서 끝까지 굴린다. 모바일 WebKit 은 휠을 지원하지 않아 스크롤 명령을 쓴다.
  await page.waitForTimeout(2000);
  const before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => window.scrollY);
  const metrics = await page.evaluate(() => ({
    scrollHeight: document.body.scrollHeight,
    innerHeight: window.innerHeight,
    overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  }));

  const scrollable = metrics.scrollHeight > metrics.innerHeight + 4;
  console.log(JSON.stringify({ engine: testInfo.project.name, typedDigits,
    loggedIn: !page.url().includes('/login'), before, after, ...metrics, scrollable }));

  // 굴릴 게 있으면 실제로 움직여야 한다.
  if (scrollable) expect(after, '스크롤이 끝까지 가지 않았다').toBeGreaterThan(before);
  expect(metrics.overflowX, '가로로 넘친다').toBe(0);

  // 4) 상세는 긴 화면이다. 여기서 끝까지 굴러가는지 잰다.
  const TARGET: Record<string, number> = { ipad: 20, 'mobile-safari': 23 };
  await page.goto(`${BASE}/profiles/${TARGET[testInfo.project.name]}?source=home`,
    { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  const d0 = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const detail = await page.evaluate(() => ({
    y: window.scrollY,
    scrollHeight: document.body.scrollHeight,
    innerHeight: window.innerHeight,
    overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  }));
  console.log(JSON.stringify({ 상세: testInfo.project.name, 시작: d0, ...detail,
    바닥까지: detail.y + detail.innerHeight >= detail.scrollHeight - 4 }));
  expect(detail.overflowX, '상세가 가로로 넘친다').toBe(0);
  if (detail.scrollHeight > detail.innerHeight + 4) {
    expect(detail.y, '상세 스크롤이 움직이지 않았다').toBeGreaterThan(d0);
  }
});
