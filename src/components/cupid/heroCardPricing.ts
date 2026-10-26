// 오늘의 한 분 카드의 OK/슈퍼OK 비용 표기.
//
// 요금은 매칭 전/후 × 성별 4조합으로 갈린다(회장 결정 18·19·29, V86).
// 화면에 숫자를 고정하지 말고 /me/pricing 조회 결과만 그려야 한다는 계약을
// 컴포넌트 렌더 트리 밖으로 뽑아 단위 테스트로 고정한다.
import type { CurrentPricingResponse } from '@/lib/api/pricing';

export function costPillLabel(
  pricing: CurrentPricingResponse | null,
  kind: 'OK' | 'SUPER_OK',
): string | null {
  if (!pricing) return null;
  return kind === 'OK' ? `♥${pricing.okSendCost}` : `♥${pricing.superOkSendCost}`;
}
