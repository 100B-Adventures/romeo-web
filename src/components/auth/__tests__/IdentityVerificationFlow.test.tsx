import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdentityVerificationFlow } from '../IdentityVerificationFlow';
import { authApi, type IdentityStatusResponse } from '@/lib/api/auth';
import { WEB_IDV_REQUIRED_TERMS } from '@/lib/identityVerification';

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    startIdentityVerification: jest.fn(),
    getIdentityVerification: jest.fn(),
    retryIdentityVerification: jest.fn(),
  },
}));

jest.setTimeout(15000);

const success: IdentityStatusResponse = {
  status: 'SUCCEEDED',
  adult: true,
  failureCode: null,
  failureCategory: null,
  failureMessage: null,
  failureNextAction: null,
  retryCount: 0,
  retryAllowed: false,
  signupTicket: 'signup-ticket-1',
  block: null,
};

const underage: IdentityStatusResponse = {
  ...success,
  status: 'UNDERAGE',
  adult: false,
  signupTicket: null,
  block: {
    reason: 'UNDERAGE',
    adultAt: '2027-01-02',
    message: '2027년 1월 2일부터 가입할 수 있어요.',
  },
};

const retryableFailure: IdentityStatusResponse = {
  ...success,
  status: 'FAILED',
  adult: null,
  failureCode: 'TEMPORARY_PROVIDER_ERROR',
  failureCategory: 'TEMPORARY',
  failureMessage: '잠시 뒤 다시 시도해 주세요.',
  retryCount: 1,
  retryAllowed: true,
  signupTicket: null,
};

const expired: IdentityStatusResponse = {
  ...retryableFailure,
  status: 'EXPIRED',
  failureCode: 'TIMEOUT',
  failureMessage: '시간이 지났어요. 처음부터 다시 해 주세요.',
  retryAllowed: false,
};

const carrierMismatch: IdentityStatusResponse = {
  ...retryableFailure,
  failureCode: 'CARRIER_MISMATCH',
  failureMessage: '고르신 통신사와 번호가 달라요.',
};

function popupDouble() {
  const location = {
    href: 'about:blank',
    replace: jest.fn((target: string) => { location.href = target; }),
  };
  return {
    close: jest.fn(),
    location,
    document: { location },
    opener: window,
  } as unknown as Window;
}

describe('V10-WEB-IDV 웹 본인확인 4상태 통합', () => {
  const onVerified = jest.fn();
  const onSupport = jest.fn();
  const onRestart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS = 'idv.example.test';
    jest.spyOn(window, 'open').mockReturnValue(null);
    (authApi.startIdentityVerification as jest.Mock).mockResolvedValue({
      status: 'PENDING',
      pollAfterMs: 60000,
      expiresAt: new Date(Date.now() + 180000).toISOString(),
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS;
    jest.restoreAllMocks();
  });

  async function startFlow() {
    const user = userEvent.setup();
    render(
      <IdentityVerificationFlow
        sessionId="idv-session-1"
        onBack={jest.fn()}
        onRestart={onRestart}
        onVerified={onVerified}
        onSupport={onSupport}
      />,
    );
    await user.click(screen.getByRole('radio', { name: /^SKT SK텔레콤$/ }));
    await user.click(screen.getByRole('checkbox', { name: '4건에 모두 동의합니다' }));
    await user.click(screen.getByRole('button', { name: '통신사로 본인확인 시작하기' }));
    await screen.findByTestId('idv-progress-screen');
    return user;
  }

  it('V10-WEB-IDV-01 정상: 필수 약관 4건으로 시작하고 성공 표를 가입으로 넘긴다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(success);
    const user = await startFlow();

    expect(authApi.startIdentityVerification).toHaveBeenCalledWith(
      'idv-session-1',
      'SKT',
      expect.arrayContaining([...WEB_IDV_REQUIRED_TERMS]),
    );
    expect((authApi.startIdentityVerification as jest.Mock).mock.calls[0][2]).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await screen.findByRole('heading', { name: /만 19세 이상이/ });
    await user.click(screen.getByRole('button', { name: '큐피드 인터뷰 시작하기' }));

    expect(onVerified).toHaveBeenCalledWith('signup-ticket-1');
  });

  it('V10-WEB-IDV-02 거절: 미성년 결과는 차단 화면에서 끝나고 가입 표를 넘기지 않는다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(underage);
    const user = await startFlow();

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await screen.findByTestId('idv-blocked-screen');

    expect(screen.getByText(/2027년 1월 2일부터/)).toBeInTheDocument();
    expect(screen.getByTestId('idv-blocked-screen')).toHaveTextContent('성인 도달일이 지난 뒤 다음 정리 시 삭제합니다');
    expect(screen.queryByText(/차단일로부터 90일/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '큐피드 인터뷰 시작하기' })).not.toBeInTheDocument();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('P1-WEB-IDV-NOTICE-01 경계: 성인 도달일이 없으면 90일 폴백 보관과 미저장 항목을 고지한다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue({
      ...underage,
      block: {
        reason: 'UNDERAGE',
        adultAt: null,
        message: '만 19세가 되면 가입하실 수 있어요.',
      },
    });
    const user = await startFlow();

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await screen.findByTestId('idv-blocked-screen');

    expect(screen.getByText(/성인 도달일을 확인할 수 없어/)).toHaveTextContent('차단일로부터 90일 뒤 종료');
    expect(screen.getByText(/성인 도달일을 확인할 수 없어/)).toHaveTextContent('차단 종료일이 지난 뒤 다음 정리 시 삭제');
    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('생성 후 90일이 지난 다음 정리 시 삭제');
    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('미성년 여부');
    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('이름·생년월일 원본·CI·DI·1회용 가입표는 저장하지 않습니다');
  });

  it('P1-WEB-IDV-NOTICE-02 정상: 선택 전과 성공 후에 DI 해시·사업자·세션 90일 보관을 같은 계약으로 고지한다', async () => {
    const user = userEvent.setup();
    render(
      <IdentityVerificationFlow
        sessionId="idv-session-1"
        onBack={jest.fn()}
        onRestart={onRestart}
        onVerified={onVerified}
        onSupport={onSupport}
      />,
    );

    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('생성 후 90일이 지난 다음 정리 시 삭제');
    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('처리 결과에 따라 실패 사유');
    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('DI 해시');
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(success);
    await user.click(screen.getByRole('radio', { name: /^SKT SK텔레콤$/ }));
    await user.click(screen.getByRole('checkbox', { name: '4건에 모두 동의합니다' }));
    await user.click(screen.getByRole('button', { name: '통신사로 본인확인 시작하기' }));
    await user.click(await screen.findByRole('button', { name: '인증을 마쳤어요' }));

    expect(await screen.findByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('별도 자동 파기 기한 없이');
    expect(screen.getByText(/본인확인 세션에는 세션 식별값/)).toHaveTextContent('회원 계정이 물리 삭제될 때 함께 삭제');
  });

  it('V10-WEB-IDV-03 경계: SUCCEEDED여도 가입 표가 없으면 성공으로 취급하지 않는다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue({ ...success, signupTicket: null });
    const user = await startFlow();

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /본인확인이/ })).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: '큐피드 인터뷰 시작하기' })).not.toBeInTheDocument();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('V10-WEB-IDV-04 정상: API 응답을 기다리기 전 클릭 동기 구간에 빈 사업자 창을 선개방한다', async () => {
    const providerWindow = popupDouble();
    let resolveStart!: (value: { status: 'PENDING'; pollAfterMs: number; expiresAt: string; handoff: string }) => void;
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    (authApi.startIdentityVerification as jest.Mock).mockReturnValue(new Promise((resolve) => {
      resolveStart = resolve;
    }));

    const user = userEvent.setup();
    render(
      <IdentityVerificationFlow
        sessionId="idv-session-1"
        onBack={jest.fn()}
        onRestart={onRestart}
        onVerified={onVerified}
        onSupport={onSupport}
      />,
    );
    await user.click(screen.getByRole('radio', { name: /^SKT SK텔레콤$/ }));
    await user.click(screen.getByRole('checkbox', { name: '4건에 모두 동의합니다' }));
    await user.click(screen.getByRole('button', { name: '통신사로 본인확인 시작하기' }));

    expect(window.open).toHaveBeenCalledWith('about:blank', '_blank', 'popup');
    expect(providerWindow.opener).toBe(window);
    expect(providerWindow.location.href).toBe('about:blank');

    resolveStart({
      status: 'PENDING',
      pollAfterMs: 60000,
      expiresAt: new Date(Date.now() + 180000).toISOString(),
      handoff: 'https://idv.example.test/provider-session',
    });

    await waitFor(() => expect(providerWindow.location.href).toBe('https://idv.example.test/provider-session'));
    expect(providerWindow.opener).toBeNull();
    expect(providerWindow.close).not.toHaveBeenCalled();
  });

  it('V10-WEB-IDV-05 거절: handoff가 없으면 선개방 창을 닫는다', async () => {
    const providerWindow = popupDouble();
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    await startFlow();

    await waitFor(() => expect(providerWindow.close).toHaveBeenCalledTimes(1));
  });

  it('V10-WEB-IDV-05b 거절: 사업자 시작 API가 실패하면 선개방 창을 닫는다', async () => {
    const providerWindow = popupDouble();
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    (authApi.startIdentityVerification as jest.Mock).mockRejectedValueOnce(new Error('provider unavailable'));
    const user = userEvent.setup();
    render(
      <IdentityVerificationFlow
        sessionId="idv-session-1"
        onBack={jest.fn()}
        onRestart={jest.fn()}
        onVerified={onVerified}
        onSupport={onSupport}
      />,
    );
    await user.click(screen.getByRole('radio', { name: /^SKT SK텔레콤$/ }));
    await user.click(screen.getByRole('checkbox', { name: '4건에 모두 동의합니다' }));
    await user.click(screen.getByRole('button', { name: '통신사로 본인확인 시작하기' }));

    await waitFor(() => expect(providerWindow.close).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert')).toHaveTextContent('provider unavailable');
  });

  it('P0-WEB-IDV-HOST-03 거절: 시작과 재열기에서 허용목록 밖 주소를 열지 않는다', async () => {
    const providerWindow = popupDouble();
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    (authApi.startIdentityVerification as jest.Mock).mockResolvedValue({
      status: 'PENDING',
      pollAfterMs: 60000,
      expiresAt: new Date(Date.now() + 180000).toISOString(),
      handoff: 'https://attacker.example/idv',
    });
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue({
      ...success,
      status: 'PENDING',
      adult: null,
      signupTicket: null,
    });

    const user = await startFlow();

    await waitFor(() => expect(providerWindow.close).toHaveBeenCalledTimes(1));
    expect(providerWindow.location.href).toBe('about:blank');

    await user.click(screen.getByRole('button', { name: '인증 문자 다시 받기' }));
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(authApi.getIdentityVerification).toHaveBeenCalledWith('idv-session-1');
  });

  it('V10-WEB-IDV-06 정상: 재시도도 응답 전에 창을 선개방하고 handoff로 이동한다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(retryableFailure);
    const user = await startFlow();
    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await screen.findByRole('button', { name: '다시 시도하기' });

    const providerWindow = popupDouble();
    let resolveRetry!: (value: { status: 'PENDING'; attemptNo: number; pollAfterMs: number; expiresAt: string; handoff: string }) => void;
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    (authApi.retryIdentityVerification as jest.Mock).mockReturnValue(new Promise((resolve) => {
      resolveRetry = resolve;
    }));

    await user.click(screen.getByRole('button', { name: '다시 시도하기' }));

    expect(window.open).toHaveBeenCalledWith('about:blank', '_blank', 'popup');
    expect(providerWindow.location.href).toBe('about:blank');

    const retryExpiresAt = new Date(Date.now() + 120000).toISOString();
    resolveRetry({
      status: 'PENDING',
      attemptNo: 2,
      pollAfterMs: 45000,
      expiresAt: retryExpiresAt,
      handoff: 'https://idv.example.test/retry',
    });

    await waitFor(() => expect(providerWindow.location.href).toBe('https://idv.example.test/retry'));
    expect(providerWindow.close).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/남은 시간 (1:59|2:00)/)).toBeInTheDocument();

    (window.open as jest.Mock).mockClear();
    await user.click(screen.getByRole('button', { name: '인증 문자 다시 받기' }));
    expect(window.open).toHaveBeenCalledWith('https://idv.example.test/retry', '_blank', 'noopener,noreferrer');
  });

  it('P1-WEB-IDV-02 경계: 실제 retry DTO는 새 handoff를 반영하고 기존 만료와 폴링을 보존한다', async () => {
    const originalExpiresAt = new Date(Date.now() + 180000).toISOString();
    (authApi.startIdentityVerification as jest.Mock).mockResolvedValue({
      status: 'PENDING',
      pollAfterMs: 60000,
      expiresAt: originalExpiresAt,
    });
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(retryableFailure);
    const intervalSpy = jest.spyOn(window, 'setInterval');
    const user = await startFlow();
    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await screen.findByRole('button', { name: '다시 시도하기' });
    intervalSpy.mockClear();

    const providerWindow = popupDouble();
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    (authApi.retryIdentityVerification as jest.Mock).mockResolvedValue({
      status: 'PENDING',
      attemptNo: 2,
      handoff: 'https://idv.example.test/retry-contract',
    });

    await user.click(screen.getByRole('button', { name: '다시 시도하기' }));

    await waitFor(() => expect(providerWindow.location.href).toBe('https://idv.example.test/retry-contract'));
    expect(screen.getByLabelText(/남은 시간 (2:5[0-9]|3:00)/)).toBeInTheDocument();
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    (window.open as jest.Mock).mockClear();
    await user.click(screen.getByRole('button', { name: '인증 문자 다시 받기' }));
    expect(window.open).toHaveBeenCalledWith('https://idv.example.test/retry-contract', '_blank', 'noopener,noreferrer');
  });

  it('P0-WEB-IDV-HOST-04 거절: 재시도 응답의 허용목록 밖 주소를 열지 않는다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(retryableFailure);
    const user = await startFlow();
    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await screen.findByRole('button', { name: '다시 시도하기' });

    const providerWindow = popupDouble();
    (window.open as jest.Mock).mockReturnValue(providerWindow);
    (authApi.retryIdentityVerification as jest.Mock).mockResolvedValue({
      status: 'PENDING',
      attemptNo: 2,
      pollAfterMs: 45000,
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      handoff: 'https://attacker.example/retry',
    });

    await user.click(screen.getByRole('button', { name: '다시 시도하기' }));

    await waitFor(() => expect(providerWindow.close).toHaveBeenCalledTimes(1));
    expect(providerWindow.location.href).toBe('about:blank');
  });

  it('P1-WEB-IDV-03 거절: 만료 상태는 실패 세션 재호출 대신 새 세션 시작을 제공한다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(expired);
    const user = await startFlow();

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await user.click(await screen.findByRole('button', { name: '새 본인확인 시작하기' }));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(authApi.retryIdentityVerification).not.toHaveBeenCalled();
  });

  it('P1-WEB-IDV-04 거절: 통신사 불일치는 같은 통신사 재호출 대신 선택 화면으로 복귀한다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(carrierMismatch);
    const user = await startFlow();

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    await user.click(await screen.findByRole('button', { name: '통신사 다시 고르고 시도하기' }));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(authApi.retryIdentityVerification).not.toHaveBeenCalled();
  });

  it('P1-WEB-IDV-04b 경합: 새 세션을 여는 동안 연속 클릭해도 재시작은 한 번만 요청한다', async () => {
    (authApi.getIdentityVerification as jest.Mock).mockResolvedValue(carrierMismatch);
    let resolveRestart!: () => void;
    onRestart.mockReturnValueOnce(new Promise<void>((resolve) => {
      resolveRestart = resolve;
    }));
    const user = await startFlow();

    await user.click(screen.getByRole('button', { name: '인증을 마쳤어요' }));
    const restartButton = await screen.findByRole('button', { name: '통신사 다시 고르고 시도하기' });
    await user.dblClick(restartButton);

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '새 본인확인을 여는 중입니다' })).toBeDisabled();
    resolveRestart();
    await waitFor(() => expect(restartButton).toBeEnabled());
  });

  it('P1-WEB-IDV-04d 경합: 진행 화면의 통신사 재선택도 같은 재시작 잠금을 사용한다', async () => {
    let resolveRestart!: () => void;
    onRestart.mockReturnValueOnce(new Promise<void>((resolve) => {
      resolveRestart = resolve;
    }));
    const user = await startFlow();
    const chooseCarrier = screen.getByRole('button', { name: '그만두고 통신사 다시 고르기' });

    await user.dblClick(chooseCarrier);

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '새 본인확인을 여는 중입니다' })).toBeDisabled();
    resolveRestart();
    await waitFor(() => expect(chooseCarrier).toBeEnabled());
  });
});
