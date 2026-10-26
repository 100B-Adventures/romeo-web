'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentApi } from '@/lib/api/payment';
import { capturePaymentAuth, paymentAuthUnchanged } from '@/lib/payment/authSnapshot';
import { clearPendingTossOrder, readPendingTossOrder } from '@/lib/payment/pendingOrder';
import { useAuthStore } from '@/store/authStore';

// Toss 에러 코드 -> 사용자 친화적 메시지 변환
const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
  PAY_PROCESS_ABORTED: '결제 처리가 중단되었습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드를 시도해주세요.',
  BELOW_MINIMUM_AMOUNT: '최소 결제 금액 이상이어야 합니다.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 만료되었습니다.',
  INVALID_STOPPED_CARD: '정지된 카드입니다.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '할부가 지원되지 않는 카드입니다.',
  INVALID_CARD_LOST_OR_STOLEN: '분실 또는 도난 카드입니다.',
  RESTRICTED_TRANSFER_ACCOUNT: '이체가 제한된 계좌입니다.',
  INVALID_CARD_NUMBER: '카드 번호가 올바르지 않습니다.',
  EXCEED_MAX_AMOUNT: '결제 한도를 초과했습니다.',
};

/**
 * 결제 실패 페이지
 * Toss Payments에서 실패 시 code, message 파라미터와 함께 리다이렉트됨
 */
function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useAuthStore((state) => state.user?.userId);

  // Toss 에러 정보
  const errorCode = searchParams.get('code') || '';
  const orderId = searchParams.get('orderId');
  const restored = searchParams.get('restore') === '1';
  const [orderState, setOrderState] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // 사용자 친화적 메시지 변환
  const definitiveFailure = Boolean(ERROR_MESSAGES[errorCode]) || orderState === 'FAILED'
    || orderState === 'CANCELLED';
  const displayMessage = definitiveFailure
    ? (ERROR_MESSAGES[errorCode] || '결제가 승인되지 않았습니다.')
    : '결제 결과가 아직 확정되지 않았습니다. 같은 주문의 상태를 확인해 주세요.';

  useEffect(() => {
    if (!definitiveFailure || !userId) return;
    const attempt = readPendingTossOrder(userId);
    if (attempt?.protocol === 'legacy' && (!orderId || attempt.orderId === orderId)) {
      clearPendingTossOrder(attempt.orderId);
    }
  }, [definitiveFailure, orderId, userId]);

  const checkOrder = async () => {
    if (!orderId) return;
    const auth = capturePaymentAuth();
    if (!auth) return;
    setChecking(true);
    try {
      const order = await paymentApi.getOrder(orderId);
      if (!paymentAuthUnchanged(auth)) return;
      setOrderState(order.status);
      if (order.status === 'COMPLETED') {
        router.push(`/payment/success?orderId=${encodeURIComponent(order.orderId)}`);
      }
    } catch {
      if (paymentAuthUnchanged(auth)) setOrderState('PENDING');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (restored) void checkOrder();
    // restored 진입에서만 1회 조회한다. 수동 CTA는 checkOrder를 직접 호출한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored, orderId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* 실패 아이콘 */}
      <div className="w-24 h-24 mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* 실패 메시지 */}
      <h2 className="text-xl font-bold text-text dark:text-dark-cream mb-2">
        {definitiveFailure ? '결제에 실패했습니다' : '결제 결과 확인 중'}
      </h2>
      <p className="text-sm text-subtext dark:text-[var(--subtext)] text-center mb-2">{displayMessage}</p>
      {errorCode && definitiveFailure && (
        <p className="text-xs text-subtext/50 dark:text-[var(--subtext)]/50 mb-8">오류 코드: {errorCode}</p>
      )}

      {/* 액션 버튼 */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        {definitiveFailure ? (
          <button
            onClick={() => router.push('/payment')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base shadow-lg shadow-gold/20 transition-all active:scale-[0.98]"
          >
            다시 시도하기
          </button>
        ) : orderId ? (
          <button
            onClick={checkOrder}
            disabled={checking}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base shadow-lg shadow-gold/20 transition-all active:scale-[0.98]"
          >
            {checking ? '주문 확인 중' : '이 주문 확인하기'}
          </button>
        ) : null}
        <button
          onClick={() => router.push('/home')}
          className="w-full py-3.5 rounded-xl border border-[var(--border)] text-subtext dark:text-[var(--subtext)] text-sm font-medium hover:bg-ivory dark:hover:bg-dark-bg transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
          <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">로딩 중...</p>
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
