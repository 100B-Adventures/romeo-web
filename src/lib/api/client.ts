import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  AuthSessionReplacedError,
  coordinateTokenRefresh,
  RefreshedTokens,
} from './refreshCoordinator';

// 빌드 시 주입되는 환경변수 우선, 없으면 로컬 개발 기본값
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
};

export const REFRESH_REQUEST_TIMEOUT_MS = 45_000;

class MissingRefreshTokenError extends Error {}

export function isAuthRefreshRejected(refreshError: unknown): boolean {
  if (refreshError instanceof MissingRefreshTokenError) return true;
  const status = (refreshError as { response?: { status?: number } } | null)?.response?.status;
  return status === 400 || status === 401;
}

const readPersistedSessionKey = (): string | null => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const state = JSON.parse(raw)?.state;
    const userId = state?.user?.userId;
    const generation = state?.authGeneration;
    return Number.isSafeInteger(userId) && Number.isSafeInteger(generation)
      ? `user-${userId}:generation-${generation}`
      : null;
  } catch {
    return null;
  }
};

export const requestRefreshTokens = (refreshToken: string): Promise<RefreshedTokens> => axios.post(
  `${getApiUrl()}/auth/token/refresh`,
  { refreshToken },
  { timeout: REFRESH_REQUEST_TIMEOUT_MS },
).then((response) => response.data as RefreshedTokens);

const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type AuthenticatedRequestConfig = { _retry?: boolean; _authGeneration?: number };

const refreshAuthSessionForState = async (
  authAtRefreshStart: ReturnType<typeof useAuthStore.getState>,
): Promise<RefreshedTokens> => {
  const trackedStoreSession = Boolean(authAtRefreshStart.isLoggedIn && authAtRefreshStart.user);
  const refreshGeneration = authAtRefreshStart.authGeneration;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new MissingRefreshTokenError('No refresh token');

  const sessionKey = trackedStoreSession
    ? `user-${authAtRefreshStart.user!.userId}:generation-${refreshGeneration}`
    : readPersistedSessionKey() ?? 'untracked';
  const refreshed = await coordinateTokenRefresh({
    observedRefreshToken: refreshToken,
    sessionKey,
    readStoredTokens: () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      return storedAccessToken && storedRefreshToken
        ? { accessToken: storedAccessToken, refreshToken: storedRefreshToken }
        : null;
    },
    readStoredSessionKey: readPersistedSessionKey,
    writeStoredTokens: ({ accessToken, refreshToken: rotatedRefreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', rotatedRefreshToken);
    },
    requestTokens: requestRefreshTokens,
    isSessionCurrent: () => !trackedStoreSession
      || useAuthStore.getState().authGeneration === refreshGeneration,
  });

  if (trackedStoreSession) {
    const updated = useAuthStore.getState().refreshTokens(
      { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken },
      refreshGeneration,
    );
    if (!updated) throw new Error('Auth session changed during token refresh');
    if (refreshed.status) {
      const userPatch: Parameters<ReturnType<typeof useAuthStore.getState>['updateUser']>[0] = {
        status: refreshed.status,
      };
      if (refreshed.nickname != null) userPatch.nickname = refreshed.nickname;
      if (refreshed.gender !== undefined) userPatch.gender = refreshed.gender;
      if (refreshed.profilePhoto != null) userPatch.profilePhoto = refreshed.profilePhoto;
      useAuthStore.getState().updateUser(userPatch);
    } else {
      // 다른 탭이 refresh 를 끝낸 경우 coordinator 결과에는 사용자 메타데이터가 없을 수 있다.
      // persisted user 를 다시 읽어 현재 탭도 관리자 상태 변경을 즉시 반영한다.
      await useAuthStore.persist.rehydrate();
    }
  } else {
    localStorage.setItem('accessToken', refreshed.accessToken);
    localStorage.setItem('refreshToken', refreshed.refreshToken);
  }
  return refreshed;
};

export const refreshCurrentAuthSession = async (): Promise<RefreshedTokens> => {
  const authAtRefreshStart = useAuthStore.getState();
  if (!authAtRefreshStart.isLoggedIn || !authAtRefreshStart.user) {
    throw new Error('No active auth session');
  }
  return refreshAuthSessionForState(authAtRefreshStart);
};

export const recoverFromAuthRefreshFailure = async (
  refreshError: unknown,
  expectedGeneration: number,
): Promise<'session-replaced' | 'logged-out' | 'session-kept'> => {
  if (refreshError instanceof AuthSessionReplacedError
    || useAuthStore.getState().authGeneration !== expectedGeneration) {
    await useAuthStore.persist.rehydrate();
    return 'session-replaced';
  }
  if (!isAuthRefreshRejected(refreshError)) return 'session-kept';
  useAuthStore.getState().logout();
  return 'logged-out';
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    (config as typeof config & AuthenticatedRequestConfig)._authGeneration = useAuthStore.getState().authGeneration;
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & AuthenticatedRequestConfig;

    // 에러 응답 로깅
    if (error.response) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('[API Network Error]', {
        url: error.config?.url,
        method: error.config?.method,
        message: 'Network error - no response received',
      });
    } else {
      console.error('[API Error]', error.message);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest._authGeneration !== undefined
        && originalRequest._authGeneration !== useAuthStore.getState().authGeneration) {
        return Promise.reject(new Error('Auth session changed before retry'));
      }
      originalRequest._retry = true;
      const authAtRefreshStart = useAuthStore.getState();
      const refreshGeneration = authAtRefreshStart.authGeneration;

      try {
        const { accessToken: newAccessToken } = await refreshAuthSessionForState(authAtRefreshStart);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        const recovery = await recoverFromAuthRefreshFailure(refreshError, refreshGeneration);
        if (recovery !== 'logged-out') return Promise.reject(refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // ErrorResponse 형식으로 변환하여 throw
    const errorResponse = error.response?.data;
    if (errorResponse && errorResponse.code && errorResponse.message) {
      // 이미 ErrorResponse 형식인 경우 그대로 전달
      return Promise.reject({
        ...error,
        errorResponse,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
