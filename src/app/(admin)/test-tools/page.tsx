'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

/**
 * ADMIN 특별기능 — 매칭 테스트 도구
 * 오늘의 카드 생성 / 받은 OK / 보낸 OK / 매칭을 직접 트리거해 QA.
 * 실데이터에 직접 영향을 주므로 운영 메뉴와 구분된 섹션.
 */
export default function AdminTestToolsPage() {
  // 공통 토스트/로딩
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // 받은 OK (to = 테스트 계정이 받음)
  const [recvTo, setRecvTo] = useState('');
  const [recvFrom, setRecvFrom] = useState('');
  const [recvType, setRecvType] = useState<'OK' | 'SUPER_OK'>('OK');

  // 보낸 OK (from = 테스트 계정이 보냄)
  const [sendFrom, setSendFrom] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendType, setSendType] = useState<'OK' | 'SUPER_OK'>('OK');

  // 매칭
  const [matchA, setMatchA] = useState('');
  const [matchB, setMatchB] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const run = async (key: string, fn: () => Promise<unknown>, okMsg: string) => {
    try {
      setBusy(key);
      const res = await fn();
      const detail = (res as { message?: string })?.message;
      showToast(detail ? `${okMsg} — ${detail}` : okMsg, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const num = (v: string) => Number(v.trim());
  const validId = (v: string) => v.trim() !== '' && !Number.isNaN(num(v)) && num(v) > 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">매칭 테스트 도구</h1>
        <p className="text-sm text-gray-500 mt-1">
          오늘의 카드·받은 OK·보낸 OK·매칭을 직접 만들어 QA합니다.
          <span className="text-amber-600 font-medium"> ⚠️ 실데이터에 직접 반영됩니다.</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          userId는 회원 관리 페이지에서 확인. 테스트 계정 예: 01010000001~005.
        </p>
      </div>

      <div className="space-y-5">
        {/* 1. 오늘의 카드 생성 */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">① 오늘의 카드 생성</h2>
          <p className="text-xs text-gray-500 mb-3">
            적격 회원에게 오늘의 한 분을 08 슬롯으로 한 번 생성합니다. 이미 생성된 회원은 건너뜁니다.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <button
              onClick={() => run('today', () => adminApi.triggerRecommendations(), '오늘의 카드 생성 완료')}
              disabled={busy === 'today'}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === 'today' ? '생성 중...' : '카드 생성'}
            </button>
          </div>
        </section>

        {/* 2. 받은 OK */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">② 받은 OK 만들기</h2>
          <p className="text-xs text-gray-500 mb-3">
            특정 유저가 <b>테스트 계정에게</b> 좋아요를 보냅니다 (받은 OK 화면 검증).
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <label className="flex flex-col text-xs text-gray-500">
              보내는 사람 userId
              <input value={recvFrom} onChange={(e) => setRecvFrom(e.target.value)}
                className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="예: 12" />
            </label>
            <label className="flex flex-col text-xs text-gray-500">
              받는 사람(테스트) userId
              <input value={recvTo} onChange={(e) => setRecvTo(e.target.value)}
                className="mt-1 w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="예: 3" />
            </label>
            <label className="flex flex-col text-xs text-gray-500">
              타입
              <select value={recvType} onChange={(e) => setRecvType(e.target.value as 'OK' | 'SUPER_OK')}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                <option value="OK">OK</option>
                <option value="SUPER_OK">SUPER_OK</option>
              </select>
            </label>
            <button
              onClick={() => run('recv', () => adminApi.createTestLike(num(recvFrom), num(recvTo), recvType), '받은 OK 생성 완료')}
              disabled={busy === 'recv' || !validId(recvFrom) || !validId(recvTo)}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {busy === 'recv' ? '처리 중...' : '받은 OK 생성'}
            </button>
          </div>
        </section>

        {/* 3. 보낸 OK */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">③ 보낸 OK 만들기</h2>
          <p className="text-xs text-gray-500 mb-3">
            <b>테스트 계정이</b> 특정 유저에게 좋아요를 보냅니다 (보낸 OK 화면 검증).
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <label className="flex flex-col text-xs text-gray-500">
              보내는(테스트) userId
              <input value={sendFrom} onChange={(e) => setSendFrom(e.target.value)}
                className="mt-1 w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="예: 3" />
            </label>
            <label className="flex flex-col text-xs text-gray-500">
              받는 사람 userId
              <input value={sendTo} onChange={(e) => setSendTo(e.target.value)}
                className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="예: 12" />
            </label>
            <label className="flex flex-col text-xs text-gray-500">
              타입
              <select value={sendType} onChange={(e) => setSendType(e.target.value as 'OK' | 'SUPER_OK')}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                <option value="OK">OK</option>
                <option value="SUPER_OK">SUPER_OK</option>
              </select>
            </label>
            <button
              onClick={() => run('send', () => adminApi.createTestLike(num(sendFrom), num(sendTo), sendType), '보낸 OK 생성 완료')}
              disabled={busy === 'send' || !validId(sendFrom) || !validId(sendTo)}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {busy === 'send' ? '처리 중...' : '보낸 OK 생성'}
            </button>
          </div>
        </section>

        {/* 4. 매칭 */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">④ 매칭 만들기</h2>
          <p className="text-xs text-gray-500 mb-3">두 유저 간 양방향 좋아요 + 매칭을 즉시 생성합니다.</p>
          <div className="flex items-end gap-3 flex-wrap">
            <label className="flex flex-col text-xs text-gray-500">
              유저 A userId
              <input value={matchA} onChange={(e) => setMatchA(e.target.value)}
                className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="예: 3" />
            </label>
            <span className="pb-2 text-gray-400">↔</span>
            <label className="flex flex-col text-xs text-gray-500">
              유저 B userId
              <input value={matchB} onChange={(e) => setMatchB(e.target.value)}
                className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" placeholder="예: 12" />
            </label>
            <button
              onClick={() => run('match', () => adminApi.createTestMatch(num(matchA), num(matchB)), '매칭 생성 완료')}
              disabled={busy === 'match' || !validId(matchA) || !validId(matchB)}
              className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50"
            >
              {busy === 'match' ? '처리 중...' : '매칭 생성'}
            </button>
          </div>
        </section>

        {/* 5. 테스트 계정 추천 리셋 */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">⑤ 테스트 계정 추천 리셋</h2>
          <p className="text-xs text-gray-500 mb-3">테스트 계정의 추천/좋아요/매칭을 삭제 후 재생성합니다.</p>
          <button
            onClick={() => run('reset', () => adminApi.resetTestAccountRecommendations(), '테스트 계정 리셋 완료')}
            disabled={busy === 'reset'}
            className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {busy === 'reset' ? '리셋 중...' : '추천 리셋'}
          </button>
        </section>
      </div>

      {/* 토스트 */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm text-white z-50 max-w-md
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
