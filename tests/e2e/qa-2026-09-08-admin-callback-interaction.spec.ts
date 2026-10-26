import { test, expect } from '@playwright/test';

// 토큰 정리로 건드린 나머지 두 화면(관리자 지면, 결제 콜백)을 실제로 눌러 확인한다.
const BASE = process.env.TOKEN_CLEANUP_BASE_URL || 'https://stage.romeoncupid.art';
const ADMIN = '01010000001';

async function login(page: any, phone: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.locator('input[type="tel"]').first().fill(phone);
  await page.getByText('계속하기', { exact: false }).first().click();
  await page.waitForTimeout(3000);
  const otp = page.locator('input[inputmode="numeric"]');
  const n = await otp.count();
  for (let i = 0; i < n; i++) await otp.nth(i).fill('0');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^로그인$/ }).first().click();
  await page.waitForTimeout(5000);
}

test('관리자 지면: 로그인 후 들어가 내용이 뜨고 굴러가고 안 넘친다', async ({ page }) => {
  await login(page, ADMIN);
  expect(page.url(), '관리자 로그인 실패').not.toContain('/login');

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  const m = await page.evaluate(() => ({
    y: window.scrollY, scrollHeight: document.body.scrollHeight, innerHeight: window.innerHeight,
    overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    bg: getComputedStyle(document.body).backgroundColor,
  }));
  console.log(JSON.stringify({ 화면: '관리자', 글자수: text.length, 앞부분: text.slice(0, 60), ...m }));
  expect(text.length, '관리자 지면이 비어 있다').toBeGreaterThan(20);
  expect(m.overflowX, '관리자 지면이 가로로 넘친다').toBe(0);
});

test('결제 콜백 지면: 상태값을 받아 내용이 뜨고 안 넘친다', async ({ page }) => {
  for (const status of ['success', 'fail']) {
    await page.goto(`${BASE}/payment/mobile-callback?status=${status}`,
      { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
    const m = await page.evaluate(() => ({
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      color: getComputedStyle(document.body).color,
    }));
    console.log(JSON.stringify({ 화면: `콜백 ${status}`, 글자수: text.length, 앞부분: text.slice(0, 60), ...m }));
    expect(text.length, `콜백(${status}) 지면이 비어 있다`).toBeGreaterThan(2);
    expect(m.overflowX, `콜백(${status})이 가로로 넘친다`).toBe(0);
  }
});
