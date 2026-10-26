import apiClient from './client';

// 회원의 성별·매칭 등급이 반영된 행동 요금 조회 (회장 결정 18·19·29, V86).
// 요금은 매칭 전/후 × 성별로 4갈래로 갈리므로 화면에 숫자를 고정하지 않는다.
// mobile/src/lib/api/payment.ts의 CurrentPricingResponse와 동일 계약.
export interface CurrentPricingResponse {
  tier: 'BASE' | 'POST_MATCH';
  gender: 'MALE' | 'FEMALE';
  okSendCost: number;
  superOkSendCost: number;
  acceptCost: number;
  pricingVersion: string;
}

export const pricingApi = {
  getCurrentPricing: (): Promise<CurrentPricingResponse> =>
    apiClient.get('/me/pricing').then((r) => r.data),
};
