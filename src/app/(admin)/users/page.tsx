'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  adminApi,
  UserListResponse,
  PageResponse,
  UserStatus,
} from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 상태 뱃지 색상 매핑
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: '활성' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', label: '정지' },
  DELETED: { bg: 'bg-gray-100', text: 'text-gray-500', label: '삭제' },
  PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: '심사중' },
};

// 성별 뱃지 색상 매핑
const GENDER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  MALE: { bg: 'bg-sky-100', text: 'text-sky-700', label: '남성' },
  FEMALE: { bg: 'bg-pink-100', text: 'text-pink-700', label: '여성' },
};

/**
 * 회원 관리 페이지 — 사용자 목록, 검색, 상태 변경
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<PageResponse<UserListResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const PAGE_SIZE = 20;

  // 상태 변경 모달 상태
  const [modalUser, setModalUser] = useState<UserListResponse | null>(null);
  const [modalAction, setModalAction] = useState<'ACTIVE' | 'SUSPENDED' | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 토스트 메시지
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 사용자 목록 조회
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: PageResponse<UserListResponse>;
      if (keyword) {
        data = await adminApi.searchUsers(keyword, page, PAGE_SIZE);
      } else {
        data = await adminApi.getUsers(page, PAGE_SIZE);
      }
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setKeyword(searchInput.trim());
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('');
    setPage(0);
  };

  // 상태 변경 모달 열기
  const openStatusModal = (user: UserListResponse, action: 'ACTIVE' | 'SUSPENDED') => {
    setModalUser(user);
    setModalAction(action);
    setStatusReason('');
  };

  // 상태 변경 실행
  const handleStatusChange = async () => {
    if (!modalUser || !modalAction) return;

    try {
      setActionLoading(true);
      await adminApi.updateUserStatus(modalUser.userId, modalAction, statusReason || undefined);
      setToast({
        message: `${modalUser.nickname} 회원이 ${modalAction === 'ACTIVE' ? '활성화' : '정지'} 처리되었습니다.`,
        type: 'success',
      });
      // 모달 닫고 목록 새로고침
      setModalUser(null);
      setModalAction(null);
      fetchUsers();
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 날짜 포매팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        {users && (
          <span className="text-sm text-gray-500">
            총 {users.totalElements.toLocaleString()}명
          </span>
        )}
      </div>

      {/* 검색 바 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="닉네임 또는 전화번호로 검색..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          검색
        </button>
        {keyword && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            초기화
          </button>
        )}
      </form>

      {/* 검색 결과 표시 */}
      {keyword && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>검색어:</span>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">{keyword}</span>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-3">로딩 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 사용자 테이블 */}
      {!loading && !error && users && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">닉네임</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">전화번호</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">성별</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">역할</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">인증</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">가입일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.content.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      {keyword ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  users.content.map((user) => {
                    const statusStyle = STATUS_STYLES[user.status] || STATUS_STYLES.ACTIVE;
                    const genderStyle = GENDER_STYLES[user.gender] || GENDER_STYLES.MALE;

                    return (
                      <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{user.userId}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link href={`/users/${user.userId}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {user.nickname}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{user.phoneNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${genderStyle.bg} ${genderStyle.text}`}>
                            {genderStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${user.role === 'ADMIN' ? 'text-red-600' : 'text-gray-500'}`}>
                            {user.role === 'ADMIN' ? '관리자' : '일반'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.verified ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs text-gray-400">미인증</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* R12-23: 별도 상세 버튼 제거 — 닉네임 클릭으로 상세 이동 */}
                            {user.status === 'ACTIVE' ? (
                              <button
                                onClick={() => openStatusModal(user, 'SUSPENDED')}
                                className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                title="계정 정지"
                              >
                                정지
                              </button>
                            ) : user.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => openStatusModal(user, 'ACTIVE')}
                                className="px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                                title="계정 활성화"
                              >
                                활성화
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {users.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, users.totalElements)}
                {' / '}
                {users.totalElements.toLocaleString()}명
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={users.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  처음
                </button>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={users.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-xs text-gray-700 font-medium">
                  {page + 1} / {users.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(users.totalPages - 1, page + 1))}
                  disabled={users.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
                <button
                  onClick={() => setPage(users.totalPages - 1)}
                  disabled={users.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  마지막
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상태 변경 모달 */}
      {modalUser && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setModalUser(null); setModalAction(null); }}
          />
          {/* 모달 카드 */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {modalAction === 'SUSPENDED' ? '계정 정지' : '계정 활성화'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">{modalUser.nickname}</span>
              {' '}회원을{' '}
              {modalAction === 'SUSPENDED' ? '정지' : '활성화'}하시겠습니까?
            </p>

            {/* 사유 입력 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사유 {modalAction === 'SUSPENDED' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={modalAction === 'SUSPENDED' ? '정지 사유를 입력해주세요...' : '활성화 사유 (선택)'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setModalUser(null); setModalAction(null); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading || (modalAction === 'SUSPENDED' && !statusReason.trim())}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${modalAction === 'SUSPENDED'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }
                `}
              >
                {actionLoading ? '처리 중...' : (modalAction === 'SUSPENDED' ? '정지 처리' : '활성화 처리')}
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
