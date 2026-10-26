'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, AdminStatsResponse, FunnelResponse } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

/**
 * 관리자 대시보드 — 주요 지표 카드 + 매칭 퍼널
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [funnelDays, setFunnelDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  // 통계 + 퍼널 데이터 조회
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, f] = await Promise.all([
        adminApi.getStats(),
        adminApi.getFunnel(funnelDays),
      ]);
      setStats(s);
      setFunnel(f);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [funnelDays]);

  // 테스트 계정 추천 리셋
  const handleResetTestRecommendations = useCallback(async () => {
    if (!window.confirm('테스트 계정(01010000001~999)의 추천 데이터를 모두 리셋합니다. 계속하시겠습니까?')) {
      return;
    }
    try {
      setResetLoading(true);
      setResetResult(null);
      const data = await adminApi.resetTestAccountRecommendations();
      const msg = data.deletedSlots != null && data.deletedLogs != null
        ? `리셋 완료 — 슬롯 ${data.deletedSlots}건, 로그 ${data.deletedLogs}건 삭제`
        : '리셋 완료';
      setResetResult(msg);
    } catch (err) {
      setResetResult(`리셋 실패: ${getErrorMessage(err)}`);
    } finally {
      setResetLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // 통계 카드 정의
  const statCards: {
    label: string;
    value: number;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      label: '전체 사용자',
      value: stats.totalUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: '활성 사용자',
      value: stats.activeUsers,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: '오늘 가입',
      value: stats.todaySignups,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
    },
    {
      label: '인증 대기',
      value: stats.pendingVerifications,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: '남성 사용자',
      value: stats.maleUsers,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      label: '여성 사용자',
      value: stats.femaleUsers,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      label: '전체 매칭',
      value: stats.totalMatchings,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      label: '오늘 매칭',
      value: stats.todayMatchings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      label: '오늘 OK 전송',
      value: stats.todayLikes ?? 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      label: '오늘 슈퍼OK',
      value: stats.todaySuperLikes ?? 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    },
    {
      label: '대기 신고',
      value: stats.pendingReports ?? 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: '오늘 결제',
      value: stats.todayPaidCount ?? 0,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
    {
      label: '오늘 매출 (원)',
      value: stats.todayRevenue ?? 0,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 페이지 제목 + 새로고침 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          새로고침
        </button>
      </div>

      {/* 매칭 퍼널 (Phase 2) */}
      {funnel && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">매칭 퍼널</h3>
            <select
              value={funnelDays}
              onChange={(e) => setFunnelDays(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value={7}>최근 7일</option>
              <option value={30}>최근 30일</option>
              <option value={90}>최근 90일</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { label: '추천 노출', v: funnel.cardsShown, color: 'bg-blue-400' },
              { label: '프로필 조회', v: funnel.cardsViewed, color: 'bg-cyan-400' },
              { label: 'OK 전송', v: funnel.likesSent, color: 'bg-emerald-400' },
              { label: '슈퍼OK', v: funnel.superLikesSent, color: 'bg-yellow-400' },
              { label: '매칭 성사', v: funnel.matched, color: 'bg-orange-400' },
              { label: '연락처 공개', v: funnel.contactsRevealed, color: 'bg-pink-400' },
              { label: '커플 등록', v: funnel.couplesRegistered, color: 'bg-purple-500' },
            ].map((row, i, arr) => {
              const max = arr[0].v || 1;
              const pct = Math.max(2, (row.v / max) * 100);
              const dropoff = i > 0 && arr[i - 1].v > 0 ? Math.round((row.v / arr[i - 1].v) * 100) : null;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 text-right">{row.label}</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded">
                    <div className={`h-full ${row.color} rounded flex items-center justify-end pr-2 text-white text-sm font-semibold`} style={{ width: `${pct}%` }}>
                      {row.v.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-gray-500 text-right">
                    {dropoff != null ? `${dropoff}%` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* 추가 요약 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 성비 요약 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">성비 현황</h3>
          <div className="space-y-4">
            {/* 남성 바 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">남성</span>
                <span className="text-sm font-medium text-sky-600">
                  {stats.maleUsers.toLocaleString()}명
                  {stats.totalUsers > 0 && (
                    <span className="text-gray-400 ml-1">
                      ({Math.round((stats.maleUsers / stats.totalUsers) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalUsers > 0 ? (stats.maleUsers / stats.totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>
            {/* 여성 바 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">여성</span>
                <span className="text-sm font-medium text-pink-600">
                  {stats.femaleUsers.toLocaleString()}명
                  {stats.totalUsers > 0 && (
                    <span className="text-gray-400 ml-1">
                      ({Math.round((stats.femaleUsers / stats.totalUsers) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalUsers > 0 ? (stats.femaleUsers / stats.totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 매칭 요약 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">매칭 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-rose-50 rounded-lg">
              <p className="text-2xl font-bold text-rose-600">{stats.totalMatchings.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">전체 매칭</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.activeMatchings.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">진행 중</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.coupleRegistrations.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">커플 등록</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.todayMatchings.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">오늘 매칭</p>
            </div>
          </div>
        </div>
      </div>

      {/* 관리 도구 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">관리 도구</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetTestRecommendations}
            disabled={resetLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resetLoading ? '리셋 중...' : '테스트 계정 추천 리셋'}
          </button>
          {resetResult && (
            <span className={`text-sm ${resetResult.startsWith('리셋 실패') ? 'text-red-600' : 'text-green-600'}`}>
              {resetResult}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          테스트 계정(01010000001~999)의 추천 슬롯과 로그를 초기화합니다.
        </p>
      </div>
    </div>
  );
}
