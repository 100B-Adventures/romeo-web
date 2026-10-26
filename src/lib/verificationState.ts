type VerificationLike = {
  type: string;
  status: string;
};

/**
 * 서버 목록은 id 오름차순이다. 승인 이력이 있으면 그 행을 선택하고,
 * 없을 때만 마지막 행(최신 행)을 선택한다.
 */
export function selectVerificationItem<T extends VerificationLike>(
  verifications: T[],
  type: string,
): T | undefined {
  const sameType = verifications.filter((item) => item.type === type);
  return sameType.find((item) => item.status === 'APPROVED')
    ?? sameType[sameType.length - 1];
}
