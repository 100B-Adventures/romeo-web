'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, type UserListResponse } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Badge, Card, Filters, SearchBar, formatDate } from '../_components/AdminUI';
import styles from '../admin-theme.module.css';

type UserFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';

const FILTERS: ReadonlyArray<{ value: UserFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'PENDING', label: 'PENDING 심사' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
  { value: 'DELETED', label: '탈퇴' },
];

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'approved' as const;
  if (status === 'SUSPENDED' || status === 'DELETED') return 'rejected' as const;
  return 'pending' as const;
}

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<UserFilter>('ALL');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = appliedQuery.trim()
        ? await adminApi.searchUsers(appliedQuery.trim(), pageNumber, 20)
        : await adminApi.getUsers(pageNumber, 20);
      setUsers(page.content);
      setTotal(page.totalElements);
      setTotalPages(page.totalPages);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, pageNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleUsers = useMemo(() => users.filter((user) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return !['ACTIVE', 'SUSPENDED', 'DELETED'].includes(String(user.status));
    return String(user.status) === filter;
  }), [filter, users]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>회원 관리</h1>
        <div className={styles.subtitle}>전체 {total.toLocaleString()} · 현재 목록 {visibleUsers.length}</div>
      </div>
      <Filters options={FILTERS} value={filter} onChange={(nextFilter) => { setFilter(nextFilter); setPageNumber(0); }} />
      <SearchBar value={query} onChange={setQuery} onSearch={() => { setAppliedQuery(query); setPageNumber(0); }} placeholder="이름 · 회원번호 · 휴대폰 뒷자리로 검색" />

      {loading && <div className={`${styles.notice} ${styles.sectionTopSmall}`}>회원 목록을 불러오고 있습니다.</div>}
      {error && <div className={`${styles.error} ${styles.sectionTopSmall}`}>{error}</div>}
      {!loading && !error && (
        <Card className={styles.sectionTopSmall}>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.tableRowsTall}`}>
              <thead><tr><th>회원</th><th>성별</th><th>가입</th><th>인증</th><th>상태</th><th><span className={styles.srOnly}>상세</span></th></tr></thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.nickname || '닉네임 없음'} · #{user.userId}</td>
                    <td>{user.gender === 'FEMALE' ? '여' : '남'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{user.verified ? '완료' : '미완료'}</td>
                    <td><Badge tone={statusTone(String(user.status))}>{user.status}</Badge></td>
                    <td><Link className={styles.rowLink} href={`/admin/users/${user.userId}`}>상세 ›</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleUsers.length === 0 && <div className={styles.empty}>조건에 맞는 회원이 없습니다.</div>}
          {totalPages > 1 && (
            <div className={styles.pagination} aria-label="회원 목록 페이지 이동">
              <button type="button" className={styles.button} disabled={pageNumber === 0 || loading} onClick={() => setPageNumber((current) => current - 1)}>이전</button>
              <span className={styles.muted}>{pageNumber + 1} / {totalPages}</span>
              <button type="button" className={styles.button} disabled={pageNumber + 1 >= totalPages || loading} onClick={() => setPageNumber((current) => current + 1)}>다음</button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
