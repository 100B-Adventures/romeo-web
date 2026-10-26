import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// 2026-09-08 갱신 — 이 스펙은 로컬 픽스처 전용이다. `restore-test-token` 은 실제 발급되는 JWT가
// 아니라 이 파일 안에서만 쓰는 가짜 문자열이고, page.route 로 recommendations/today ·
// profiles/77 · me/pricing 3개 API만 목킹한다. 실서버(stage/prod)에서는 이 3개 외의 호출
// (예: 헤더의 세션 검증, 알림 개수 등)이 가짜 토큰으로 real API 를 때려 401 → 로그인 리다이렉트로
// 이어지므로 애초에 성립할 수 없는 시나리오다(qa-tracker 2026-09-08 컨트롤러 회귀에서도 대상 밖).
// 실서버로 승격하려면 loginAsTestUser 로 실제 로그인하고 시드 데이터로 profileId 77 인물을
// 만들어야 하는데, 이 파일의 목적은 "단일 공유 히어로 계약"의 순수 렌더 계약 검증(백엔드 무관)이라
// 조용히 지우는 대신 로컬 전용임을 명시하고 실서버 실행에서 제외한다.
const isLocalRun = !process.env.CI && /localhost|127\.0\.0\.1/.test(process.env.BASE_URL || 'http://localhost:3000');
test.skip(!isLocalRun, 'home-detail-restore: 로컬 픽스처 전용(가짜 토큰 + route mock) — stage/prod 실서버에서는 성립하지 않는다. web/tests/e2e/home-detail-restore.spec.ts 상단 주석 참조.');

const evidenceDir = path.resolve(__dirname, '../../test-results/home-detail-restore');
const portrait = `data:image/png;base64,${fs.readFileSync(path.resolve(__dirname, '../../../mobile/assets/images/vnext-intro-taeho.png')).toString('base64')}`;
const profile = {
  profileId: 77, userId: 77, nickname: '준호', birthYear: 1992, age: 34, gender: 'MALE', location: '강남',
  height: 180, bodyType: '다부진', religion: '천주교', mbti: 'ENTJ', occupation: '전략 컨설턴트', company: '큐피드 파트너스', school: '연세대학교',
  bio: '서로의 일을 존중하고 주말에는 함께 새로운 것을 시도하고 싶어요.', essayLifestyle: '평일에는 일에 집중하고, 주말 아침에는 한강을 달립니다.', essayIdealType: '대화로 갈등을 풀고 서로의 성장을 응원하는 관계를 원합니다.',
  regionTags: ['강남', '서초'], marriagePlan: '1-2년', childPlan: '상의 후 결정', matchScore: 88,
  personalities: ['다정한', '진중한'], hobbies: ['러닝', '재즈'], iHave: [], iWant: [], photoUrls: [portrait],
  verified: true, verificationBadges: ['IDENTITY', 'CAREER'], alreadyLiked: false, receivedLike: false,
};
const pricing = { tier: 'BASE', gender: 'FEMALE', okSendCost: 0, superOkSendCost: 0, acceptCost: 0, pricingVersion: 'v1' };

test.describe('HD 홈·상세 복구 3폭 실제 렌더', () => {
  test.beforeEach(async ({ page }) => {
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.route('**/api/v1/recommendations/today', (route) => route.fulfill({ json: {
      currentSlot: '12', nextSlot: '18', nextSlotTime: null, hasActiveMatching: false, expiredCount: 1, pendingCount: 2,
      slots: [
        { slot: '08', slotLabel: '아침', active: false, upcoming: false, profiles: [{ ...profile, profileId: 76, nickname: '시간대 잔존' }], profileCount: 1 },
        { slot: '12', slotLabel: '점심', active: true, upcoming: false, profiles: [profile], profileCount: 1, cupidReason: '두 분 모두 진지한 만남과 활동적인 주말을 답했어요.', matchScore: 88 },
        { slot: '18', slotLabel: '저녁', active: false, upcoming: true, profiles: [], profileCount: 0 },
      ],
    } }));
    await page.route('**/api/v1/profiles/77', (route) => route.fulfill({ json: profile }));
    await page.route('**/api/v1/me/pricing', (route) => route.fulfill({ json: pricing }));
    await page.addInitScript(() => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { accessToken: 'restore-test-token', refreshToken: 'restore-test-token', user: { userId: 1, nickname: '정오', gender: 'FEMALE', status: 'ACTIVE' }, isLoggedIn: true }, version: 0 }));
      localStorage.setItem('accessToken', 'restore-test-token');
      localStorage.setItem('refreshToken', 'restore-test-token');
    });
  });

  for (const viewport of [{ width: 390, height: 812 }, { width: 1024, height: 812 }, { width: 1440, height: 1000 }]) {
    test(`HD-03 ${viewport.width}px 홈과 상세가 단일 공유 히어로 계약을 지킨다`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/home');
      await expect(page.getByTestId('today-profile-hero')).toHaveCount(1);
      await expect(page.getByTestId('today-profile-hero').getByRole('heading')).toContainText('준호, 34');
      await expect(page.getByText('시간대 잔존')).toHaveCount(0);
      await expect(page.getByRole('button', { name: '오늘' })).toBeVisible();
      await expect(page.getByRole('button', { name: '커뮤니티' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      await page.screenshot({ path: path.join(evidenceDir, `home-${viewport.width}.png`) });

      await page.goto('/profiles/77');
      const hero = page.getByTestId('detail-profile-hero');
      await expect(hero).toBeVisible();
      await expect(hero.getByRole('heading')).toContainText('준호, 34');
      await expect(page.locator('header')).toHaveCount(0);
      await expect(page.getByTestId('detail-fact-file')).toContainText('MBTI');
      await expect(page.getByTestId('detail-narratives')).toContainText('LIFESTYLE');
      await expect(page.getByTestId('detail-verified')).toBeVisible();
      await expect(page.getByTestId('detail-brand-card')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      await page.screenshot({ path: path.join(evidenceDir, `detail-${viewport.width}.png`) });
    });
  }
});
