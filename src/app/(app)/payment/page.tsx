'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { paymentApi, type ChargeProduct } from '@/lib/api/payment';
import {
  clearPendingTossOrder, createTossOrderId, readPendingTossOrder,
  savePendingTossOrder, type PendingTossOrder,
} from '@/lib/payment/pendingOrder';
import { capturePaymentAuth, paymentAuthUnchanged, type PaymentAuthSnapshot } from '@/lib/payment/authSnapshot';
import { heartApi } from '@/lib/api/heart';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

// 하트 1개 = 1,000원이 정가다(기획.md 결정 18). 할인율은 이 정가 대비로 계산한다.
// 상품 목록 자체는 서버 charge_products 표에서만 받는다. 웹에 상품 배열을 두지 않는다.
const HEART_LIST_PRICE = 1000;

async function resolveRejectedStartingOrder(order: PendingTossOrder, auth: PaymentAuthSnapshot): Promise<
  { kind: 'replaced'; order: PendingTossOrder } | { kind: 'cleared' } | { kind: 'blocked' }
> {
  if (!order.rejectedCode || order.ownerUserId !== auth.ownerUserId
    || !paymentAuthUnchanged(auth)
    || readPendingTossOrder(auth.ownerUserId)?.orderId !== order.orderId) return { kind: 'blocked' };
  try {
    const current = await paymentApi.getCurrentPending();
    if (!paymentAuthUnchanged(auth)) return { kind: 'blocked' };
    if (current?.status === 'PENDING') {
      if (readPendingTossOrder(auth.ownerUserId)?.orderId !== order.orderId) return { kind: 'blocked' };
      const discovered: PendingTossOrder = {
        ownerUserId: auth.ownerUserId, orderId: current.orderId,
        productId: '', amount: current.amount,
      };
      savePendingTossOrder(discovered);
      return { kind: 'replaced', order: discovered };
    }
    if (current !== null) return { kind: 'blocked' };
    try {
      await paymentApi.getOrder(order.orderId);
    } catch (error) {
      const code = (error as { errorResponse?: { code?: string } })?.errorResponse?.code;
      if (code === 'PAYMENT_003' && paymentAuthUnchanged(auth)) {
        if (readPendingTossOrder(auth.ownerUserId)?.orderId !== order.orderId) return { kind: 'blocked' };
        clearPendingTossOrder(order.orderId);
        return { kind: 'cleared' };
      }
    }
  } catch {
    // current의 장애/권한 오류는 미결 없음 증거가 아니다.
  }
  return { kind: 'blocked' };
}

/**
 * 하트 충전 페이지
 * Toss Payments SDK를 통한 결제 요청 -> 성공 리다이렉트 -> confirm API 호출
 */
export default function PaymentPage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const userId = useAuthStore((state) => state.user?.userId);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ChargeProduct[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [reservationEnabled, setReservationEnabled] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingTossOrder | null>(null);
  const [currentPendingChecked, setCurrentPendingChecked] = useState(false);
  const [pendingScanGeneration, setPendingScanGeneration] = useState(0);
  const tossPaymentsRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    setCurrentPendingChecked(false);
    const local = userId ? readPendingTossOrder(userId) : null;
    setPendingOrder(local);
    const auth = capturePaymentAuth();
    if (local) {
      setCurrentPendingChecked(true);
      if (local.rejectedCode && auth && auth.ownerUserId === userId) {
        resolveRejectedStartingOrder(local, auth).then((result) => {
          if (!active || !paymentAuthUnchanged(auth)) return;
          if (result.kind === 'replaced') setPendingOrder(result.order);
          if (result.kind === 'cleared') {
            setPendingOrder(null);
            setPendingScanGeneration((value) => value + 1);
          }
        });
      }
    } else if (auth && auth.ownerUserId === userId) {
      paymentApi.getCurrentPending().then((current) => {
        if (!active || !paymentAuthUnchanged(auth)) return;
        if (current?.status === 'PENDING') {
          const recovered: PendingTossOrder = {
            ownerUserId: auth.ownerUserId, orderId: current.orderId,
            productId: '', amount: current.amount,
          };
          savePendingTossOrder(recovered);
          setPendingOrder(recovered);
        }
        setCurrentPendingChecked(true);
      }).catch(() => {
        // 조회 장애는 '미결 없음'이 아니다. 새 구매를 잠근 채 재조회 CTA를 제공한다.
      });
    }
    const syncPendingOrder = () => setPendingOrder(userId ? readPendingTossOrder(userId) : null);
    window.addEventListener('storage', syncPendingOrder);
    return () => {
      active = false;
      window.removeEventListener('storage', syncPendingOrder);
    };
  }, [userId, accessToken, pendingScanGeneration]);

  // Toss SDK 초기화
  useEffect(() => {
    paymentApi.getConfig().then((config) => {
      setReservationEnabled(config.reservationEnabled === true);
      if (!config.tossClientKey) return;
      return loadTossPayments(config.tossClientKey).then((tp) => {
        tossPaymentsRef.current = tp;
        setIsSdkReady(true);
      });
    }).catch(() => {
      setReservationEnabled(false);
      setIsSdkReady(false);
    });
  }, []);

  // 잔액 로드
  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await heartApi.getBalance();
      setBalance(data.balance);
    } catch {
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // 충전 상품 목록 — 서버가 유일한 진실원이다. 실패하면 결제를 아예 열지 않는다.
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const rows = await paymentApi.getProducts();
      setProducts(rows);
      setProductsError(rows.length === 0);
    } catch {
      setProducts([]);
      setProductsError(true);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 페이지 포커스/가시성 변경 시 잔액 재조회 (결제 성공 후 복귀 시 반영)
  useEffect(() => {
    const handleFocus = () => {
      fetchBalance();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBalance();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchBalance]);

  const checkPendingOrder = async () => {
    const auth = capturePaymentAuth();
    if (!auth || auth.ownerUserId !== userId) {
      showToast('현재 로그인 계정을 다시 확인해 주세요.');
      return;
    }
    if (!pendingOrder || pendingOrder.ownerUserId !== userId) {
      showToast('이전 주문의 계정으로 로그인해 결제 상태를 확인해 주세요.');
      return;
    }
    if (pendingOrder.rejectedCode) {
      const result = await resolveRejectedStartingOrder(pendingOrder, auth);
      if (!paymentAuthUnchanged(auth)) return;
      if (result.kind === 'replaced') {
        setPendingOrder(result.order);
        showToast('진행 중인 원 주문을 다시 찾았습니다. 상태를 확인해 주세요.');
      } else if (result.kind === 'cleared') {
        setPendingOrder(null);
        setPendingScanGeneration((value) => value + 1);
        showToast('서버에 남은 이전 주문이 없습니다. 새 결제 가능 상태를 다시 확인합니다.');
      } else {
        showToast('이전 주문 상태를 확인할 수 없습니다. 새 결제는 시작하지 않습니다.');
      }
      return;
    }
    try {
      let recoveredOrder = pendingOrder;
      if (pendingOrder.amount === null) {
        // 선저장 후 앱이 종료됐거나 예약 응답이 유실된 경우에도 새 INSERT를 만들지 않는다.
        const current = await paymentApi.getCurrentPending();
        if (!paymentAuthUnchanged(auth)) return;
        if (current?.status === 'PENDING' && current.orderId !== pendingOrder.orderId) {
          const discovered: PendingTossOrder = {
            ownerUserId: auth.ownerUserId, orderId: current.orderId,
            productId: '', amount: current.amount,
          };
          savePendingTossOrder(discovered);
          setPendingOrder(discovered);
          showToast('진행 중인 원 주문을 다시 찾았습니다. 상태를 확인해 주세요.');
          return;
        }
        const original = await paymentApi.getOrder(pendingOrder.orderId);
        if (!paymentAuthUnchanged(auth)) return;
        if (!Number.isSafeInteger(original.amount) || original.amount <= 0) {
          showToast('원 주문 금액을 확인할 수 없습니다. 새 결제는 시작하지 않습니다.');
          return;
        }
        recoveredOrder = { ...pendingOrder, amount: original.amount };
        savePendingTossOrder(recoveredOrder);
        setPendingOrder(recoveredOrder);
      }
      const order = await paymentApi.getOrder(pendingOrder.orderId);
      if (!paymentAuthUnchanged(auth)) return;
      if (order.status === 'COMPLETED' || order.status === 'FAILED'
        || order.status === 'CANCELLED') {
        clearPendingTossOrder(pendingOrder.orderId);
        setPendingOrder(null);
        setPendingScanGeneration((value) => value + 1);
        // 지급 완료는 서버 확정 주문/잔액으로 복원한다. 이 경로에서 confirm을 재호출하지 않는다.
        router.push(order.status === 'COMPLETED'
          ? `/payment/success?orderId=${encodeURIComponent(order.orderId)}`
          : `/payment/fail?orderId=${encodeURIComponent(order.orderId)}&restore=1`);
        return;
      }
      if (!recoveredOrder.paymentKey && order.canCancel) {
        const cancelled = await paymentApi.cancelIntent(pendingOrder.orderId);
        if (!paymentAuthUnchanged(auth)) return;
        if (cancelled.cancelled) {
          clearPendingTossOrder(pendingOrder.orderId);
          setPendingOrder(null);
          setPendingScanGeneration((value) => value + 1);
          showToast('이전 결제창의 예약을 취소했습니다.');
          return;
        }
      }
      if (recoveredOrder.paymentKey && recoveredOrder.amount !== null) {
        const params = new URLSearchParams({
          orderId: recoveredOrder.orderId, paymentKey: recoveredOrder.paymentKey,
          amount: String(recoveredOrder.amount),
        });
        router.push(`/payment/success?${params.toString()}`);
      } else {
        showToast('이전 주문의 결제 결과를 확인 중입니다. 새 결제는 잠시 기다려 주세요.');
      }
    } catch (error) {
      if (!paymentAuthUnchanged(auth)) return;
      const code = (error as { errorResponse?: { code?: string } })?.errorResponse?.code;
      if (code === 'RESERVATION_DISABLED' || code === 'PAYMENT_PENDING'
        || code === 'ORDER_NOT_RESERVED') {
        try {
          const current = await paymentApi.getCurrentPending();
          if (!paymentAuthUnchanged(auth)) return;
          if (current?.status === 'PENDING') {
            const discovered: PendingTossOrder = {
              ownerUserId: auth.ownerUserId, orderId: current.orderId,
              productId: '', amount: current.amount,
            };
            savePendingTossOrder(discovered);
            setPendingOrder(discovered);
            showToast('진행 중인 원 주문을 다시 찾았습니다. 상태를 확인해 주세요.');
            return;
          }
          if (current === null && code === 'RESERVATION_DISABLED') {
            try {
              await paymentApi.getOrder(pendingOrder.orderId);
            } catch (orderError) {
              const orderCode = (orderError as { errorResponse?: { code?: string } })
                ?.errorResponse?.code;
              if (paymentAuthUnchanged(auth) && orderCode === 'PAYMENT_003') {
                clearPendingTossOrder(pendingOrder.orderId);
                setPendingOrder(null);
                setPendingScanGeneration((value) => value + 1);
                showToast('서버에 남은 이전 주문이 없습니다. 새 결제 가능 상태를 다시 확인합니다.');
                return;
              }
            }
          }
        } catch {
          // current 조회 불명은 미결 없음의 증명이 아니므로 로컬 가드를 유지한다.
        }
      }
      showToast('이전 주문의 결제 상태를 확인할 수 없습니다. 새 결제는 시작하지 않습니다.');
    }
  };

  // 결제 시작
  const handlePurchase = async (pkg: ChargeProduct) => {
    const auth = capturePaymentAuth();
    if (!auth || auth.ownerUserId !== userId) {
      showToast('현재 로그인 계정을 다시 확인해 주세요.');
      return;
    }
    if (!userId) {
      showToast('로그인 후 결제해 주세요.');
      return;
    }
    if (pendingOrder || readPendingTossOrder(userId)) {
      showToast('이전 주문의 결제 결과를 먼저 확인해 주세요.');
      return;
    }
    if (!currentPendingChecked) {
      showToast('이전 주문 상태를 확인한 뒤 새 결제를 시작할 수 있습니다.');
      return;
    }
    if (!tossPaymentsRef.current) {
      showToast('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    // 서버 상품표를 못 받았으면 결제를 시작하지 않는다. 표시와 지급이 갈라지는 것을 막는 안전핀이다.
    if (productsError || products.length === 0) {
      showToast('충전 상품을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);
    setSelectedPackage(pkg.productId);

    let reservedOrder: PendingTossOrder | null = null;
    let preparingOrder: PendingTossOrder | null = null;
    try {
      const orderId = createTossOrderId();
      preparingOrder = {
        ownerUserId: userId, orderId, productId: pkg.productId,
        amount: reservationEnabled ? null : pkg.price,
        protocol: reservationEnabled ? 'reserved-v2' : 'legacy',
      };
      // 예약 응답 유실과 레거시 성공 콜백 모두 같은 계정·주문·금액으로만 복구한다.
      savePendingTossOrder(preparingOrder);
      setPendingOrder(preparingOrder);
      let paymentAmount = pkg.price;
      let customerKey = 'ANONYMOUS';
      if (reservationEnabled) {
        const intent = await paymentApi.reserveIntent(orderId, pkg.productId);
        if (!paymentAuthUnchanged(auth)) {
          showToast('로그인 계정이 바뀌었습니다. 원 주문의 계정으로 결과를 확인해 주세요.');
          return;
        }
        if (!Number.isSafeInteger(intent.amount) || intent.amount <= 0) {
          // 결속된 같은 예약 replay는 202이고 본문에 금액이 없다. GET으로만 원 스냅샷 확인.
          const existing = await paymentApi.getOrder(orderId);
          if (!paymentAuthUnchanged(auth)) return;
          const recovered = { ...preparingOrder, amount: existing.amount };
          savePendingTossOrder(recovered);
          setPendingOrder(recovered);
          showToast('이전 주문의 결제 결과를 확인 중입니다.');
          return;
        }
        reservedOrder = { ownerUserId: userId, orderId,
          productId: pkg.productId, amount: intent.amount, protocol: 'reserved-v2' };
        savePendingTossOrder(reservedOrder);
        setPendingOrder(reservedOrder);
        if (intent.orderId !== orderId || intent.productId !== pkg.productId
          || intent.amount !== pkg.price || intent.hearts !== pkg.hearts
          || intent.status !== 'PENDING'
          || !/^[A-Za-z0-9._=@-]{2,50}$/.test(intent.customerKey)) {
          throw new Error('서버 주문과 선택한 상품이 다릅니다');
        }
        paymentAmount = intent.amount;
        customerKey = intent.customerKey;
      }

      // Toss Payments 결제 위젯 호출
      const payment = tossPaymentsRef.current.payment({ customerKey });
      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: paymentAmount,
        },
        orderId,
        orderName: `Romeo-N-Cupid ${pkg.name}`,
        // 하트 수를 주소에 실어 보내지 않는다. 성공 화면은 서버 승인 응답의 값만 표시한다.
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      if (!paymentAuthUnchanged(auth)) {
        showToast('로그인 계정이 바뀌었습니다. 원 주문의 계정으로 결과를 확인해 주세요.');
        return;
      }
      if (preparingOrder?.protocol === 'legacy') {
        clearPendingTossOrder(preparingOrder.orderId);
        setPendingOrder(null);
        const code = (err as { code?: string })?.code;
        if (code !== 'PAY_PROCESS_CANCELED' && code !== 'USER_CANCEL') {
          showToast(getErrorMessage(err));
        }
        return;
      }
      if (reservedOrder) {
        try {
          const cancelled = await paymentApi.cancelIntent(reservedOrder.orderId);
          if (cancelled.cancelled) {
            clearPendingTossOrder(reservedOrder.orderId);
            setPendingOrder(null);
          } else {
            showToast('결제 결과를 확인 중입니다. 새 구매는 시작하지 않습니다.');
          }
        } catch {
          showToast('결제 결과를 확인할 수 없습니다. 이전 주문을 다시 확인해 주세요.');
        }
      } else {
        const code = (err as { errorResponse?: { code?: string } })?.errorResponse?.code;
        if (code === 'PAYMENT_PENDING' || code === 'RESERVATION_DISABLED') {
          const preparing = readPendingTossOrder(userId);
          if (preparing && preparingOrder && preparing.orderId === preparingOrder.orderId) {
            const rejected: PendingTossOrder = { ...preparing, rejectedCode: code };
            try {
              savePendingTossOrder(rejected);
            } catch {
              // marker 저장 실패는 승인/미생성 판정이 아니다. 원 선저장 가드를 보존한다.
              showToast('예약 상태를 저장할 수 없습니다. 이전 주문을 다시 확인해 주세요.');
              return;
            }
            setPendingOrder(rejected);
            const result = await resolveRejectedStartingOrder(rejected, auth);
            if (!paymentAuthUnchanged(auth)) return;
            if (result.kind === 'replaced') setPendingOrder(result.order);
            if (result.kind === 'cleared') {
              setPendingOrder(null);
              setPendingScanGeneration((value) => value + 1);
            }
          }
          showToast(code === 'RESERVATION_DISABLED'
            ? '현재 새 결제를 시작할 수 없습니다.'
            : '진행 중인 원 주문을 확인해 주세요.');
        } else {
          showToast('예약 결과를 확인할 수 없습니다. 이전 주문을 다시 확인해 주세요.');
        }
      }
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-subtext dark:text-[var(--subtext)]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">하트 충전</h1>
        <div className="w-6" />
      </div>
      {pendingOrder && (
        <div className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5 text-text dark:text-dark-cream">
          <p className="text-sm mb-3">이전 결제 결과를 확인 중입니다. 새 결제는 잠시 기다려 주세요.</p>
          <button onClick={checkPendingOrder}
            className="px-4 py-2 rounded-xl bg-gold dark:bg-dark-gold text-white text-sm font-medium">
            이전 주문 확인
          </button>
        </div>
      )}
      {!pendingOrder && !currentPendingChecked && (
        <div className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5 text-text dark:text-dark-cream">
          <p className="text-sm mb-3">이전 결제 상태를 확인하는 중입니다.</p>
          <button onClick={() => setPendingScanGeneration((value) => value + 1)}
            className="px-4 py-2 rounded-xl bg-gold dark:bg-dark-gold text-white text-sm font-medium">
            이전 주문 다시 확인
          </button>
        </div>
      )}

      {/* 현재 하트 잔액 */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gold/10 to-rosegold/10 dark:from-dark-gold/10 dark:to-rosegold/10 border border-gold/20 dark:border-dark-gold/20 text-center">
        <p className="text-sm text-subtext dark:text-[var(--subtext)] mb-2">현재 보유 하트</p>
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto" />
        ) : (
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-4xl font-bold text-gold dark:text-dark-gold tabular-nums">
              {balance === null ? '조회 중' : balance.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* 충전 패키지 목록 */}
      <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">
        충전 패키지
        {!isSdkReady && (
          <span className="ml-2 text-xs font-normal text-subtext dark:text-[var(--subtext)]">결제 모듈 로딩 중...</span>
        )}
      </h2>
      {isProductsLoading ? (
        <div className="flex items-center justify-center py-10 mb-4">
          <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        </div>
      ) : productsError ? (
        <div className="p-5 mb-4 rounded-2xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-center">
          <p className="text-sm font-medium text-text dark:text-dark-cream mb-1">충전 상품을 불러오지 못했습니다</p>
          <p className="text-xs text-subtext dark:text-[var(--subtext)] mb-4">
            상품 정보를 확인하기 전에는 결제를 진행할 수 없습니다.
          </p>
          <button
            onClick={fetchProducts}
            className="px-5 py-2.5 rounded-xl bg-gold dark:bg-dark-gold text-white text-sm font-medium"
          >
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {products.map((pkg) => {
            const isSelected = selectedPackage === pkg.productId;
            const listPrice = pkg.hearts * HEART_LIST_PRICE;
            const discount = listPrice > pkg.price ? Math.round((1 - pkg.price / listPrice) * 100) : 0;
            return (
              <button
                key={pkg.productId}
                onClick={() => setSelectedPackage(pkg.productId)}
                className={`
                  relative w-full p-5 rounded-2xl text-left transition-all
                  ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold/10 to-rosegold/10 dark:from-dark-gold/10 dark:to-rosegold/10 border-2 border-gold dark:border-dark-gold ring-2 ring-gold/20 dark:ring-dark-gold/20'
                      : 'bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-gold/10 dark:bg-dark-gold/10' : 'bg-ivory dark:bg-dark-bg'
                      }`}
                    >
                      <svg className="w-6 h-6 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text dark:text-dark-cream">{pkg.name}</h3>
                      {discount > 0 ? (
                        <p className="text-xs text-subtext dark:text-[var(--subtext)]">
                          <span className="line-through">{listPrice.toLocaleString()}원</span>
                          <span className="ml-1.5 text-red-500 dark:text-red-400 font-bold">{discount}% 할인</span>
                        </p>
                      ) : (
                        <p className="text-xs text-subtext dark:text-[var(--subtext)]">정가</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gold dark:text-dark-gold">{pkg.price.toLocaleString()}원</p>
                    <p className="text-[10px] text-subtext dark:text-[var(--subtext)]">
                      하트당 {Math.round(pkg.price / pkg.hearts).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 충전하기 버튼 (2단계) */}
      <button
        onClick={() => {
          const pkg = products.find((p) => p.productId === selectedPackage);
          if (pkg) handlePurchase(pkg);
        }}
        disabled={!selectedPackage || isProcessing || !isSdkReady
          || !currentPendingChecked || Boolean(pendingOrder) || isProductsLoading || productsError}
        className="w-full py-4 mb-8 rounded-2xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            결제 진행 중...
          </span>
        ) : selectedPackage ? (
          `${products.find((p) => p.productId === selectedPackage)?.price.toLocaleString()}원 충전하기`
        ) : (
          '패키지를 선택하세요'
        )}
      </button>

      {/* 안내 사항 — R21 Editorial 톤 */}
      <div className="p-4 rounded-2xl bg-ivory dark:bg-dark-bg">
        <h3 className="text-xs font-bold text-text dark:text-dark-cream mb-2">Cupid 매일 1픽은 무료. 충전은 답장 가속용</h3>
        <ul className="text-xs text-subtext dark:text-[var(--subtext)] space-y-1.5 leading-relaxed">
          <li>- 매일 정오, Cupid 추천 1분 무료</li>
          <li>- 하트 1개는 1,000원입니다. 큰 묶음일수록 하트당 가격이 내려갑니다.</li>
          <li>- OK와 슈퍼 OK에 드는 하트는 상대와 매칭되기 전인지 이후인지에 따라 달라집니다. 실제 금액은 보내기 화면에서 확인하실 수 있습니다.</li>
          <li>- 충전한 하트는 환불되지 않습니다.</li>
          <li>- 결제는 Toss Payments를 통해 안전하게 처리됩니다</li>
        </ul>
      </div>
    </div>
  );
}
