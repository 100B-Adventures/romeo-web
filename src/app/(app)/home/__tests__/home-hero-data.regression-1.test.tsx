import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import HomePage from '../page';
import TopHeader from '@/components/layout/TopHeader';
import { recommendationApi } from '@/lib/api/matching';
import { pricingApi } from '@/lib/api/pricing';
import { heartApi } from '@/lib/api/heart';
import { aiConsentApi } from '@/lib/api/aiConsent';

const push = jest.fn();
const showToast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: { showToast: typeof showToast }) => unknown) => selector({ showToast }),
}));
jest.mock('@/lib/api/matching', () => ({
  recommendationApi: { getTodayRecommendations: jest.fn() },
  matchingApi: { sendLike: jest.fn() },
}));
jest.mock('@/lib/api/pricing', () => ({ pricingApi: { getCurrentPricing: jest.fn() } }));
jest.mock('@/lib/api/heart', () => ({ heartApi: { getBalance: jest.fn() } }));
jest.mock('@/lib/api/aiConsent', () => ({
  aiConsentApi: { getState: jest.fn() },
  requiresAiConsentDecision: jest.fn(() => false),
}));

// Regression: ROMEO-HOME-HERO-DATA-01, 홈 복구 뒤 히어로 사진과 헤더 하트 잔액이 사라짐
// Found by /qa on 2026-09-05
// Report: docs/qa-tracker.md ROMEO-VNEXT-QA-GATE-V39-R2-07
describe('홈 히어로 데이터 회귀 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({ okSendCost: 10, superOkSendCost: 20 });
    (aiConsentApi.getState as jest.Mock).mockResolvedValue({ status: 'GRANTED' });
  });

  function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <TopHeader />
        <HomePage />
      </QueryClientProvider>,
    );
  }

  it('ROMEO-HOME-HERO-DATA-01 정상 경로: fresh 사진 URL과 숫자 하트 잔액을 함께 표시한다', async () => {
    const freshPhotoUrl = 'https://profile-assets.example.test/fresh-signed-portrait.jpg?signature=new';
    (heartApi.getBalance as jest.Mock).mockResolvedValue({ balance: 42 });
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      currentSlot: '12',
      nextSlot: null,
      nextSlotTime: null,
      hasActiveMatching: false,
      expiredCount: 0,
      pendingCount: 1,
      slots: [{
        slot: '12',
        slotLabel: '정오',
        active: true,
        upcoming: false,
        profiles: [{
          profileId: 25,
          nickname: '준호',
          age: 34,
          photoUrls: [freshPhotoUrl],
          verified: true,
          verificationBadges: ['IDENTITY'],
          alreadyLiked: false,
          receivedLike: false,
        }],
        profileCount: 1,
      }],
    });

    renderPage();

    const portrait = await screen.findByRole('img', { name: '준호' });
    expect(portrait).toHaveAttribute('src', freshPhotoUrl);
    await waitFor(() => expect(screen.getByTestId('header-heart-balance')).toHaveTextContent('42'));
    expect(heartApi.getBalance).toHaveBeenCalledTimes(1);
  });

  it('ROMEO-HOME-HERO-DATA-02 거절 경로: 사진과 잔액 조회 실패를 가짜 데이터로 채우지 않는다', async () => {
    (heartApi.getBalance as jest.Mock).mockRejectedValue(new Error('balance unavailable'));
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      currentSlot: '12',
      nextSlot: null,
      nextSlotTime: null,
      hasActiveMatching: false,
      expiredCount: 0,
      pendingCount: 1,
      slots: [{
        slot: '12',
        slotLabel: '정오',
        active: true,
        upcoming: false,
        profiles: [{
          profileId: 25,
          nickname: '준호',
          age: 34,
          photoUrls: [],
          verified: false,
          verificationBadges: [],
          alreadyLiked: false,
          receivedLike: false,
        }],
        profileCount: 1,
      }],
    });

    renderPage();

    expect(await screen.findByLabelText('등록된 사진 없음')).toBeInTheDocument();
    await waitFor(() => expect(heartApi.getBalance).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('header-heart-balance')).toHaveTextContent('--');
    expect(within(screen.getByRole('button', { name: '하트 충전소' })).queryByText('0')).not.toBeInTheDocument();
  });
});
