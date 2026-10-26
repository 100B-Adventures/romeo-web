import { test, expect } from '@playwright/test';
import fs from 'fs';

// 2026-09-07 로그인 상태 엔진별 홈·상세 겹침 실측 (qa-verifier 전용 산출물).
// 기존 engine-home-overlap.spec.ts는 다른 세션이 동시에 편집 중이라(회장 CLAUDE.md
// "중복 방지: 같은 workflow를 만지는 다른 pane이 있으면 먼저 실행하지 않는다") 그 파일을
// 건드리지 않고 별도 파일로 분리했다. 로직은 그 파일의 로그인 자동화를 그대로 재사용한다.
//
// 계정 6개(userId 18~23)는 서로 다른 사람을 오늘의 인물로 순환 배정했다
// (viewer->target: 18->19, 19->20, 20->21, 21->22, 22->23, 23->18. 자기 자신 추천 없음.
//  2026-09-07 POST /api/v1/admin/test/today-pick 로 admin(01010000001)이 직접 심음, slotId 6674~6679).
test('로그인 상태 엔진별 홈·상세 겹침 실측', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const EVIDENCE_DIR = 'docs/romeo-vnext/qa/evidence/2026-09-07-gate6-login';
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  await page.goto('https://stage.romeoncupid.art/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);

  const PHONES: Record<string, string> = {
    desktop: '01010000002', ipad: '01010000003', firefox: '01010000004',
    webkit: '01010000005', 'mobile-safari': '01010000006', 'mobile-chrome': '01010000007',
  };
  const TARGETS: Record<string, number> = {
    desktop: 19, ipad: 20, firefox: 21, webkit: 22, 'mobile-safari': 23, 'mobile-chrome': 18,
  };
  const engine = testInfo.project.name;
  const phone = PHONES[engine];
  const targetUserId = TARGETS[engine];
  if (!phone || !targetUserId) {
    test.skip(true, `엔진 ${engine}에 배정된 계정/타깃이 없음`);
    return;
  }

  await page.locator('input[type="tel"]').first().fill(phone);
  await page.getByText('계속하기', { exact: false }).first().click();
  await page.waitForTimeout(3000);

  const otp = page.locator('input[inputmode="numeric"]');
  const n = await otp.count();
  for (let i = 0; i < n; i++) await otp.nth(i).fill('0');
  await page.waitForTimeout(1500);
  // 6칸을 채워도 자동 제출되지 않는다. "로그인" 버튼을 눌러야 한다(실측, 2026-09-07).
  await page.getByRole('button', { name: /^로그인$/ }).first().click();
  await page.waitForTimeout(5000);

  const loginUrl = page.url();
  const loggedIn = !loginUrl.includes('/login');

  // 홈 화면
  await page.goto('https://stage.romeoncupid.art/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${EVIDENCE_DIR}/home-${engine}.png`, fullPage: true });

  const homeMetrics = await page.evaluate(() => {
    const d = document.documentElement;
    const nav = document.querySelector('.fixed.bottom-0, nav');
    const navTop = nav ? Math.round(nav.getBoundingClientRect().top) : -1;
    const bar = document.querySelector('[class*="actionBar"]');
    const barBottom = bar ? Math.round(bar.getBoundingClientRect().bottom) : -1;
    const overlap = (navTop > 0 && barBottom > navTop) ? barBottom - navTop : 0;
    return {
      path: location.pathname,
      overflowX: d.scrollWidth - d.clientWidth,
      navTop, barBottom, overlap,
      bodyScrollHeight: document.body.scrollHeight,
      title: document.title,
      bodyTextSample: (document.body.innerText || '').slice(0, 200),
    };
  });

  // 상세 화면 (심어둔 오늘의 인물 target)
  await page.goto(`https://stage.romeoncupid.art/profiles/${targetUserId}?source=home`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${EVIDENCE_DIR}/detail-${engine}.png`, fullPage: true });

  const detailMetrics = await page.evaluate(() => {
    const d = document.documentElement;
    const nav = document.querySelector('.fixed.bottom-0, nav');
    const navTop = nav ? Math.round(nav.getBoundingClientRect().top) : -1;
    const bar = document.querySelector('[class*="actionBar"]');
    const barBottom = bar ? Math.round(bar.getBoundingClientRect().bottom) : -1;
    const overlap = (navTop > 0 && barBottom > navTop) ? barBottom - navTop : 0;
    return { path: location.pathname, overflowX: d.scrollWidth - d.clientWidth, navTop, barBottom, overlap };
  });

  const result = { engine, phone, targetUserId, loggedIn, loginUrl, home: homeMetrics, detail: detailMetrics };
  console.log(`RESULT [${engine}] ${JSON.stringify(result)}`);
  fs.writeFileSync(`${EVIDENCE_DIR}/result-${engine}.json`, JSON.stringify(result, null, 2));

  expect(loggedIn, `${engine} 로그인 실패: ${loginUrl}`).toBeTruthy();
});
