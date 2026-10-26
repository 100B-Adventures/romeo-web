/**
 * 요금 4조합 조회 계약 — 정본 요금표(회장 결정 18·19·29, V86)를 화면에 고정 숫자로
 * 박지 않고 /me/pricing 조회 결과만 그린다는 계약을 고정한다.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { TodayHeroCard } from '../TodayHeroCard';
import { pricingApi } from '@/lib/api/pricing';

jest.mock('@/lib/api/pricing', () => ({
  pricingApi: { getCurrentPricing: jest.fn() },
}));

const baseProps = {
  nickname: '테스트',
  initialRevealed: true,
};

describe('TodayHeroCard 요금 조회', () => {
  afterEach(() => jest.clearAllMocks());

  it('매칭 전 남성 조합(♥10/♥20)을 서버 조회 값 그대로 그린다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({
      tier: 'BASE', gender: 'MALE', okSendCost: 10, superOkSendCost: 20, acceptCost: 0, pricingVersion: 'v1',
    });
    render(<TodayHeroCard {...baseProps} />);
    await waitFor(() => expect(screen.getByText('♥10')).toBeInTheDocument());
    expect(screen.getByText('♥20')).toBeInTheDocument();
  });

  it('매칭 이후 남성 조합(♥30/♥60)을 서버 조회 값 그대로 그린다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockResolvedValue({
      tier: 'POST_MATCH', gender: 'MALE', okSendCost: 30, superOkSendCost: 60, acceptCost: 0, pricingVersion: 'v1',
    });
    render(<TodayHeroCard {...baseProps} />);
    await waitFor(() => expect(screen.getByText('♥30')).toBeInTheDocument());
    expect(screen.getByText('♥60')).toBeInTheDocument();
  });

  it('조회 실패 시 틀린 숫자를 보이지 않고 비용 뱃지를 숨긴다', async () => {
    (pricingApi.getCurrentPricing as jest.Mock).mockRejectedValue(new Error('pricing unavailable'));
    render(<TodayHeroCard {...baseProps} />);
    await waitFor(() => expect(pricingApi.getCurrentPricing).toHaveBeenCalled());
    expect(screen.queryByText(/^♥\d+$/)).not.toBeInTheDocument();
  });
});
