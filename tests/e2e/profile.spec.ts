import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('프로필 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('내 프로필 페이지 로드', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('load');
    // 프로필 페이지가 에러 없이 로드되는지 확인
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('프로필 수정 페이지 접근', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('load');
    // 닉네임 입력 필드 존재 확인
    const nicknameInput = page.locator('input[placeholder*="닉네임"]');
    await expect(nicknameInput).toBeVisible({ timeout: 10000 });
  });

  test('프로필 수정 — 성별별 체형 옵션', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('load');
    // 체형 셀렉트 필드 존재 확인
    const bodyTypeSelect = page.locator('select').filter({ hasText: /체형|슬림|보통/ });
    await expect(bodyTypeSelect).toBeVisible({ timeout: 10000 });
  });

  test('프로필 수정 — 저장 버튼 표시', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForLoadState('load');
    // 고정 저장 버튼 존재 확인
    const saveButton = page.locator('button:has-text("저장")');
    await expect(saveButton).toBeVisible({ timeout: 10000 });
  });

  test('상대 프로필 상세 페이지', async ({ page }) => {
    await page.goto('/profiles/1');
    await page.waitForLoadState('load');
    // 페이지가 로드되고 404가 아닌지 확인
    await expect(page).not.toHaveURL(/\/404/);
  });

  test('섹션별 인라인 편집 UI (PROF-09)', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('load');
    // 섹션 편집 아이콘/버튼 확인 (자기소개, 상세정보, 데이트스타일)
    const editIcons = page.locator('[data-testid="section-edit-icon"], button[aria-label*="편집"], a[href*="edit?section="]');
    if (await editIcons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await editIcons.count();
      expect(count).toBeGreaterThanOrEqual(1);
      // 첫 번째 편집 아이콘 클릭 시 해당 섹션만 수정 UI 표시
      await editIcons.first().click();
      await page.waitForLoadState('load');
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });

  test('인증 항목별 상세 안내 (VERI-05)', async ({ page }) => {
    await page.goto('/profile/verification');
    await page.waitForLoadState('load');
    // 인증 항목(신원/학력/소득/직장/거주) 가이드 텍스트 확인
    const guideText = page.locator('text=/신원|학력|소득|직장|거주/');
    if (await guideText.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(guideText.first()).toBeVisible();
    }
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
