import apiClient from './client';

// === 요청/응답 타입 ===

/** 토스 결제 승인 요청 */
export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/** 토스 결제 승인 응답 */
export interface PaymentConfirmResponse {
  paymentId: number;
  orderId: string;
  amount: number;
  /**
   * 이번 결제로 실제 지급된 하트 수. 서버 charge_products 표가 정한 값이다.
   *
   * 예전 성공 화면은 이 값을 쓰지 않고 주소창 `?hearts=` 를 그대로 표시했다.
   * 주소를 고치면 아무 숫자나 보였고, 웹 상품표가 서버와 어긋나 있었기 때문에
   * 정상 결제에서도 표시와 지급이 달랐다. 표시는 이 필드 하나만 쓴다.
   */
  hearts: number;
  balance: number;
  paymentMethod: string;
  status: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | string;
  amount: number;
  hearts: number | null;
  paymentKeyBound: boolean;
  canCancel: boolean;
}

export interface PaymentIntentResponse {
  orderId: string;
  productId: string;
  amount: number;
  hearts: number;
  status: 'PENDING';
  customerKey: string;
}

export interface PaymentIntentCancelResponse {
  orderId: string;
  status: 'PENDING' | 'CANCELLED';
  cancelled?: boolean;
}

export interface PaymentConfigResponse {
  tossClientKey: string;
  reservationEnabled: boolean;
}

/** 서버가 확정한 동일 주문·원금액·적립값이 모두 있어야 성공 화면으로 간다. */
export const isCompletedPaymentResponse = (
  value: unknown,
  orderId: string,
  amount: number,
): value is PaymentConfirmResponse => {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<PaymentConfirmResponse>;
  return response.status === 'COMPLETED' && response.orderId === orderId
    && response.amount === amount && typeof response.hearts === 'number'
    && Number.isInteger(response.hearts) && response.hearts > 0
    && typeof response.balance === 'number' && Number.isFinite(response.balance);
};

/** 충전 상품 (서버 charge_products 표가 유일한 진실원) */
export interface ChargeProduct {
  productId: string;
  name: string;
  hearts: number;
  price: number;
}

/** 결제 내역 단건 */
export interface PaymentHistoryItem {
  id: number;
  orderId: string;
  amount: number;
  paymentMethod: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

/** 결제 내역 페이지 응답 (Spring Page 형식) */
export interface PaymentHistoryPageResponse {
  content: PaymentHistoryItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// === API 함수 ===

export const paymentApi = {
  getConfig: (): Promise<PaymentConfigResponse> =>
    apiClient.get('/payments/config').then((r) => r.data),
  /**
   * 충전 상품 목록 조회. 화면은 이 결과만으로 그린다.
   *
   * 웹에 상품 배열을 상수로 박아두었다가 서버 표(V72)와 갈라진 적이 있다.
   * 그때 1만원 결제는 표시보다 적은 하트가 지급되고 5천원·3만원은 아예 거절됐다.
   * 숫자가 두 곳에 있으면 언젠가 갈라지므로 웹에는 대비 상수를 두지 않는다.
   */
  getProducts: (): Promise<ChargeProduct[]> =>
    apiClient.get('/payments/products').then((r) => r.data),

  /** 결제 내역 조회 (페이지네이션) */
  getHistory: (page = 0, size = 20): Promise<PaymentHistoryPageResponse> =>
    apiClient.get('/payments/history', { params: { page, size } }).then((r) => r.data),

  /** 토스페이먼츠 결제 승인 (success 콜백에서 호출) */
  confirmPayment: (data: PaymentConfirmRequest, reservedV2 = false): Promise<PaymentConfirmResponse> =>
    apiClient.post('/payments/confirm', data, reservedV2
      ? { headers: { 'X-Payment-Protocol': 'reserved-v2' } } : undefined).then((r) => r.data),

  reserveIntent: (orderId: string, productId: string): Promise<PaymentIntentResponse> =>
    apiClient.post('/payments/intents', { orderId, productId }).then((r) => r.data),

  cancelIntent: (orderId: string): Promise<PaymentIntentCancelResponse> =>
    apiClient.post(`/payments/intents/${encodeURIComponent(orderId)}/cancel`).then((r) => r.data),

  getOrder: (orderId: string): Promise<PaymentOrderResponse> =>
    apiClient.get(`/payments/orders/${encodeURIComponent(orderId)}`).then((r) => r.data),

  getCurrentPending: (): Promise<PaymentOrderResponse | null> =>
    apiClient.get('/payments/intents/current').then((r) => r.status === 204 ? null : r.data),

  /** 결제 환불 요청 */
  refundPayment: (orderId: string): Promise<void> =>
    apiClient.post('/payments/refund', { orderId }).then((r) => r.data),
};
