'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

/**
 * 하트 관리 페이지 — 잔액 조회 + 보너스 지급
 */
export default function AdminHeartsPage() {
  // 잔액 조회 상태
  const [balanceUserId, setBalanceUserId] = useState('');
  const [balanceResult, setBalanceResult] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // 보너스 지급 상태
  const [issueUserId, setIssueUserId] = useState('');
  const [issueAmount, setIssueAmount] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  // 토스트 메시지
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 잔액 조회
  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = parseInt(balanceUserId);
    if (isNaN(userId)) {
      setBalanceError('유효한 유저 ID를 입력해주세요.');
      return;
    }

    try {
      setBalanceLoading(true);
      setBalanceError(null);
      setBalanceResult(null);
      const data = await adminApi.getHeartBalance(userId);
      // API 응답이 숫자이거나 객체일 수 있음
      const balance = typeof data === 'number' ? data : (data?.balance ?? data?.heartBalance ?? data);
      setBalanceResult(balance);
    } catch (err) {
      setBalanceError(getErrorMessage(err));
    } finally {
      setBalanceLoading(false);
    }
  };

  // 보너스 지급
  const handleIssueHearts = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = parseInt(issueUserId);
    const amount = parseInt(issueAmount);
    if (isNaN(userId) || isNaN(amount) || amount <= 0) {
      setToast({ message: '유효한 유저 ID와 수량을 입력해주세요.', type: 'error' });
      return;
    }

    try {
      setIssueLoading(true);
      await adminApi.issueHearts(userId, amount, issueDescription || undefined);
      setToast({
        message: `유저 ${userId}에게 ${amount}하트를 지급했습니다.`,
        type: 'success',
      });
      // 폼 초기화
      setIssueUserId('');
      setIssueAmount('');
      setIssueDescription('');
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      });
    } finally {
      setIssueLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">하트 관리</h1>
        <p className="text-sm text-gray-500 mt-1">사용자 하트 잔액을 조회하고 보너스 하트를 지급합니다.</p>
      </div>

      {/* 잔액 조회 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          잔액 조회
        </h2>
        <form onSubmit={handleCheckBalance} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="balanceUserId" className="block text-sm font-medium text-gray-700 mb-1">
              유저 ID
            </label>
            <input
              id="balanceUserId"
              type="number"
              value={balanceUserId}
              onChange={(e) => setBalanceUserId(e.target.value)}
              placeholder="유저 ID를 입력하세요"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={balanceLoading || !balanceUserId.trim()}
              className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {balanceLoading ? '조회 중...' : '잔액 조회'}
            </button>
          </div>
        </form>

        {/* 잔액 조회 결과 */}
        {balanceResult !== null && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              유저 <span className="font-mono font-bold">{balanceUserId}</span>의 하트 잔액
            </p>
            <p className="text-3xl font-bold text-amber-800 mt-1">
              {typeof balanceResult === 'number' ? balanceResult.toLocaleString() : String(balanceResult)} 하트
            </p>
          </div>
        )}

        {/* 잔액 조회 에러 */}
        {balanceError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{balanceError}</p>
          </div>
        )}
      </div>

      {/* 보너스 지급 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          보너스 하트 지급
        </h2>
        <form onSubmit={handleIssueHearts} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="issueUserId" className="block text-sm font-medium text-gray-700 mb-1">
                유저 ID <span className="text-red-500">*</span>
              </label>
              <input
                id="issueUserId"
                type="number"
                value={issueUserId}
                onChange={(e) => setIssueUserId(e.target.value)}
                placeholder="유저 ID를 입력하세요"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="issueAmount" className="block text-sm font-medium text-gray-700 mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                id="issueAmount"
                type="number"
                min="1"
                value={issueAmount}
                onChange={(e) => setIssueAmount(e.target.value)}
                placeholder="지급할 하트 수량"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-1">
              지급 사유 (선택)
            </label>
            <input
              id="issueDescription"
              type="text"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="관리자 보너스 지급"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={issueLoading || !issueUserId.trim() || !issueAmount.trim()}
              className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {issueLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              보너스 지급
            </button>
          </div>
        </form>
      </div>

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
