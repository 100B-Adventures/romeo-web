'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminApi,
  type VerificationResponse,
  type VerificationStatus,
} from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Badge, Card, Filters, SearchBar, Toast, relativeTime, useToast } from '../_components/AdminUI';
import styles from '../admin-theme.module.css';

type ReviewFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL';

const FILTERS: ReadonlyArray<{ value: ReviewFilter; label: string }> = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'EXPIRED', label: '만료' },
  { value: 'ALL', label: '전체' },
];

const TYPE_LABEL: Record<string, string> = {
  IDENTITY: '본인 확인',
  EDUCATION: '학력',
  INCOME: '소득',
  CAREER: '직장',
  RESIDENCE: '자산·거주',
};

const STATUS_TONE = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'neutral',
} as const;

export default function AdminReviewPage() {
  const [filter, setFilter] = useState<ReviewFilter>('PENDING');
  const [items, setItems] = useState<VerificationResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [rejectReason, setRejectReason] = useState('이름이 가려져 본인 확인이 어려웠어요. 이름·발급일이 보이게 다시 촬영해 주세요.');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = filter === 'PENDING'
        ? await adminApi.getPendingVerifications(0, 20)
        : await adminApi.getVerifications(filter === 'ALL' ? undefined : filter, 0, 20);
      setItems(page.content);
      setSelectedId((current) => page.content.some((item) => item.id === current) ? current : page.content[0]?.id ?? null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = appliedQuery.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      [item.userNickname, item.userId, item.type, item.id]
        .filter((value) => value != null)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [appliedQuery, items]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const review = async (status: VerificationStatus) => {
    if (!selected) return;
    if (status === 'REJECTED' && !rejectReason.trim()) {
      toast.showToast('반려 사유를 입력해 주세요.');
      return;
    }
    setActing(true);
    try {
      await adminApi.reviewVerification(
        selected.id,
        status,
        status === 'APPROVED' ? '관리자 심사 승인' : rejectReason.trim(),
        status === 'APPROVED' ? '서류 확인 완료' : '재제출 요청',
      );
      toast.showToast(status === 'APPROVED' ? '승인했습니다. 회원에게 알림이 갑니다.' : '반려했습니다. 사유가 회원에게 전달됩니다.');
      await load();
    } catch (requestError) {
      toast.showToast(getErrorMessage(requestError));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>인증 심사</h1>
        <div className={styles.subtitle}>대기 {items.filter((item) => item.status === 'PENDING').length} · 선택 {selected ? 1 : 0}</div>
      </div>

      <Filters options={FILTERS} value={filter} onChange={setFilter} />
      <SearchBar value={query} onChange={setQuery} onSearch={() => setAppliedQuery(query)} placeholder="회원 이름 · 회원번호로 검색" />

      {loading && <div className={`${styles.notice} ${styles.sectionTopSmall}`}>심사 목록을 불러오고 있습니다.</div>}
      {error && <div className={`${styles.error} ${styles.sectionTopSmall}`}>{error}</div>}

      {!loading && !error && (
        <div className={styles.reviewColumns}>
          <Card>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.tableRowsTall}`}>
                <thead><tr><th>회원</th><th>항목</th><th>제출</th><th>상태</th></tr></thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={`${styles.clickableRow} ${item.id === selectedId ? styles.selectedRow : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td>{item.userNickname || `회원 #${item.userId ?? '미확인'}`}</td>
                      <td>{TYPE_LABEL[item.type] || item.type}</td>
                      <td>{relativeTime(item.createdAt)}</td>
                      <td><Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <div className={styles.empty}>조건에 맞는 심사 건이 없습니다.</div>}
            <p className={`${styles.bodyCopy} ${styles.bodyCopyTop12}`}>원본은 판정 즉시 파기되고, 비식별 파기 영수증만 남습니다.</p>
          </Card>

          <Card>
            {selected ? (
              <>
                <div className={styles.eyebrow}>심사 중 · {selected.userNickname || `회원 #${selected.userId ?? '미확인'}`} · {TYPE_LABEL[selected.type] || selected.type}</div>
                <div className={styles.viewer}>
                  {selected.documentUrl ? (
                    <a className={styles.viewerLink} href={selected.documentUrl} target="_blank" rel="noreferrer">원본 문서 열기</a>
                  ) : '제출 원본을 불러올 수 없습니다.'}
                </div>
                <p className={`${styles.bodyCopy} ${styles.bodyCopyTop12}`}>확인 포인트: <strong>이름</strong>·발급일이 보이는가. 금액·성적은 확인하지 않습니다.</p>
                <div className={`${styles.actionRow} ${styles.actionRowTop}`}>
                  <button type="button" className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonGrow}`} onClick={() => review('APPROVED')} disabled={acting}>승인</button>
                  <button type="button" className={`${styles.button} ${styles.buttonDanger} ${styles.buttonGrow}`} onClick={() => review('REJECTED')} disabled={acting || !rejectReason.trim()}>반려</button>
                </div>
                <label className={styles.fieldLabel} htmlFor="reject-reason">반려 사유 (회원에게 그대로 전달)</label>
                <textarea id="reject-reason" className={styles.textarea} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
              </>
            ) : <div className={styles.empty}>왼쪽 목록에서 심사할 항목을 선택해 주세요.</div>}
          </Card>
        </div>
      )}
      <Toast message={toast.message} onClose={toast.closeToast} />
    </div>
  );
}
