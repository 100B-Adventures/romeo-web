'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Badge, Card, Toast, formatDate, useToast } from '../../_components/AdminUI';
import styles from '../../admin-theme.module.css';

type VerificationRecord = {
  id: number;
  type: string;
  status: string;
};

type UserDetail = {
  userId: number;
  phoneNumber?: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE';
  role?: string;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
  lastAccessIp?: string;
  loginCount?: number;
  age?: number;
  profilePhotos?: string[];
  profileCompleteness?: number;
  verificationRecords?: VerificationRecord[];
  sentLikesCount?: number;
  receivedLikesCount?: number;
  matchingsCount?: number;
  heartBalance?: number;
  totalPaymentAmount?: number;
  matchingRecords?: Array<{
    matchingId: number;
    partnerUserId?: number;
    partnerNickname?: string;
    matchedAt?: string;
    myReaction: string;
    partnerReaction: string;
    result: string;
  }>;
  sanctionRecords?: Array<{
    actionId: number;
    actionType: string;
    details?: string;
    createdAt?: string;
  }>;
  reportedCount?: number;
  blockedByCount?: number;
};

type ActivityLog = {
  sentLikes?: number;
  receivedLikes?: number;
  communityPosts?: number;
  communityComments?: number;
  reportsFiled?: number;
  blocksCreated?: number;
};

const VERIFICATION_LABEL: Record<string, string> = {
  IDENTITY: '본인 확인',
  EDUCATION: '학력',
  CAREER: '직장',
  INCOME: '소득',
  RESIDENCE: '자산',
};

function statusTone(status?: string) {
  if (status === 'ACTIVE' || status === 'APPROVED') return 'approved' as const;
  if (status === 'SUSPENDED' || status === 'REJECTED') return 'rejected' as const;
  return 'pending' as const;
}

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const userId = Number(params.id);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [activity, setActivity] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('올바른 회원 번호가 아닙니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [detail, activityLog] = await Promise.all([
        adminApi.getUserDetail(userId) as Promise<UserDetail>,
        adminApi.getUserActivityLog(userId) as Promise<ActivityLog>,
      ]);
      setUser(detail);
      setActivity(activityLog);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const suspend = async () => {
    if (!user || user.status === 'SUSPENDED') return;
    if (!window.confirm(`${user.nickname || `회원 #${user.userId}`}의 이용을 정지하시겠습니까?`)) return;
    setActing(true);
    try {
      await adminApi.updateUserStatus(user.userId, 'SUSPENDED', '관리자 회원 상세 조치');
      toast.showToast('이용 정지를 적용했습니다.');
      await load();
    } catch (requestError) {
      toast.showToast(getErrorMessage(requestError));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} href="/admin/users">‹ 회원 관리</Link>
      {loading && <div className={styles.notice}>회원 상세를 불러오고 있습니다.</div>}
      {error && <div className={styles.error}>{error}</div>}
      {user && (
        <>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {user.profilePhotos?.[0]
                ? <img src={user.profilePhotos[0]} alt={`${user.nickname || '회원'} 프로필`} />
                : <div className={styles.avatarFallback}>{user.nickname?.charAt(0) || '회'}</div>}
            </div>
            <div>
              <div className={styles.profileName}>{user.nickname || '닉네임 없음'} · #{user.userId}</div>
              <div className={styles.chipRow}>
                <Badge tone={statusTone(user.status)}>{user.status || '상태 없음'}</Badge>
                <Badge tone="neutral">{user.gender === 'FEMALE' ? '여' : '남'} · {user.age ?? '나이 없음'}</Badge>
              </div>
            </div>
            <div className={styles.profileActions}>
              <Link className={styles.button} href={`/admin/hearts?userId=${user.userId}`}>하트 지급</Link>
              <button type="button" className={`${styles.button} ${styles.buttonWine}`} onClick={suspend} disabled={acting || user.status === 'SUSPENDED'}>{user.status === 'SUSPENDED' ? '정지됨' : '이용 정지'}</button>
            </div>
          </div>

          <div className={styles.twoColumns}>
            <Card>
              <div className={styles.eyebrow}>계정 · 접속</div>
              {[
                ['가입일', formatDate(user.createdAt, true)],
                ['최근 로그인', formatDate(user.lastLoginAt, true)],
                ['로그인 방식', '휴대폰 OTP'],
                ['접속 IP', user.lastAccessIp || '미수집'],
                ['누적 접속', user.loginCount == null ? '미수집' : `${user.loginCount.toLocaleString()}회`],
                ['연락처', user.phoneNumber || '없음'],
                ['역할', user.role || 'USER'],
                ['상태', user.status || '없음'],
              ].map(([label, value]) => (
                <div className={styles.kvRow} key={label}><span className={styles.kvLabel}>{label}</span><span className={styles.kvValue}>{value}</span></div>
              ))}
            </Card>
            <Card>
              <div className={styles.eyebrow}>인증 · 하트</div>
              {(user.verificationRecords ?? []).slice(0, 4).map((record) => (
                <div className={styles.kvRow} key={record.id}>
                  <span className={styles.kvLabel}>{VERIFICATION_LABEL[record.type] || record.type}</span>
                  <span className={statusTone(record.status) === 'approved' ? styles.successText : styles.accentText}>{record.status}</span>
                </div>
              ))}
              <div className={styles.kvRow}><span className={styles.kvLabel}>보유 하트</span><span className={styles.kvValue}>{user.heartBalance?.toLocaleString() ?? 0}</span></div>
              <div className={styles.kvRow}><span className={styles.kvLabel}>누적 결제</span><span className={styles.kvValue}>₩{(user.totalPaymentAmount ?? 0).toLocaleString()}</span></div>
              <div className={styles.kvRow}><span className={styles.kvLabel}>프로필 완성도</span><span className={styles.kvValue}>{user.profileCompleteness ?? 0}%</span></div>
            </Card>
          </div>

          <Card className={styles.sectionTopSmall}>
            <div className={styles.eyebrow}>매칭 기록</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>상대</th><th>추천일</th><th>내 반응</th><th>상대 반응</th><th>결과</th></tr></thead>
                <tbody>
                  {(user.matchingRecords ?? []).map((record) => (
                    <tr key={record.matchingId}>
                      <td>{record.partnerNickname || '닉네임 없음'} · #{record.partnerUserId ?? '-'}</td>
                      <td>{formatDate(record.matchedAt)}</td>
                      <td>{record.myReaction}</td>
                      <td>{record.partnerReaction}</td>
                      <td><Badge tone={statusTone(record.result)}>{record.result}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(user.matchingRecords ?? []).length === 0 && <div className={styles.empty}>매칭 기록이 없습니다.</div>}
            <div className={`${styles.eyebrow} ${styles.sectionTopSmall}`}>활동 집계</div>
            <div className={styles.metricGrid}>
              {[
                ['보낸 OK', activity?.sentLikes ?? user.sentLikesCount ?? 0],
                ['받은 OK', activity?.receivedLikes ?? user.receivedLikesCount ?? 0],
                ['매칭', user.matchingsCount ?? 0],
                ['게시글·댓글', (activity?.communityPosts ?? 0) + (activity?.communityComments ?? 0)],
              ].map(([label, value]) => (
                <div className={styles.metric} key={label}><div className={styles.eyebrow}>{label}</div><div className={styles.metricValue}>{value}</div></div>
              ))}
            </div>
          </Card>

          <Card className={styles.sectionTopSmall}>
            <div className={styles.eyebrow}>신고 · 제재 이력</div>
            <p className={`${styles.bodyCopy} ${styles.bodyCopyTop10}`}>피신고 {user.reportedCount ?? 0}건 · 차단당함 {user.blockedByCount ?? 0}건 · 본인 신고 {activity?.reportsFiled ?? 0}건 · 본인 차단 {activity?.blocksCreated ?? 0}건</p>
            {(user.sanctionRecords ?? []).map((record) => (
              <div className={styles.kvRow} key={record.actionId}>
                <span className={styles.kvLabel}>{formatDate(record.createdAt, true)} · {record.actionType}</span>
                <span className={styles.kvValue}>{record.details || '상세 사유 없음'}</span>
              </div>
            ))}
            {(user.sanctionRecords ?? []).length === 0 && <div className={styles.empty}>제재 이력이 없습니다.</div>}
          </Card>
        </>
      )}
      <Toast message={toast.message} onClose={toast.closeToast} />
    </div>
  );
}
