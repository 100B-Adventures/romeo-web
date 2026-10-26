'use client';

// 차단 관리 페이지
// 차단 목록 조회 + 차단 해제

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { safetyApi } from '@/lib/api/safety';
import { useUIStore } from '@/store/uiStore';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface BlockItem {
  id: number;
  blockedUserId: number;
  createdAt: string;
}

export default function BlocksPage() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const fetchBlocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await safetyApi.getBlockedUsers(0);
      setBlocks(data.content || []);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // 차단 해제
  const handleUnblock = async (userId: number) => {
    if (!confirm('이 사용자의 차단을 해제하시겠습니까?')) return;
    setUnblockingId(userId);
    try {
      await safetyApi.unblockUser(userId);
      setBlocks((prev) => prev.filter((b) => b.blockedUserId !== userId));
      showToast('차단이 해제되었습니다');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="px-4 py-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text dark:text-dark-cream">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">차단 관리</h1>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
          <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">불러오는 중...</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 text-subtext/20 dark:text-[var(--subtext)]/20 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-sm text-subtext dark:text-[var(--subtext)]">차단한 사용자가 없습니다</p>
        </div>
      )}

      {/* 차단 목록 */}
      {!isLoading && blocks.length > 0 && (
        <div className="flex flex-col gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]"
            >
              {/* 아바타 */}
              <div className="w-10 h-10 rounded-full bg-ivory dark:bg-dark-bg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-subtext/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text dark:text-dark-cream">
                  사용자 #{block.blockedUserId}
                </p>
                <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">
                  {new Date(block.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>

              {/* 해제 버튼 */}
              <button
                onClick={() => handleUnblock(block.blockedUserId)}
                disabled={unblockingId === block.blockedUserId}
                className="px-3 py-1.5 text-xs font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
              >
                {unblockingId === block.blockedUserId ? '해제 중...' : '해제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
