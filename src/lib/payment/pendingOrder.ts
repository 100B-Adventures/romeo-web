export interface PendingTossOrder {
  ownerUserId: number;
  orderId: string;
  productId: string;
  amount: number | null;
  /** 예약 플래그가 꺼진 과도기 웹은 헤더 없는 confirm으로 승인한다. 미표기 기존 기록은 reserved-v2다. */
  protocol?: 'reserved-v2' | 'legacy';
  paymentKey?: string;
  /** 서버가 새 예약이 생성되지 않았다고 명시한 응답. 정리는 별도 본인 서버 조회가 필요하다. */
  rejectedCode?: 'PAYMENT_PENDING' | 'RESERVATION_DISABLED';
}

const STORAGE_PREFIX = 'romeo:pending-toss-order:v2:';
const storageKey = (ownerUserId: number) => `${STORAGE_PREFIX}${ownerUserId}`;

export function createTossOrderId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `RNC_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function readPendingTossOrder(ownerUserId: number): PendingTossOrder | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(ownerUserId));
    if (!raw) return null;
    const value = JSON.parse(raw) as PendingTossOrder;
    // 새 예약은 128-bit ID지만, 이미 발급된 구웹 RNC_<상품>_<시각>_<난수>도 복구해야 한다.
    if (value.ownerUserId !== ownerUserId || !/^RNC_[A-Za-z0-9_-]{1,96}$/.test(value.orderId)
      || typeof value.productId !== 'string'
      || (value.protocol !== undefined && value.protocol !== 'reserved-v2' && value.protocol !== 'legacy')
      || (value.amount !== null && (!Number.isSafeInteger(value.amount) || value.amount <= 0)))
      return null;
    return value;
  } catch {
    return null;
  }
}

export function findPendingTossOrder(orderId: string): PendingTossOrder | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const owner = Number(key.slice(STORAGE_PREFIX.length));
      const order = readPendingTossOrder(owner);
      if (order?.orderId === orderId) return order;
    }
  } catch {
    return null;
  }
  return null;
}

export function savePendingTossOrder(order: PendingTossOrder): void {
  localStorage.setItem(storageKey(order.ownerUserId), JSON.stringify(order));
  if (readPendingTossOrder(order.ownerUserId)?.orderId !== order.orderId) {
    throw new Error('결제 복구 정보를 저장할 수 없습니다');
  }
}

export function clearPendingTossOrder(orderId: string): void {
  const order = findPendingTossOrder(orderId);
  if (!order) return;
  try {
    localStorage.removeItem(storageKey(order.ownerUserId));
  } catch {
    // 서버가 확정한 지급 결과는 브라우저 저장소 정리 실패로 되돌리지 않는다.
  }
}
