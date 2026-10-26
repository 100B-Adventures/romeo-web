import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDetailPage from '../page';
import { profileApi } from '@/lib/api/profile';
import { matchingApi } from '@/lib/api/matching';
import { pricingApi } from '@/lib/api/pricing';

// 교차 코드리뷰 M18 회귀: 같은 발신을 서버 요금 하나로만 렌더하고,
// 요금 조회 실패·로딩 중에는 숫자를 보이지 말고 발신도 막는다.

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: mockReplace }),
  useParams: () => ({ id: '77' }),
}));

jest.mock('@/lib/api/profile', () => ({
  profileApi: { getProfileById: jest.fn() },
}));
jest.mock('@/lib/api/matching', () => ({
  matchingApi: { sendLike: jest.fn() },
}));
jest.mock('@/lib/api/safety', () => ({
  safetyApi: { blockUser: jest.fn(), createReport: jest.fn() },
}));
jest.mock('@/lib/api/pricing', () => ({
  pricingApi: { getCurrentPricing: jest.fn() },
}));

const baseProfile = {
  profileId: 77,
  userId: 77,
  nickname: '테스트',
  gender: 'FEMALE',
  age: 27,
  photoUrls: [],
  verified: false,
} as any;

describe('상대 프로필 상세 — 서버 요금 4조합 정본화 (M18)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (profileApi.getProfileById as jest.Mock).mockResolvedValue(baseProfile);
  });

  it('요금 조회 성공 시 서버 값(OK/슈퍼OK)만 버튼에 표시한다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({
      tier: 'BASE',
      gender: 'MALE',
      okSendCost: 10,
      superOkSendCost: 20,
      acceptCost: 0,
      pricingVersion: 'v1',
    });

    render(<ProfileDetailPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('좋아요 (♥10)')).toBeInTheDocument();
      expect(screen.getByLabelText('Super OK (♥20)')).toBeInTheDocument();
    });
    // 옛 하드코딩 원단위 표기가 남아있지 않아야 한다
    expect(screen.queryByText('5,000원')).not.toBeInTheDocument();
    expect(screen.queryByText('10,000원')).not.toBeInTheDocument();
  });

  it('HD-06 정상 경로: OK 클릭이 화면 장식에서 끝나지 않고 발신 API를 호출한다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({ tier: 'BASE', gender: 'MALE', okSendCost: 10, superOkSendCost: 20, acceptCost: 0, pricingVersion: 'v1' });
    (matchingApi.sendLike as jest.Mock).mockResolvedValue({ matched: false, toProfileId: 77, likeId: 91 });

    render(<ProfileDetailPage />);
    const okButton = await screen.findByLabelText('좋아요 (♥10)');
    await waitFor(() => expect(okButton).toBeEnabled());
    fireEvent.click(okButton);
    await waitFor(() => expect(matchingApi.sendLike).toHaveBeenCalledWith({ targetProfileId: 77, likeType: 'OK' }));
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/ok-sent\?/));
  });

  it('HD-07 정상 경로: 슈퍼 OK도 동일한 전송 결과 화면에 상대 스냅샷을 전달한다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({ tier: 'BASE', gender: 'MALE', okSendCost: 10, superOkSendCost: 20, acceptCost: 0, pricingVersion: 'v1' });
    (matchingApi.sendLike as jest.Mock).mockResolvedValue({ matched: false, toProfileId: 77, likeId: 92 });
    render(<ProfileDetailPage />);
    const button = await screen.findByLabelText('Super OK (♥20)');
    fireEvent.click(button);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/ok-sent?likeId=92'));
  });

  it('요금 조회 실패 시 발신 버튼을 비활성화해 발신을 막는다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockRejectedValue(new Error('network'));

    render(<ProfileDetailPage />);

    await waitFor(() => expect(screen.getByText('테스트')).toBeInTheDocument());

    const okBtn = await screen.findByLabelText('좋아요');
    const superBtn = await screen.findByLabelText('Super OK');
    expect(okBtn).toBeDisabled();
    expect(superBtn).toBeDisabled();

    await userEvent.click(okBtn);
    expect(matchingApi.sendLike).not.toHaveBeenCalled();
  });
});
