import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 유저 정보 인터페이스
export interface User {
  userId: number;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  profilePhoto?: string;
  percentileRank?: number;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  role?: 'USER' | 'ADMIN' | 'OPERATOR';
}

// 인증 상태 인터페이스
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoggedIn: boolean;
  /** 명시 로그인·로그아웃 때만 증가한다. 같은 회원의 401 토큰 갱신은 유지한다. */
  authGeneration: number;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  refreshTokens: (
    tokens: { accessToken: string; refreshToken: string },
    expectedGeneration: number,
  ) => boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// SSR 환경에서 안전하게 동작하도록 skipHydration 사용
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoggedIn: false,
      authGeneration: 0,

      // 로그인: 토큰 저장 및 유저 정보 설정
      login: (tokens, user) => {
        set((state) => ({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
          isLoggedIn: true,
          authGeneration: state.authGeneration + 1,
        }));

        // persisted session identity를 먼저 기록한 뒤 개별 토큰을 공개해 탭 간 소유권 판정을 보장한다.
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
      },

      // 401 자동 갱신: 같은 로그인 세션일 때만 토큰을 교체하고 인증 세대는 유지한다.
      refreshTokens: (tokens, expectedGeneration) => {
        const state = get();
        if (!state.isLoggedIn || !state.user || state.authGeneration !== expectedGeneration) {
          return false;
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
        return true;
      },

      // 로그아웃: 모든 인증 데이터 초기화
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        set((state) => ({
          accessToken: null,
          refreshToken: null,
          user: null,
          isLoggedIn: false,
          authGeneration: state.authGeneration + 1,
        }));
      },

      // 유저 정보 부분 업데이트 (프로필 수정 등)
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // SSR 환경에서는 빈 스토리지 반환
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // 토큰은 이미 localStorage에 개별 저장하므로 user와 isLoggedIn만 persist
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        authGeneration: state.authGeneration,
      }),
      skipHydration: true,
    }
  )
);
