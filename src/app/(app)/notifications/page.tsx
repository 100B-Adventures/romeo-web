'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { notificationApi, Notification } from '@/lib/api/notification';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 알림 타입별 설정 (백엔드 NotificationType enum 기준)
const NOTIFICATION_CONFIG: Record<string, { icon: React.ReactNode; color: string; route?: (n: Notification) => string }> = {
  LIKE_RECEIVED: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-500',
    route: () => '/home',
  },
  MATCH: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    color: 'bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold',
    route: (n) => n.referenceId ? `/matchings/${n.referenceId}` : '/home',
  },
  CONTACT_REVEALED: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
    route: (n) => n.referenceId ? `/matchings/${n.referenceId}` : '/home',
  },
  VERIFICATION_APPROVED: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400',
    route: () => '/profile/verification',
  },
  VERIFICATION_REJECTED: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
    route: () => '/profile/verification',
  },
  PAYMENT_SUCCESS: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: 'bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold',
    route: () => '/store',
  },
  PAYMENT_FAILED: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    color: 'bg-red-50 dark:bg-red-900/20 text-red-500',
    route: () => '/payment',
  },
  MATCHING_STATUS_CHANGED: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
    route: () => '/home',
  },
  COUPLE_REGISTERED: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-500',
    route: () => '/couple',
  },
  HEART_BONUS: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400',
    route: () => '/payment',
  },
  SYSTEM: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400',
  },
};

/**
 * 알림 페이지
 * 알림 목록 (무한 스크롤) + 타입별 아이콘/색상 + 전체 읽음 처리
 */
export default function NotificationsPage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 최초 로드
  const fetchInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const [notifData, count] = await Promise.all([
        notificationApi.getNotifications(0, 20),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(notifData.content);
      setUnreadCount(count);
      setHasMore(notifData.content.length >= 20);
      setPage(1);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // 추가 로드 (무한 스크롤)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const data = await notificationApi.getNotifications(page, 20);
      setNotifications((prev) => [...prev, ...data.content]);
      setHasMore(data.content.length >= 20);
      setPage((prev) => prev + 1);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, showToast]);

  // IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore, isLoadingMore]);

  // 알림 클릭 (읽음 처리 + 페이지 이동)
  const handleNotificationClick = async (notification: Notification) => {
    // 읽음 처리
    if (!notification.read) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // 읽음 처리 실패 시 무시
      }
    }

    // 해당 페이지로 이동
    const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.SYSTEM;
    if (config.route) {
      router.push(config.route(notification));
    }
  };

  // 전체 읽음 처리
  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('모든 알림을 읽음 처리했습니다.');
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  // 시간 포맷
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">알림을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-text dark:text-dark-cream">알림</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-gold dark:text-dark-gold font-medium"
          >
            전체 읽음
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 text-subtext/20 dark:text-[var(--subtext)]/20 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <p className="text-sm text-subtext dark:text-[var(--subtext)]">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.SYSTEM;
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-colors
                  ${notification.read
                    ? 'bg-white dark:bg-dark-card'
                    : 'bg-gold/5 dark:bg-dark-gold/5'
                  }
                  border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40
                `}
              >
                {/* 타입 아이콘 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  {config.icon}
                </div>

                {/* 알림 내용 */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${
                    notification.read
                      ? 'text-subtext dark:text-[var(--subtext)]'
                      : 'text-text dark:text-dark-cream font-bold'
                  }`}>
                    {notification.title}
                  </h3>
                  <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-subtext/50 dark:text-[var(--subtext)]/50 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* 읽지 않음 표시 */}
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-gold dark:bg-dark-gold flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })}

          {/* 무한 스크롤 로드 트리거 */}
          <div ref={loadMoreRef} className="h-4">
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
