import { test, expect } from '@playwright/test';
import fs from 'fs';

// 2026-09-07 회귀 고정 — 상세 화면 행동 버튼 바(.actionBar)와 하단 탭바(BottomTabBar) 겹침.
//
// 배경: 같은 종류의 결함이 이미 두 번 났다.
//   - 2026-09-05 (커밋 5057457): 두 요소가 하단 고정대 높이를 "서로 다른 값"으로 잡아 49px 겹침.
//   - 2026-09-07: 값은 하나(52px 토큰)로 통일됐지만, .actionBar가 position:sticky, 탭바가
//     position:fixed로 "서로 다른 좌표계"를 써서 16px 겹침(web/src/app/(app)/profiles/[id]/
//     ProfileDetail.module.css:15 수정으로 해소, iPad·iPhone 계열에서만 재현되던 WebKit 결함).
//
// 재현 조건이 핵심이다: 이 결함은 뷰포트 지표가 흔들리는 순간(fullPage 스크린샷, 실기기
// 주소창 접힘/펼침 등)에만 드러난다. position:fixed 요소는 즉시 새 값을 반영하지만
// position:sticky 요소는 그 순간의 옛 오프셋에 고정된 채 남는다. 그래서 이 스펙은 측정
// 직전에 반드시 fullPage 스크린샷을 찍어 그 조건을 강제한다 — 이 스크린샷 없이 재면
// .actionBar를 다시 sticky로 되돌려도 겹침이 재현되지 않아 회귀를 놓친다(장식 테스트가 됨).
//
// 이 파일은 기존 engine-home-overlap.spec.ts / engine-home-overlap-login-2026-09-07.spec.ts와
// 별도다(다른 세션이 그 두 파일을 동시에 쓰고 있어 건드리지 않는다).
test.describe('상세 화면 actionBar ↔ 탭바 겹침 회귀', () => {
  test.setTimeout(90000);

  // 2026-09-07 gate6-login 실측과 동일한 계정 배정을 기본값으로 둔다(design-conformance-matrix.md
  // "2026-09-07 로그인 상태 엔진별 홈·상세 겹침 최초 실측" 절 참조). 인증번호 시간당 5회 제한에
  // 걸리면(회귀 확인 과정에서 실제로 여러 번 걸렸다) 다른 화이트리스트 계정으로 임시 교체해도 되지만,
  // 이 파일 자체의 기본값은 원래 배정으로 유지한다.
  const PHONES: Record<string, string> = {
    ipad: '01010000003',
    'mobile-safari': '01010000006',
  };
  const TARGETS: Record<string, number> = {
    ipad: 20,
    'mobile-safari': 23,
  };

  test('fullPage 캡처 직후에도 겹침 0, 탭바가 가려지지 않는다', async ({ page }, testInfo) => {
    const engine = testInfo.project.name;
    const phone = PHONES[engine];
    const targetUserId = TARGETS[engine];
    test.skip(!phone, `엔진 ${engine}에는 이 회귀 계정이 배정되지 않았다 (ipad·mobile-safari만 덮는다)`);

    const BASE = process.env.OVERLAP_REGRESSION_BASE_URL || 'http://localhost:3000';

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
    await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    expect(page.url(), `${engine} 로그인 실패`).not.toContain('/login');

    await page.goto(`${BASE}/profiles/${targetUserId}?source=home`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    // ★ 재현 조건: 측정 직전 fullPage 스크린샷으로 WebKit의 sticky 캐시 어긋남을 강제한다.
    const EVIDENCE_DIR = 'docs/romeo-vnext/qa/evidence/2026-09-07-detail-overlap-regression';
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: `${EVIDENCE_DIR}/detail-${engine}.png`, fullPage: true });

    const metrics = await page.evaluate(() => {
      const d = document.documentElement;
      const nav = document.querySelector('[data-testid="bottom-tab-bar"]') as HTMLElement | null;
      const bar = document.querySelector('[data-testid="profile-action-bar"]') as HTMLElement | null;
      const navRect = nav?.getBoundingClientRect();
      const barRect = bar?.getBoundingClientRect();
      const navTop = navRect ? Math.round(navRect.top) : -1;
      const barBottom = barRect ? Math.round(barRect.bottom) : -1;
      const overlap = (navTop > 0 && barBottom > navTop) ? barBottom - navTop : 0;
      // 탭바가 실제로 가려지는지: 탭바 중앙 좌표에서 elementFromPoint가 탭바(또는 그 자손)를
      // 반환하는지 본다. actionBar가 그 지점을 가로채면 탭바 자신이 아닌 다른 요소가 잡힌다.
      let tabBarObscured = false;
      if (nav && navRect) {
        const cx = navRect.left + navRect.width / 2;
        const cy = navRect.top + navRect.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        tabBarObscured = !!hit && !nav.contains(hit) && hit !== nav;
      }
      return {
        path: location.pathname,
        overflowX: d.scrollWidth - d.clientWidth,
        navTop, barBottom, overlap, tabBarObscured,
      };
    });

    fs.writeFileSync(`${EVIDENCE_DIR}/result-${engine}.json`, JSON.stringify({ engine, phone, targetUserId, metrics }, null, 2));

    expect(metrics.overlap, `${engine} 상세 겹침(fullPage 캡처 직후 실측)`).toBe(0);
    expect(metrics.tabBarObscured, `${engine} 하단 탭바가 actionBar에 가려짐`).toBe(false);
    expect(metrics.overflowX, `${engine} 가로 넘침`).toBe(0);
  });
});
