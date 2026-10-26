'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 신고 상태 뱃지 스타일
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: '대기' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: '승인' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: '반려' },
};

// 필터 탭 목록
const FILTER_TABS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
];

// R15-21: 신고 유형별 분류
const TYPE_TABS = [
  { value: '', label: '전체' },
  { value: 'PROFILE', label: '프로필' },
  { value: 'POST', label: '게시글' },
  { value: 'COMMENT', label: '댓글' },
];

interface ReportItem {
  id: number;
  reporterId?: number;
  reporterNickname?: string;
  reportedUserId?: number;
  reportedUserNickname?: string;
  reason?: string;
  description?: string;
  status: string;
  adminNote?: string;
  createdAt?: string;
  targetType?: string;
  targetId?: number;
}

/**
 * 신고 관리 페이지 — 신고 목록 조회, 상태 필터, 승인/반려 처리
 */
export default function AdminReportsPage() {
  const [reports, setReports] = useState<{ content: ReportItem[]; totalElements: number; totalPages: number; number: number; first: boolean; last: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const PAGE_SIZE = 20;

  // 처리 모달 상태
  const [processTarget, setProcessTarget] = useState<ReportItem | null>(null);
  const [processAction, setProcessAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminNote, setAdminNote] = useState('');
  const [processLoading, setProcessLoading] = useState(false);

  // 토스트 메시지
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 신고 목록 조회
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getReports(statusFilter || undefined, page, PAGE_SIZE);
      setReports(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 필터 탭 변경
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  // 처리 모달 열기
  const openProcessModal = (report: ReportItem, action: 'APPROVED' | 'REJECTED') => {
    setProcessTarget(report);
    setProcessAction(action);
    setAdminNote('');
  };

  // 신고 처리 실행
  const handleProcess = async () => {
    if (!processTarget) return;

    try {
      setProcessLoading(true);
      await adminApi.processReport(processTarget.id, processAction, adminNote || undefined);
      setToast({
        message: `신고 #${processTarget.id}이(가) ${processAction === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
        type: 'success',
      });
      setProcessTarget(null);
      fetchReports();
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      });
    } finally {
      setProcessLoading(false);
    }
  };

  // 날짜 포매팅
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
          <p className="text-sm text-gray-500 mt-1">접수된 신고를 검토하고 처리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {reports && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg">
              총 {reports.totalElements}건
            </span>
          )}
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            새로고침
          </button>
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${statusFilter === tab.value
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
        <span className="border-l border-gray-300 mx-1" />
        {TYPE_TABS.map((tab) => (
          <button
            key={`type-${tab.value}`}
            onClick={() => { setTypeFilter(tab.value); setPage(0); }}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${typeFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-200 rounded w-64" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 신고 목록 */}
      {!loading && !error && reports && (() => {
        // 클라이언트 사이드 targetType 필터 적용
        const filteredContent = typeFilter
          ? reports.content.filter((r) => r.targetType === typeFilter)
          : reports.content;
        return (
        <>
          {filteredContent.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">
                {statusFilter ? `${STATUS_STYLES[statusFilter]?.label || statusFilter} 상태의 신고가 없습니다.` : '접수된 신고가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((report) => {
                const statusStyle = STATUS_STYLES[report.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: report.status };

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* 정보 영역 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            #{report.id}
                          </span>
                          {/* R15-21: 신고 유형 뱃지 + 대상 ID */}
                          {report.targetType && (
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              report.targetType === 'PROFILE' ? 'bg-blue-100 text-blue-700' :
                              report.targetType === 'POST' ? 'bg-purple-100 text-purple-700' :
                              report.targetType === 'COMMENT' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {report.targetType === 'PROFILE' ? '프로필' :
                               report.targetType === 'POST' ? '게시글' :
                               report.targetType === 'COMMENT' ? '댓글' : report.targetType}
                              {report.targetId != null && (
                                <span className="ml-1 opacity-75">#{report.targetId}</span>
                              )}
                            </span>
                          )}
                          {report.createdAt && (
                            <span className="text-xs text-gray-400 ml-2">
                              {formatDate(report.createdAt)}
                            </span>
                          )}
                        </div>

                        {/* R15-20: 신고자 / 피신고자 정보 + 바로 보기 링크 */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-2 text-sm">
                          <div>
                            <span className="text-gray-500">신고자: </span>
                            {report.reporterId ? (
                              <a href={`/admin/users/${report.reporterId}`} className="text-blue-600 hover:underline font-medium">
                                {report.reporterNickname || `#${report.reporterId}`}
                              </a>
                            ) : (
                              <span className="text-gray-900 font-medium">알 수 없음</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">피신고자: </span>
                            {report.reportedUserId ? (
                              <a href={`/admin/users/${report.reportedUserId}`} className="text-red-600 hover:underline font-medium">
                                {report.reportedUserNickname || `#${report.reportedUserId}`}
                              </a>
                            ) : (
                              <span className="text-gray-900 font-medium">알 수 없음</span>
                            )}
                          </div>
                        </div>

                        {/* 신고 사유 */}
                        {report.reason && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="text-gray-500">사유: </span>
                            <span className="font-medium">{report.reason}</span>
                          </p>
                        )}

                        {/* 상세 설명 */}
                        {report.description && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="text-gray-500">설명: </span>
                            {report.description}
                          </p>
                        )}

                        {/* 관리자 노트 (처리된 경우) */}
                        {report.adminNote && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">관리자 노트</p>
                            <p className="text-sm text-gray-700">{report.adminNote}</p>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 (PENDING 상태만) */}
                      {report.status === 'PENDING' && (
                        <div className="flex md:flex-col items-center gap-2 md:justify-center flex-shrink-0">
                          <button
                            onClick={() => openProcessModal(report, 'APPROVED')}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            승인
                          </button>
                          <button
                            onClick={() => openProcessModal(report, 'REJECTED')}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            반려
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {reports.totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3">
              <div className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, reports.totalElements)}
                {' / '}
                {reports.totalElements}건
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={reports.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  처음
                </button>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={reports.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-xs text-gray-700 font-medium">
                  {page + 1} / {reports.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(reports.totalPages - 1, page + 1))}
                  disabled={reports.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
                <button
                  onClick={() => setPage(reports.totalPages - 1)}
                  disabled={reports.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  마지막
                </button>
              </div>
            </div>
          )}
        </>
        );
      })()}

      {/* 처리 모달 */}
      {processTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setProcessTarget(null)}
          />
          {/* 모달 카드 */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              신고 {processAction === 'APPROVED' ? '승인' : '반려'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              신고 #{processTarget.id}을(를) {processAction === 'APPROVED' ? '승인' : '반려'}합니다.
            </p>
            {processAction === 'APPROVED' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700">⚠️ 승인 시 피신고자의 계정이 즉시 정지됩니다</p>
                <p className="text-xs text-red-500 mt-1">정지된 유저는 로그인 시 정지 안내 화면을 보게 됩니다.</p>
              </div>
            )}

            {/* 신고 요약 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              {processTarget.targetType && (
                <p className="mb-1">
                  <span className="text-gray-500">신고 유형:</span>{' '}
                  <span className="font-medium">
                    {processTarget.targetType === 'PROFILE' ? '프로필' :
                     processTarget.targetType === 'POST' ? '게시글' :
                     processTarget.targetType === 'COMMENT' ? '댓글' : processTarget.targetType}
                    {processTarget.targetId != null && ` #${processTarget.targetId}`}
                  </span>
                </p>
              )}
              <p><span className="text-gray-500">신고자:</span> {processTarget.reporterNickname || `ID ${processTarget.reporterId}`}</p>
              <p><span className="text-gray-500">피신고자:</span> {processTarget.reportedUserNickname || `ID ${processTarget.reportedUserId}`}</p>
              {processTarget.reason && <p><span className="text-gray-500">사유:</span> {processTarget.reason}</p>}
            </div>

            {/* 관리자 노트 입력 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리자 노트
                {processAction === 'REJECTED' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  processAction === 'APPROVED'
                    ? '처리 메모 (선택, 예: 확인 후 제재 처리)'
                    : '반려 사유를 입력해주세요 (예: 허위 신고로 판단)'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setProcessTarget(null)}
                disabled={processLoading}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleProcess}
                disabled={processLoading || (processAction === 'REJECTED' && !adminNote.trim())}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${processAction === 'APPROVED'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                  }
                `}
              >
                {processLoading
                  ? '처리 중...'
                  : (processAction === 'APPROVED' ? '승인 확정' : '반려 확정')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
          <div
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
              ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
            `}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
