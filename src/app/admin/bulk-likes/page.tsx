'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminApi,
  type BulkLikeQuotaResponse,
  type BulkLikeResponse,
  type UserListResponse,
} from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Badge, Card, Filters, SearchBar, Toast, formatDate, useToast } from '../_components/AdminUI';
import styles from '../admin-theme.module.css';

type TargetFilter = 'ALL' | 'RECENT' | 'NO_OK' | 'ACTIVE';
type BulkHistory = {
  batchId: number;
  senderUserId: number;
  senderNickname?: string;
  likeType: 'OK' | 'SUPER_OK';
  sentCount: number;
  matchedCount: number;
  createdAt?: string;
};

type BulkResult = BulkLikeResponse & {
  skipped?: Array<{ userId: number; reason: string }>;
};

const TARGET_FILTERS: ReadonlyArray<{ value: TargetFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'RECENT', label: '최근 가입' },
  { value: 'NO_OK', label: '받은 OK 0' },
  { value: 'ACTIVE', label: 'ACTIVE' },
];

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `bulk-${Date.now()}`;
}

export default function AdminBulkLikesPage() {
  const [sender, setSender] = useState<UserListResponse | null>(null);
  const [quota, setQuota] = useState<BulkLikeQuotaResponse | null>(null);
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [history, setHistory] = useState<BulkHistory[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [targetPage, setTargetPage] = useState(0);
  const [targetTotalPages, setTargetTotalPages] = useState(0);
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('ALL');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [likeType, setLikeType] = useState<'OK' | 'SUPER_OK'>('OK');
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSender, nextQuota, nextUsers, nextHistory] = await Promise.all([
        adminApi.getBulkLikeSender(),
        adminApi.getBulkLikeQuota(),
        adminApi.getFemaleUsers(targetPage, 20, {
          keyword: appliedQuery.trim() || undefined,
          recent: targetFilter === 'RECENT',
          activeOnly: targetFilter === 'ACTIVE',
          receivedOkZero: targetFilter === 'NO_OK',
        }),
        adminApi.getBulkLikeHistory(0, 20) as Promise<{ content?: BulkHistory[] }>,
      ]);
      setSender(nextSender);
      setQuota(nextQuota);
      setUsers(nextUsers.content);
      setTargetTotalPages(nextUsers.totalPages);
      setHistory(nextHistory.content ?? []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, targetFilter, targetPage]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleUsers = useMemo(() => users, [users]);

  const toggleTarget = (userId: number) => {
    setResult(null);
    setConfirmed(false);
    setSelectedIds((current) => {
      if (current.includes(userId)) return current.filter((id) => id !== userId);
      if (current.length >= 20) {
        toast.showToast('한 번에 최대 20명까지 선택할 수 있습니다.');
        return current;
      }
      return [...current, userId];
    });
  };

  const send = async () => {
    if (!sender || selectedIds.length === 0 || !confirmed) return;
    if (quota && selectedIds.length > quota.remainingToday) {
      toast.showToast(`오늘 남은 발송 수량은 ${quota.remainingToday}명입니다.`);
      return;
    }
    setSending(true);
    try {
      const response = await adminApi.sendBulkLikes(selectedIds, sender.userId, likeType, idempotencyKey) as BulkResult;
      setResult(response);
      setSelectedIds([]);
      setConfirmed(false);
      setIdempotencyKey(newIdempotencyKey());
      toast.showToast(`${response.successCount}명에게 ${likeType === 'OK' ? 'OK' : '슈퍼 OK'}를 보냈습니다.`);
      const [nextQuota, nextHistory] = await Promise.all([
        adminApi.getBulkLikeQuota(),
        adminApi.getBulkLikeHistory(0, 20) as Promise<{ content?: BulkHistory[] }>,
      ]);
      setQuota(nextQuota);
      setHistory(nextHistory.content ?? []);
    } catch (requestError) {
      toast.showToast(getErrorMessage(requestError));
    } finally {
      setSending(false);
    }
  };

  const canSend = Boolean(sender && selectedIds.length > 0 && confirmed && !sending && (!quota || selectedIds.length <= quota.remainingToday));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>대량 좋아요</h1>
        <div className={styles.subtitle}>지정된 남성 계정 하나가 여성 회원 여러 명에게 보냅니다.</div>
      </div>
      {quota && (
        <div className={`${styles.quota} ${quota.remainingToday === 0 ? styles.quotaExhausted : ''}`}>
          오늘 대량 발송 {quota.usedToday}/{quota.dailyLimit}명 · 남은 수량 {quota.remainingToday}명
        </div>
      )}
      {loading && <div className={`${styles.notice} ${styles.sectionTopSmall}`}>발송 대상을 불러오고 있습니다.</div>}
      {error && <div className={`${styles.error} ${styles.sectionTopSmall}`}>{error}</div>}

      {!loading && !error && (
        <div className={styles.bulkColumns}>
          <div className={styles.stack}>
            <Card>
              <div className={styles.eyebrow}>보내는 계정</div>
              {sender ? (
                <>
                  <div className={styles.senderRow}>
                    <div className={styles.avatarSmall}><div className={styles.avatarFallback}>{sender.nickname?.charAt(0) || '관'}</div></div>
                    <div>
                      <div className={styles.senderName}>{sender.nickname || '닉네임 없음'} · #{sender.userId}</div>
                      <div className={styles.chipRow}><Badge tone="neutral">{sender.gender === 'MALE' ? '남' : sender.gender}</Badge><Badge tone="approved">{sender.status}</Badge></div>
                    </div>
                  </div>
                  <div className={styles.senderMeta}>발송 계정은 서버 설정으로 하나에 고정됩니다. 받는 분 화면에는 다른 남성 회원과 똑같이 소개됩니다.</div>
                </>
              ) : <div className={styles.empty}>발송 계정이 지정되지 않아 기능이 잠겼습니다.</div>}
            </Card>

            <Card>
              <div className={styles.between}>
                <div className={styles.eyebrow}>받을 여성 회원</div>
                <div className={styles.selectionMeta}>{selectedIds.length > 0 ? `${selectedIds.length}명 선택됨 · 이 지면 ${visibleUsers.length}명 중` : '아직 고른 분이 없습니다'}</div>
              </div>
              <Filters options={TARGET_FILTERS} value={targetFilter} onChange={(nextFilter) => { setTargetFilter(nextFilter); setTargetPage(0); }} />
              <SearchBar value={query} onChange={setQuery} onSearch={() => { setAppliedQuery(query); setTargetPage(0); }} placeholder="이름 · 회원번호로 검색" />
              <div className={`${styles.tableWrap} ${styles.tableTop10}`}>
                <table className={`${styles.table} ${styles.tableHeadersCompact}`}>
                  <thead><tr><th><span className={styles.srOnly}>선택</span></th><th>회원</th><th>가입</th><th>인증</th><th>상태</th></tr></thead>
                  <tbody>
                    {visibleUsers.map((user) => {
                      const selected = selectedIds.includes(user.userId);
                      return (
                        <tr key={user.userId} className={`${styles.clickableRow} ${selected ? styles.selectedRow : ''}`} onClick={() => toggleTarget(user.userId)}>
                          <td><input type="checkbox" checked={selected} onChange={() => toggleTarget(user.userId)} onClick={(event) => event.stopPropagation()} aria-label={`${user.nickname || user.userId} 선택`} /></td>
                          <td>{user.nickname || '닉네임 없음'} · #{user.userId}</td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>{user.verified ? '완료' : '미완료'}</td>
                          <td><Badge tone={user.status === 'ACTIVE' ? 'approved' : 'pending'}>{user.status}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {targetTotalPages > 1 && (
                <div className={styles.pagination} aria-label="대량 좋아요 대상 페이지 이동">
                  <button type="button" className={styles.button} disabled={targetPage === 0 || loading} onClick={() => setTargetPage((current) => current - 1)}>이전</button>
                  <span className={styles.muted}>{targetPage + 1} / {targetTotalPages}</span>
                  <button type="button" className={styles.button} disabled={targetPage + 1 >= targetTotalPages || loading} onClick={() => setTargetPage((current) => current + 1)}>다음</button>
                </div>
              )}
              <p className={`${styles.bodyCopy} ${styles.bodyCopyTop10}`}>한 번에 최대 20명, 하루 최대 {quota?.dailyLimit ?? 100}명까지 보냅니다.</p>
            </Card>
          </div>

          <div className={styles.stack}>
            <Card>
              <div className={styles.eyebrow}>종류를 정하고 보냅니다</div>
              <div className={`${styles.chipRow} ${styles.sectionTop12}`}>
                <button type="button" className={`${styles.chip} ${styles.buttonGrow} ${likeType === 'OK' ? styles.chipActive : ''}`} onClick={() => setLikeType('OK')}>OK</button>
                <button type="button" className={`${styles.chip} ${styles.buttonGrow} ${likeType === 'SUPER_OK' ? styles.chipActive : ''}`} onClick={() => setLikeType('SUPER_OK')}>슈퍼 OK</button>
              </div>
              <div className={`${styles.summaryPanel} ${styles.bulkSummary}`}>
                <div className={styles.muted}>보낼 내용</div>
                <div className={styles.profileName}>{selectedIds.length === 0 ? '받을 분을 먼저 고르세요' : `${sender?.nickname || '발신 계정'} · #${sender?.userId} → 여성 ${selectedIds.length}명 · ${likeType === 'OK' ? 'OK' : '슈퍼 OK'}`}</div>
              </div>
              <div className={styles.warningBox}>
                <div className={styles.warningTitle}>되돌릴 수 없습니다</div>
                <p className={`${styles.bodyCopy} ${styles.bodyCopyTop6}`}>보낸 좋아요는 회수할 수 없습니다. 받는 분에게 알림이 즉시 가고, 이미 OK를 보내 둔 분이 있으면 그 자리에서 <strong>매칭이 성사되며 연락처가 서로 공개</strong>됩니다.</p>
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={selectedIds.length === 0} />
                위 내용을 확인했습니다
              </label>
              <button type="button" className={`${styles.button} ${styles.buttonWine} ${styles.buttonBlock} ${styles.sectionTop12}`} onClick={send} disabled={!canSend}>
                {selectedIds.length === 0 ? '받을 분을 고르면 보낼 수 있어요' : sending ? '보내는 중' : `${selectedIds.length}명에게 ${likeType === 'OK' ? 'OK' : '슈퍼 OK'} 보내기`}
              </button>
            </Card>

            <Card>
              <div className={styles.eyebrow}>{result ? '방금 보낸 결과' : '보낸 결과'}</div>
              <div className={styles.metricGrid}>
                {[
                  ['요청', result?.totalRequested ?? 0],
                  ['보냄', result?.successCount ?? 0],
                  ['건너뜀', result?.skippedCount ?? 0],
                  ['매칭', result?.matchedCount ?? 0],
                ].map(([label, value]) => (
                  <div className={styles.metric} key={label}><div className={styles.eyebrow}>{label}</div><div className={styles.metricValue}>{value}</div></div>
                ))}
              </div>
              <p className={`${styles.bodyCopy} ${styles.bodyCopyTop10}`}>
                {result
                  ? result.skippedCount > 0
                    ? `건너뛴 ${result.skippedCount}명 · ${result.skipped?.map((item) => `#${item.userId} ${item.reason}`).join(', ') || '서버 사유 없음'}`
                    : '요청한 대상 전원에게 발송했습니다.'
                  : '이번 접속에서는 아직 보낸 것이 없습니다. 보내고 나면 건너뛴 분과 그 이유가 여기에 뜹니다.'}
              </p>
              <div className={`${styles.eyebrow} ${styles.sectionTopSmall}`}>지난 발송</div>
              <div className={`${styles.tableWrap} ${styles.tableTop8}`}>
                <table className={`${styles.table} ${styles.tableHeadersCompact} ${styles.tableRowsHistory}`}>
                  <thead><tr><th>일시</th><th>보낸 계정</th><th>종류</th><th>보냄</th><th>매칭</th></tr></thead>
                  <tbody>
                    {history.slice(0, 4).map((item) => (
                      <tr key={item.batchId}>
                        <td>{formatDate(item.createdAt, true)}</td>
                        <td>{item.senderNickname || `#${item.senderUserId}`}</td>
                        <td>{item.likeType === 'SUPER_OK' ? '슈퍼 OK' : 'OK'}</td>
                        <td className={styles.successText}>{item.sentCount}</td>
                        <td>{item.matchedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`${styles.bodyCopy} ${styles.bodyCopyTop9}`}>회원 화면에는 대량 발송 표시가 남지 않습니다.</p>
            </Card>
          </div>
        </div>
      )}
      <Toast message={toast.message} onClose={toast.closeToast} />
    </div>
  );
}
