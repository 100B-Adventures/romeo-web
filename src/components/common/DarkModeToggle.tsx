'use client';

// 다크 모드 토글 버튼
// 해(라이트)/달(다크) 아이콘으로 전환. uiStore의 toggleDarkMode 호출

import { useUIStore } from '@/store/uiStore';

export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="
        relative flex h-10 w-10 items-center justify-center rounded-full
        overflow-hidden
        transition-all duration-300
        hover:bg-gold/10 dark:hover:bg-dark-gold/10
        active:scale-95
      "
    >
      {/* 해 아이콘 (라이트 모드일 때 표시) */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          absolute transition-all duration-300
          text-gold
          ${darkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
        `}
      >
        {/* 태양 본체 */}
        <circle cx="12" cy="12" r="5" />
        {/* 태양 광선 */}
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* 달 아이콘 (다크 모드일 때 표시) */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          absolute transition-all duration-300
          text-dark-gold
          ${darkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
        `}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
