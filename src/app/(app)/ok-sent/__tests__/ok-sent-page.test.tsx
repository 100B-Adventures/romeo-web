import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import OkSentPage from '../page';
import { matchingApi } from '@/lib/api/matching';

const mockReplace = jest.fn();
let mockQuery = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useSearchParams: () => mockQuery,
}));
jest.mock('@/lib/api/matching', () => ({ matchingApi: { getSentLikeById: jest.fn() } }));

function historyProfile(overrides: Record<string, unknown> = {}) {
  return {
    nickname: '준호',
    photoUrl: 'https://cdn.example/junho.jpg',
    expiresAt: '2099-10-04T12:00:00+09:00',
    likeType: 'SUPER_OK',
    responseStatus: null,
    status: 'PENDING',
    matchingId: null,
    ...overrides,
  };
}

describe('v39 OK 전송 화면', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = new URLSearchParams({ likeId: '91' });
  });

  it('OK-SENT-PAGE-01 정상 경로: 인증된 보낸 기록의 상대 이름·사진·종료 시각을 표시한다', async () => {
    (matchingApi.getSentLikeById as jest.Mock).mockResolvedValue(historyProfile());
    render(<OkSentPage />);

    expect(await screen.findByTestId('ok-sent-recipient-name')).toHaveTextContent('준호 님에게');
    expect(screen.getByTestId('ok-sent-photo')).toHaveAttribute('src', 'https://cdn.example/junho.jpg');
    expect(screen.getByText('SUPER OK SENT')).toBeInTheDocument();
    expect(matchingApi.getSentLikeById).toHaveBeenCalledWith(91);
    fireEvent.click(screen.getByLabelText('오늘의 지면으로'));
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('OK-SENT-PAGE-02 거절 조건: 보낸 기록에 없는 직접 진입은 URL 이름으로 위장하지 않는다', async () => {
    mockQuery = new URLSearchParams({ likeId: '91', nickname: '위조된이름', photoUrl: 'https://evil.example/a.jpg' });
    (matchingApi.getSentLikeById as jest.Mock).mockResolvedValue(null);
    render(<OkSentPage />);

    expect(await screen.findByTestId('ok-sent-recipient-error')).toBeInTheDocument();
    expect(screen.queryByText(/위조된이름|회원 님에게/)).not.toBeInTheDocument();
  });

  it('OK-SENT-PAGE-03 경계값: 경로의 상대가 바뀌면 실패 사진과 서버 프로필을 함께 초기화한다', async () => {
    (matchingApi.getSentLikeById as jest.Mock)
      .mockResolvedValueOnce(historyProfile())
      .mockResolvedValueOnce(historyProfile({ nickname: '민재', photoUrl: 'https://cdn.example/minjae.jpg' }));
    const view = render(<OkSentPage />);
    fireEvent.error(await screen.findByTestId('ok-sent-photo'));
    expect(screen.getByTestId('ok-sent-photo-unavailable')).toBeInTheDocument();

    mockQuery = new URLSearchParams({ likeId: '92' });
    view.rerender(<OkSentPage />);
    await waitFor(() => expect(screen.getByTestId('ok-sent-photo')).toHaveAttribute('src', 'https://cdn.example/minjae.jpg'));
    expect(screen.getByTestId('ok-sent-recipient-name')).toHaveTextContent('민재 님에게');
  });

  it('OK-SENT-PAGE-04 만료 경계: 서버 종료 시각이 지났으면 재진입해도 24시간으로 되돌리지 않는다', async () => {
    (matchingApi.getSentLikeById as jest.Mock).mockResolvedValue(historyProfile({ status: 'EXPIRED', responseStatus: 'EXPIRED', expiresAt: '2020-01-01T00:00:00Z' }));
    render(<OkSentPage />);
    expect(await screen.findByText('EXPIRED')).toBeInTheDocument();
    expect(screen.getByTestId('ok-sent-timer')).toHaveTextContent('00:00');
  });

  it('OK-SENT-PAGE-05 거절 상태: 상대가 지나간 전송을 응답 대기로 오표시하지 않는다', async () => {
    (matchingApi.getSentLikeById as jest.Mock).mockResolvedValue(historyProfile({ status: 'REJECTED', responseStatus: 'REJECT' }));
    render(<OkSentPage />);
    expect(await screen.findByText('CLOSED')).toBeInTheDocument();
    expect(screen.getByText('상대가 지나갔어요')).toBeInTheDocument();
    expect(screen.getByText(/지나간 지면은 다시 추천되지 않아요/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('지난 지면 다시 읽기'));
    expect(mockReplace).toHaveBeenCalledWith('/history');
    expect(screen.queryByTestId('ok-sent-timer')).not.toBeInTheDocument();
    expect(screen.queryByText('응답 대기 중')).not.toBeInTheDocument();
  });

  it('OK-SENT-PAGE-06 매칭 상태: 닫힘 상태를 보여주고 알림을 통해서만 매칭 지면으로 이동한다', async () => {
    (matchingApi.getSentLikeById as jest.Mock).mockResolvedValue(historyProfile({
      status: 'MATCHED', responseStatus: 'ACCEPT', matchingId: 45,
    }));
    render(<OkSentPage />);

    expect(await screen.findAllByText('MATCHED')).toHaveLength(2);
    expect(screen.getByText('상대도 OK했어요')).toBeInTheDocument();
    expect(screen.getByText(/알림에서 매칭 지면을 확인해 주세요/)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalledWith('/matchings/45');
    fireEvent.click(screen.getByTestId('ok-sent-notifications-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/notifications');
    expect(screen.queryByTestId('ok-sent-timer')).not.toBeInTheDocument();
    expect(screen.queryByText('응답 없이 자동 종료')).not.toBeInTheDocument();
  });

  it('OK-SENT-PAGE-07 MATCH_005: 기존 상대를 지우고 재조회하지 않는다', async () => {
    (matchingApi.getSentLikeById as jest.Mock).mockRejectedValue({ response: { data: { code: 'MATCH_005' } } });
    render(<OkSentPage />);

    expect(await screen.findByTestId('ok-sent-recipient-error')).toBeInTheDocument();
    expect(screen.queryByText('응답 없이 자동 종료')).not.toBeInTheDocument();
  });

  it('OK-SENT-PAGE-08 복구 경로: PENDING 재조회가 일시 실패하면 다음 재조회를 예약한다', async () => {
    jest.useFakeTimers();
    (matchingApi.getSentLikeById as jest.Mock)
      .mockResolvedValueOnce(historyProfile())
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce(historyProfile());

    const view = render(<OkSentPage />);
    await act(async () => { await Promise.resolve(); });
    expect(matchingApi.getSentLikeById).toHaveBeenCalledTimes(1);

    await act(async () => { await jest.advanceTimersByTimeAsync(60_000); });
    expect(matchingApi.getSentLikeById).toHaveBeenCalledTimes(2);

    await act(async () => { await jest.advanceTimersByTimeAsync(60_000); });
    expect(matchingApi.getSentLikeById).toHaveBeenCalledTimes(3);

    view.unmount();
    jest.useRealTimers();
  });
});
