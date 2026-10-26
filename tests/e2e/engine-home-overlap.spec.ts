import { test, expect } from '@playwright/test';

// 로그인 후 홈·상세에서 행동 버튼과 하단 탭바 겹침을 엔진별로 잰다.
// 엔진마다 반올림이 달라 크롬에서 0이어도 다른 엔진에서 1일 수 있다(로그인 전 화면에서 실측된 현상).
// 저장소에 토큰을 심는 방식은 앱이 안 받아들여 /login 으로 튕긴다 — 실제 로그인 화면을 통과한다.
test('엔진별 상세 화면 행동 버튼과 탭바 겹침', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.goto('https://stage.romeoncupid.art/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);

  // 인증번호는 번호당 한 시간에 5회 제한이다(실측: AUTH_002).
  // 엔진이 6개라 한 번호로 돌리면 제한을 넘겨 로그인 화면에 머문다.
  // 그래서 엔진마다 다른 검증 번호를 쓴다.
  const PHONES: Record<string, string> = {
    desktop: '01010000001', ipad: '01010000003', firefox: '01010000011',
    webkit: '01010000012', 'mobile-safari': '01010000013', 'mobile-chrome': '01010000014',
  };
  const phone = PHONES[testInfo.project.name] || '01010000081';
  await page.locator('input[type="tel"]').first().fill(phone);
  await page.getByText('계속하기', { exact: false }).first().click();
  await page.waitForTimeout(3000);

  const otp = page.locator('input[inputmode="numeric"]');
  const n = await otp.count();
  for (let i = 0; i < n; i++) await otp.nth(i).fill('0');
  await page.waitForTimeout(1500);
  // 6칸을 채워도 자동 제출되지 않는다. "로그인" 버튼을 눌러야 한다(실측).
  await page.getByRole('button', { name: /^로그인$/ }).first().click();
  await page.waitForTimeout(5000);

  await page.goto('https://stage.romeoncupid.art/profiles/27?source=home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const m = await page.evaluate(() => {
    const d = document.documentElement;
    const nav = document.querySelector('.fixed.bottom-0, nav');
    const navTop = nav ? Math.round(nav.getBoundingClientRect().top) : -1;
    const bar = document.querySelector('[class*="actionBar"]');
    const barBottom = bar ? Math.round(bar.getBoundingClientRect().bottom) : -1;
    const overlap = (navTop > 0 && barBottom > navTop) ? barBottom - navTop : 0;
    return { path: location.pathname, overflowX: d.scrollWidth - d.clientWidth, navTop, barBottom, overlap };
  });
  console.log(`RESULT [${testInfo.project.name}] 경로=${m.path} 넘침=${m.overflowX} 탭바상단=${m.navTop} 행동바하단=${m.barBottom} 겹침=${m.overlap}px`);
  expect(m.overflowX).toBe(0);
});
