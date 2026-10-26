import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// v39.5 승인 탭: 오늘·히스토리·커뮤니티·프로필·더보기. live·meeting은 타입만 보존한다.
export type TabName = 'home' | 'history' | 'community' | 'profile' | 'live' | 'meeting' | 'more';

export const TAB_ROUTES: Record<TabName, string> = {
  home: '/home',
  history: '/history',
  community: '/community',
  profile: '/profile',
  live: '/home',
  meeting: '/home',
  more: '/more',
} as const;

// UI 상태 인터페이스
export interface UIState {
  activeTab: TabName;
  darkMode: boolean;
  toastMessage: string | null;
  interviewIntroPending: boolean;
  setActiveTab: (tab: TabName) => void;
  toggleDarkMode: () => void;
  showToast: (message: string, duration?: number) => void;
  markInterviewIntroPending: () => void;
  consumeInterviewIntroPending: () => boolean;
}

// 토스트 타이머 관리
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeTab: 'home',
      darkMode: false,
      toastMessage: null,
      interviewIntroPending: false,

      // 활성 탭 변경
      setActiveTab: (tab) => set({ activeTab: tab }),

      // 다크 모드 토글
      toggleDarkMode: () =>
        set((state) => {
          const next = !state.darkMode;

          // html 요소에 dark 클래스 즉시 적용
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next);
          }

          return { darkMode: next };
        }),

      // 토스트 메시지 표시 (기본 3초 후 자동 숨김)
      showToast: (message, duration = 3000) => {
        // 기존 타이머 해제
        if (toastTimer) {
          clearTimeout(toastTimer);
        }

        set({ toastMessage: message });

        toastTimer = setTimeout(() => {
          set({ toastMessage: null });
          toastTimer = null;
        }, duration);
      },

      // 가입 성공 직후 인터뷰 안내를 한 번만 여는 비영속 handoff다.
      // sessionStorage가 차단돼도 같은 App Router 세션 안에서는 안내를 건너뛰지 않는다.
      markInterviewIntroPending: () => set({ interviewIntroPending: true }),
      consumeInterviewIntroPending: () => {
        const pending = get().interviewIntroPending;
        if (pending) set({ interviewIntroPending: false });
        return pending;
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // darkMode만 persist (탭, 토스트는 매 세션 초기화)
      partialize: (state) => ({
        darkMode: state.darkMode,
      }),
    }
  )
);
