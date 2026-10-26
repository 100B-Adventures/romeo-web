'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, UserListResponse, PageResponse, BulkLikeResponse, BulkLikeQuotaResponse } from '@/lib/api/admin';

const PAGE_SIZE = 20;

export default function BulkLikesPage() {
  // 회장 결정 44(2026-08-27): 발신 계정은 로그인한 운영자 자신이 아니라 서버가 지정한
  // 남성 관리자 계정 한 개로 고정한다(R12-24의 "admin 자신의 ID 자동" 방식을 대체).
  const [sender, setSender] = useState<UserListResponse | null>(null);
  const [senderError, setSenderError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getBulkLikeSender()
      .then(setSender)
      .catch((err) => setSenderError(err?.response?.data?.message || '발신 계정을 불러오지 못했습니다'));
  }, []);

  // 회장 결정 52(2026-08-27, 2026-08-28 재확정): 하루 100명 상한 오늘 사용량.
  // 전송 성공 직후에도 다시 불러와 잔여량을 갱신한다(loadQuota를 아래 전송 성공 분기에서 재호출).
  const [quota, setQuota] = useState<BulkLikeQuotaResponse | null>(null);
  const loadQuota = useCallback(() => {
    adminApi.getBulkLikeQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);
  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  // 여성 유저 목록
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 선택
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 폼 — R12-24: 남성ID 입력 제거, admin 자신의 ID 사용
  const [likeType, setLikeType] = useState<'OK' | 'SUPER_OK'>('OK');

  // 전송 이력 (R12-24: 통계)
  const [history, setHistory] = useState<BulkLikeResponse[]>([]);
  // 서버 저장된 벌크 좋아요 이력
  const [serverHistory, setServerHistory] = useState<Array<Record<string, unknown>>>([]);

  // 액션
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BulkLikeResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // 2026-08-27 코드리뷰 재차단(MAJOR 4) — 이전엔 sendBulkLikes를 호출할 때마다 새 UUID를
  // 만들어서, 네트워크 실패 후 "다시 시도" 버튼을 눌러도 서버에는 매번 새 idempotencyKey가
  // 갔다(멱등이 실질적으로 작동하지 않음). 성공할 때까지 같은 키를 보존하고, 성공하면
  // 다음 전송(새 사용자 조작)을 위해 키를 비운다.
  const pendingIdempotencyKeyRef = useRef<string | null>(null);
  // 선택·타입이 바뀌면 이전 실패 시도용 키를 버린다 — 서버가 "같은 키·다른 내용"으로
  // 판단해 거절하지 않게 한다(내용이 바뀌었으니 새 요청이 맞다).
  useEffect(() => {
    pendingIdempotencyKeyRef.current = null;
  }, [selectedIds, likeType]);

  // 여성 유저 로드
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getFemaleUsers(page, PAGE_SIZE);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError('여성 유저 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // 서버 이력 로드
  useEffect(() => {
    adminApi.getBulkLikeHistory(0, 50).then((data: { content?: Array<Record<string, unknown>> }) => {
      setServerHistory(data.content || []);
    }).catch(() => {});
  }, []);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 유저 토글
  const toggleUser = (userId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // 전체 선택 토글 (현재 페이지)
  const toggleSelectAll = () => {
    if (selectAll) {
      const currentPageIds = new Set(users.map(u => u.userId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        users.forEach(u => next.add(u.userId));
        return next;
      });
    }
    setSelectAll(!selectAll);
  };

  // 페이지 변경 시 전체선택 상태 동기화
  useEffect(() => {
    if (users.length > 0) {
      setSelectAll(users.every(u => selectedIds.has(u.userId)));
    }
  }, [users, selectedIds]);

  // 벌크 좋아요 전송 — 회장 결정 44: 지정된 발신 계정(sender)만 사용한다
  const handleSend = async () => {
    setShowConfirm(false);
    const maleId = sender?.userId;
    if (!maleId || selectedIds.size === 0) return;

    // 이번 전송(사용자 조작 1회)에 쓸 키 — 실패해서 재시도해도 같은 키를 재사용한다.
    if (!pendingIdempotencyKeyRef.current) {
      pendingIdempotencyKeyRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `bulk-like-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    try {
      setSending(true);
      const res = await adminApi.sendBulkLikes(
        Array.from(selectedIds),
        maleId,
        likeType,
        pendingIdempotencyKeyRef.current
      );
      setResult(res);
      setHistory(prev => [res, ...prev]);
      setToast({ message: `벌크 좋아요 전송 완료: 성공 ${res.successCount}건, 매칭 ${res.matchedCount}건`, type: 'success' });
      // 성공 — 다음 전송은 새 키를 쓴다.
      pendingIdempotencyKeyRef.current = null;
      // 하루 상한 잔여량 갱신 (회장 결정 52)
      loadQuota();
    } catch (err: any) {
      const msg = err?.response?.data?.message || '벌크 좋아요 전송 실패';
      setToast({ message: msg, type: 'error' });
      // 실패 — 키를 그대로 남겨 "다시 시도"가 서버에 같은 키로 도착하게 한다.
    } finally {
      setSending(false);
    }
  };

  // 전송 버튼 활성화 조건 — 지정 발신 계정 로드 완료 + 선택 필요
  const canSend = selectedIds.size > 0 && !!sender?.userId;

  // 현재 페이지 표시 범위
  const startItem = page * PAGE_SIZE + 1;
  const endItem = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">벌크 좋아요</h1>
        <p className="mt-1 text-sm text-gray-500">여성 유저를 선택하여 내가(관리자) 해당 여성들에게 일괄 좋아요를 보냅니다</p>
      </div>

      {/* 설정 카드: R12-24 — admin 자신이 대상, 좋아요 타입만 선택 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">전송 설정</h2>
          {/* 회장 결정 52(2026-08-27, 2026-08-28 재확정): 하루 100명 상한 — 오늘 남은 수량.
              여성 한 명당 보내는 횟수 제한(결정 51)과는 다른 층위의 안전장치임을 문구로 구분한다. */}
          {quota && (
            <span
              className={`text-sm font-medium ${
                quota.remainingToday <= 0 ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              오늘 대량 발송 {quota.usedToday}/{quota.dailyLimit}명 · 남은 수량 {quota.remainingToday}명
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* 대상 남성: admin 자신 (자동) */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              보내는 계정 (고정)
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
              {sender
                ? `${sender.nickname || '(닉네임 없음)'} · #${sender.userId}`
                : senderError || '불러오는 중...'}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              다른 계정은 고를 수 없습니다. 받는 분 화면에는 다른 남성 회원과 똑같이 소개됩니다.
            </p>
          </div>

          {/* 좋아요 타입 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              좋아요 타입
            </label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="likeType"
                  value="OK"
                  checked={likeType === 'OK'}
                  onChange={() => setLikeType('OK')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">OK</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="likeType"
                  value="SUPER_OK"
                  checked={likeType === 'SUPER_OK'}
                  onChange={() => setLikeType('SUPER_OK')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">SUPER OK</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 여성 유저 목록 테이블 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            여성 유저 목록
            <span className="ml-2 text-sm font-normal text-gray-500">
              (총 {totalElements}명)
            </span>
          </h2>
          {selectedIds.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedIds.size}명 선택됨
            </span>
          )}
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
            <button onClick={loadUsers} className="ml-2 underline hover:no-underline">다시 시도</button>
          </div>
        )}

        {/* 로딩 */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">닉네임</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">전화번호</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">상태</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">인증</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">가입일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">
                        여성 유저가 없습니다
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.userId}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedIds.has(user.userId) ? 'bg-blue-50' : ''}`}
                        onClick={() => toggleUser(user.userId)}
                      >
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.userId)}
                            onChange={() => toggleUser(user.userId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700 font-mono">{user.userId}</td>
                        <td className="px-5 py-3 text-sm text-gray-900 font-medium">{user.nickname}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{user.phoneNumber}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : user.status === 'SUSPENDED'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {user.status === 'ACTIVE' ? '활성' : user.status === 'SUSPENDED' ? '정지' : '삭제'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {user.verified ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">인증됨</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">미인증</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                {totalElements > 0 ? `${startItem}-${endItem} / ${totalElements}명` : '데이터 없음'}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-700">
                  {page + 1} / {totalPages || 1}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 액션 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between sticky bottom-6">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{selectedIds.size}명</span> 선택됨
          {sender && (
            <span className="ml-3">
              &rarr; <span className="font-medium text-gray-900">{sender.nickname || '지정 계정'}</span>가 선택한 여성들에게
              <span className="ml-1 font-medium text-blue-600">{likeType === 'OK' ? 'OK' : 'SUPER OK'}</span> 전송
            </span>
          )}
        </div>
        <button
          disabled={!canSend || sending}
          onClick={() => setShowConfirm(true)}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          벌크 좋아요 전송
        </button>
      </div>

      {/* 결과 카드 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">전송 결과</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{result.totalRequested}</p>
              <p className="text-xs text-gray-500 mt-1">요청 건수</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{result.successCount}</p>
              <p className="text-xs text-gray-500 mt-1">성공</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{result.skippedCount}</p>
              <p className="text-xs text-gray-500 mt-1">스킵</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-pink-700">{result.matchedCount}</p>
              <p className="text-xs text-gray-500 mt-1">매칭 성사</p>
            </div>
          </div>
        </div>
      )}

      {/* 전송 이력 (R12-24) */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 세션 전송 이력</h2>
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div key={idx} className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-500">#{history.length - idx}</span>
                <span className="text-gray-700">요청 {h.totalRequested}</span>
                <span className="text-green-700">성공 {h.successCount}</span>
                <span className="text-yellow-700">스킵 {h.skippedCount}</span>
                <span className="text-pink-700">매칭 {h.matchedCount}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-6 text-sm">
            <span className="text-gray-500">총계:</span>
            <span className="font-medium text-gray-900">요청 {history.reduce((a, h) => a + h.totalRequested, 0)}</span>
            <span className="font-medium text-green-700">성공 {history.reduce((a, h) => a + h.successCount, 0)}</span>
            <span className="font-medium text-pink-700">매칭 {history.reduce((a, h) => a + h.matchedCount, 0)}</span>
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">벌크 좋아요 전송 확인</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-bold text-gray-900">{sender?.nickname || '지정 계정'}</span>가
              여성 유저 <span className="font-bold text-gray-900 ml-1">{selectedIds.size}명</span>에게
              <span className="font-bold text-blue-600 ml-1">{likeType === 'OK' ? 'OK' : 'SUPER OK'}</span>을
              보냅니다.
            </p>
            <p className="text-xs text-gray-500 mb-6">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 서버 발송 이력 */}
      {serverHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">발송 이력 (서버)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">날짜</th>
                  <th className="pb-2">발신자</th>
                  <th className="pb-2">상세</th>
                  <th className="pb-2">수신자</th>
                </tr>
              </thead>
              <tbody>
                {serverHistory.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b cursor-pointer hover:bg-gray-50" onClick={() => {
                      const el = document.getElementById(`bulk-detail-${i}`);
                      if (el) el.classList.toggle('hidden');
                    }}>
                      <td className="py-2 text-gray-600">{String(item.createdAt || '').slice(0, 16).replace('T', ' ')}</td>
                      <td className="py-2">{String(item.senderNickname || item.targetUserId || '-')}</td>
                      <td className="py-2 text-gray-500">{String(item.details || '-')}</td>
                      <td className="py-2 text-blue-500">{String(item.recipientCount || 0)}명 ▾</td>
                    </tr>
                    <tr id={`bulk-detail-${i}`} className="hidden">
                      <td colSpan={4} className="p-3 bg-gray-50">
                        <div className="text-xs space-y-1">
                          {(item.recipients as Array<Record<string, unknown>> || []).map((r, j) => (
                            <div key={j} className="flex justify-between">
                              <span>{String(r.nickname || r.userId)}</span>
                              <span className="text-amber-600">{String(r.likeType || '')} {r.rating ? `★${r.rating}` : ''}</span>
                            </div>
                          ))}
                          {!(item.recipients as Array<unknown>)?.length && <span className="text-gray-400">수신자 정보 없음</span>}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
