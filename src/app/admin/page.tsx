'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminStatsResponse, type FunnelResponse } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Card } from './_components/AdminUI';
import styles from './admin-theme.module.css';

type FunnelRow = { label: string; value: number };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextFunnel] = await Promise.all([
        adminApi.getStats(),
        adminApi.getFunnel(7),
      ]);
      setStats(nextStats);
      setFunnel(nextFunnel);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const funnelRows = useMemo<FunnelRow[]>(() => {
    if (!funnel) return [];
    return [
      { label: '가입', value: funnel.signupCompleted },
      { label: '인터뷰 완료', value: funnel.interviewCompleted },
      { label: '심사 승인', value: funnel.reviewApproved },
      { label: '첫 추천', value: funnel.firstRecommendation },
      { label: 'OK', value: funnel.okSent },
      { label: '매칭 성사', value: funnel.matchCompleted },
    ];
  }, [funnel]);

  const funnelMax = Math.max(1, ...funnelRows.map((row) => row.value));
  const todayParts = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const today = ['year', 'month', 'day']
    .map((type) => todayParts.find((part) => part.type === type)?.value)
    .join('.');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>대시보드 · {today}</h1>

      {loading && <div className={`${styles.notice} ${styles.sectionTop}`}>운영 지표를 불러오고 있습니다.</div>}
      {error && (
        <div className={`${styles.error} ${styles.sectionTop}`}>
          <p>{error}</p>
          <button type="button" className={styles.button} onClick={load}>다시 시도</button>
        </div>
      )}

      {stats && (
        <>
          <div className={styles.cardGrid4}>
            {[
              ['오늘 가입', stats.todaySignups],
              ['심사 대기', stats.pendingVerifications],
              ['오늘 매칭', stats.todayMatchings],
              ['신고 접수', stats.pendingReports ?? 0],
            ].map(([label, value]) => (
              <Card key={label}>
                <div className={styles.eyebrow}>{label}</div>
                <div className={styles.statValue}>{Number(value).toLocaleString()}</div>
              </Card>
            ))}
          </div>

          <Card className={styles.sectionTop}>
            <div className={styles.eyebrow}>매칭 퍼널 · 이번 주</div>
            <div className={styles.funnel}>
              {funnelRows.map((row) => {
                const percent = Math.round((row.value / funnelMax) * 100);
                return (
                  <div className={styles.funnelRow} key={row.label}>
                    <span className={styles.funnelLabel}>{row.label}</span>
                    <progress className={styles.progress} max={100} value={percent} aria-label={`${row.label} ${row.value}`} />
                    <span className={styles.funnelValue}>{row.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
