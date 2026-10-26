import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuspendedPage from '../page';

const push = jest.fn();
const replace = jest.fn();
const logout = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, back: jest.fn() }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ logout }),
}));

describe('웹 정지 안내 화면 (모바일 /suspended 와 동일 계약)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('정지 안내 문구를 보여준다', () => {
    render(<SuspendedPage />);
    expect(screen.getByText('이용 정지')).toBeInTheDocument();
    expect(screen.getByText(/계정이 잠시/)).toBeInTheDocument();
  });

  it('로그아웃을 누르면 로그아웃 후 로그인 화면으로 보낸다', async () => {
    render(<SuspendedPage />);
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(logout).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
