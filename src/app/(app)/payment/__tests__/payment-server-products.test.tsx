/**
 * 회귀 고정 — 교차 코드리뷰 BLOCK B4·B5 (2026-08-30)
 *
 * B4. 웹이 상품 배열을 코드에 박아두는 바람에 서버 charge_products 표(V72)와 갈라졌다.
 *     웹은 50·110·350·1,200하트를 팔았고 서버는 10·30·60·150하트만 승인했다. 1만원·10만원
 *     결제는 표시보다 적은 하트가 지급됐고 5천원·3만원은 아예 거절됐다.
 *     → 화면은 서버 조회 결과만 그리고, 조회에 실패하면 결제를 열지 않는다.
 *
 * B5. 성공 화면이 서버 응답이 아니라 주소창의 `hearts` 를 읽어 표시했다. 주소를 고치면
 *     아무 숫자나 보였다. → 승인 응답의 hearts·amount 만 표시한다.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentPage from '../page';
import PaymentSuccessPage from '../success/page';
import PaymentFailPage from '../fail/page';
import { paymentApi } from '@/lib/api/payment';
import { heartApi } from '@/lib/api/heart';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

jest.mock('@/lib/api/payment', () => ({
  isCompletedPaymentResponse: jest.requireActual('@/lib/api/payment').isCompletedPaymentResponse,
  paymentApi: {
    getConfig: jest.fn(),
    getProducts: jest.fn(),
    confirmPayment: jest.fn(),
    getOrder: jest.fn(),
    getCurrentPending: jest.fn(),
    reserveIntent: jest.fn(),
    cancelIntent: jest.fn(),
  },
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (s: { user: { userId: number }; accessToken: string; authGeneration: number }) => unknown) =>
      selector({ user: { userId: 1 }, accessToken: 'test-owner-token', authGeneration: 1 }),
    { getState: () => ({ user: { userId: 1 }, accessToken: 'test-owner-token', authGeneration: 1 }) },
  ),
}));
jest.mock('@/lib/api/heart', () => ({ heartApi: { getBalance: jest.fn() } }));
jest.mock('@tosspayments/tosspayments-sdk', () => ({
  loadTossPayments: jest.fn(() => Promise.resolve({ payment: () => ({ requestPayment: jest.fn() }) })),
}));

const showToast = jest.fn();
jest.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (s: { showToast: (m: string) => void }) => unknown) =>
    selector({ showToast: (m: string) => showToast(m) }),
}));

const push = jest.fn();
const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, back: jest.fn() }),
  useSearchParams: () => searchParams,
}));

const mockApi = paymentApi as jest.Mocked<typeof paymentApi>;
const mockHeartApi = heartApi as jest.Mocked<typeof heartApi>;

// 서버 V72 가 실제로 판매 중인 상품 4종
const SERVER_PRODUCTS = [
  { productId: 'heart_10', name: '하트 10개', hearts: 10, price: 10000 },
  { productId: 'heart_30', name: '하트 30개', hearts: 30, price: 27000 },
  { productId: 'heart_60', name: '하트 60개', hearts: 60, price: 50000 },
  { productId: 'heart_150', name: '하트 150개', hearts: 150, price: 100000 },
];

beforeEach(() => {
  jest.clearAllMocks();
  // mockResolvedValueOnce 큐가 앞 테스트의 timeout 뒤에 남으면 다음 계정 조회가 가짜 미결로 열린다.
  mockApi.getCurrentPending.mockReset();
  Array.from(searchParams.keys()).forEach((key) => searchParams.delete(key));
  localStorage.clear();
  localStorage.setItem('accessToken', 'test-owner-token');
  mockHeartApi.getBalance.mockResolvedValue({ balance: 0 });
  mockApi.getCurrentPending.mockResolvedValue(null);
  mockApi.getConfig.mockResolvedValue({ tossClientKey: 'test_client_key', reservationEnabled: true });
});

describe('TOSS-W 예약 선행', () => {
  it('TOSS-W08 정상: 로컬 기록 유실 시 서버 본인 미결 주문을 복원하고 새 구매를 잠근다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS.slice(0, 1));
    const current = {
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'PENDING',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    } as const;
    let resolveCurrent!: (value: typeof current) => void;
    mockApi.getCurrentPending.mockImplementation(() => new Promise<typeof current>((resolve) => {
      resolveCurrent = resolve;
    }));
    const requestPayment = jest.fn();
    (loadTossPayments as jest.Mock).mockResolvedValue({ payment: () => ({ requestPayment }) });
    render(<PaymentPage />);
    await act(async () => { resolveCurrent(current); });
    expect(screen.getByRole('button', { name: '이전 주문 확인' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}'))
      .toMatchObject({ ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef' });
    fireEvent.click(screen.getByText('하트 10개'));
    expect(screen.getByRole('button', { name: '10,000원 충전하기' })).toBeDisabled();
    expect(mockApi.reserveIntent).not.toHaveBeenCalled();
    expect(requestPayment).not.toHaveBeenCalled();
  });

  it('TOSS-W09 경계: 응답 유실 선저장 주문은 새 예약 POST 없이 본인 원 주문을 GET한다', async () => {
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: 'heart_10', amount: null,
    }));
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'PENDING',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    });
    render(<PaymentPage />);
    await userEvent.click(await screen.findByRole('button', { name: '이전 주문 확인' }));
    await waitFor(() => expect(mockApi.getOrder).toHaveBeenCalledWith(
      'RNC_0123456789abcdef0123456789abcdef'));
    expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}'))
      .toMatchObject({ amount: 10000 });
    expect(mockApi.reserveIntent).not.toHaveBeenCalled();
    expect(loadTossPayments).toHaveBeenCalled();
    expect(mockApi.confirmPayment).not.toHaveBeenCalled();
  });

  it('TOSS-W11 경합: 새 P 예약이 기존 O 때문에 409면 원 O를 복원하며 P 가드를 남기지 않는다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS.slice(0, 1));
    mockApi.getCurrentPending
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        orderId: 'RNC_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', status: 'PENDING',
        amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
      });
    mockApi.reserveIntent.mockRejectedValue({ errorResponse: { code: 'PAYMENT_PENDING' } });
    render(<PaymentPage />);
    await waitFor(() => expect(screen.getByText('하트 10개')).toBeInTheDocument());
    fireEvent.click(screen.getByText('하트 10개'));
    const purchase = screen.getByRole('button', { name: '10,000원 충전하기' });
    await waitFor(() => expect(purchase).toBeEnabled());
    fireEvent.click(purchase);
    await waitFor(() => expect(mockApi.reserveIntent).toHaveBeenCalledTimes(1));
    const provisionalId = mockApi.reserveIntent.mock.calls[0][0];
    await waitFor(() => expect(mockApi.getCurrentPending).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}').orderId)
      .toBe('RNC_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
    const saved = JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}');
    expect(saved.orderId).toBe('RNC_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(saved.orderId).not.toBe(provisionalId);
  });

  it('TOSS-W13 경합: 명시 거절 marker는 current 204와 원 P 404가 모두 본인 확인되면 제거한다', async () => {
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: 'heart_10', amount: null, rejectedCode: 'PAYMENT_PENDING',
    }));
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getCurrentPending.mockResolvedValue(null);
    mockApi.getOrder.mockRejectedValue({ errorResponse: { code: 'PAYMENT_003' } });
    render(<PaymentPage />);
    await waitFor(() => expect(localStorage.getItem('romeo:pending-toss-order:v2:1')).toBeNull());
    await userEvent.click(await screen.findByText('하트 10개'));
    await waitFor(() => expect(screen.getByRole('button', { name: '10,000원 충전하기' })).toBeEnabled());
    expect(mockApi.reserveIntent).not.toHaveBeenCalled();
  });

  it('TOSS-W14 거절: marker 없는 선저장 P의 404와 네트워크 불명은 새 예약을 만들지 않는다', async () => {
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: 'heart_10', amount: null,
    }));
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getCurrentPending.mockResolvedValue(null);
    mockApi.getOrder.mockRejectedValue({ errorResponse: { code: 'PAYMENT_003' } });
    render(<PaymentPage />);
    await userEvent.click(await screen.findByRole('button', { name: '이전 주문 확인' }));
    await waitFor(() => expect(mockApi.getOrder).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('romeo:pending-toss-order:v2:1')).not.toBeNull();
    expect(mockApi.reserveIntent).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '패키지를 선택하세요' })).toBeDisabled();
  });

  it('TOSS-W15 거절: 명시 거절 marker 저장 실패는 원 P를 보존하고 새 주문을 열지 않는다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS.slice(0, 1));
    mockApi.reserveIntent.mockRejectedValue({ errorResponse: { code: 'PAYMENT_PENDING' } });
    const originalSetItem = Storage.prototype.setItem;
    let orderWrites = 0;
    const storageSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'romeo:pending-toss-order:v2:1' && ++orderWrites === 2) {
        throw new Error('quota exceeded');
      }
      return originalSetItem.call(this, key, value);
    });
    try {
      render(<PaymentPage />);
      fireEvent.click(await screen.findByText('하트 10개'));
      const purchase = screen.getByRole('button', { name: '10,000원 충전하기' });
      await waitFor(() => expect(purchase).toBeEnabled());
      fireEvent.click(purchase);
      await waitFor(() => expect(showToast).toHaveBeenCalledWith(
        '예약 상태를 저장할 수 없습니다. 이전 주문을 다시 확인해 주세요.'));
      const saved = JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}');
      expect(saved.orderId).toMatch(/^RNC_/);
      expect(saved.rejectedCode).toBeUndefined();
      expect(mockApi.getCurrentPending).toHaveBeenCalledTimes(1);
      expect(mockApi.reserveIntent).toHaveBeenCalledTimes(1);
      expect(mockApi.confirmPayment).not.toHaveBeenCalled();
    } finally {
      storageSpy.mockRestore();
    }
  });

  it('TOSS-W16 거절: 명시 거절 marker도 current 네트워크 장애만으로 제거하지 않는다', async () => {
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: 'heart_10', amount: null, rejectedCode: 'RESERVATION_DISABLED',
    }));
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getCurrentPending.mockRejectedValue(new Error('network'));
    render(<PaymentPage />);
    fireEvent.click(await screen.findByRole('button', { name: '이전 주문 확인' }));
    await waitFor(() => expect(mockApi.getCurrentPending).toHaveBeenCalled());
    expect(localStorage.getItem('romeo:pending-toss-order:v2:1')).not.toBeNull();
    expect(mockApi.getOrder).not.toHaveBeenCalled();
    expect(mockApi.reserveIntent).not.toHaveBeenCalled();
  });

  it('TOSS-W05 정상: 복원한 완료 주문은 성공 화면으로, 확정 실패는 실패 화면으로 이동한다', async () => {
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: '', amount: 10000,
    }));
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getOrder.mockResolvedValueOnce({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'COMPLETED',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    });
    render(<PaymentPage />);
    await userEvent.click(await screen.findByRole('button', { name: '이전 주문 확인' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(
      '/payment/success?orderId=RNC_0123456789abcdef0123456789abcdef'));
    expect(mockApi.confirmPayment).not.toHaveBeenCalled();
  });

  it('TOSS-W07 거절: 서버가 실패 확정한 복원 주문은 실패 화면으로 이동한다', async () => {
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: '', amount: 10000,
    }));
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getOrder.mockResolvedValueOnce({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'FAILED',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    });
    render(<PaymentPage />);
    await userEvent.click(await screen.findByRole('button', { name: '이전 주문 확인' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(
      '/payment/fail?orderId=RNC_0123456789abcdef0123456789abcdef&restore=1'));
  });

  it('TOSS-W03 정상: 서버 예약을 저장한 뒤에만 Toss SDK를 열고 서버 금액을 쓴다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.reserveIntent.mockImplementation(async (orderId, productId) => {
      expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}'))
        .toMatchObject({ ownerUserId: 1, orderId, productId, amount: null });
      return {
        orderId, productId, amount: 10000, hearts: 10, status: 'PENDING',
        customerKey: '7caa8c21-5984-4e57-8db5-5c6443f8b3ca',
      } as never;
    });
    const requestPayment = jest.fn().mockResolvedValue(undefined);
    const payment = jest.fn(() => ({ requestPayment }));
    (loadTossPayments as jest.Mock).mockResolvedValue({
      payment,
    });
    render(<PaymentPage />);
    await waitFor(() => expect(screen.getByText('하트 10개')).toBeInTheDocument());
    await userEvent.click(screen.getByText('하트 10개'));
    await userEvent.click(screen.getByRole('button', { name: '10,000원 충전하기' }));

    await waitFor(() => expect(requestPayment).toHaveBeenCalledTimes(1));
    const orderId = mockApi.reserveIntent.mock.calls[0][0];
    expect(orderId).toMatch(/^RNC_[a-f0-9]{32}$/);
    expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}'))
      .toMatchObject({ ownerUserId: 1, orderId, amount: 10000 });
    expect(requestPayment.mock.calls[0][0].orderId).toBe(orderId);
    expect(requestPayment.mock.calls[0][0].amount.value).toBe(10000);
    expect(payment).toHaveBeenCalledWith({
      customerKey: '7caa8c21-5984-4e57-8db5-5c6443f8b3ca',
    });
    expect(payment).not.toHaveBeenCalledWith({ customerKey: 'RNC_USER_1' });
  });

  it('TOSS-W04 정상: 예약 flag OFF면 서버 상품 금액으로 레거시 결제창을 열고 예약 API는 호출하지 않는다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockApi.getConfig.mockResolvedValue({ tossClientKey: 'test_client_key', reservationEnabled: false });
    const requestPayment = jest.fn().mockResolvedValue(undefined);
    const payment = jest.fn(() => ({ requestPayment }));
    (loadTossPayments as jest.Mock).mockResolvedValue({ payment });
    render(<PaymentPage />);
    await waitFor(() => expect(screen.getByText('하트 10개')).toBeInTheDocument());
    await userEvent.click(screen.getByText('하트 10개'));
    const purchase = screen.getByRole('button', { name: '10,000원 충전하기' });
    await waitFor(() => expect(purchase).toBeEnabled());
    await userEvent.click(purchase);

    await waitFor(() => expect(requestPayment).toHaveBeenCalledTimes(1));
    expect(mockApi.reserveIntent).not.toHaveBeenCalled();
    expect(payment).toHaveBeenCalledWith({ customerKey: 'ANONYMOUS' });
    expect(requestPayment.mock.calls[0][0].amount.value).toBe(10000);
    expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}'))
      .toMatchObject({ ownerUserId: 1, productId: 'heart_10', amount: 10000, protocol: 'legacy' });
  });

  it('TOSS-W04b 거절: 레거시 결제창이 명시 취소되면 로컬 주문 잠금을 제거한다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS.slice(0, 1));
    mockApi.getConfig.mockResolvedValue({ tossClientKey: 'test_client_key', reservationEnabled: false });
    const requestPayment = jest.fn().mockRejectedValue({ code: 'PAY_PROCESS_CANCELED' });
    (loadTossPayments as jest.Mock).mockResolvedValue({ payment: () => ({ requestPayment }) });
    render(<PaymentPage />);
    await userEvent.click(await screen.findByText('하트 10개'));
    await userEvent.click(screen.getByRole('button', { name: '10,000원 충전하기' }));

    await waitFor(() => expect(requestPayment).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(localStorage.getItem('romeo:pending-toss-order:v2:1')).toBeNull());
    expect(mockApi.cancelIntent).not.toHaveBeenCalled();
  });
});

describe('B4: 충전 화면은 서버 상품표만 그린다', () => {
  it('TC-10 정상 경로: 현재 보유 하트는 통합 하트 지갑 값을 표시한다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockHeartApi.getBalance.mockResolvedValue({ balance: 31 });

    render(<PaymentPage />);

    await waitFor(() => expect(screen.getByText('31')).toBeInTheDocument());
    expect(mockHeartApi.getBalance).toHaveBeenCalledTimes(1);
  });

  it('TC-10 거절 조건: 하트 지갑 조회 실패를 옛 결제 잔액으로 폴백하지 않는다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    mockHeartApi.getBalance.mockRejectedValue(new Error('heart balance unavailable'));

    render(<PaymentPage />);

    await waitFor(() => expect(screen.getByText('조회 중')).toBeInTheDocument());
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(mockHeartApi.getBalance).toHaveBeenCalledTimes(1);
  });

  it('서버가 준 상품 4종을 그대로 표시하고, 폐기된 구 상품은 어디에도 없다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);

    render(<PaymentPage />);

    await waitFor(() => expect(screen.getByText('하트 10개')).toBeInTheDocument());
    expect(screen.getByText('하트 30개')).toBeInTheDocument();
    expect(screen.getByText('하트 60개')).toBeInTheDocument();
    expect(screen.getByText('하트 150개')).toBeInTheDocument();

    // 구 상품(50·110·350·1,200하트)이 화면에 되살아나면 이 테스트가 깨진다.
    expect(screen.queryByText(/하트 50개/)).not.toBeInTheDocument();
    expect(screen.queryByText(/하트 110개/)).not.toBeInTheDocument();
    expect(screen.queryByText(/하트 350개/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,200/)).not.toBeInTheDocument();
  });

  it('서버 조회에 실패하면 상품을 하나도 그리지 않고 결제 버튼을 잠근다', async () => {
    mockApi.getProducts.mockRejectedValue(new Error('network'));

    render(<PaymentPage />);

    await waitFor(() => expect(screen.getByText('충전 상품을 불러오지 못했습니다')).toBeInTheDocument());
    // 조회 실패 상태에서 임의 금액이 화면에 남아 있으면 안 된다.
    expect(screen.queryByText(/원 충전하기/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '패키지를 선택하세요' })).toBeDisabled();
  });

  it('서버가 빈 목록을 주면 결제를 열지 않는다', async () => {
    mockApi.getProducts.mockResolvedValue([]);

    render(<PaymentPage />);

    await waitFor(() => expect(screen.getByText('충전 상품을 불러오지 못했습니다')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '패키지를 선택하세요' })).toBeDisabled();
  });

  it('선택한 상품의 금액은 서버 값 그대로다', async () => {
    mockApi.getProducts.mockResolvedValue(SERVER_PRODUCTS);
    render(<PaymentPage />);

    await waitFor(() => expect(screen.getByText('하트 150개')).toBeInTheDocument());
    await userEvent.click(screen.getByText('하트 150개'));

    expect(screen.getByRole('button', { name: '100,000원 충전하기' })).toBeInTheDocument();
  });
});

describe('B5: 성공 화면은 서버 승인 응답만 표시한다', () => {
  it('TOSS-W17 정상: 레거시 웹 콜백은 예약 헤더 없이 원 주문·금액을 승인한다', async () => {
    searchParams.set('paymentKey', 'pk_legacy');
    searchParams.set('orderId', 'RNC_0123456789abcdef0123456789abcdef');
    searchParams.set('amount', '10000');
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: 'heart_10', amount: 10000, protocol: 'legacy',
    }));
    mockApi.confirmPayment.mockResolvedValue({
      paymentId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      amount: 10000, hearts: 10, balance: 10, paymentMethod: '카드', status: 'COMPLETED',
    });
    mockHeartApi.getBalance.mockResolvedValue({ balance: 10 });

    render(<PaymentSuccessPage />);

    await waitFor(() => expect(screen.getByText('충전 완료!')).toBeInTheDocument());
    expect(mockApi.confirmPayment).toHaveBeenCalledWith({
      paymentKey: 'pk_legacy', orderId: 'RNC_0123456789abcdef0123456789abcdef', amount: 10000,
    }, false);
    expect(mockApi.getOrder).not.toHaveBeenCalled();
    expect(localStorage.getItem('romeo:pending-toss-order:v2:1')).toBeNull();
  });

  it('TOSS-W06 정상: 완료 주문 복원은 서버 주문과 잔액으로 표시하고 confirm을 재호출하지 않는다', async () => {
    searchParams.set('orderId', 'RNC_0123456789abcdef0123456789abcdef');
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'COMPLETED',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    });
    mockHeartApi.getBalance.mockResolvedValue({ balance: 23 });
    render(<PaymentSuccessPage />);
    await waitFor(() => expect(screen.getByText('충전 완료!')).toBeInTheDocument());
    expect(screen.getByText('+10개')).toBeInTheDocument();
    expect(screen.getByText('23개')).toBeInTheDocument();
    expect(mockHeartApi.getBalance).toHaveBeenCalledTimes(1);
    expect(mockApi.confirmPayment).not.toHaveBeenCalled();
  });

  it('TC-11 거절 조건: 완료 주문 복원 뒤 하트 지갑 조회 실패 시 과거 잔액을 표시하지 않는다', async () => {
    searchParams.set('orderId', 'RNC_0123456789abcdef0123456789abcdef');
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'COMPLETED',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    });
    mockHeartApi.getBalance.mockRejectedValue(new Error('heart balance unavailable'));

    render(<PaymentSuccessPage />);

    await waitFor(() => expect(screen.getByText('충전 완료!')).toBeInTheDocument());
    expect(screen.getByText('조회 중')).toBeInTheDocument();
    expect(screen.queryByText('0개')).not.toBeInTheDocument();
  });

  it('주소창의 hearts 를 조작해도 서버가 지급한 수량이 표시된다', async () => {
    searchParams.set('paymentKey', 'pk_test');
    searchParams.set('orderId', 'RNC_heart_10_1_abc');
    searchParams.set('amount', '10000');
    searchParams.set('hearts', '999999'); // 공격자가 손으로 붙인 값
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_heart_10_1_abc', status: 'PENDING', amount: 10000,
      hearts: 10, paymentKeyBound: false, canCancel: true,
    });
    mockApi.confirmPayment.mockResolvedValue({
      paymentId: 1,
      orderId: 'RNC_heart_10_1_abc',
      amount: 10000,
      hearts: 10,
      balance: 10,
      paymentMethod: '카드',
      status: 'COMPLETED',
    });
    mockHeartApi.getBalance.mockResolvedValue({ balance: 41 });

    render(<PaymentSuccessPage />);

    await waitFor(() => expect(screen.getByText('+10개')).toBeInTheDocument());
    expect(screen.queryByText(/999,?999/)).not.toBeInTheDocument();
    expect(screen.getByText('10,000원')).toBeInTheDocument();
    expect(screen.getByText('41개')).toBeInTheDocument();
    expect(mockHeartApi.getBalance).toHaveBeenCalledTimes(1);
  });

  it('TC-11 거절 조건: 승인 뒤 하트 지갑 조회 실패 시 승인 응답의 옛 잔액을 표시하지 않는다', async () => {
    searchParams.set('paymentKey', 'pk_test');
    searchParams.set('orderId', 'RNC_0123456789abcdef0123456789abcdef');
    searchParams.set('amount', '10000');
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'PENDING',
      amount: 10000, hearts: 10, paymentKeyBound: false, canCancel: true,
    });
    mockApi.confirmPayment.mockResolvedValue({
      paymentId: 1,
      orderId: 'RNC_0123456789abcdef0123456789abcdef',
      hearts: 10,
      amount: 10000,
      balance: 999,
      paymentMethod: '카드',
      status: 'COMPLETED',
    });
    mockHeartApi.getBalance.mockRejectedValue(new Error('heart balance unavailable'));

    render(<PaymentSuccessPage />);

    await waitFor(() => expect(screen.getByText('충전 완료!')).toBeInTheDocument());
    expect(screen.getByText('조회 중')).toBeInTheDocument();
    expect(screen.queryByText('999개')).not.toBeInTheDocument();
  });

  it('TOSS-W01 거절: 2xx라도 COMPLETED 튜플이 없으면 충전 완료로 표시하지 않는다', async () => {
    searchParams.set('paymentKey', 'pk_test');
    searchParams.set('orderId', 'RNC_heart_10_1_abc');
    searchParams.set('amount', '10000');
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_heart_10_1_abc', status: 'PENDING', amount: 10000,
      hearts: 10, paymentKeyBound: false, canCancel: true,
    });
    mockApi.confirmPayment.mockResolvedValue({
      orderId: 'RNC_heart_10_1_abc', status: 'PENDING',
    } as never);

    render(<PaymentSuccessPage />);

    const heading = await screen.findByRole('heading', { name: '결제 결과 확인 중' });
    expect(heading.parentElement).toHaveClass('pay-result');
    expect(screen.queryByText('충전 완료!')).not.toBeInTheDocument();
    const retry = screen.getByRole('button', { name: '이 주문 다시 확인' });
    expect(retry).toHaveClass('pay-cta');
    expect(retry).not.toHaveClass('rounded-xl');
  });

  it('TOSS-W02 정상: 503 미확정은 같은 주문 조회와 원 튜플 재시도로만 완료된다', async () => {
    searchParams.set('paymentKey', 'pk_test');
    searchParams.set('orderId', 'RNC_heart_10_1_abc');
    searchParams.set('amount', '10000');
    mockApi.confirmPayment
      .mockRejectedValueOnce({ errorResponse: { code: 'PAYMENT_PENDING' } })
      .mockResolvedValueOnce({
        paymentId: 1, orderId: 'RNC_heart_10_1_abc', amount: 10000,
        hearts: 10, balance: 10, paymentMethod: '카드', status: 'COMPLETED',
      });
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_heart_10_1_abc', status: 'PENDING', amount: 10000,
      hearts: 10, paymentKeyBound: true, canCancel: false,
    });

    render(<PaymentSuccessPage />);
    await waitFor(() => expect(screen.getByText('결제 결과 확인 중')).toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem('romeo:pending-toss-order:v2:1') || '{}'))
      .toMatchObject({ ownerUserId: 1, orderId: 'RNC_heart_10_1_abc', paymentKey: 'pk_test' });
    await userEvent.click(screen.getByRole('button', { name: '이 주문 다시 확인' }));

    await waitFor(() => expect(screen.getByText('충전 완료!')).toBeInTheDocument());
    expect(mockApi.getOrder).toHaveBeenCalledWith('RNC_heart_10_1_abc');
    expect(mockApi.confirmPayment).toHaveBeenCalledTimes(2);
    expect(mockApi.confirmPayment).toHaveBeenNthCalledWith(2, {
      paymentKey: 'pk_test', orderId: 'RNC_heart_10_1_abc', amount: 10000,
    }, true);
  });

  it.each([
    ['404', { errorResponse: { code: 'PAYMENT_003' }, response: { status: 404 } }],
    ['503', { errorResponse: { code: 'PAYMENT_PENDING' }, response: { status: 503 } }],
    ['네트워크 유실', new Error('network')],
  ])('TOSS-W10 거절: 로컬 결속 없는 콜백 GET %s이면 승인 POST를 열지 않는다', async (_case, error) => {
    searchParams.set('paymentKey', 'pk_test');
    searchParams.set('orderId', 'RNC_heart_10_1_abc');
    searchParams.set('amount', '10000');
    mockApi.getOrder.mockRejectedValue(error);

    render(<PaymentSuccessPage />);

    await waitFor(() => expect(screen.getByText('결제 결과 확인 중')).toBeInTheDocument());
    expect(mockApi.confirmPayment).not.toHaveBeenCalled();
    expect(screen.queryByText('충전 완료!')).not.toBeInTheDocument();
  });
});

describe('TOSS-W 확정 실패 복원', () => {
  it('TOSS-W18 거절: 레거시 결제 실패 리다이렉트는 예약 없는 로컬 주문 잠금을 제거한다', async () => {
    searchParams.set('code', 'PAY_PROCESS_CANCELED');
    localStorage.setItem('romeo:pending-toss-order:v2:1', JSON.stringify({
      ownerUserId: 1, orderId: 'RNC_0123456789abcdef0123456789abcdef',
      productId: 'heart_10', amount: 10000, protocol: 'legacy',
    }));

    render(<PaymentFailPage />);

    expect(await screen.findByText('결제에 실패했습니다')).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('romeo:pending-toss-order:v2:1')).toBeNull());
  });

  it('TOSS-W12 거절: 복원된 서버 FAILED 주문은 미확정 화면에 가두지 않고 새 주문 CTA를 연다', async () => {
    searchParams.set('orderId', 'RNC_0123456789abcdef0123456789abcdef');
    searchParams.set('restore', '1');
    mockApi.getOrder.mockResolvedValue({
      orderId: 'RNC_0123456789abcdef0123456789abcdef', status: 'FAILED',
      amount: 10000, hearts: 10, paymentKeyBound: true, canCancel: false,
    });
    render(<PaymentFailPage />);
    await waitFor(() => expect(screen.getByText('결제에 실패했습니다')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '다시 시도하기' }));
    expect(push).toHaveBeenCalledWith('/payment');
  });
});
