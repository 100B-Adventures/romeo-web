'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/**
 * (auth) 레이아웃 — 인증 페이지 전용
 * AppShell(탭바) 없음. 중앙 정렬. 5성급 호텔 감성 배경.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((state) => state.darkMode);

  // 다크 모드 클래스 동기화
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg flex flex-col items-center justify-center px-4 py-12">
      {/* 장식: 상단 골드 라인 */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold dark:via-dark-gold to-transparent" />

      {/* 로고 */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gold dark:text-dark-gold">
          Romeo & Cupid
        </h1>
        <p className="mt-1.5 text-sm tracking-widest uppercase text-subtext dark:text-[var(--subtext)]">
          Premium Matching
        </p>
      </div>

      {/* 콘텐츠 카드 */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* 하단 장식 텍스트 */}
      <p className="mt-12 text-sm text-subtext/50 dark:text-[var(--subtext)]/50">
        &copy; 2026 Romeo & Cupid
      </p>
    </div>
  );
}
