import { fireEvent, render, screen } from '@testing-library/react';
import SupportPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

describe('고객센터 정오 1회 추천 계약', () => {
  it('N-4-WEB-SUPPORT 정상 경로: 매칭 안내도 정오 한 분만 약속한다', () => {
    render(<SupportPage />);

    fireEvent.click(screen.getByRole('button', { name: /매칭은 어떻게 이루어지나요/ }));

    expect(screen.getByText(/매일 정오\(KST 12:00\)에 엄선된 한 분/)).toBeInTheDocument();
    expect(screen.queryByText(/매일 3회/)).not.toBeInTheDocument();
    expect(screen.queryByText(/오후 6시/)).not.toBeInTheDocument();
  });
});
