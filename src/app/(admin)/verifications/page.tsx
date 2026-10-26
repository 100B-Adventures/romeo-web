'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  adminApi,
  VerificationResponse,
  PageResponse,
  VerificationType,
  VerificationStatus,
} from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 인증 종류 한국어 라벨
const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  IDENTITY: '신원 인증',
  EDUCATION: '학력 인증',
  INCOME: '소득 인증',
  CAREER: '직장 인증',
  RESIDENCE: '거주지 인증',
};

// 인증 종류 뱃지 스타일
const VERIFICATION_TYPE_STYLES: Record<VerificationType, { bg: string; text: string }> = {
  IDENTITY: { bg: 'bg-blue-100', text: 'text-blue-700' },
  EDUCATION: { bg: 'bg-purple-100', text: 'text-purple-700' },
  INCOME: { bg: 'bg-green-100', text: 'text-green-700' },
  CAREER: { bg: 'bg-amber-100', text: 'text-amber-700' },
  RESIDENCE: { bg: 'bg-teal-100', text: 'text-teal-700' },
};

// 인증 상태 뱃지 (반려 = 빨강 강조)
const STATUS_BADGE: Record<VerificationStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: '대기', bg: 'bg-amber-100', text: 'text-amber-700' },
  APPROVED: { label: '승인', bg: 'bg-green-100', text: 'text-green-700' },
  REJECTED: { label: '반려', bg: 'bg-red-100', text: 'text-red-700' },
  EXPIRED: { label: '만료', bg: 'bg-gray-100', text: 'text-gray-500' },
};

// 상태 필터 탭
const STATUS_FILTERS: { key: VerificationStatus | 'ALL'; label: string }[] = [
  { key: 'PENDING', label: '대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
  { key: 'EXPIRED', label: '만료' },
  { key: 'ALL', label: '전체' },
];

/**
 * 인증 심사 페이지 — 대기 목록 조회 + 승인/반려
 */
export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<PageResponse<VerificationResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('PENDING');
  const PAGE_SIZE = 20;

  // 심사 모달 상태
  const [reviewTarget, setReviewTarget] = useState<VerificationResponse | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewMemo, setReviewMemo] = useState('');
  const [reviewAdminNote, setReviewAdminNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // 이미지 확대 모달
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 토스트 메시지
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 인증 목록 조회 (status 필터별)
  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = statusFilter === 'PENDING'
        ? await adminApi.getPendingVerifications(page, PAGE_SIZE)
        : await adminApi.getVerifications(
            statusFilter === 'ALL' ? undefined : statusFilter,
            page,
            PAGE_SIZE
          );
      setVerifications(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 심사 모달 열기
  const openReviewModal = (verification: VerificationResponse, action: 'APPROVED' | 'REJECTED') => {
    setReviewTarget(verification);
    setReviewAction(action);
    setReviewMemo('');
    setReviewAdminNote('');
  };

  // 심사 실행
  const handleReview = async () => {
    if (!reviewTarget) return;

    try {
      setReviewLoading(true);
      await adminApi.reviewVerification(
        reviewTarget.id,
        reviewAction,
        reviewMemo || (reviewAction === 'APPROVED' ? '승인 완료' : '반려'),
        reviewAdminNote || undefined
      );
      setToast({
        message: `인증이 ${reviewAction === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
        type: 'success',
      });
      // 모달 닫고 목록 새로고침
      setReviewTarget(null);
      fetchVerifications();
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // 날짜 포매팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 상대 시간 포매팅 (n일 전 등)
  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인증 심사</h1>
          <p className="text-sm text-gray-500 mt-1">인증 요청을 검토하고 승인/반려합니다. 반려된 건은 <span className="text-red-600 font-medium">반려</span> 뱃지로 표시됩니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {verifications && (
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
              {STATUS_FILTERS.find((f) => f.key === statusFilter)?.label} {verifications.totalElements}건
            </span>
          )}
          <button
            onClick={fetchVerifications}
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
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(0); }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${statusFilter === f.key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
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
            onClick={fetchVerifications}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 인증 대기 목록 */}
      {!loading && !error && verifications && (
        <>
          {verifications.content.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">
                {STATUS_FILTERS.find((f) => f.key === statusFilter)?.label} 인증 요청이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.content.map((verification) => {
                const typeStyle = VERIFICATION_TYPE_STYLES[verification.type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                const typeLabel = VERIFICATION_TYPE_LABELS[verification.type] || verification.type;

                return (
                  <div
                    key={verification.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* 서류 이미지 썸네일 */}
                      <div className="flex-shrink-0">
                        {verification.documentUrl ? (
                          <button
                            onClick={() => setPreviewImage(verification.documentUrl)}
                            className="block w-32 h-32 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors relative group"
                          >
                            <img
                              src={verification.documentUrl}
                              alt={`${typeLabel} 서류`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 이미지 로드 실패 시 대체 표시
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-100');
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                              </svg>
                            </div>
                          </button>
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 2.25H6A2.25 2.25 0 003.75 4.5v15A2.25 2.25 0 006 21.75h12A2.25 2.25 0 0020.25 19.5v-15A2.25 2.25 0 0018 2.25z" />
                            </svg>
                            <span className="text-xs text-gray-400 absolute mt-12">이미지 없음</span>
                          </div>
                        )}
                      </div>

                      {/* 정보 영역 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                            {typeLabel}
                          </span>
                          {/* 상태 뱃지 — 반려/승인/만료 구분 */}
                          {(() => {
                            const sb = STATUS_BADGE[verification.status] || STATUS_BADGE.PENDING;
                            return (
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${sb.bg} ${sb.text}`}>
                                {sb.label}
                              </span>
                            );
                          })()}
                          <span className="text-xs text-gray-400">
                            #{verification.id}
                          </span>
                        </div>

                        {/* 유저 정보 */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
                          {verification.userNickname && (
                            <span className="text-gray-900 font-medium">
                              {verification.userNickname}
                            </span>
                          )}
                          {verification.userId && (
                            <a
                              href={`/users/${verification.userId}`}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              유저 #{verification.userId}
                            </a>
                          )}
                          {verification.userPhoneNumber && (
                            <span className="text-gray-500 text-xs">
                              {verification.userPhoneNumber}
                            </span>
                          )}
                          {!verification.userId && !verification.userNickname && (
                            <span className="text-gray-400 text-xs">유저 정보 없음</span>
                          )}
                        </div>

                        {/* 메모 (유저가 제출 시 작성한 내용) */}
                        {verification.memo && (
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="text-gray-500">유저 메모: </span>
                            {verification.memo}
                          </p>
                        )}

                        {/* 메타 정보 */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span>제출: {formatDate(verification.createdAt)}</span>
                          <span>({formatRelativeTime(verification.createdAt)})</span>
                          {verification.expiresAt && (
                            <span>만료: {formatDate(verification.expiresAt)}</span>
                          )}
                        </div>
                      </div>

                      {/* 액션 버튼 — 대기 상태만 심사 가능. 처리된 건은 결과 표시 */}
                      <div className="flex md:flex-col items-center gap-2 md:justify-center flex-shrink-0">
                        {verification.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => openReviewModal(verification, 'APPROVED')}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              승인
                            </button>
                            <button
                              onClick={() => openReviewModal(verification, 'REJECTED')}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              반려
                            </button>
                          </>
                        ) : (
                          <div className="text-center">
                            <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${(STATUS_BADGE[verification.status] || STATUS_BADGE.PENDING).bg} ${(STATUS_BADGE[verification.status] || STATUS_BADGE.PENDING).text}`}>
                              {(STATUS_BADGE[verification.status] || STATUS_BADGE.PENDING).label} 완료
                            </span>
                            {verification.reviewMemo && (
                              <p className="text-[11px] text-gray-400 mt-1.5 max-w-[140px]">
                                {verification.reviewMemo}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {verifications.totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3">
              <div className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, verifications.totalElements)}
                {' / '}
                {verifications.totalElements}건
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={verifications.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  처음
                </button>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={verifications.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-xs text-gray-700 font-medium">
                  {page + 1} / {verifications.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(verifications.totalPages - 1, page + 1))}
                  disabled={verifications.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
                <button
                  onClick={() => setPage(verifications.totalPages - 1)}
                  disabled={verifications.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  마지막
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 심사 모달 */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReviewTarget(null)}
          />
          {/* 모달 카드 */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              인증 {reviewAction === 'APPROVED' ? '승인' : '반려'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${VERIFICATION_TYPE_STYLES[reviewTarget.type]?.bg || 'bg-gray-100'} ${VERIFICATION_TYPE_STYLES[reviewTarget.type]?.text || 'text-gray-700'}`}>
                {VERIFICATION_TYPE_LABELS[reviewTarget.type] || reviewTarget.type}
              </span>
              <span className="ml-2">#{reviewTarget.id}</span>
              {reviewTarget.userNickname && (
                <span className="ml-2 text-gray-700 font-medium">{reviewTarget.userNickname}</span>
              )}
              {reviewTarget.userId && (
                <span className="ml-1 text-gray-400">(유저 #{reviewTarget.userId})</span>
              )}
            </p>

            {/* 서류 이미지 (모달 내) */}
            {reviewTarget.documentUrl && (
              <div className="mb-4">
                <img
                  src={reviewTarget.documentUrl}
                  alt="인증 서류"
                  className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
              </div>
            )}

            {/* 유저 메모 표시 */}
            {reviewTarget.memo && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">유저 메모</p>
                <p className="text-sm text-gray-700">{reviewTarget.memo}</p>
              </div>
            )}

            {/* 심사 메모 (유저에게 전달) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                심사 메모 (유저에게 전달)
                {reviewAction === 'REJECTED' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                value={reviewMemo}
                onChange={(e) => setReviewMemo(e.target.value)}
                placeholder={
                  reviewAction === 'APPROVED'
                    ? '승인 메모 (선택, 예: 인증 확인 완료)'
                    : '반려 사유를 입력해주세요 (예: 서류가 불선명합니다)'
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 관리자 노트 (내부용) */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리자 노트 (내부 기록용, 선택)
              </label>
              <textarea
                value={reviewAdminNote}
                onChange={(e) => setReviewAdminNote(e.target.value)}
                placeholder="내부 참고 사항..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewTarget(null)}
                disabled={reviewLoading}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading || (reviewAction === 'REJECTED' && !reviewMemo.trim())}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${reviewAction === 'APPROVED'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                  }
                `}
              >
                {reviewLoading
                  ? '처리 중...'
                  : (reviewAction === 'APPROVED' ? '승인 확정' : '반려 확정')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <img
              src={previewImage}
              alt="서류 확대"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
