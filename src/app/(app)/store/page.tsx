'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { heartApi } from '@/lib/api/heart';
import { paymentApi, PaymentHistoryItem } from '@/lib/api/payment';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import HeartBadge from '@/components/common/HeartBadge';

/**
 * 스토어 페이지
 * 하트 잔액 표시 + 충전 페이지 링크 + 하트 사용 내역 (무한 스크롤)
 */
export default function StorePage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 잔액 및 최초 내역 로드
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balanceData, historyData] = await Promise.all([
        heartApi.getBalance(),
        paymentApi.getHistory(0, 20),
      ]);
      setBalance(balanceData.balance);
      setHistory(historyData.content);
      setHasMore(!historyData.last);
      setPage(1);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 추가 내역 로드 (무한 스크롤)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const data = await paymentApi.getHistory(page, 20);
      setHistory((prev) => [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage((prev) => prev + 1);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, showToast]);

  // IntersectionObserver로 무한 스크롤
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

  // 상태별 라벨/색상
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return { label: '완료', color: 'text-green-600 dark:text-green-400' };
      case 'PENDING':
        return { label: '처리중', color: 'text-yellow-600 dark:text-yellow-400' };
      case 'CANCELED':
      case 'REFUNDED':
        return { label: '환불됨', color: 'text-red-500 dark:text-red-400' };
      default:
        return { label: status, color: 'text-subtext dark:text-[var(--subtext)]' };
    }
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <h1 className="text-lg font-bold text-text dark:text-dark-cream mb-6">스토어</h1>

      {/* 하트 잔액 카드 */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-gold/10 to-rosegold/10 dark:from-dark-gold/10 dark:to-rosegold/10 border border-gold/20 dark:border-dark-gold/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-subtext dark:text-[var(--subtext)] mb-1">보유 하트</p>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-3xl font-bold text-gold dark:text-dark-gold tabular-nums">
                {balance.toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/payment')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white text-sm font-bold shadow-lg shadow-gold/20 transition-all active:scale-95"
          >
            충전하기
          </button>
        </div>
      </div>

      {/* 하트 사용 내역 */}
      <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">사용 내역</h2>
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-16 h-16 text-subtext/20 dark:text-[var(--subtext)]/20 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-subtext dark:text-[var(--subtext)]">사용 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((item) => {
            const statusDisplay = getStatusDisplay(item.status);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text dark:text-dark-cream truncate">
                    {item.orderId}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.label}
                    </span>
                    <span className="text-xs text-subtext/50 dark:text-[var(--subtext)]/50">
                      {item.paidAt
                        ? new Date(item.paidAt).toLocaleDateString('ko-KR')
                        : new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-text dark:text-dark-cream tabular-nums flex-shrink-0 ml-3">
                  {item.amount.toLocaleString()}원
                </span>
              </div>
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
