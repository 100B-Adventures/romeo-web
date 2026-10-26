import { act, render, screen } from '@testing-library/react';
import Toast from '../Toast';
import { useUIStore } from '@/store/uiStore';

describe('TC-HEART-TOAST-WEB 전역 안내 표시 계약', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useUIStore.setState({ toastMessage: null });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('TC-HEART-TOAST-WEB-01 정상 경로: showToast 값이 화면 상태 메시지로 보인다', () => {
    render(<Toast />);

    act(() => useUIStore.getState().showToast('하트가 부족해요.'));

    expect(screen.getByRole('status')).toHaveTextContent('하트가 부족해요.');
  });

  it('TC-HEART-TOAST-WEB-02 거절 조건: 메시지가 없으면 빈 토스트를 그리지 않는다', () => {
    render(<Toast />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
