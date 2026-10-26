import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfileDetailPage from '../page';
import { profileApi } from '@/lib/api/profile';
import { matchingApi } from '@/lib/api/matching';
import { pricingApi } from '@/lib/api/pricing';

const mockPush = jest.fn();
const showToast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  useParams: () => ({ id: '77' }),
}));
jest.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: { showToast: typeof showToast }) => unknown) => selector({ showToast }),
}));
jest.mock('@/lib/api/profile', () => ({ profileApi: { getProfileById: jest.fn() } }));
jest.mock('@/lib/api/matching', () => ({ matchingApi: { sendLike: jest.fn() } }));
jest.mock('@/lib/api/safety', () => ({ safetyApi: { blockUser: jest.fn(), createReport: jest.fn() } }));
jest.mock('@/lib/api/pricing', () => ({ pricingApi: { getCurrentPricing: jest.fn() } }));

const profile = {
  profileId: 77,
  userId: 77,
  nickname: '테스트',
  gender: 'FEMALE',
  age: 27,
  photoUrls: [],
  verified: false,
} as any;

describe('TC-HEART-INSUFFICIENT-WEB 발신 하트 부족 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (profileApi.getProfileById as jest.Mock).mockResolvedValue(profile);
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({
      tier: 'BASE', gender: 'MALE', okSendCost: 20, superOkSendCost: 40, acceptCost: 0, pricingVersion: 'v1',
    });
  });

  it('TC-HEART-INSUFFICIENT-WEB-01 정상 경로: PAYMENT_006의 잔액과 필요량을 보이고 충전 화면으로 이동한다', async () => {
    (matchingApi.sendLike as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { code: 'PAYMENT_006', message: '포인트가 부족합니다. 현재 잔액: 0, 필요 금액: 20' } },
    });

    render(<ProfileDetailPage />);
    fireEvent.click(await screen.findByLabelText('좋아요 (♥20)'));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('남은 하트0');
    expect(dialog).toHaveTextContent('필요한 하트20');
    fireEvent.click(screen.getByRole('button', { name: '하트 충전하러 가기' }));
    expect(mockPush).toHaveBeenCalledWith('/payment');
  });

  it('TC-HEART-INSUFFICIENT-WEB-02 거절 조건: 다른 발신 실패를 하트 부족으로 오분류하지 않는다', async () => {
    (matchingApi.sendLike as jest.Mock).mockRejectedValue({
      response: { status: 409, data: { code: 'MATCH_004', message: '이미 좋아요를 보낸 프로필입니다' } },
    });

    render(<ProfileDetailPage />);
    fireEvent.click(await screen.findByLabelText('좋아요 (♥20)'));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('이미 마음을 전했어요.'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
