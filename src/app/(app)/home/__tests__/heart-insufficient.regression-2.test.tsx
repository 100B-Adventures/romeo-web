import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage from '../page';
import { matchingApi, recommendationApi } from '@/lib/api/matching';
import { pricingApi } from '@/lib/api/pricing';
import { aiConsentApi } from '@/lib/api/aiConsent';

const push = jest.fn();
const showToast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/store/uiStore', () => ({ useUIStore: (selector: (state: { showToast: typeof showToast }) => unknown) => selector({ showToast }) }));
jest.mock('@/lib/api/matching', () => ({
  recommendationApi: { getTodayRecommendations: jest.fn() },
  matchingApi: { sendLike: jest.fn() },
}));
jest.mock('@/lib/api/pricing', () => ({ pricingApi: { getCurrentPricing: jest.fn() } }));
jest.mock('@/lib/api/aiConsent', () => ({
  aiConsentApi: { getState: jest.fn() },
  requiresAiConsentDecision: jest.fn(() => false),
}));

const profile = { profileId: 27, userId: 27, nickname: '테스트', age: 29, photoUrls: [], verified: false };

describe('TC-HEART-INSUFFICIENT-WEB-HOME 홈 발신 하트 부족 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({ okSendCost: 20, superOkSendCost: 40 });
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      slots: [{ active: true, upcoming: false, profiles: [profile] }],
    });
    (aiConsentApi.getState as jest.Mock).mockResolvedValue({ status: 'GRANTED' });
  });

  it('TC-HEART-INSUFFICIENT-WEB-HOME-01 정상 경로: 홈 발신 PAYMENT_006도 잔액과 필요량 및 충전 행동을 보인다', async () => {
    (matchingApi.sendLike as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { code: 'PAYMENT_006', message: '포인트가 부족합니다. 현재 잔액: 0, 필요 금액: 20' } },
    });

    render(<HomePage />);
    fireEvent.click(await screen.findByRole('button', { name: /OK ♥20/ }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('남은 하트0');
    expect(dialog).toHaveTextContent('필요한 하트20');
    fireEvent.click(screen.getByRole('button', { name: '하트 충전하러 가기' }));
    expect(push).toHaveBeenCalledWith('/payment');
  });

  it('TC-HEART-INSUFFICIENT-WEB-HOME-02 거절 조건: 비대상 발신 실패는 충전 안내로 오분류하지 않는다', async () => {
    (matchingApi.sendLike as jest.Mock).mockRejectedValue({
      response: { status: 409, data: { code: 'MATCH_004', message: 'duplicate' } },
    });

    render(<HomePage />);
    fireEvent.click(await screen.findByRole('button', { name: /OK ♥20/ }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('이미 마음을 전했어요.'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
