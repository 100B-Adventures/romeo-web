import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdultDeclarationPage from '../page';

const push = jest.fn();
const replace = jest.fn();
const logout = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ logout }),
}));

describe('성인 자기신고 화면 출구', () => {
  beforeEach(() => jest.clearAllMocks());

  it('N2 설정 버튼으로 회원 탈퇴 접근 경로를 연다', async () => {
    render(<AdultDeclarationPage />);

    await userEvent.click(screen.getByRole('button', { name: '설정 및 회원 탈퇴' }));

    expect(push).toHaveBeenCalledWith('/profile/settings');
  });

  it('N2 로그아웃 뒤 로그인 화면으로 이동한다', async () => {
    render(<AdultDeclarationPage />);

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(logout).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
