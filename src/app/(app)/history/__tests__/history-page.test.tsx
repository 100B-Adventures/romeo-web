import { render, screen } from '@testing-library/react';
import HistoryPage from '../page';
import { matchingApi } from '@/lib/api/matching';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/lib/api/matching', () => ({
  matchingApi: {
    getHistoryProfiles: jest.fn(),
    getMyMatchings: jest.fn(),
  },
}));

describe('지난 지면 재전송 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (matchingApi.getHistoryProfiles as jest.Mock)
      .mockResolvedValueOnce({ content: [] })
      .mockResolvedValueOnce({
        content: [{
          profileId: 17,
          nickname: '거절회원',
          photoUrls: [],
          verified: true,
          alreadyLiked: true,
          receivedLike: false,
          responseStatus: 'REJECT',
          expiresAt: '2026-10-03T12:00:00+09:00',
        }],
      });
    (matchingApi.getMyMatchings as jest.Mock).mockResolvedValue({ content: [] });
  });

  it('HISTORY-RESEND-WEB-01 거절 조건: 거절된 보낸 OK 카드에는 슈퍼 OK 재전송 행동이 없다', async () => {
    render(<HistoryPage />);

    expect(await screen.findByText('거절회원')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /슈퍼 OK 다시/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/슈퍼 OK 다시/)).not.toBeInTheDocument();
  });
});
