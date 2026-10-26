'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Badge, Card, Filters, Toast, useToast } from '../_components/AdminUI';
import styles from '../admin-theme.module.css';

type ReportType = 'ALL' | 'PROFILE' | 'POST' | 'COMMENT';
type ReportFilter = 'PENDING' | 'APPROVED' | 'REJECTED';
type ReportItem = {
  id: number;
  reportedUserId: number;
  reportedUserNickname?: string;
  targetType: 'PROFILE' | 'POST' | 'COMMENT';
  targetId?: number;
  reason: string;
  description?: string;
  status: ReportFilter;
  createdAt: string;
};

const TYPE_FILTERS: ReadonlyArray<{ value: ReportType; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'PROFILE', label: '프로필' },
  { value: 'POST', label: '게시글' },
  { value: 'COMMENT', label: '댓글' },
];

const STATUS_FILTERS: ReadonlyArray<{ value: ReportFilter; label: string }> = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인(조치)' },
  { value: 'REJECTED', label: '반려(기각)' },
];

const TYPE_LABEL = { PROFILE: '프로필', POST: '게시글', COMMENT: '댓글' } as const;

export default function AdminReportsPage() {
  const [typeFilter, setTypeFilter] = useState<ReportType>('ALL');
  const [statusFilter, setStatusFilter] = useState<ReportFilter>('PENDING');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.getReports(statusFilter, 0, 20) as { content?: ReportItem[] };
      setReports(page.content ?? []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleReports = useMemo(
    () => reports.filter((report) => typeFilter === 'ALL' || report.targetType === typeFilter),
    [reports, typeFilter],
  );

  const process = async (report: ReportItem, action: 'dismiss' | 'warn' | 'suspend') => {
    setActingId(report.id);
    try {
      if (action === 'dismiss') {
        await adminApi.processReport(report.id, 'DISMISS', '신고 기각');
      } else if (action === 'warn') {
        await adminApi.processReport(report.id, 'WARN', '경고 조치');
      } else {
        await adminApi.processReport(report.id, 'SUSPEND', '이용 정지 조치');
      }
      toast.showToast(action === 'dismiss' ? '신고를 기각했습니다.' : action === 'warn' ? '경고 조치로 처리했습니다.' : '신고 승인과 이용 정지를 적용했습니다.');
      await load();
    } catch (requestError) {
      toast.showToast(getErrorMessage(requestError));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>신고 관리</h1>
        <div className={styles.subtitle}>대기 {reports.filter((report) => report.status === 'PENDING').length} · 현재 목록 {visibleReports.length}</div>
      </div>
      <Filters options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
      <Filters options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />

      {loading && <div className={`${styles.notice} ${styles.sectionTopSmall}`}>신고 목록을 불러오고 있습니다.</div>}
      {error && <div className={`${styles.error} ${styles.sectionTopSmall}`}>{error}</div>}
      {!loading && !error && visibleReports.length === 0 && <div className={`${styles.empty} ${styles.sectionTopSmall}`}>조건에 맞는 신고가 없습니다.</div>}

      <div className={`${styles.stack} ${styles.stackAfterFilters}`}>
        {visibleReports.map((report) => (
          <Card key={report.id}>
            <div className={styles.reportCard}>
              <div>
                <div className={styles.chipRow}>
                  <Badge>{TYPE_LABEL[report.targetType]}</Badge>
                  <span className={styles.reportTitle}>{report.reason}</span>
                </div>
                <div className={styles.reportMeta}>
                  피신고 회원 {report.reportedUserNickname || `#${report.reportedUserId}`} · 신고 #{report.id}
                  {report.description ? ` · 사유: ${report.description}` : ''}
                </div>
              </div>
              <div className={styles.actionRow}>
                <button type="button" className={styles.button} disabled={actingId === report.id} onClick={() => process(report, 'dismiss')}>기각</button>
                <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} disabled={actingId === report.id} onClick={() => process(report, 'warn')}>경고</button>
                <button type="button" className={`${styles.button} ${styles.buttonWine}`} disabled={actingId === report.id} onClick={() => process(report, 'suspend')}>이용 정지</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Toast message={toast.message} onClose={toast.closeToast} />
    </div>
  );
}
