import type { IdentityStatusResponse, IdentityVerificationStatus } from './api/auth';

export const WEB_IDV_REQUIRED_TERMS = [
  'PRIVACY_COLLECTION',
  'UNIQUE_IDENTIFIER',
  'CARRIER_IDENTITY_TERMS',
  'PROVIDER_DATA_SHARING',
] as const;

/**
 * 외부 본인확인 창은 빌드 시 명시된 사업자 호스트만 연다.
 * 계약 사업자가 아직 설정되지 않은 환경은 빈 허용목록으로 fail-closed 한다.
 */
export function trustedIdentityHandoff(handoff?: string): string | undefined {
  if (!handoff) return undefined;

  const allowedHosts = new Set(
    (process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

  try {
    const target = new URL(handoff);
    if (target.protocol !== 'https:' || target.username || target.password) return undefined;
    if (!allowedHosts.has(target.host.toLowerCase())) return undefined;
    return target.toString();
  } catch {
    return undefined;
  }
}

/**
 * 서버 계약은 필수 약관의 부분집합이 아니라 정확히 같은 집합을 요구한다.
 * 중복으로 개수만 맞추거나, 알 수 없는 약관을 끼워 넣는 요청도 거절한다.
 */
export function hasExactRequiredTerms(agreements: readonly string[]): boolean {
  if (agreements.length !== WEB_IDV_REQUIRED_TERMS.length) return false;
  const unique = new Set(agreements);
  return unique.size === WEB_IDV_REQUIRED_TERMS.length
    && WEB_IDV_REQUIRED_TERMS.every((term) => unique.has(term));
}

/** ISO 8601 문자열의 오프셋을 보존해 절대 시각으로 비교한다. */
export function identitySecondsRemaining(expiresAt: string, nowMs = Date.now()): number {
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return 0;
  return Math.max(0, Math.ceil((expiresMs - nowMs) / 1000));
}

export function formatIdentityCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export type IdentityView = 'progress' | 'result' | 'blocked';

export function viewForIdentityStatus(status: IdentityVerificationStatus): IdentityView {
  if (status === 'UNDERAGE') return 'blocked';
  if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'EXPIRED' || status === 'CONSUMED') {
    return 'result';
  }
  return 'progress';
}

export function canRetryIdentityVerification(result: IdentityStatusResponse): boolean {
  return result.status === 'FAILED' && result.retryAllowed;
}

/** 같은 세션 재호출로 복구할 수 없고 새 세션과 통신사 선택부터 시작해야 하는 결과다. */
export function shouldRestartIdentityVerification(result: IdentityStatusResponse): boolean {
  return result.status === 'EXPIRED' || result.failureCode === 'CARRIER_MISMATCH';
}
