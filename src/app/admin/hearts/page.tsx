'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Card, Toast, formatDate, useToast } from '../_components/AdminUI';
import styles from '../admin-theme.module.css';

type HeartBalance = { userId: number; balance: number };
type HeartGrantAudit = { actionId: number; adminId: number; adminNickname?: string; recipientUserId: number; recipientNickname?: string; amount: number; reason?: string; createdAt: string };

export default function AdminHeartsPage() {
  const [lookupId, setLookupId] = useState('');
  const [issueId, setIssueId] = useState('');
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('인증 완료 감사 보너스');
  const [balance, setBalance] = useState<HeartBalance | null>(null);
  const [grantAudit, setGrantAudit] = useState<HeartGrantAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const { message, showToast, closeToast } = useToast();

  const loadUser = useCallback(async (rawUserId: string) => {
    const userId = Number(rawUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      showToast('올바른 회원 ID를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const nextBalance = await adminApi.getHeartBalance(userId) as HeartBalance;
      setBalance(nextBalance);
      setIssueId(String(userId));
    } catch (requestError) {
      showToast(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadGrantAudit = useCallback(async () => {
    try {
      const page = await adminApi.getHeartGrantAudit(0, 20) as { content?: HeartGrantAudit[] };
      setGrantAudit(page.content ?? []);
    } catch (requestError) {
      showToast(getErrorMessage(requestError));
    }
  }, [showToast]);

  useEffect(() => {
    loadGrantAudit();
    const queryId = new URLSearchParams(window.location.search).get('userId');
    if (queryId) {
      setLookupId(queryId);
      setIssueId(queryId);
      loadUser(queryId);
    }
  }, [loadGrantAudit, loadUser]);

  const issue = async () => {
    const userId = Number(issueId);
    const parsedAmount = Number(amount);
    if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      showToast('회원 ID와 1 이상의 정수 수량을 확인해 주세요.');
      return;
    }
    setIssuing(true);
    try {
      await adminApi.issueHearts(userId, parsedAmount, reason.trim() || undefined);
      showToast(`${userId}번 회원에게 ${parsedAmount}하트를 지급했습니다.`);
      setLookupId(String(userId));
      await loadUser(String(userId));
      await loadGrantAudit();
    } catch (requestError) {
      showToast(getErrorMessage(requestError));
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>하트 관리</h1>
        <div className={styles.subtitle}>사용자 하트 잔액 조회 · 보너스 지급</div>
      </div>
      <div className={styles.twoColumns}>
        <Card>
          <div className={styles.eyebrow}>잔액 조회</div>
          <label className={styles.fieldLabel} htmlFor="heart-lookup-id">회원 ID</label>
          <div className={`${styles.search} ${styles.searchFlush}`}>
            <input id="heart-lookup-id" className={`${styles.input} ${styles.inputCompact}`} value={lookupId} onChange={(event) => setLookupId(event.target.value.replace(/\D/g, ''))} placeholder="회원 ID" inputMode="numeric" />
            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => loadUser(lookupId)} disabled={loading}>{loading ? '조회 중' : '조회'}</button>
          </div>
          <div className={styles.balancePanel}>
            <div className={styles.muted}>유저 <strong>#{balance?.userId ?? '조회 전'}</strong>의 하트 잔액</div>
            <div className={styles.balanceValue}>{balance?.balance.toLocaleString() ?? 0} <span className={styles.balanceUnit}>하트</span></div>
          </div>
        </Card>

        <Card>
          <div className={styles.eyebrow}>보너스 하트 지급</div>
          <label className={styles.fieldLabel} htmlFor="heart-issue-id">회원 ID</label>
          <input id="heart-issue-id" className={`${styles.input} ${styles.inputCompact}`} value={issueId} onChange={(event) => setIssueId(event.target.value.replace(/\D/g, ''))} placeholder="회원 ID" inputMode="numeric" />
          <label className={styles.fieldLabel} htmlFor="heart-amount">지급 수량</label>
          <input id="heart-amount" className={`${styles.input} ${styles.inputCompact}`} value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          <label className={styles.fieldLabel} htmlFor="heart-reason">지급 사유 (선택)</label>
          <input id="heart-reason" className={`${styles.input} ${styles.inputCompact}`} value={reason} onChange={(event) => setReason(event.target.value)} />
          <button type="button" className={`${styles.button} ${styles.buttonWine} ${styles.buttonBlock} ${styles.sectionTopSmall}`} onClick={issue} disabled={issuing || !issueId || Number(amount) <= 0}>{issuing ? '지급 중' : '보너스 지급'}</button>
        </Card>
      </div>

      <Card className={styles.sectionTopSmall}>
        <div className={styles.eyebrow}>최근 지급 내역</div>
        <div className={`${styles.tableWrap} ${styles.tableTop12}`}>
          <table className={`${styles.table} ${styles.tableRowsTall}`}>
            <thead><tr><th>관리자</th><th>회원</th><th>수량</th><th>사유</th><th>일시</th></tr></thead>
            <tbody>
              {grantAudit.map((item) => (
                <tr key={item.actionId}>
                  <td>{item.adminNickname || '관리자'} · #{item.adminId}</td>
                  <td>{item.recipientNickname || '닉네임 없음'} · #{item.recipientUserId}</td>
                  <td className={styles.successText}>+{item.amount}</td>
                  <td>{item.reason || '사유 없음'}</td>
                  <td>{formatDate(item.createdAt, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {grantAudit.length === 0 && <div className={styles.empty}>관리자 지급 기록이 없습니다.</div>}
      </Card>
      <Toast message={message} onClose={closeToast} />
    </div>
  );
}
