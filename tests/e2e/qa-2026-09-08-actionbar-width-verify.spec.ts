import { test, expect } from '@playwright/test';
import fs from 'fs';

// 2026-09-08 재판정: 2026-09-07 gate6 캡처의 1024/1440 겹침측정이 뷰포트 폭을 실제로
// 바꾸지 않은 채(viewportHeight 900 고정, width 미기록) 390과 동일값을 낸 것으로 의심되어
// 실제 setViewportSize로 폭을 명시 적용하고 actionBar/tabbar의 width까지 함께 재측정한다.
test('actionBar/tabbar 폭·겹침 1024·1440 재실측', async ({ page }) => {
  test.setTimeout(120000);
  const EVIDENCE_DIR = 'docs/romeo-vnext/qa/evidence/2026-09-08-width-verify';
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('https://stage.romeoncupid.art/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.locator('input[type="tel"]').first().fill('01010000002');
  await page.getByText('계속하기', { exact: false }).first().click();
  await page.waitForTimeout(3000);
  const otp = page.locator('input[inputmode="numeric"]');
  const n = await otp.count();
  for (let i = 0; i < n; i++) await otp.nth(i).fill('0');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^로그인$/ }).first().click();
  await page.waitForTimeout(5000);
  const loggedIn = !page.url().includes('/login');

  const results: Record<string, unknown> = { loggedIn };

  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('https://stage.romeoncupid.art/profiles/19?source=home', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${EVIDENCE_DIR}/detail-${width}.png`, fullPage: true });
    const m = await page.evaluate(() => {
      const d = document.documentElement;
      const nav = document.querySelector('.fixed.bottom-0, nav') as HTMLElement | null;
      const navRect = nav ? nav.getBoundingClientRect() : null;
      const bar = document.querySelector('[class*="actionBar"]') as HTMLElement | null;
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const barStyle = bar ? getComputedStyle(bar).position : null;
      const overlap = (navRect && barRect && barRect.bottom > navRect.top) ? barRect.bottom - navRect.top : 0;
      return {
        vw: window.innerWidth,
        overflowX: d.scrollWidth - d.clientWidth,
        navRect: navRect ? { top: Math.round(navRect.top), width: Math.round(navRect.width) } : null,
        barRect: barRect ? { bottom: Math.round(barRect.bottom), width: Math.round(barRect.width) } : null,
        barPosition: barStyle,
        overlap,
      };
    });
    results[`width-${width}`] = m;
  }

  fs.writeFileSync(`${EVIDENCE_DIR}/result.json`, JSON.stringify(results, null, 2));
  console.log('RESULT', JSON.stringify(results));
  expect(loggedIn).toBeTruthy();
});
