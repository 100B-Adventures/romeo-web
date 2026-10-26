'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../admin-theme.module.css';

export type BadgeTone = 'pending' | 'approved' | 'rejected' | 'neutral';

export function Badge({ children, tone = 'pending' }: { children: React.ReactNode; tone?: BadgeTone }) {
  const toneClass = {
    pending: styles.badgePending,
    approved: styles.badgeApproved,
    rejected: styles.badgeRejected,
    neutral: styles.badgeNeutral,
  }[tone];
  return <span className={`${styles.badge} ${toneClass}`}>{children}</span>;
}
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

export function Filters<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.filterRow} role="group">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={`${styles.chip} ${value === option.value ? styles.chipActive : ''}`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
}) {
  return (
    <form
      className={styles.search}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <label className={styles.srOnly} htmlFor={`search-${placeholder}`}>검색어</label>
      <input
        id={`search-${placeholder}`}
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>조회</button>
    </form>
  );
}

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 2200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return <div className={styles.toast} role="status">{message}</div>;
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setMessage(null), []);
  return useMemo(() => ({ message, showToast: setMessage, closeToast }), [closeToast, message]);
}

export function formatDate(value?: string | null, includeTime = false) {
  if (!value) return '없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(date);
}

export function relativeTime(value?: string | null) {
  if (!value) return '제출 시각 없음';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}시간 전`;
  return `${Math.floor(elapsedMinutes / 1440)}일 전`;
}
