import { capturePaymentAuth, paymentAuthUnchanged } from '../authSnapshot';
import { useAuthStore, type User } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import axios from 'axios';

const FIRST_USER: User = {
  userId: 1,
  nickname: '첫 회원',
  gender: 'MALE',
  status: 'ACTIVE',
};

const SECOND_USER: User = {
  ...FIRST_USER,
  userId: 2,
  nickname: '다른 회원',
};

const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoggedIn: false,
    authGeneration: 0,
  });
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  jest.restoreAllMocks();
});

describe('결제 인증 소유권 스냅샷', () => {
  it('TOSS-A01 정상: 같은 회원의 401 토큰 갱신은 인증 세대를 유지해 결제 복구를 허용한다', () => {
    useAuthStore.getState().login(
      { accessToken: 'access-old', refreshToken: 'refresh-old' },
      FIRST_USER,
    );
    const snapshot = capturePaymentAuth();
    expect(snapshot).not.toBeNull();

    const refreshed = useAuthStore.getState().refreshTokens(
      { accessToken: 'access-new', refreshToken: 'refresh-new' },
      snapshot!.authGeneration,
    );

    expect(refreshed).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('access-new');
    expect(paymentAuthUnchanged(snapshot!)).toBe(true);
  });

  it('TOSS-A02 거절: 로그아웃 뒤 같은 회원 재로그인도 새 인증 세대이므로 원 결제를 자동 복구하지 않는다', () => {
    useAuthStore.getState().login(
      { accessToken: 'access-old', refreshToken: 'refresh-old' },
      FIRST_USER,
    );
    const snapshot = capturePaymentAuth()!;

    useAuthStore.getState().logout();
    useAuthStore.getState().login(
      { accessToken: 'access-new', refreshToken: 'refresh-new' },
      FIRST_USER,
    );

    expect(paymentAuthUnchanged(snapshot)).toBe(false);
  });

  it('TOSS-A03 거절: 다른 회원 로그인은 토큰 문자열과 무관하게 원 결제를 자동 복구하지 않는다', () => {
    useAuthStore.getState().login(
      { accessToken: 'access-old', refreshToken: 'refresh-old' },
      FIRST_USER,
    );
    const snapshot = capturePaymentAuth()!;

    useAuthStore.getState().login(
      { accessToken: 'access-other', refreshToken: 'refresh-other' },
      SECOND_USER,
    );

    expect(paymentAuthUnchanged(snapshot)).toBe(false);
  });

  it('TOSS-A04 정상: API 401 자동 갱신이 localStorage와 Zustand를 함께 바꾸고 같은 세대를 재시도한다', async () => {
    useAuthStore.getState().login(
      { accessToken: 'access-old', refreshToken: 'refresh-old' },
      FIRST_USER,
    );
    const generation = useAuthStore.getState().authGeneration;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'access-new', refreshToken: 'refresh-new' },
    });
    const adapter = jest.fn()
      .mockRejectedValueOnce({
        config: { headers: {}, url: '/payment-probe', method: 'get' },
        response: { status: 401, data: {} },
        request: {},
      })
      .mockImplementationOnce(async (config) => ({
        data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config,
      }));
    apiClient.defaults.adapter = adapter;

    const response = await apiClient.get('/payment-probe');

    expect(response.data).toEqual({ ok: true });
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      authGeneration: generation,
    });
    expect(localStorage.getItem('accessToken')).toBe('access-new');
    expect(adapter.mock.calls[1][0].headers.Authorization).toBe('Bearer access-new');
  });

  it('TOSS-A05 경합: 같은 인증 세대의 동시 401은 refresh token을 한 번만 사용한다', async () => {
    useAuthStore.getState().login(
      { accessToken: 'access-old', refreshToken: 'refresh-old' },
      FIRST_USER,
    );
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let resolveRefresh!: (value: { data: { accessToken: string; refreshToken: string } }) => void;
    const refresh = jest.spyOn(axios, 'post').mockImplementation(() => new Promise((resolve) => {
      resolveRefresh = resolve;
    }));
    const adapter = jest.fn().mockImplementation(async (config) => {
      if (!config._retry) {
        return Promise.reject({
          config,
          response: { status: 401, data: {} },
          request: {},
        });
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    });
    apiClient.defaults.adapter = adapter;

    const first = apiClient.get('/payment-probe-a');
    const second = apiClient.get('/payment-probe-b');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(refresh).toHaveBeenCalledTimes(1);

    resolveRefresh({ data: { accessToken: 'access-new', refreshToken: 'refresh-new' } });
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      isLoggedIn: true,
    });
  });

  it('TOSS-A06 교차 탭 계정 교체: 오래된 요청이 새 계정 토큰을 지우거나 재사용하지 않는다', async () => {
    useAuthStore.getState().login(
      { accessToken: 'access-old', refreshToken: 'refresh-old' },
      FIRST_USER,
    );
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let resolveRefresh!: (value: { data: { accessToken: string; refreshToken: string } }) => void;
    jest.spyOn(axios, 'post').mockImplementation(() => new Promise((resolve) => {
      resolveRefresh = resolve;
    }));
    const adapter = jest.fn().mockRejectedValue({
      config: { headers: {}, url: '/payment-probe', method: 'get' },
      response: { status: 401, data: {} },
      request: {},
    });
    apiClient.defaults.adapter = adapter;

    const staleRequest = apiClient.get('/payment-probe');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const replacementGeneration = useAuthStore.getState().authGeneration + 1;
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        accessToken: 'access-other',
        refreshToken: 'refresh-other',
        user: SECOND_USER,
        isLoggedIn: true,
        authGeneration: replacementGeneration,
      },
      version: 0,
    }));
    localStorage.setItem('accessToken', 'access-other');
    localStorage.setItem('refreshToken', 'refresh-other');
    resolveRefresh({ data: { accessToken: 'access-rotated-old', refreshToken: 'refresh-rotated-old' } });

    await expect(staleRequest).rejects.toThrow('Auth session was replaced during token refresh');
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('accessToken')).toBe('access-other');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-other');
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'access-other',
      refreshToken: 'refresh-other',
      user: SECOND_USER,
      isLoggedIn: true,
      authGeneration: replacementGeneration,
    });
  });
});
