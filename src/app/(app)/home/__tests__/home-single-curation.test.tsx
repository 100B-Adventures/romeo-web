import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage from '../page';
import { matchingApi, recommendationApi } from '@/lib/api/matching';
import { pricingApi } from '@/lib/api/pricing';
import { aiConsentApi } from '@/lib/api/aiConsent';
import { recoverFromAuthRefreshFailure, refreshCurrentAuthSession } from '@/lib/api/client';

const push = jest.fn();
const replace = jest.fn();
const showToast = jest.fn();
let query = new URLSearchParams();
let userStatus: 'ACTIVE' | 'PENDING_APPROVAL' = 'ACTIVE';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => query,
}));
jest.mock('@/store/uiStore', () => ({ useUIStore: (selector: (state: { showToast: typeof showToast }) => unknown) => selector({ showToast }) }));
jest.mock('@/store/authStore', () => ({ useAuthStore: (selector: (state: { user: { userId: number; status: typeof userStatus }; authGeneration: number }) => unknown) => selector({ user: { userId: 1, status: userStatus }, authGeneration: 7 }) }));
jest.mock('@/lib/api/matching', () => ({
  recommendationApi: { getTodayRecommendations: jest.fn() },
  matchingApi: { sendLike: jest.fn() },
}));
jest.mock('@/lib/api/pricing', () => ({ pricingApi: { getCurrentPricing: jest.fn() } }));
jest.mock('@/lib/api/aiConsent', () => ({
  aiConsentApi: { getState: jest.fn() },
  requiresAiConsentDecision: (status: string) => status === 'NOT_DECIDED' || status === 'RECONSENT_REQUIRED',
}));
jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  refreshCurrentAuthSession: jest.fn(),
  recoverFromAuthRefreshFailure: jest.fn(),
}));

const profile = (profileId: number, nickname: string) => ({
  profileId, nickname, age: 34, location: '강남', occupation: '전략 컨설턴트', bio: '진지한 만남을 찾고 있어요.',
  company: '큐피드 파트너스', school: '연세대학교', education: 'UNIVERSITY', incomeRange: '연 1억 이상',
  height: 180, bodyType: '다부진', religion: '천주교', hobbies: ['러닝', '재즈'],
  photoUrls: ['/portrait.jpg'], verified: true, verificationBadges: ['IDENTITY', 'CAREER', 'EDUCATION'], alreadyLiked: false, receivedLike: false,
});

describe('홈·상세 복구 계약 HD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query = new URLSearchParams();
    userStatus = 'ACTIVE';
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({ okSendCost: 10, superOkSendCost: 20 });
    (matchingApi.sendLike as jest.Mock).mockResolvedValue({ matched: false, likeId: 91 });
    (aiConsentApi.getState as jest.Mock).mockResolvedValue({ status: 'GRANTED' });
    (refreshCurrentAuthSession as jest.Mock).mockResolvedValue({ status: userStatus });
    (recoverFromAuthRefreshFailure as jest.Mock).mockResolvedValue('logged-out');
  });

  it('HD-01 정상 경로: 세 시간대 응답에서도 현재 한 사람의 히어로와 실호출 행동만 렌더한다', async () => {
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      currentSlot: '12', nextSlot: '18', nextSlotTime: null, hasActiveMatching: false, expiredCount: 1, pendingCount: 2,
      slots: [
        { slot: '08', slotLabel: '아침', active: false, upcoming: false, profiles: [profile(1, '아침회원')], profileCount: 1 },
        { slot: '12', slotLabel: '점심', active: true, upcoming: false, profiles: [profile(2, '준호')], profileCount: 1, cupidReason: '두 분 모두 진지한 만남을 원해요.', matchScore: 88 },
        { slot: '18', slotLabel: '저녁', active: false, upcoming: true, profiles: [profile(3, '저녁회원')], profileCount: 1 },
      ],
    });

    render(<HomePage />);
    expect(await screen.findByText('준호')).toBeInTheDocument();
    expect(screen.getAllByTestId('today-profile-hero')).toHaveLength(1);
    expect(screen.getByTestId('profile-dossier')).toHaveTextContent('강남180CM다부진천주교');
    expect(screen.getByTestId('profile-verified')).toHaveTextContent('No. 2');
    expect(screen.getByTestId('profile-verified')).toHaveTextContent('큐피드 파트너스');
    expect(screen.getByTestId('profile-verified')).toHaveTextContent('연세대학교');
    expect(screen.getByText('✓ VERIFIED MEMBER')).toBeInTheDocument();
    expect(screen.queryByText('아침회원')).not.toBeInTheDocument();
    expect(screen.queryByText('저녁회원')).not.toBeInTheDocument();

    const okButton = await screen.findByRole('button', { name: /OK ♥10/ });
    await waitFor(() => expect(okButton).toBeEnabled());
    fireEvent.click(okButton);
    await waitFor(() => expect(matchingApi.sendLike).toHaveBeenCalledWith({ targetProfileId: 2, likeType: 'OK' }));
  });

  it('HD-02 거절 경로: 추천 0건은 시간대 카드나 근거 없는 CTA 없이 편집형 빈 지면을 제공한다', async () => {
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      currentSlot: '12', nextSlot: null, nextSlotTime: null, hasActiveMatching: false, expiredCount: 0, pendingCount: 0, slots: [],
    });

    render(<HomePage />);
    expect(await screen.findByTestId('home-empty')).toHaveTextContent('기준을 모두 통과한 분이 없습니다');
    expect(screen.getByTestId('home-empty')).toHaveTextContent('기준을 낮추거나 지역을 임의로 넓히지 않고');
    expect(screen.getByTestId('home-empty')).toHaveTextContent("TODAY'S ONE");
    expect(screen.getByTestId('home-empty')).toHaveTextContent("EDITOR'S NOTE");
    expect(screen.getByTestId('home-empty')).toHaveTextContent('12:00');
    expect(screen.queryByTestId('today-profile-hero')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('EMPTY-REASON-WEB-CTA 정상 경로: 인증 미제출·반려 사유는 인증 제출 화면으로 연결한다', async () => {
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      currentSlot: '12', nextSlot: null, nextSlotTime: null, hasActiveMatching: false,
      expiredCount: 0, pendingCount: 0, slots: [], emptyReason: 'MALE_VERIFICATION_REQUIRED',
    });

    render(<HomePage />);

    expect(await screen.findByRole('heading', { name: '인증 1건이면 소개가 시작돼요' })).toBeInTheDocument();
    expect(screen.getByTestId('home-empty')).toHaveTextContent('인증 1건 완료 후 소개가 시작됩니다');
    expect(screen.getByTestId('home-empty')).toHaveTextContent('인증 완료 후 시작');
    fireEvent.click(screen.getByRole('button', { name: '인증하러 가기' }));
    expect(push).toHaveBeenCalledWith('/profile/verification');
  });

  it('AI-AC-WEB-03 거절 조건: 미결정 사용자는 추천을 조회하기 전에 전체 동의 화면으로 이동한다', async () => {
    (aiConsentApi.getState as jest.Mock).mockResolvedValue({ status: 'NOT_DECIDED' });

    render(<HomePage />);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ai-consent?returnTo=%2Fhome'));
    expect(recommendationApi.getTodayRecommendations).not.toHaveBeenCalled();
  });

  it('AI-AC-WEB-04 구버전 고지에서 규칙 추천을 고르면 동의 게이트를 반복하지 않는다', async () => {
    query = new URLSearchParams('aiConsentFallback=rules');
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      currentSlot: '12', nextSlot: null, nextSlotTime: null, hasActiveMatching: false,
      expiredCount: 0, pendingCount: 0, slots: [],
    });

    render(<HomePage />);

    expect(await screen.findByTestId('home-empty')).toBeInTheDocument();
    expect(aiConsentApi.getState).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalledWith('/ai-consent?returnTo=%2Fhome');
    expect(recommendationApi.getTodayRecommendations).toHaveBeenCalledTimes(1);
  });

  it('F-02 거절 경로: 심사 대기 회원은 추천 API를 호출하지 않고 사유를 안내한다', async () => {
    userStatus = 'PENDING_APPROVAL';

    render(<HomePage />);

    expect(await screen.findByTestId('home-pending-approval')).toHaveTextContent('승인 전에는 오늘의 추천이 준비되지 않습니다');
    expect(refreshCurrentAuthSession).toHaveBeenCalledTimes(1);
    expect(aiConsentApi.getState).not.toHaveBeenCalled();
    expect(recommendationApi.getTodayRecommendations).not.toHaveBeenCalled();
  });

  it('N-1-WEB-RETRY 일시 장애 경로: refresh 시간 초과·5xx는 심사 안내와 세션을 유지한다', async () => {
    userStatus = 'PENDING_APPROVAL';
    (refreshCurrentAuthSession as jest.Mock).mockRejectedValue(new Error('refresh expired'));
    (recoverFromAuthRefreshFailure as jest.Mock).mockResolvedValue('session-kept');

    render(<HomePage />);

    await waitFor(() => expect(recoverFromAuthRefreshFailure).toHaveBeenCalledWith(expect.any(Error), 7));
    expect(await screen.findByRole('alert')).toHaveTextContent('승인 상태를 불러오지 못했습니다');
    expect(replace).not.toHaveBeenCalledWith('/login');
    expect(screen.queryByTestId('home-error')).not.toBeInTheDocument();
  });

  it('N-1-WEB-REJECT 거절 경로: refresh token 거부는 로그인 화면으로 이동한다', async () => {
    userStatus = 'PENDING_APPROVAL';
    (refreshCurrentAuthSession as jest.Mock).mockRejectedValue(Object.assign(new Error('refresh rejected'), { response: { status: 401 } }));
    (recoverFromAuthRefreshFailure as jest.Mock).mockResolvedValue('logged-out');

    render(<HomePage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('B1 신고가 필요한 로그인 회원은 추천을 렌더하지 않고 성인 신고 화면으로 이동한다', async () => {
    (recommendationApi.getTodayRecommendations as jest.Mock).mockResolvedValue({
      adultDeclarationRequired: true,
      currentSlot: null,
      nextSlot: null,
      nextSlotTime: null,
      hasActiveMatching: false,
      expiredCount: 0,
      pendingCount: 0,
      slots: [],
    });

    render(<HomePage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/adult-declaration'));
    expect(screen.queryByTestId('today-profile-hero')).not.toBeInTheDocument();
  });
});
