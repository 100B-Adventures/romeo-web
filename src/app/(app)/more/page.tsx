'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authApi } from '@/lib/api/auth';

/**
 * 더보기 페이지 — 메뉴 리스트
 * 스토어, 매력지수, 결혼소식, 친구초대, 커뮤니티, 공지사항, 고객센터, 설정, 아는사람 피하기
 * 하단에 DarkModeToggle + 로그아웃
 */

// 메뉴 아이템 타입
interface MenuItem {
  label: string;
  route: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

// 메뉴 섹션 정의
const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: '서비스',
    items: [
      {
        label: '스토어',
        route: '/store',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
          </svg>
        ),
      },
      {
        label: '매력지수',
        route: '/charm',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        ),
      },
      {
        label: '결혼소식',
        route: '/couple',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        ),
      },
      {
        label: '친구초대',
        route: '/invite',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: '지원',
    items: [
      {
        label: '공지사항',
        route: '/notifications',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
          </svg>
        ),
      },
      {
        label: '고객센터',
        route: '/support',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        ),
      },
      {
        label: '설정',
        route: '/profile/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        label: '아는사람 피하기',
        route: '/profile/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        ),
      },
    ],
  },
];

export default function MorePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);
  const { darkMode, toggleDarkMode } = useUIStore();

  // 로그아웃 핸들러 — 서버 API 호출 후 로컬 상태 초기화
  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // 로그아웃 API 실패해도 로컬 상태 초기화
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className="px-4 py-4">
      {/* 프로필 미니 카드 */}
      <button
        onClick={() => router.push('/profile')}
        className="w-full flex items-center gap-4 p-4 mb-6 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors text-left"
      >
        {/* 프로필 사진 */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-ivory dark:bg-dark-bg border-2 border-gold dark:border-dark-gold flex-shrink-0">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-7 h-7 text-subtext dark:text-dark-cream" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* 유저 정보 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-text dark:text-dark-cream truncate">
            {user?.nickname || '프로필을 설정해주세요'}
          </h2>
          <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">
            {user?.status === 'ACTIVE' ? '활동 중' : user?.status === 'PENDING_APPROVAL' ? '심사 대기 중' : '프로필 편집'}
          </p>
        </div>

        {/* 화살표 */}
        <svg className="w-5 h-5 text-subtext dark:text-[var(--subtext)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* 메뉴 섹션 */}
      {MENU_SECTIONS.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-xs font-semibold text-subtext dark:text-[var(--subtext)] uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => !item.disabled && router.push(item.route)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ivory/50 dark:hover:bg-dark-bg/50'}`}
              >
                <span className="text-subtext dark:text-[var(--subtext)]">
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-medium text-text dark:text-dark-cream">
                  {item.label}
                </span>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.disabled ? 'bg-subtext/10 text-subtext dark:text-[var(--subtext)]' : 'bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold'}`}>
                    {item.badge}
                  </span>
                )}
                <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 관리자 메뉴 */}
      {user?.role === 'ADMIN' && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-subtext dark:text-[var(--subtext)] uppercase tracking-wider mb-2 px-1">
            관리자
          </h3>
          <div className="rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left hover:bg-ivory/50 dark:hover:bg-dark-bg/50"
            >
              <span className="text-subtext dark:text-[var(--subtext)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </span>
              <span className="flex-1 text-sm font-medium text-text dark:text-dark-cream">관리자 대시보드</span>
              <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 다크 모드 토글 */}
      <div className="mb-4 px-4 py-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-subtext dark:text-[var(--subtext)]">
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium text-text dark:text-dark-cream">
              {darkMode ? '다크 모드' : '라이트 모드'}
            </span>
          </div>

          {/* 토글 스위치 */}
          <button
            onClick={toggleDarkMode}
            className={`
              relative w-12 h-7 rounded-full transition-colors duration-300 overflow-hidden
              ${darkMode ? 'bg-gold dark:bg-dark-gold' : 'bg-subtext/30'}
            `}
            aria-label="다크 모드 토글"
          >
            <span
              className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300
                ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>
      </div>

      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-2xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
      >
        로그아웃
      </button>

      {/* 하단 버전 정보 */}
      <p className="mt-6 mb-4 text-center text-xs text-subtext/40 dark:text-[var(--subtext)]/40">
        Romeo & Cupid v1.0.0
      </p>
    </div>
  );
}
