import { test, expect } from '@playwright/test';

// 2026-09-06: 엔진마다 반올림이 달라 겹침이 다르게 나타나는지 확인한다.
// 겹침 1px 문제가 실제로 있었고, iOS 사용자는 전부 WebKit 계열이라 그 화면을 봐야 한다.
test('엔진별 로그인 화면 넘침', async ({ page }, testInfo) => {
  await page.goto('https://stage.romeoncupid.art/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => {
    const d = document.documentElement;
    return { overflowX: d.scrollWidth - d.clientWidth, w: d.clientWidth, h: d.clientHeight };
  });
  console.log(`RESULT [${testInfo.project.name}] 가로넘침=${m.overflowX}px 창=${m.w}x${m.h}`);
  expect(m.overflowX).toBe(0);
});
