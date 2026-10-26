'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { heartApi } from '@/lib/api/heart';
import styles from './TopHeader.module.css';

/**
 * 상단 헤더 — 프로필 사진, 하트 잔액 배지, 알림 벨
 * 5성급 호텔 감성의 미니멀한 디자인
 */
export default function TopHeader({
  variant = 'default',
  title,
  onBack,
  inline = false,
}: {
  variant?: 'default' | 'back';
  title?: string;
  onBack?: () => void;
  inline?: boolean;
} = {}) {
  const router = useRouter();
  const isBack = variant === 'back';

  return (
    <header className={`${styles.header} ${inline ? styles.inline : ''}`}>
      <div className={styles.inner}>
        {isBack ? (
          <button type="button" className={styles.back} onClick={onBack ?? (() => router.replace('/home'))} aria-label="오늘의 지면으로">
            ‹
          </button>
        ) : <HeartBadge />}
        <span className={styles.wordmark}>CUPID</span>
        {isBack ? <span className={styles.rightTitle}>{title ?? ''}</span> : (
          <button
            onClick={() => router.push('/notifications')}
            className={styles.notification}
            aria-label="알림"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className={styles.dot} />
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * 하트 잔액 배지 — 골드 테두리, 하트 아이콘 + 잔액 표시
 */
function HeartBadge() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['heart-balance'],
    queryFn: heartApi.getBalance,
  });

  return (
    <button
      onClick={() => router.push('/store')}
      className={styles.heart}
      aria-label="하트 충전소"
    >
      {/* 하트 아이콘 */}
      <svg
        width="17"
        height="17"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <span data-testid="header-heart-balance">
        {typeof data?.balance === 'number' ? data.balance.toLocaleString() : '--'}
      </span>
    </button>
  );
}
