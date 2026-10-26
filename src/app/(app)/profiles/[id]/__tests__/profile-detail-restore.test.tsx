import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDetailPage from '../page';
import { profileApi } from '@/lib/api/profile';
import { pricingApi } from '@/lib/api/pricing';

const mockPush = jest.fn();
const mockRouter = { push: mockPush, back: jest.fn(), replace: jest.fn() };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
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

const profile = {
  profileId: 77,
  userId: 77,
  nickname: '준호',
  gender: 'MALE',
  age: 34,
  location: '강남',
  occupation: '전략 컨설턴트',
  photoUrls: ['/profile.png'],
  verified: true,
  verificationBadges: ['IDENTITY', 'CAREER'],
  mbti: 'INFJ',
  marriagePlan: '2-3년',
  childPlan: '원함',
  essayLifestyle: '토요일 아침에는 한강을 달립니다.',
  essayIdealType: '서로의 일을 존중하는 관계를 바랍니다.',
  hobbies: ['재즈', '러닝'],
  bio: '주중에는 일에 몰입하고 주말에는 새로운 것을 배우는 사람입니다.',
} as any;

describe('홈·상세 복구 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({
      tier: 'BASE', gender: 'FEMALE', okSendCost: 0, superOkSendCost: 0, acceptCost: 0, pricingVersion: 'v1',
    });
  });

  it('HD-04 정상 경로: 이름과 나이를 상세 공유 히어로 안에 표시한다', async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValue(profile);

    render(<ProfileDetailPage />);

    const hero = await screen.findByTestId('detail-profile-hero');
    expect(within(hero).getByRole('heading')).toHaveTextContent('준호, 34');
    expect(screen.getByTestId('profile-dossier')).toHaveTextContent('강남');
    expect(screen.getByTestId('detail-about')).toHaveTextContent('Cupid');
    expect(screen.getByTestId('detail-fact-file')).toHaveTextContent('결혼 계획');
    expect(screen.getByTestId('detail-narratives')).toHaveTextContent('LIFESTYLE');
    expect(screen.getByTestId('profile-verified')).toHaveTextContent('전략 컨설턴트');
    expect(screen.getByTestId('detail-brand-card')).toHaveTextContent('확인한 사실의 범위에서 책임집니다');
  });

  it('HD-05 거절 경로: 조회 실패를 무한 로딩하지 않고 재시도와 홈 행동을 제공한다', async () => {
    (profileApi.getProfileById as jest.Mock).mockRejectedValue(new Error('network'));

    render(<ProfileDetailPage />);

    await waitFor(() => expect(screen.getByTestId('detail-error')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: '홈으로' }));
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('H4 서류 인증 배지가 있으면 자기신고 나이와 무관하게 VERIFIED MEMBER를 표시한다', async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValue({
      ...profile,
      age: 34,
      ageSource: 'SELF_DECLARED',
      identityVerified: false,
      verified: true,
      verificationBadges: ['CAREER'],
    });

    render(<ProfileDetailPage />);

    const hero = await screen.findByTestId('detail-profile-hero');
    expect(within(hero).getByRole('heading')).toHaveTextContent('준호, 34');
    expect(within(hero).getByText('✓ VERIFIED MEMBER')).toBeInTheDocument();
  });
});
