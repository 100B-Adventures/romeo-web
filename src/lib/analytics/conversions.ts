/**
 * 전환 이벤트: Meta 픽셀과 GA4 에 같은 전환을 한 번만 보낸다.
 * 픽셀·gtag 스크립트는 afterInteractive 로 늦게 뜨므로 없으면 잠시 기다렸다 보낸다.
 * 같은 전환은 브라우저 단위로 한 번만 나간다(새로고침·탭 재방문 포함). event id 와 transaction_id 는 각 매체의 중복 제거 키다.
 */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const RETRY_MS = 500;
const RETRY_MAX = 20;
const inMemory = new Set<string>();

function once(key: string): boolean {
  const storageKey = `romeo:conversion:${key}`;
  if (inMemory.has(storageKey)) return false;
  inMemory.add(storageKey);
  try {
    if (window.localStorage.getItem(storageKey) === '1') return false;
    window.localStorage.setItem(storageKey, '1');
  } catch {
    // 저장소가 막힌 환경은 메모리만으로 이 문서 안의 중복을 막는다.
  }
  return true;
}

function deliver(send: () => boolean, attempt = 0) {
  if (send() || attempt >= RETRY_MAX) return;
  window.setTimeout(() => deliver(send, attempt + 1), RETRY_MS);
}

function emit(
  eventId: string,
  meta: { name: string; params?: Record<string, unknown> },
  ga4: { name: string; params?: Record<string, unknown> },
) {
  if (typeof window === 'undefined' || !once(eventId)) return;
  deliver(() => {
    if (!window.fbq) return false;
    window.fbq('track', meta.name, meta.params ?? {}, { eventID: eventId });
    return true;
  });
  deliver(() => {
    if (!window.gtag) return false;
    window.gtag('event', ga4.name, ga4.params ?? {});
    return true;
  });
}

/** 회원가입 API 성공 직후 */
export function trackSignupComplete(userId: string | number) {
  const eventId = `signup:${userId}`;
  emit(eventId, { name: 'CompleteRegistration' }, { name: 'sign_up' });
}

/** 결제 완료. amount 는 서버 승인·주문 응답 값만 넘긴다(주소창 값 금지). */
export function trackPurchaseComplete(orderId: string, amount: number) {
  const eventId = `purchase:${orderId}`;
  const value = { value: amount, currency: 'KRW' };
  emit(eventId, { name: 'Purchase', params: value }, { name: 'purchase', params: { ...value, transaction_id: orderId } });
}
