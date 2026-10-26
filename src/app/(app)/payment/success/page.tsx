'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { isCompletedPaymentResponse, paymentApi } from '@/lib/api/payment';
import { heartApi } from '@/lib/api/heart';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import {
  clearPendingTossOrder, findPendingTossOrder, savePendingTossOrder,
} from '@/lib/payment/pendingOrder';
import { capturePaymentAuth, paymentAuthUnchanged } from '@/lib/payment/authSnapshot';

/**
 * 결제 성공 페이지
 * Toss Payments 성공 콜백 -> 백엔드 결제 승인 -> 결과 표시
 * URL params: paymentKey, orderId, amount (Toss가 전달)
 *
 * 지급 하트 수와 결제 금액은 주소창이 아니라 서버 승인 응답에서 읽는다.
 * 예전에는 프론트가 `?hearts=` 를 실어 보내고 그 값을 그대로 표시했다. 주소를 고치면
 * 아무 숫자나 보였고, 서버가 실제로 지급한 수량과도 무관했다.
 */
function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useUIStore((state) => state.showToast);
  const userId = useAuthStore((state) => state.user?.userId);

  const [isConfirming, setIsConfirming] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDefinitiveFailure, setIsDefinitiveFailure] = useState(false);
  const [chargedHearts, setChargedHearts] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const [balanceUnavailable, setBalanceUnavailable] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // 중복 호출 방지
  const confirmedRef = useRef(false);

  // 결제 승인 처리
  const confirmPayment = useCallback(async () => {
    // 이미 승인 완료된 경우 중복 호출 방지
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    const awaitCorrectAccount = () => {
      confirmedRef.current = false;
      setIsPending(true);
      setIsConfirming(false);
    };

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (orderId && !paymentKey && !amount) {
      const auth = capturePaymentAuth();
      if (!auth || auth.ownerUserId !== userId) {
        awaitCorrectAccount();
        return;
      }
      try {
        const order = await paymentApi.getOrder(orderId);
        if (!paymentAuthUnchanged(auth)) {
          awaitCorrectAccount();
          return;
        }
        if (order.status === 'FAILED' || order.status === 'CANCELLED') {
          setIsDefinitiveFailure(true);
          return;
        }
        if (order.status !== 'COMPLETED' || !order.hearts || order.hearts <= 0) {
          setIsPending(true);
          return;
        }
        setChargedHearts(order.hearts);
        setPaidAmount(order.amount);
        try {
          const balance = await heartApi.getBalance();
          if (!paymentAuthUnchanged(auth)) {
            awaitCorrectAccount();
            return;
          }
          setNewBalance(balance.balance);
        } catch {
          if (!paymentAuthUnchanged(auth)) {
            awaitCorrectAccount();
            return;
          }
          setBalanceUnavailable(true);
        }
        if (!paymentAuthUnchanged(auth)) {
          awaitCorrectAccount();
          return;
        }
        setIsConfirmed(true);
        setIsPending(false);
      } catch {
        setIsPending(true);
      } finally {
        setIsConfirming(false);
      }
      return;
    }

    if (!paymentKey || !orderId || !amount) {
      showToast('결제 정보가 올바르지 않습니다.');
      setIsConfirming(false);
      return;
    }

    const auth = capturePaymentAuth();
    if (!auth || auth.ownerUserId !== userId) {
      awaitCorrectAccount();
      return;
    }

    let reserved = findPendingTossOrder(orderId);
    if (!reserved) {
      // 탭 저장소가 유실돼도 서버가 본인 주문을 확인한 뒤에만 콜백 튜플을 복원한다.
      // 404는 owner 증명이 없으므로 구버전 신규 승인으로 추측해 진행하지 않는다.
      try {
        const ownedOrder = await paymentApi.getOrder(orderId);
        if (!paymentAuthUnchanged(auth)) {
          awaitCorrectAccount();
          return;
        }
        if (ownedOrder.amount !== Number(amount)) {
          awaitCorrectAccount();
          return;
        }
        if (ownedOrder.status === 'FAILED' || ownedOrder.status === 'CANCELLED') {
          setIsDefinitiveFailure(true);
          setIsConfirming(false);
          return;
        }
        if (ownedOrder.status !== 'PENDING' && ownedOrder.status !== 'COMPLETED') {
          awaitCorrectAccount();
          return;
        }
        if (ownedOrder.status === 'PENDING') {
          reserved = { ownerUserId: userId!, orderId, productId: '', amount: ownedOrder.amount, paymentKey };
          savePendingTossOrder(reserved);
        }
      } catch {
        // 네트워크/503/404/401 모두 다른 계정 주문이 없다는 증명이 아니다.
        awaitCorrectAccount();
        return;
      }
    }
    if (reserved) {
      if (!userId || reserved.ownerUserId !== userId
        || reserved.orderId !== orderId
        || (reserved.paymentKey && reserved.paymentKey !== paymentKey)) {
        awaitCorrectAccount();
        return;
      }
      if (reserved.amount === null) {
        try {
          const replay = await paymentApi.reserveIntent(reserved.orderId, reserved.productId);
          if (!paymentAuthUnchanged(auth)) {
            awaitCorrectAccount();
            return;
          }
          const recoveredAmount = Number.isSafeInteger(replay.amount) && replay.amount > 0
            ? replay.amount
            : (await paymentApi.getOrder(orderId)).amount;
          if (!paymentAuthUnchanged(auth)) {
            awaitCorrectAccount();
            return;
          }
          reserved = { ...reserved, amount: recoveredAmount };
          savePendingTossOrder(reserved);
        } catch {
          awaitCorrectAccount();
          return;
        }
      }
      if (reserved.amount !== Number(amount)) {
        awaitCorrectAccount();
        return;
      }
      try {
        savePendingTossOrder({ ...reserved, paymentKey });
      } catch {
        confirmedRef.current = false;
        setIsPending(true);
        setIsConfirming(false);
        return;
      }
    }

    try {
      setIsConfirming(true);
      const result = await paymentApi.confirmPayment({
        paymentKey,
        orderId,
        amount: Number(amount),
      }, Boolean(reserved && reserved.protocol !== 'legacy'));
      if (!paymentAuthUnchanged(auth)) {
        awaitCorrectAccount();
        return;
      }
      if (!isCompletedPaymentResponse(result, orderId, Number(amount))) {
        setIsPending(true);
        return;
      }
      setIsPending(false);
      setIsConfirmed(true);
      if (reserved) clearPendingTossOrder(orderId);
      // 충전 수량·결제 금액은 승인 응답, 현재 잔액은 통합 하트 지갑이 진실원이다.
      setChargedHearts(result.hearts);
      setPaidAmount(result.amount);
      try {
        const balance = await heartApi.getBalance();
        if (!paymentAuthUnchanged(auth)) {
          awaitCorrectAccount();
          return;
        }
        setNewBalance(balance.balance);
      } catch {
        if (!paymentAuthUnchanged(auth)) {
          awaitCorrectAccount();
          return;
        }
        setBalanceUnavailable(true);
      }
      setPaymentMethod(result.paymentMethod || '');
    } catch (err) {
      if (!paymentAuthUnchanged(auth)) {
        awaitCorrectAccount();
        return;
      }
      const code = (err as { errorResponse?: { code?: string } })?.errorResponse?.code;
      if (code === 'PAYMENT_NOT_APPROVED' || code === 'ORDER_CANCELED') {
        setIsPending(false);
        setIsDefinitiveFailure(true);
        if (reserved) clearPendingTossOrder(orderId);
        showToast(getErrorMessage(err));
      } else {
        // 네트워크 유실·503·조회 불명은 결제 실패의 증거가 아니다.
        setIsPending(true);
      }
    } finally {
      setIsConfirming(false);
    }
  }, [searchParams, showToast, userId]);

  const checkSameOrder = useCallback(async () => {
    const orderId = searchParams.get('orderId');
    if (!orderId) return;
    const auth = capturePaymentAuth();
    if (!auth || auth.ownerUserId !== userId) {
      showToast('현재 로그인 계정을 다시 확인해 주세요.');
      return;
    }
    const reserved = findPendingTossOrder(orderId);
    if (reserved && reserved.ownerUserId !== userId) {
      showToast('이전 주문의 계정으로 로그인해 결과를 확인해 주세요.');
      return;
    }
    setIsConfirming(true);
    try {
      const order = await paymentApi.getOrder(orderId);
      if (!paymentAuthUnchanged(auth)) {
        confirmedRef.current = false;
        setIsPending(true);
        setIsConfirming(false);
        return;
      }
      if (order.status === 'FAILED' || order.status === 'CANCELLED') {
        setIsPending(false);
        setIsDefinitiveFailure(true);
        setIsConfirming(false);
        if (reserved) clearPendingTossOrder(orderId);
        return;
      }
    } catch {
      // 조회 실패 자체는 확정 실패가 아니다. 저장된 원 튜플을 그대로 재확인한다.
    }
    confirmedRef.current = false;
    await confirmPayment();
  }, [confirmPayment, searchParams, showToast, userId]);

  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  // 결제 승인 중 로딩
  if (isConfirming) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 mb-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        </div>
        <p className="text-base font-medium text-text dark:text-dark-cream mb-1">결제를 확인하고 있습니다</p>
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">잠시만 기다려주세요...</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="pay-result">
        <h2 className="pay-rhd">결제 결과 확인 중</h2>
        <p className="pay-rbd">
          결제 상태가 아직 확정되지 않았습니다. 같은 주문의 결과를 다시 확인해 주세요.
        </p>
        <button
          onClick={checkSameOrder}
          className="pay-cta"
        >
          이 주문 다시 확인
        </button>
        <div className="pay-result-links">
          <button onClick={() => router.push('/home')} className="pay-help">
            홈으로
          </button>
          <button onClick={() => router.push('/support')} className="pay-help">
            고객센터
          </button>
        </div>
      </div>
    );
  }

  // 명시적으로 거절되거나 콜백 정보가 없는 경우
  if (!isConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text dark:text-dark-cream mb-2">
          {isDefinitiveFailure ? '결제가 승인되지 않았습니다' : '결제 정보를 확인할 수 없습니다'}
        </h2>
        <p className="text-sm text-subtext dark:text-[var(--subtext)] text-center mb-8">
          {isDefinitiveFailure
            ? '이 주문은 실패가 확정되었습니다. 다시 구매하려면 새 주문을 시작해 주세요.'
            : '결제 내역에서 상태를 확인해 주세요. 결과가 불확실하면 같은 주문으로 다시 확인합니다.'}
        </p>
        <button
          onClick={isDefinitiveFailure
            ? () => router.push('/payment')
            : searchParams.get('orderId') ? checkSameOrder : () => router.push('/home')}
          className="px-8 py-3 rounded-xl bg-gold dark:bg-dark-gold text-white font-medium"
        >
          {isDefinitiveFailure ? '다시 시도하기'
            : searchParams.get('orderId') ? '이 주문 확인하기' : '홈으로 돌아가기'}
        </button>
      </div>
    );
  }

  // 승인 성공
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* 성공 아이콘 (애니메이션) */}
      <div className="w-24 h-24 mb-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center animate-[bounce_0.5s_ease-in-out]">
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* 성공 메시지 */}
      <h2 className="text-xl font-bold text-text dark:text-dark-cream mb-2">충전 완료!</h2>
      <p className="text-sm text-subtext dark:text-[var(--subtext)] text-center mb-6">
        하트가 성공적으로 충전되었습니다.
      </p>

      {/* 충전 정보 카드 */}
      <div className="w-full max-w-xs p-5 rounded-2xl bg-gold/5 dark:bg-dark-gold/5 border border-gold/20 dark:border-dark-gold/20 mb-8">
        {/* 충전된 하트 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-subtext dark:text-[var(--subtext)]">충전된 하트</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-5 h-5 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-lg font-bold text-gold dark:text-dark-gold">+{chargedHearts}개</span>
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-subtext dark:text-[var(--subtext)]">결제 금액</span>
          <span className="text-sm font-medium text-text dark:text-dark-cream">{paidAmount.toLocaleString()}원</span>
        </div>

        {/* 결제 수단 */}
        {paymentMethod && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-subtext dark:text-[var(--subtext)]">결제 수단</span>
            <span className="text-sm font-medium text-text dark:text-dark-cream">{paymentMethod}</span>
          </div>
        )}

        {/* 구분선 + 현재 잔액 */}
        <div className="flex items-center justify-between pt-3 border-t border-gold/10 dark:border-dark-gold/10">
          <span className="text-sm text-subtext dark:text-[var(--subtext)]">현재 잔액</span>
          <span className="text-lg font-bold text-text dark:text-dark-cream">
            {balanceUnavailable ? '조회 중' : `${newBalance.toLocaleString()}개`}
          </span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={() => router.push('/home')}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base shadow-lg shadow-gold/20 transition-all active:scale-[0.98]"
        >
          홈으로 돌아가기
        </button>
        <button
          onClick={() => router.push('/store')}
          className="w-full py-3 rounded-xl border border-[var(--border)] text-subtext dark:text-[var(--subtext)] text-sm font-medium hover:bg-ivory dark:hover:bg-dark-bg transition-colors"
        >
          충전 내역 보기
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
          <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">로딩 중...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
