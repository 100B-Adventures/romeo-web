import { coordinateTokenRefresh, RefreshedTokens } from '../refreshCoordinator';
import axios from 'axios';
import { recoverFromAuthRefreshFailure, REFRESH_REQUEST_TIMEOUT_MS, requestRefreshTokens } from '../client';
import { useAuthStore } from '@/store/authStore';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
    post: jest.fn(),
  },
}));

describe('웹 다중 탭 refresh 직렬화', () => {
  const originalLocks = navigator.locks;

  afterEach(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: originalLocks });
  });

  it('N-1-WEB-RECOVERY 토큰 거부만 로그아웃하고 5xx는 현재 세션을 유지한다', async () => {
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { userId: 17, nickname: '심사계정', gender: 'MALE', status: 'PENDING_APPROVAL' },
      isLoggedIn: true,
      authGeneration: 7,
    });

    const unavailable = Object.assign(new Error('unavailable'), { response: { status: 503 } });
    await expect(recoverFromAuthRefreshFailure(unavailable, 7)).resolves.toBe('session-kept');
    expect(useAuthStore.getState().isLoggedIn).toBe(true);

    const rejected = Object.assign(new Error('rejected'), { response: { status: 401 } });
    await expect(recoverFromAuthRefreshFailure(rejected, 7)).resolves.toBe('logged-out');
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });

  it('AUTH-WEB-REFRESH-01 같은 토큰의 동시 갱신은 서버를 한 번만 호출하고 회전 결과를 공유한다', async () => {
    let lockTail = Promise.resolve();
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: jest.fn((_name: string, callback: () => Promise<RefreshedTokens>) => {
          const next = lockTail.then(callback);
          lockTail = next.then(() => undefined, () => undefined);
          return next;
        }),
      },
    });

    let stored: RefreshedTokens = { accessToken: 'old-access', refreshToken: 'old-refresh' };
    const requestTokens = jest.fn(async () => ({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    }));
    const options = {
      observedRefreshToken: 'old-refresh',
      sessionKey: 'user-1:generation-1',
      readStoredTokens: () => stored,
      readStoredSessionKey: () => 'user-1:generation-1',
      writeStoredTokens: (tokens: RefreshedTokens) => { stored = tokens; },
      requestTokens,
      isSessionCurrent: () => true,
    };

    const [first, second] = await Promise.all([
      coordinateTokenRefresh(options),
      coordinateTokenRefresh(options),
    ]);

    expect(requestTokens).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(second).toEqual(first);
  });

  it('AUTH-WEB-REFRESH-02 Web Locks 미지원 브라우저는 탭 내부 Promise를 공유한다', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    let stored: RefreshedTokens = { accessToken: 'old-access', refreshToken: 'old-refresh' };
    const requestTokens = jest.fn(async () => ({
      accessToken: 'fallback-access',
      refreshToken: 'fallback-refresh',
    }));
    const options = {
      observedRefreshToken: 'old-refresh',
      sessionKey: 'user-1:generation-2',
      readStoredTokens: () => stored,
      readStoredSessionKey: () => 'user-1:generation-2',
      writeStoredTokens: (tokens: RefreshedTokens) => { stored = tokens; },
      requestTokens,
      isSessionCurrent: () => true,
    };

    const [first, second] = await Promise.all([
      coordinateTokenRefresh(options),
      coordinateTokenRefresh(options),
    ]);

    expect(requestTokens).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('AUTH-WEB-REFRESH-03 락 대기 중 다른 탭이 로그아웃했으면 서버 갱신을 시작하지 않는다', async () => {
    let releaseLock!: () => void;
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: jest.fn((_name: string, callback: () => Promise<RefreshedTokens>) =>
          new Promise<RefreshedTokens>((resolve, reject) => {
            releaseLock = () => { callback().then(resolve, reject); };
          })),
      },
    });
    let stored: RefreshedTokens | null = {
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    };
    const requestTokens = jest.fn(async () => ({
      accessToken: 'unexpected-access',
      refreshToken: 'unexpected-refresh',
    }));
    const writeStoredTokens = jest.fn();

    const refresh = coordinateTokenRefresh({
      observedRefreshToken: 'old-refresh',
      sessionKey: 'user-1:generation-3',
      readStoredTokens: () => stored,
      readStoredSessionKey: () => 'user-1:generation-3',
      writeStoredTokens,
      requestTokens,
      isSessionCurrent: () => false,
    });
    stored = null;
    releaseLock();

    await expect(refresh).rejects.toThrow('Auth session was removed before token refresh');

    expect(requestTokens).not.toHaveBeenCalled();
    expect(writeStoredTokens).not.toHaveBeenCalled();
  });

  it('AUTH-WEB-REFRESH-04 refresh 네트워크 요청은 QA에서 관찰한 30초 지연보다 긴 timeout을 전달한다', async () => {
    const refreshed = { accessToken: 'new-access', refreshToken: 'new-refresh' };
    jest.mocked(axios.post).mockResolvedValue({ data: refreshed });

    await expect(requestRefreshTokens('old-refresh')).resolves.toEqual(refreshed);

    expect(REFRESH_REQUEST_TIMEOUT_MS).toBeGreaterThan(30_000);
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/auth/token/refresh',
      { refreshToken: 'old-refresh' },
      { timeout: REFRESH_REQUEST_TIMEOUT_MS },
    );
  });

  it('AUTH-WEB-REFRESH-05 갱신 요청 중 다른 탭이 로그아웃하면 회전 토큰을 다시 저장하지 않는다', async () => {
    let stored: RefreshedTokens | null = {
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    };
    let resolveRequest!: (tokens: RefreshedTokens) => void;
    const requestTokens = jest.fn(() => new Promise<RefreshedTokens>((resolve) => {
      resolveRequest = resolve;
    }));
    const writeStoredTokens = jest.fn();

    const refresh = coordinateTokenRefresh({
      observedRefreshToken: 'old-refresh',
      sessionKey: 'user-1:generation-4',
      readStoredTokens: () => stored,
      readStoredSessionKey: () => 'user-1:generation-4',
      writeStoredTokens,
      requestTokens,
      isSessionCurrent: () => true,
    });

    await Promise.resolve();
    stored = null;
    resolveRequest({ accessToken: 'rotated-access', refreshToken: 'rotated-refresh' });

    await expect(refresh).rejects.toThrow('Auth session was removed during token refresh');
    expect(writeStoredTokens).not.toHaveBeenCalled();
  });

  it('AUTH-WEB-REFRESH-06 갱신 요청 중 다른 계정으로 바뀌면 새 세션 토큰을 덮지 않는다', async () => {
    let stored: RefreshedTokens = {
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    };
    let storedSessionKey = 'user-1:generation-5';
    let resolveRequest!: (tokens: RefreshedTokens) => void;
    const requestTokens = jest.fn(() => new Promise<RefreshedTokens>((resolve) => {
      resolveRequest = resolve;
    }));
    const writeStoredTokens = jest.fn();

    const refresh = coordinateTokenRefresh({
      observedRefreshToken: 'old-refresh',
      sessionKey: 'user-1:generation-5',
      readStoredTokens: () => stored,
      readStoredSessionKey: () => storedSessionKey,
      writeStoredTokens,
      requestTokens,
      isSessionCurrent: () => true,
    });

    await Promise.resolve();
    stored = { accessToken: 'other-access', refreshToken: 'other-refresh' };
    storedSessionKey = 'user-2:generation-6';
    resolveRequest({ accessToken: 'rotated-access', refreshToken: 'rotated-refresh' });

    await expect(refresh).rejects.toThrow('Auth session was replaced during token refresh');
    expect(writeStoredTokens).not.toHaveBeenCalled();
  });

  it('AUTH-WEB-REFRESH-07 락 대기 중 다른 계정으로 바뀌면 그 계정 토큰으로 원 요청을 재시도하지 않는다', async () => {
    let releaseLock!: () => void;
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: jest.fn((_name: string, callback: () => Promise<RefreshedTokens>) =>
          new Promise<RefreshedTokens>((resolve, reject) => {
            releaseLock = () => { callback().then(resolve, reject); };
          })),
      },
    });
    let stored = { accessToken: 'old-access', refreshToken: 'old-refresh' };
    let storedSessionKey = 'user-1:generation-7';
    const requestTokens = jest.fn(async () => ({
      accessToken: 'unexpected-access',
      refreshToken: 'unexpected-refresh',
    }));
    const writeStoredTokens = jest.fn();

    const refresh = coordinateTokenRefresh({
      observedRefreshToken: 'old-refresh',
      sessionKey: 'user-1:generation-7',
      readStoredTokens: () => stored,
      readStoredSessionKey: () => storedSessionKey,
      writeStoredTokens,
      requestTokens,
      isSessionCurrent: () => true,
    });
    stored = { accessToken: 'other-access', refreshToken: 'other-refresh' };
    storedSessionKey = 'user-2:generation-8';
    releaseLock();

    await expect(refresh).rejects.toThrow('Auth session was replaced during token refresh');
    expect(requestTokens).not.toHaveBeenCalled();
    expect(writeStoredTokens).not.toHaveBeenCalled();
  });
});
