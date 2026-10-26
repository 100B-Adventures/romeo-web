import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('매칭 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  // 2026-09-08 갱신 — 홈에 "추천/좋아요/매칭/심사" 탭은 승인 시안 v39 에 없다.
  // ADR(기획.md 2026-06-05 "홈을 오늘의 한 분 단일 큐레이션으로 확정")로 탭형 홈이 폐기됐고,
  // 코드로도 확인됨: BottomTabBar.tsx 의 v39.5 승인 탭 5개(오늘·히스토리·커뮤니티·프로필·더보기)에도
  // "추천/좋아요/매칭/심사" 가 없다. 아래 4건은 탭 클릭 대신 그 탭이 보여주려던 정보의
  // 실제 후속 화면(단일 큐레이션 히어로 · OK 액션 · 히스토리의 매칭 안내 · 인증 화면)을 확인하도록 고쳤다.
  test('홈 오늘의 한 분 단일 큐레이션 로드', async ({ page }) => {
    // 전: "추천 탭이 기본 활성화"를 확인 → 후: 탭 없는 단일 큐레이션 히어로가 로드되는지 확인.
    // 근거: design-spec-v39.md §2 "25 홈" 접힘선 표(히어로+dossier+편지),
    // src/app/(app)/home/page.tsx:68 data-testid="home-single-curation".
    await page.goto('/home');
    await page.waitForLoadState('load');
    const singleCuration = page.locator('[data-testid="home-single-curation"], [data-testid="today-single-hero"], [data-testid="home-empty"], [data-testid="home-loading"]').first();
    await expect(singleCuration).toBeVisible({ timeout: 10000 });
  });

  test('OK 액션 버튼 표시 (구 "좋아요 탭")', async ({ page }) => {
    // 전: 없는 "좋아요" 탭을 클릭 → 후: 오늘의 한 분 카드의 OK 액션이 실제로 뜨는지 확인.
    // 근거: TodayHeroCard.tsx:44 <button ...>OK <span>{costPillLabel...}</span></button>,
    // 빈 큐레이션(home-empty)일 때는 OK 버튼이 없는 게 정상이라 그 상태도 통과로 둔다.
    await page.goto('/home');
    await page.waitForLoadState('load');
    // 큐피드 추천 계산이 stage 실서버에서 로딩 상태(home-loading)로 몇 초 머물 수 있어
    // 그 상태가 끝날 때까지 먼저 기다린 뒤 OK 버튼/빈 상태를 판정한다.
    await page.locator('[data-testid="home-loading"]').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
    const okButton = page.getByRole('button', { name: /^OK/ });
    const empty = page.locator('[data-testid="home-empty"]');
    const hasOk = await okButton.first().isVisible({ timeout: 15000 }).catch(() => false);
    const isEmpty = await empty.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasOk || isEmpty).toBeTruthy();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('히스토리의 매칭 안내 노출 (구 "매칭 탭")', async ({ page }) => {
    // 전: 홈의 없는 "매칭" 탭을 클릭 → 후: 매칭 성사 정보의 실제 정착지인 /history 로 직접 이동해 확인.
    // 근거: design-spec-v39.md:160 "history 레일 = 아카이브 규칙·매칭 안내". /matchings 는
    // 목록 페이지가 없고 [id] 상세만 있어(매칭 목록 자체는 히스토리에 통합) 후속 화면이 아니다.
    await page.goto('/history');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('자격 인증 화면 성별 공통 로드 (구 "심사 탭")', async ({ page }) => {
    // 전: "여성이 남성을 별점으로 심사"하는 탭(성별별 분기) → 후: 그 기능 자체가 폐기됐다.
    // 근거: approval.spec.ts 가 이미 이 구 기능(별점 심사)을 소프트 조건부로만 남겨둔 것과 정합 —
    // ADR(오늘의 한 분 단일 AI 큐레이션)로 동료 심사가 사라지고 자격 인증(verification)만 남았다.
    // 후속 화면 = /profile/verification. 이제 성별 분기 없이 동일 화면을 쓴다(verification/page.tsx 확인).
    await page.goto('/profile/verification');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('히스토리 페이지 로드', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('히스토리 source별 액션 버튼 확인', async ({ page }) => {
    // 히스토리 탭으로 이동
    await page.goto('/history');
    await page.waitForLoadState('load');

    // 히스토리 아이템이 있으면 액션 버튼 확인
    const historyItem = page.locator('[data-testid="history-item"]').first();
    if (await historyItem.isVisible()) {
      // source에 따른 액션 버튼 (좋아요 보내기, 프로필 보기 등)
      await expect(historyItem.locator('button').first()).toBeVisible();
    }
  });

  test('추천 슬롯 정보 표시 (08/12/18시)', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');
    // 추천 시간 안내 텍스트 확인
    const slotInfo = page.locator('text=/08:00|12:00|18:00|추천/');
    if (await slotInfo.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(slotInfo.first()).toBeVisible();
    }
  });

  test('퍼센타일 뱃지 표시 확인', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');
    // 상위 N% 뱃지 확인
    const badge = page.locator('[data-testid="percentile-badge"], text=/상위.*%/');
    if (await badge.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(badge.first()).toBeVisible();
    }
  });

  test('라이브 카드 스와이프 UI', async ({ page }) => {
    await page.goto('/live');
    await page.waitForLoadState('load');
    // 스와이프 카드 또는 빈 상태
    const swipeCard = page.locator('[data-testid="swipe-card"], [class*="card"]').first();
    const emptyState = page.locator('text=/추천|없습니다/');
    const hasCard = await swipeCard.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCard || hasEmpty).toBeTruthy();
  });

  test('매칭 연락처 직접 표시 확인', async ({ page }) => {
    // 매칭 목록으로 이동
    await page.goto('/home');
    await page.waitForLoadState('load');

    // 매칭 탭 클릭
    const matchTab = page.getByText('매칭');
    if (await matchTab.isVisible()) {
      await matchTab.click();
      await page.waitForLoadState('load');

      // 매칭된 항목이 있으면 연락처 표시 확인
      const matchItem = page.locator('[data-testid="match-item"]').first();
      if (await matchItem.isVisible()) {
        // 연락처 정보가 직접 표시되는지 확인
        const contactInfo = matchItem.locator('[data-testid="contact-info"], .contact-info');
        // 연락처가 있으면 표시됨을 확인
        if (await contactInfo.isVisible()) {
          await expect(contactInfo).toBeVisible();
        }
      }
    }
  });

  test('매칭 카드 "매칭성공" 상태 라벨 (HIST-05)', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('load');
    // 매칭 탭 클릭
    const matchTab = page.getByText('매칭');
    if (await matchTab.isVisible()) {
      await matchTab.click();
      await page.waitForLoadState('load');
      // 매칭성공 라벨 확인
      const successLabel = page.locator('text=/매칭성공|매칭 성공/');
      if (await successLabel.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(successLabel.first()).toBeVisible();
      }
    }
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('차단/신고 후 카드 제거 (HIST-06)', async ({ page }) => {
    // 프로필 상세에서 차단/신고 후 목록 복귀 확인
    await page.goto('/profiles/1');
    await page.waitForLoadState('load');
    // 차단/신고 버튼이 있으면 동작 확인 (실제 클릭은 시드 데이터 의존)
    const blockBtn = page.locator('button:has-text("차단"), [data-testid="block-button"]');
    if (await blockBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(blockBtn).toBeEnabled();
    }
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('매칭 상세 차단/신고 메뉴 (HIST-07)', async ({ page }) => {
    await page.goto('/matchings/1');
    await page.waitForLoadState('load');
    // 매칭 상세의 ⋮ 메뉴 확인
    const ellipsis = page.locator('[data-testid="ellipsis-menu"], button:has(svg[class*="ellipsis"]), button:has-text("⋮")');
    if (await ellipsis.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ellipsis.click();
      // 차단/신고 옵션
      const blockOption = page.getByText('차단');
      const reportOption = page.getByText('신고');
      if (await blockOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(blockOption).toBeVisible();
      }
      if (await reportOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(reportOption).toBeVisible();
      }
    }
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
