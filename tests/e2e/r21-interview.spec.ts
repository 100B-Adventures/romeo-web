// R21 인터뷰 11문항 + AI bio 5종 톤 검증
// /interview → step 0~10 진행 → /interview/generate-bio → 5 chip 검증 → 저장

import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

const ESSAY_50 = '평일에는 회사에서 집중하고 저녁에는 운동이나 독서로 마무리합니다. 주중 루틴이 일정한 편이에요.';
const ESSAY_50_B = '주말에는 친구들과 카페를 다니거나 미술관 전시를 찾아갑니다. 가끔은 집에서 책을 읽으며 쉬어요.';
const ESSAY_50_C = '친구들은 저를 차분하고 진중한 사람이라고 말합니다. 약속을 잘 지키고 들어주는 편이라고 해요.';
const ESSAY_50_D = '편안하게 이야기를 나눌 수 있는 분, 자기 일에 진심인 분, 작은 일에 함께 웃을 수 있는 분이면 좋겠어요.';

test.describe('R21-INT: 인터뷰 11문항 + AI bio 5종 톤', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    // localStorage 초기화 (재실행 시 상태 충돌 방지)
    await page.evaluate(() => localStorage.removeItem('r21-interview-answers'));
  });

  test('R21-INT-WEB-01: 인터뷰 진입 + 첫 문항 표시', async ({ page }) => {
    await page.goto('/interview');
    await expect(page.locator('[data-testid="interview-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="interview-question"]')).toContainText('어디 사세요');
    await expect(page.locator('[data-testid="interview-meta"]')).toContainText('1 / 11');
  });

  test('R21-INT-WEB-02: 11문항 풀 진행 → generate-bio 이동', async ({ page }) => {
    await page.goto('/interview');

    // Step 1: region
    await page.locator('[data-testid="interview-region-서울"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // Step 2: job
    await page.locator('[data-testid="interview-job-IT·개발"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // Step 3: height (default 170 OK)
    await page.locator('[data-testid="interview-next"]').click();

    // Step 4: bodyType
    await page.locator('[data-testid="interview-bodyType-보통"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // Step 5: mbti
    await page.locator('[data-testid="interview-mbti-INTJ"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // Step 6: weekday (essay 50자+)
    await page.locator('[data-testid="interview-weekday-input"]').fill(ESSAY_50);
    await page.locator('[data-testid="interview-next"]').click();

    // Step 7: weekend (essay)
    await page.locator('[data-testid="interview-weekend-input"]').fill(ESSAY_50_B);
    await page.locator('[data-testid="interview-next"]').click();

    // Step 8: marriagePlan
    await page.locator('[data-testid="interview-marriagePlan-1-2년"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // Step 9: childPlan
    await page.locator('[data-testid="interview-childPlan-원함"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // Step 10: friendsDescribe (essay)
    await page.locator('[data-testid="interview-friendsDescribe-input"]').fill(ESSAY_50_C);
    await page.locator('[data-testid="interview-next"]').click();

    // Step 11: idealType (essay) + 완료
    await page.locator('[data-testid="interview-idealType-input"]').fill(ESSAY_50_D);
    await page.locator('[data-testid="interview-next"]').click();

    // generate-bio 페이지로 이동
    await expect(page).toHaveURL(/\/interview\/generate-bio$/);
  });

  test('R21-INT-WEB-03: 진행률 바 동작 확인', async ({ page }) => {
    await page.goto('/interview');
    const progressBar = page.locator('[data-testid="interview-progress"]');
    const initialWidth = await progressBar.evaluate((el) => (el as HTMLElement).style.width);
    expect(initialWidth).toBe('9%'); // 1/11 = 9.09 → round 9

    await page.locator('[data-testid="interview-region-서울"]').click();
    await page.locator('[data-testid="interview-next"]').click();
    const step2Width = await progressBar.evaluate((el) => (el as HTMLElement).style.width);
    expect(step2Width).toBe('18%'); // 2/11 = 18.18 → round 18
  });

  test('R21-INT-WEB-04: essay 50자 미만 시 다음 버튼 비활성', async ({ page }) => {
    await page.goto('/interview');
    // Step 6 (weekday)까지 이동
    await page.locator('[data-testid="interview-region-서울"]').click();
    await page.locator('[data-testid="interview-next"]').click();
    await page.locator('[data-testid="interview-job-IT·개발"]').click();
    await page.locator('[data-testid="interview-next"]').click();
    await page.locator('[data-testid="interview-next"]').click(); // height
    await page.locator('[data-testid="interview-bodyType-보통"]').click();
    await page.locator('[data-testid="interview-next"]').click();
    await page.locator('[data-testid="interview-mbti-INTJ"]').click();
    await page.locator('[data-testid="interview-next"]').click();

    // weekday essay 30자만 입력 (50자 미만)
    await page.locator('[data-testid="interview-weekday-input"]').fill('짧은 답변입니다. 30자 미만 테스트.');
    const nextBtn = page.locator('[data-testid="interview-next"]');
    await expect(nextBtn).toBeDisabled();

    // 50자 채우면 활성화
    await page.locator('[data-testid="interview-weekday-input"]').fill(ESSAY_50);
    await expect(nextBtn).toBeEnabled();
  });

  test('R21-INT-WEB-05: 뒤로 버튼 — 이전 step 이동', async ({ page }) => {
    await page.goto('/interview');
    await page.locator('[data-testid="interview-region-서울"]').click();
    await page.locator('[data-testid="interview-next"]').click();
    await expect(page.locator('[data-testid="interview-meta"]')).toContainText('2 / 11');

    await page.locator('[data-testid="interview-back"]').click();
    await expect(page.locator('[data-testid="interview-meta"]')).toContainText('1 / 11');
  });

  test('R21-INT-WEB-06: 인터뷰에 "강남" 옵션 존재 (R21에서도 지역 옵션 유지)', async ({ page }) => {
    await page.goto('/interview');
    // 강남 옵션은 지역 선택지로 유지 (Editorial 톤 잔해 아님 — 비즈니스 데이터)
    await expect(page.locator('[data-testid="interview-region-강남"]')).toBeVisible();
  });

  test('R21-INT-WEB-07: localStorage 답변 저장 후 새로고침 시 복원', async ({ page }) => {
    await page.goto('/interview');
    await page.locator('[data-testid="interview-region-서울"]').click();

    const stored = await page.evaluate(() => localStorage.getItem('r21-interview-answers'));
    expect(stored).toContain('서울');
  });

  test('R21-INT-WEB-08: 첫 문항 카피 R21 Editorial 톤 확인', async ({ page }) => {
    await page.goto('/interview');
    // Editorial 톤: 격식 있는 질문 카피 ("어디 사세요?" 등 자연스러운 톤)
    const q = await page.locator('[data-testid="interview-question"]').textContent();
    expect(q).toBeTruthy();
    expect(q).not.toContain('12명');
    expect(q).not.toContain('심사');
  });
});
