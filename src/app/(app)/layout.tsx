'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import AppShell from '@/components/layout/AppShell';

/**
 * (app) 레이아웃 — 인증 필요 영역
 * AppShell(TopHeader + BottomTabBar) 래핑
 * 미로그인 시 /login 리다이렉트
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const darkMode = useUIStore((state) => state.darkMode);

  // Zustand persist 하이드레이션
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  // 다크 모드 클래스 동기화
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // 인증 체크: 하이드레이션 후 미로그인이면 리다이렉트
  useEffect(() => {
    if (isHydrated && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isHydrated, isLoggedIn, router]);

  // 하이드레이션 전 또는 미로그인 시 로딩 표시
  if (!isHydrated || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-ivory dark:bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
