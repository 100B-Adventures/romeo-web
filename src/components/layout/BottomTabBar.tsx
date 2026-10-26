'use client';

import { useRouter } from 'next/navigation';
import { useUIStore, TAB_ROUTES, type TabName } from '@/store/uiStore';

// 탭 정의 (아이콘 + 라벨)
interface TabItem {
  name: TabName;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

// v39.5 승인 탭 5개. live·meeting은 탭에서 제외한다.
const TABS: TabItem[] = [
  {
    name: 'home',
    label: '오늘',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    name: 'history',
    label: '히스토리',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'community',
    label: '커뮤니티',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.142-4.03 7.5-9 7.5a10.4 10.4 0 01-3.6-.63L3 20.25l1.5-4.29A7.01 7.01 0 013 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5z" />
      </svg>
    ),
  },
  {
    name: 'profile',
    label: '프로필',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75a17.9 17.9 0 01-7.5-1.632z" />
      </svg>
    ),
  },
  {
    name: 'more',
    label: '더보기',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
];

/**
 * 하단 탭 바. v39.5의 오늘, 히스토리, 커뮤니티, 프로필, 더보기를 그대로 쓴다.
 */
export default function BottomTabBar() {
  const router = useRouter();
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  // 탭 클릭 핸들러
  const handleTabClick = (tab: TabName) => {
    setActiveTab(tab);
    router.push(TAB_ROUTES[tab]);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-card"
      data-testid="bottom-tab-bar"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 border-t border-[var(--border)]"
        data-testid="bottom-tab-bar-border"
      />
      <div
        className="flex h-bottom-tab-bar items-center justify-around max-w-screen-md mx-auto"
        data-testid="bottom-tab-bar-content"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;

          return (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab.name)}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors duration-200 ${
                isActive
                  ? 'text-gold dark:text-dark-gold'
                  : 'text-subtext dark:text-dark-cream/60'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon(isActive)}
              <span className="text-[10px] font-medium leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* iOS 하단 안전 영역 */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-dark-card" />
    </nav>
  );
}
