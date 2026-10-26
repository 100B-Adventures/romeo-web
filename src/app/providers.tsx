'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import Toast from '@/components/common/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * 클라이언트 프로바이더 — TanStack Query + 다크 모드 + 스토어 하이드레이션
 * 서버 컴포넌트인 layout.tsx에서 래핑하여 사용
 */
export default function Providers({ children }: ProvidersProps) {
  // QueryClient를 useState로 생성하여 SSR 시 공유 방지
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 윈도우 포커스 시 자동 refetch 비활성화
            refetchOnWindowFocus: false,
            // 재시도 1회
            retry: 1,
            // 5분간 캐시 유지
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  // 클라이언트 마운트 시 다크 모드 및 스토어 하이드레이션
  useEffect(() => {
    // Zustand persist 하이드레이션 (skipHydration 사용 중)
    useAuthStore.persist.rehydrate();

    // 다크 모드 초기 적용
    const stored = localStorage.getItem('ui-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const darkMode = parsed?.state?.darkMode ?? false;
        document.documentElement.classList.toggle('dark', darkMode);
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
  }, []);

  // 다크 모드 상태 변경 감지 및 html 클래스 동기화
  const darkMode = useUIStore((state) => state.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toast />
    </QueryClientProvider>
  );
}
