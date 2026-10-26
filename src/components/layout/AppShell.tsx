'use client';

import { usePathname } from 'next/navigation';
import TopHeader from '@/components/layout/TopHeader';
import BottomTabBar from '@/components/layout/BottomTabBar';
import StatusBar from '@/components/layout/StatusBar';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * 앱 셸 레이아웃 — 상단 헤더 + 콘텐츠 영역 + 하단 탭 바
 * 인증된 사용자 화면에서 공통으로 사용
 */
export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isProfileDetail = /^\/profiles\/[^/]+$/.test(pathname);
  const hasCustomHeader = isProfileDetail || pathname === '/ok-sent';
  const isMagazinePage = pathname === '/home' || isProfileDetail || pathname === '/ok-sent';

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg">
      <StatusBar />
      {!hasCustomHeader && <TopHeader />}

      {/* 메인 콘텐츠: 헤더(56px)와 탭바(64px) 만큼 패딩 */}
      <main className={`${hasCustomHeader ? '' : '[padding-top:var(--cupid-app-header-height)]'} pb-16 ${isMagazinePage ? 'cupid-magazine-page' : 'max-w-screen-md mx-auto'}`}>
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
