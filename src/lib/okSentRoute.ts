import type { LikeResponse } from '@/lib/api/matching';

/**
 * URL에는 관계 식별자만 남긴다. 닉네임과 서명된 사진 URL은 분석 로그와
 * 브라우저 기록으로 새지 않게 결과 화면이 소유권 검증 단건 API에서 다시 읽는다.
 */
export function buildOkSentHref(
  response: Pick<LikeResponse, 'likeId'>,
): string {
  const likeId = Number(response.likeId);
  if (!Number.isFinite(likeId) || likeId <= 0) {
    throw new Error('OK 전송 결과 식별자가 올바르지 않습니다.');
  }

  const params = new URLSearchParams({ likeId: String(likeId) });
  return `/ok-sent?${params.toString()}`;
}

export function remainingUntil(expiresAt: string | null | undefined, now = Date.now()): number {
  const raw = expiresAt ?? '';
  const deadline = Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw}+09:00`);
  return Number.isFinite(deadline) ? Math.max(0, deadline - now) : 0;
}
