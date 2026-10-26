'use client';

// 카드 설정 드롭다운 메뉴
// 점 3개(⋯) 버튼 → 드롭다운: 지인에게 소개하기, 삭제하기, 신고하기

import { useState, useRef, useEffect } from 'react';

interface CardSettingsProps {
  onIntroduce: () => void;
  onDelete: () => void;
  onReport: () => void;
}

export default function CardSettings({ onIntroduce, onDelete, onReport }: CardSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // 메뉴 항목 정의
  const menuItems = [
    {
      label: '지인에게 소개하기',
      icon: (
        // 공유 아이콘
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
      onClick: onIntroduce,
      variant: 'default' as const,
    },
    {
      label: '삭제하기',
      icon: (
        // 휴지통 아이콘
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      ),
      onClick: onDelete,
      variant: 'default' as const,
    },
    {
      label: '신고하기',
      icon: (
        // 경고 아이콘
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      onClick: onReport,
      variant: 'danger' as const,
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* 점 3개 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="더 보기"
        aria-expanded={isOpen}
        className="
          flex h-8 w-8 items-center justify-center rounded-full
          text-subtext dark:text-gray-400
          transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-800
          active:scale-95
        "
      >
        {/* 가로 점 3개 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-full z-30 mt-1
            min-w-[180px] overflow-hidden rounded-xl
            bg-white dark:bg-dark-card
            shadow-xl ring-1 ring-gray-100 dark:ring-gray-800
            animate-in fade-in slide-in-from-top-1 duration-200
          "
          role="menu"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              className={`
                flex w-full items-center gap-2.5 px-4 py-3
                text-sm transition-colors
                ${
                  item.variant === 'danger'
                    ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-text dark:text-dark-cream hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
