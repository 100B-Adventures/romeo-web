import { test, expect } from '@playwright/test';

// 하단 고정대 겹침은 엔진마다 반올림이 달라 다르게 나타날 수 있다.
// 로그인 전 화면에서 잴 수 있는 하단 요소의 경계를 엔진별로 기록한다.
test('엔진별 하단 요소 경계와 넘침', async ({ page }, testInfo) => {
  await page.goto('https://stage.romeoncupid.art/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => {
    const d = document.documentElement;
    const els = Array.from(document.querySelectorAll('button, [role=button], a'));
    const bottoms = els.map(e => { const r = e.getBoundingClientRect(); return { b: Math.round(r.bottom), h: Math.round(r.height) }; })
                       .filter(x => x.h > 0);
    const maxBottom = bottoms.length ? Math.max(...bottoms.map(x => x.b)) : -1;
    return { overflowX: d.scrollWidth - d.clientWidth, viewportH: d.clientHeight, maxBottom, count: bottoms.length };
  });
  const over = m.maxBottom > m.viewportH ? m.maxBottom - m.viewportH : 0;
  console.log(`RESULT [${testInfo.project.name}] 넘침=${m.overflowX}px 화면높이=${m.viewportH} 최하단요소=${m.maxBottom} 화면밖=${over}px 요소수=${m.count}`);
  expect(m.overflowX).toBe(0);
});
