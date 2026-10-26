export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
  userId?: number;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE';
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  profilePhoto?: string;
};

type RefreshCoordinatorOptions = {
  observedRefreshToken: string;
  sessionKey: string;
  readStoredTokens: () => RefreshedTokens | null;
  readStoredSessionKey: () => string | null;
  writeStoredTokens: (tokens: RefreshedTokens) => void;
  requestTokens: (refreshToken: string) => Promise<RefreshedTokens>;
  isSessionCurrent: () => boolean;
};

export class AuthSessionReplacedError extends Error {
  constructor() {
    super('Auth session was replaced during token refresh');
    this.name = 'AuthSessionReplacedError';
  }
}

const CROSS_TAB_LOCK_NAME = 'romeo-auth-refresh';
const inTabRefreshRequests = new Map<string, Promise<RefreshedTokens>>();

const requestOnce = (
  refreshToken: string,
  sessionKey: string,
  requestTokens: (token: string) => Promise<RefreshedTokens>,
): Promise<RefreshedTokens> => {
  const key = `${sessionKey}:${refreshToken}`;
  const pending = inTabRefreshRequests.get(key);
  if (pending) return pending;

  const request = requestTokens(refreshToken);
  inTabRefreshRequests.set(key, request);
  const clear = () => {
    if (inTabRefreshRequests.get(key) === request) inTabRefreshRequests.delete(key);
  };
  request.then(clear, clear);
  return request;
};

/**
 * 회전형 refresh token을 탭 간 한 번만 사용한다.
 *
 * <p>락을 획득한 뒤 localStorage를 다시 읽는 것이 핵심이다. 앞선 탭이 이미 회전했다면
 * 네트워크 요청을 반복하지 않고 그 탭이 저장한 새 토큰을 사용한다. Web Locks API가 없는
 * 브라우저는 기존 탭 내부 Promise 공유로 폴백한다.
 */
export const coordinateTokenRefresh = async ({
  observedRefreshToken,
  sessionKey,
  readStoredTokens,
  readStoredSessionKey,
  writeStoredTokens,
  requestTokens,
  isSessionCurrent,
}: RefreshCoordinatorOptions): Promise<RefreshedTokens> => {
  const refreshUnderLock = async (): Promise<RefreshedTokens> => {
    const stored = readStoredTokens();
    if (stored === null) {
      throw new Error('Auth session was removed before token refresh');
    }
    const storedSessionKey = readStoredSessionKey();
    if (storedSessionKey !== null && storedSessionKey !== sessionKey) {
      throw new AuthSessionReplacedError();
    }
    if (stored.refreshToken !== observedRefreshToken) {
      if (storedSessionKey === null) throw new AuthSessionReplacedError();
      return stored;
    }

    const tokens = await requestOnce(observedRefreshToken, sessionKey, requestTokens);
    if (!isSessionCurrent()) {
      throw new Error('Auth session changed during token refresh');
    }
    const latestStored = readStoredTokens();
    if (latestStored === null) {
      throw new Error('Auth session was removed during token refresh');
    }
    const latestSessionKey = readStoredSessionKey();
    if (latestSessionKey !== null && latestSessionKey !== sessionKey) {
      throw new AuthSessionReplacedError();
    }
    if (latestStored.refreshToken !== observedRefreshToken) {
      if (latestSessionKey === null) throw new AuthSessionReplacedError();
      return latestStored;
    }
    // 락을 놓기 전에 저장해야 다음 탭이 회전된 토큰을 재확인할 수 있다.
    writeStoredTokens(tokens);
    return tokens;
  };

  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(CROSS_TAB_LOCK_NAME, refreshUnderLock);
  }
  return refreshUnderLock();
};
