import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { authApi } from '@/lib/api/auth';

// 교차 코드리뷰 Codex 회수 항목 회귀: 모바일은 SUSPENDED 회원을 /suspended 로 보내는데
// 웹은 상태만 저장하고 /home 으로 보내던 불일치를 고정한다.

const push = jest.fn();
const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, back: jest.fn() }),
}));

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    loginStart: jest.fn(),
    requestPhoneVerification: jest.fn(),
    verifyPhone: jest.fn(),
    login: jest.fn(),
  },
}));

jest.setTimeout(15000);

describe('로그인: SUSPENDED 라우팅 정합', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    (authApi.loginStart as jest.Mock).mockResolvedValue({ nextStep: 'SMS_CODE', accountState: 'EXISTING', idvSession: null, smsChallenge: null, block: null });
    (authApi.requestPhoneVerification as jest.Mock).mockResolvedValue({});
    (authApi.verifyPhone as jest.Mock).mockResolvedValue({});
  });

  it('로그인 응답 status=SUSPENDED 면 /home 이 아니라 /suspended 로 보낸다', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      accessToken: 'a', refreshToken: 'r', userId: 1, nickname: '홍길동', gender: 'MALE', role: 'USER', status: 'SUSPENDED',
    });

    render(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    await user.click(screen.getByRole('button', { name: '계속하기' }));

    await waitFor(() => expect(authApi.requestPhoneVerification).toHaveBeenCalled());

    const otpInputs = await screen.findAllByRole('textbox');
    for (let i = 0; i < 6 && i < otpInputs.length; i++) {
      // 각 칸 입력 뒤 컴포넌트가 자동 포커스를 이동하므로 user.type을
      // 칸마다 연속 호출하면 user-event의 포커스 재조정과 경합해 칸이 비게 된다.
      fireEvent.change(otpInputs[i], { target: { value: String(i + 1) } });
    }

    const verifyBtn = await screen.findByRole('button', { name: '로그인' });
    await user.click(verifyBtn);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/suspended'));
    expect(push).not.toHaveBeenCalledWith('/home');
  });

  it('V10-WEB-IDV-04 신규 번호의 민감 handoff를 URL 없이 세션 저장소로 한 번만 넘긴다', async () => {
    (authApi.loginStart as jest.Mock).mockResolvedValue({
      nextStep: 'IDV',
      accountState: 'NEW',
      idvSession: { idvSessionId: 'idv-login-1', expiresAt: '2026-09-02T12:03:00+09:00', carriers: ['SKT'] },
      smsChallenge: null,
      block: null,
    });
    render(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    await user.click(screen.getByRole('button', { name: '계속하기' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/signup'));
    expect(push).not.toHaveBeenCalledWith(expect.stringContaining('01012345678'));
    expect(push).not.toHaveBeenCalledWith(expect.stringContaining('idv-login-1'));
    expect(window.location.search).toBe('');
    expect(window.history.state).not.toEqual(expect.objectContaining({
      phone: '01012345678',
      idvSessionId: 'idv-login-1',
    }));
    expect(window.sessionStorage.getItem('romeo:idv-signup-handoff:v1')).toBe(JSON.stringify({
      phone: '01012345678',
      idvSessionId: 'idv-login-1',
    }));
    expect(authApi.requestPhoneVerification).not.toHaveBeenCalled();
  });

  it('P1-WEB-IDV-01 거절: 미성년 차단은 입력 오류가 아니라 전용 차단 화면으로 보낸다', async () => {
    (authApi.loginStart as jest.Mock).mockResolvedValue({
      nextStep: 'BLOCKED',
      accountState: 'BLOCKED_UNDERAGE',
      idvSession: null,
      smsChallenge: null,
      block: {
        message: '만 19세가 되는 2027년 3월 14일부터 가입하실 수 있어요.',
        adultAt: '2027-03-14',
      },
    });
    render(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    await user.click(screen.getByRole('button', { name: '계속하기' }));

    expect(await screen.findByTestId('idv-blocked-screen')).toBeInTheDocument();
    expect(screen.getByText(/2027년 3월 14일부터/)).toBeInTheDocument();
    expect(screen.getByTestId('idv-blocked-screen')).toHaveTextContent('성인 도달일이 지난 뒤 다음 정리 시 삭제합니다');
    expect(screen.queryByText(/차단일로부터 90일/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('010-0000-0000')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /다시 시도/ })).not.toBeInTheDocument();
    expect(authApi.requestPhoneVerification).not.toHaveBeenCalled();
  });

  it('V39-WEB-LOGIN-01 정상·거절: 전화번호 이유 링크는 꺾쇠로 상태를 밝히고 요청 전에는 설명을 숨긴다', async () => {
    render(<LoginPage />);
    const user = userEvent.setup();
    const reason = screen.getByRole('button', { name: /왜 전화번호인가요/ });

    expect(reason).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/중복 계정 방지/)).not.toBeInTheDocument();

    await user.click(reason);
    expect(reason).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/중복 계정 방지/)).toBeInTheDocument();
  });
});
