import { useAuthStore } from '@/store/authStore';

export interface PaymentAuthSnapshot {
  ownerUserId: number;
  authGeneration: number;
}

/** 실제 요청 토큰과 store가 결속된 시점의 회원·인증 세대만 보존한다. */
export function capturePaymentAuth(): PaymentAuthSnapshot | null {
  if (typeof window === 'undefined') return null;
  const state = useAuthStore.getState();
  const ownerUserId = state.user?.userId;
  const accessToken = localStorage.getItem('accessToken');
  return ownerUserId && accessToken && state.accessToken === accessToken
    && Number.isSafeInteger(state.authGeneration)
    ? { ownerUserId, authGeneration: state.authGeneration } : null;
}

export function paymentAuthUnchanged(snapshot: PaymentAuthSnapshot): boolean {
  const state = useAuthStore.getState();
  const requestToken = localStorage.getItem('accessToken');
  return state.user?.userId === snapshot.ownerUserId
    && state.authGeneration === snapshot.authGeneration
    && Boolean(requestToken)
    && state.accessToken === requestToken;
}
