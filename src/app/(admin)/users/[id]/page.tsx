'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: '활성' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', label: '정지' },
  DELETED: { bg: 'bg-gray-100', text: 'text-gray-500', label: '삭제' },
  PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: '심사중' },
};

const GENDER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  MALE: { bg: 'bg-sky-100', text: 'text-sky-700', label: '남성' },
  FEMALE: { bg: 'bg-pink-100', text: 'text-pink-700', label: '여성' },
};

const VERIFICATION_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: '대기' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: '승인' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: '거절' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-500', label: '만료' },
};

interface VerificationRecord {
  id: number;
  type: string;
  status: string;
  submittedAt?: string;
  reviewedAt?: string;
  memo?: string;
}

interface UserDetail {
  userId: number;
  phoneNumber?: string;
  nickname?: string;
  gender?: string;
  role?: string;
  status?: string;
  verified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  // 프로필 전체 정보
  age?: number;
  birthYear?: number;
  occupation?: string;
  company?: string;
  incomeRange?: string;
  education?: string;
  school?: string;
  bio?: string;
  location?: string;
  height?: number;
  bodyType?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  hobbies?: string[];
  profilePhotos?: string[];
  profileCompleteness?: number;
  // 인증 기록
  verificationRecords?: VerificationRecord[];
  // 활동 통계
  sentLikesCount?: number;
  receivedLikesCount?: number;
  matchingsCount?: number;
  heartBalance?: number;
  coupleRegistered?: boolean;
  reportedCount?: number;
  blockedByCount?: number;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activityLog, setActivityLog] = useState<Record<string, unknown> | null>(null);
  const [diagnosis, setDiagnosis] = useState<import('@/lib/api/admin').UserDiagnosisResponse | null>(null);

  useEffect(() => {
    if (!userId || isNaN(userId)) { setError('유효하지 않은 유저 ID'); setLoading(false); return; }
    const fetch = async () => {
      try {
        setLoading(true); setError(null);
        const [userData, logData, diagData] = await Promise.all([
          adminApi.getUserDetail(userId),
          adminApi.getUserActivityLog(userId).catch(() => null),
          adminApi.getUserDiagnosis(userId).catch(() => null),
        ]);
        setUser(userData);
        setActivityLog(logData);
        setDiagnosis(diagData);
      }
      catch (err) { setError(getErrorMessage(err)); }
      finally { setLoading(false); }
    };
    fetch();
  }, [userId]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const fmt = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!user) return;
    const reason = window.prompt(newStatus === 'SUSPENDED' ? '정지 사유:' : '활성화 사유 (선택):', '');
    if (newStatus === 'SUSPENDED' && !reason) return;
    try {
      await adminApi.updateUserStatus(userId, newStatus, reason || undefined);
      setToast({ message: `${user.nickname || userId} ${newStatus === 'ACTIVE' ? '활성화' : '정지'} 완료`, type: 'success' });
      setUser({ ...user, status: newStatus });
    } catch (err) { setToast({ message: getErrorMessage(err), type: 'error' }); }
  };

  // 정보 행 렌더러
  const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? '-'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용자 상세</h1>
          <p className="text-sm text-gray-500">ID: {userId}</p>
        </div>
      </div>

      {loading && <div className="bg-white rounded-xl border p-12 text-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" /></div>}
      {error && !loading && <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-600 text-sm">{error}</p></div>}

      {!loading && !error && user && (
        <>
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
              <div className="flex items-center gap-2">
                {user.status === 'ACTIVE' && (
                  <button onClick={() => handleStatusChange('SUSPENDED')} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">계정 정지</button>
                )}
                {user.status === 'SUSPENDED' && (
                  <button onClick={() => handleStatusChange('ACTIVE')} className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100">계정 활성화</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoRow label="유저 ID" value={user.userId} />
              <InfoRow label="닉네임" value={user.nickname} />
              <InfoRow label="전화번호" value={user.phoneNumber} />
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">성별</p>
                {user.gender ? (
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${GENDER_STYLES[user.gender]?.bg} ${GENDER_STYLES[user.gender]?.text}`}>
                    {GENDER_STYLES[user.gender]?.label}
                  </span>
                ) : <p className="text-sm text-gray-400">-</p>}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">상태</p>
                {user.status ? (
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[user.status]?.bg} ${STATUS_STYLES[user.status]?.text}`}>
                    {STATUS_STYLES[user.status]?.label}
                  </span>
                ) : <p className="text-sm text-gray-400">-</p>}
              </div>
              <InfoRow label="역할" value={user.role === 'ADMIN' ? '관리자' : user.role === 'OPERATOR' ? '운영자' : '일반'} />
              <InfoRow label="가입일" value={fmt(user.createdAt)} />
              <InfoRow label="최근 로그인" value={fmt(user.lastLoginAt)} />
            </div>
          </div>

          {/* 프로필 상세 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>
              {user.profileCompleteness != null && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${user.profileCompleteness}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{user.profileCompleteness}%</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoRow label="나이" value={user.age ? `${user.age}세 (${user.birthYear}년생)` : undefined} />
              <InfoRow label="직업" value={user.occupation} />
              <InfoRow label="회사" value={user.company} />
              <InfoRow label="학력" value={user.education} />
              <InfoRow label="학교" value={user.school} />
              <InfoRow label="지역" value={user.location} />
              <InfoRow label="키" value={user.height ? `${user.height}cm` : undefined} />
              <InfoRow label="체형" value={user.bodyType} />
              <InfoRow label="소득" value={user.incomeRange} />
              <InfoRow label="흡연" value={user.smoking} />
              <InfoRow label="음주" value={user.drinking} />
              <InfoRow label="종교" value={user.religion} />
            </div>
            {user.hobbies && user.hobbies.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">취미</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.hobbies.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{h}</span>
                  ))}
                </div>
              </div>
            )}
            {user.bio && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">자기소개</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">{user.bio}</p>
              </div>
            )}
          </div>

          {/* 프로필 사진 */}
          {user.profilePhotos && user.profilePhotos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 사진 ({user.profilePhotos.length}장)</h2>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                {user.profilePhotos.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={photo} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 진단 (Phase 3) */}
          {diagnosis && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">자동 진단</h2>
              <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-lg font-bold text-amber-800">{diagnosis.reason}</span>
                <span className="text-sm text-amber-700">{diagnosis.reasonDetail}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{diagnosis.profileCompleteness ?? 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">프로필 완성도</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{diagnosis.verifiedBadges?.length ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">승인 뱃지</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{diagnosis.recommendationExposures}</p>
                  <p className="text-xs text-gray-500 mt-1">추천 노출</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{diagnosis.cardsViewed}</p>
                  <p className="text-xs text-gray-500 mt-1">내가 본 카드</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{diagnosis.contactReveals}</p>
                  <p className="text-xs text-gray-500 mt-1">연락처 공개</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{diagnosis.coupleRegistrations}</p>
                  <p className="text-xs text-gray-500 mt-1">커플 등록</p>
                </div>
              </div>
            </div>
          )}

          {/* 활동 통계 + 하트 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-800">{user.sentLikesCount ?? '-'}</p>
                <p className="text-xs text-blue-600 mt-1">보낸 OK</p>
              </div>
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-pink-800">{user.receivedLikesCount ?? '-'}</p>
                <p className="text-xs text-pink-600 mt-1">받은 OK</p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-800">{user.matchingsCount ?? '-'}</p>
                <p className="text-xs text-green-600 mt-1">매칭</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-800">{user.heartBalance?.toLocaleString() ?? '-'}</p>
                <p className="text-xs text-amber-600 mt-1">하트 잔액</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-800">{user.coupleRegistered ? '등록' : '미등록'}</p>
                <p className="text-xs text-gray-500 mt-1">커플 등록</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-red-600">{user.reportedCount ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">피신고 수</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-600">{user.blockedByCount ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">차단당한 수</p>
              </div>
            </div>
          </div>

          {/* 인증 기록 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">인증 기록</h2>
              <div className="flex items-center gap-1">
                {user.verified ? (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307z" clipRule="evenodd" /><path fillRule="evenodd" d="M15.78 9.78a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 111.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
                    인증 완료
                  </span>
                ) : <span className="text-sm text-gray-400">미인증</span>}
              </div>
            </div>
            {user.verificationRecords && user.verificationRecords.length > 0 ? (
              <div className="space-y-2">
                {user.verificationRecords.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{v.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${VERIFICATION_STATUS[v.status]?.bg || 'bg-gray-100'} ${VERIFICATION_STATUS[v.status]?.text || 'text-gray-600'}`}>
                        {VERIFICATION_STATUS[v.status]?.label || v.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {fmt(v.submittedAt)}
                      {v.reviewedAt && <span className="ml-2">심사: {fmt(v.reviewedAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">인증 제출 내역이 없습니다</p>
            )}
          </div>

          {/* 활동 로그 */}
          {activityLog && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 활동 로그</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-pink-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-pink-600">{String(activityLog.sentLikes ?? 0)}</div>
                  <div className="text-xs text-gray-500">보낸 좋아요</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-rose-600">{String(activityLog.receivedLikes ?? 0)}</div>
                  <div className="text-xs text-gray-500">받은 좋아요</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{String(activityLog.communityPosts ?? 0)}</div>
                  <div className="text-xs text-gray-500">게시글</div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{String(activityLog.communityComments ?? 0)}</div>
                  <div className="text-xs text-gray-500">댓글</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{String(activityLog.reportsFiled ?? 0)}</div>
                  <div className="text-xs text-gray-500">신고</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">{String(activityLog.blocksCreated ?? 0)}</div>
                  <div className="text-xs text-gray-500">차단</div>
                </div>
              </div>
            </div>
          )}

          {/* 관리 메뉴 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">관리</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/reports" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">신고 관리</Link>
              <Link href="/verifications" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">인증 심사</Link>
              <Link href="/hearts" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">하트 관리</Link>
            </div>
          </div>
        </>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
