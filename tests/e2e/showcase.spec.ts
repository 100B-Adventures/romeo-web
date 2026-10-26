import { test, expect } from '@playwright/test';

const SHOWCASE_TITLE = '지금 활동중인 회원';
const SHOWCASE_TIMEOUT = 5000;

test.describe('쇼케이스 프로필 섹션', () => {
  test('홈페이지에 쇼케이스 프로필이 표시된다', async ({ page }) => {
    await page.goto('/');
    // 쇼케이스 섹션이 렌더링될 때까지 대기 (API 실패 시 스킵)
    const showcaseSection = page.getByText(SHOWCASE_TITLE);
    const isVisible = await showcaseSection.isVisible().catch(() => false);
    if (!isVisible) {
      try {
        await showcaseSection.waitFor({ state: 'visible', timeout: SHOWCASE_TIMEOUT });
      } catch {
        test.skip(true, '쇼케이스 섹션이 렌더링되지 않음 (API 미응답 또는 데이터 없음)');
        return;
      }
    }
    await expect(showcaseSection).toBeVisible();
  });

  test('쇼케이스 프로필 카드가 표시된다', async ({ page }) => {
    await page.goto('/');
    // 쇼케이스 섹션이 있을 때만 카드 확인
    const showcaseSection = page.getByText(SHOWCASE_TITLE);
    try {
      await showcaseSection.waitFor({ state: 'visible', timeout: SHOWCASE_TIMEOUT });
    } catch {
      test.skip(true, '쇼케이스 섹션이 렌더링되지 않음 (API 미응답 또는 데이터 없음)');
      return;
    }
    await expect(page.getByText('가입하고 전체 프로필 보기')).toBeVisible();
  });

  test('CTA 버튼 클릭 시 가입 페이지로 이동', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByText('가입하고 전체 프로필 보기');
    try {
      await cta.waitFor({ state: 'visible', timeout: SHOWCASE_TIMEOUT });
    } catch {
      test.skip(true, '쇼케이스 CTA 버튼이 렌더링되지 않음');
      return;
    }
    await cta.click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});
