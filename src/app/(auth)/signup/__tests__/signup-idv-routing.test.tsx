import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '../page';
import { authApi } from '@/lib/api/auth';
import { useUIStore } from '@/store/uiStore';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    loginStart: jest.fn(),
    requestPhoneVerification: jest.fn(),
    signup: jest.fn(),
  },
}));

jest.mock('@/components/auth/IdentityVerificationFlow', () => ({
  IdentityVerificationFlow: ({ sessionId, onVerified, onRestart, continueLabel }: {
    sessionId: string;
    onVerified: (ticket: string) => void;
    onRestart: () => void | Promise<void>;
    continueLabel?: string;
  }) => (
    <div data-testid="idv-flow" data-session-id={sessionId}>
      <button type="button" onClick={() => onVerified('signup-ticket-web')}>{continueLabel || 'IDV 성공 대역'}</button>
      <button type="button" onClick={() => void onRestart()}>새 IDV 세션</button>
    </div>
  ),
}));

jest.setTimeout(15000);

describe('V10-WEB-SIGNUP 성인 본인확인 가입 통합', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/signup');
    useUIStore.setState({ interviewIntroPending: false });
  });

  async function moveToPhone() {
    const user = userEvent.setup();
    render(<SignupPage />);
    await user.click(screen.getByRole('button', { name: /^여성 매일 정오/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.type(screen.getByPlaceholderText('2~10자'), '지수');
    await user.click(screen.getByRole('button', { name: '본인확인으로' }));
    await user.type(screen.getByPlaceholderText('010-0000-0000'), '01012345678');
    return user;
  }

  it('P0-WEB-SIGNUP-01 정상: IDV 성공 즉시 가입을 끝내고 인터뷰 첫 화면으로 이동한다', async () => {
    (authApi.loginStart as jest.Mock).mockResolvedValue({
      accountState: 'NEW',
      nextStep: 'IDV',
      idvSession: { idvSessionId: 'idv-web-1', expiresAt: '2026-09-02T12:03:00+09:00', carriers: ['SKT'] },
      smsChallenge: null,
      block: null,
    });
    (authApi.signup as jest.Mock).mockResolvedValue({
      accessToken: 'access', refreshToken: 'refresh', userId: 1, nickname: '지수', gender: 'FEMALE', status: 'ACTIVE',
    });
    const user = await moveToPhone();

    await user.click(screen.getByRole('button', { name: '계속하기' }));
    await user.click(await screen.findByRole('button', { name: '가입 정보 입력하기' }));

    await waitFor(() => expect(authApi.signup).toHaveBeenCalledWith({
      phoneNumber: '01012345678',
      nickname: '지수',
      gender: 'FEMALE',
      signupTicket: 'signup-ticket-web',
    }));
    expect(push).toHaveBeenCalledWith('/interview');
    expect(window.sessionStorage.getItem('romeo:interview-intro:v1')).toBe('pending');
    expect(screen.queryByRole('button', { name: /^여성 매일 정오/ })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('2~10자')).not.toBeInTheDocument();
    expect(authApi.requestPhoneVerification).not.toHaveBeenCalled();
  });

  it('V10-WEB-SIGNUP-02 거절: 기존 회원은 가입 문자 인증으로 새지 않고 로그인으로 돌려보낸다', async () => {
    (authApi.loginStart as jest.Mock).mockResolvedValue({
      accountState: 'EXISTING', nextStep: 'SMS_CODE', idvSession: null, smsChallenge: {}, block: null,
    });
    const user = await moveToPhone();

    await user.click(screen.getByRole('button', { name: '계속하기' }));

    expect(await screen.findByText(/이미 가입된 번호/)).toBeInTheDocument();
    expect(authApi.requestPhoneVerification).not.toHaveBeenCalled();
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it('TC-WEB-SIGNUP-03 정상: handoff 세션부터 가입과 인터뷰 안내 표식까지 전 단계를 잇는다', async () => {
    window.sessionStorage.setItem('romeo:idv-signup-handoff:v1', JSON.stringify({
      phone: '01012345678',
      idvSessionId: 'idv-login-1',
    }));
    (authApi.signup as jest.Mock).mockResolvedValue({
      accessToken: 'access', refreshToken: 'refresh', userId: 1, nickname: '지수', gender: 'FEMALE', status: 'ACTIVE',
    });

    const user = userEvent.setup();
    render(<SignupPage />);

    const flow = await screen.findByTestId('idv-flow');
    expect(flow).toHaveAttribute('data-session-id', 'idv-login-1');
    expect(screen.queryByRole('button', { name: /^여성 매일 정오/ })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('2~10자')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('romeo:idv-signup-handoff:v1')).toBeNull();
    expect(window.location.search).toBe('');

    await user.click(screen.getByRole('button', { name: '가입 정보 입력하기' }));
    await user.click(await screen.findByRole('button', { name: /^여성 매일 정오/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.type(screen.getByPlaceholderText('2~10자'), '지수');
    await user.click(screen.getByRole('button', { name: '가입 계속하기' }));

    await waitFor(() => expect(authApi.signup).toHaveBeenCalledWith({
      phoneNumber: '01012345678',
      nickname: '지수',
      gender: 'FEMALE',
      signupTicket: 'signup-ticket-web',
    }));
    expect(push).toHaveBeenCalledWith('/interview');
    expect(window.sessionStorage.getItem('romeo:interview-intro:v1')).toBe('pending');
    expect(useUIStore.getState().interviewIntroPending).toBe(true);
    expect(authApi.loginStart).not.toHaveBeenCalled();
  });

  it('V10-WEB-SIGNUP-04 거절: 소비 뒤 새로고침과 직접 진입은 본인확인 세션을 복원하지 않는다', async () => {
    window.sessionStorage.setItem('romeo:idv-signup-handoff:v1', JSON.stringify({
      phone: '01012345678',
      idvSessionId: 'idv-login-once',
    }));

    const first = render(<SignupPage />);
    await screen.findByTestId('idv-flow');
    first.unmount();

    render(<SignupPage />);

    expect(screen.queryByTestId('idv-flow')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^여성 매일 정오/ })).toBeInTheDocument();
  });

  it('P0-WEB-IDV-BLOCKED-01 거절: 미성년 차단 화면은 실제 보관 항목과 파기 시점을 고지한다', async () => {
    (authApi.loginStart as jest.Mock).mockResolvedValue({
      accountState: 'BLOCKED_UNDERAGE',
      nextStep: 'BLOCKED',
      idvSession: null,
      smsChallenge: null,
      block: { message: '2027년 3월 14일부터 가입할 수 있어요.', adultAt: '2027-03-14' },
    });
    const user = await moveToPhone();

    await user.click(screen.getByRole('button', { name: '계속하기' }));

    expect(await screen.findByText(/전화번호 해시, 성인 도달일\(생년월일에서 도출되어 생년월일과 동등한 정보\), 차단 종료일, 차단 시각, 확인 사업자/)).toBeInTheDocument();
    expect(screen.getByText(/성인 도달일이 지난 뒤 다음 정리 시 삭제합니다/)).toBeInTheDocument();
    expect(screen.queryByText(/차단일로부터 90일/)).not.toBeInTheDocument();
    expect(screen.queryByText(/오늘 남은 기록은 없습니다/)).not.toBeInTheDocument();
  });

  it('V10-WEB-SIGNUP-05 거절: 변조된 handoff는 즉시 폐기하고 인증 화면을 열지 않는다', async () => {
    window.sessionStorage.setItem('romeo:idv-signup-handoff:v1', JSON.stringify({
      phone: 'not-a-phone',
      idvSessionId: '',
    }));

    render(<SignupPage />);

    await waitFor(() => expect(window.sessionStorage.getItem('romeo:idv-signup-handoff:v1')).toBeNull());
    expect(screen.queryByTestId('idv-flow')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^여성 매일 정오/ })).toBeInTheDocument();
  });

  it('P1-WEB-IDV-04c 정상: 결과 화면 재시작은 loginStart의 새 세션으로 통신사 선택 흐름을 교체한다', async () => {
    (authApi.loginStart as jest.Mock)
      .mockResolvedValueOnce({
        accountState: 'NEW',
        nextStep: 'IDV',
        idvSession: { idvSessionId: 'idv-old', expiresAt: '2026-09-04T12:03:00+09:00', carriers: ['SKT'] },
        smsChallenge: null,
        block: null,
      })
      .mockResolvedValueOnce({
        accountState: 'NEW',
        nextStep: 'IDV',
        idvSession: { idvSessionId: 'idv-new', expiresAt: '2026-09-04T12:06:00+09:00', carriers: ['SKT', 'KT'] },
        smsChallenge: null,
        block: null,
      });
    const user = await moveToPhone();

    await user.click(screen.getByRole('button', { name: '계속하기' }));
    expect(await screen.findByTestId('idv-flow')).toHaveAttribute('data-session-id', 'idv-old');
    await user.click(screen.getByRole('button', { name: '새 IDV 세션' }));

    await waitFor(() => expect(screen.getByTestId('idv-flow')).toHaveAttribute('data-session-id', 'idv-new'));
    expect(authApi.loginStart).toHaveBeenCalledTimes(2);
    expect(authApi.requestPhoneVerification).not.toHaveBeenCalled();
  });
});
