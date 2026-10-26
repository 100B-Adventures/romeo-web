import apiClient from './client';

export const AI_CONSENT_NOTICE_VERSION = 'ai-recommendation-v2-2026-10-07';
export const AI_CONSENT_CANONICAL_NOTICE = `Romeo는 오늘의 상대 선정과 추천 이유 생성을 위해 OpenAI의 AI를 이용할 수 있습니다.
전송 정보는 공통 취미, 생활권, MBTI, 결혼 계획, 자녀 계획, 음주 여부, 흡연 여부이며,
이름, 연락처, 사진, 정확한 위치, 직업, 회사, 소득, 자산, 인증 자료 및 민감정보는 보내지 않습니다.
동의하지 않거나 철회해도 규칙 추천을 계속 이용할 수 있습니다.\n`;

const ANTHROPIC_NOTICE_VERSION = 'ai-recommendation-v1-2026-10-03';
const ANTHROPIC_CANONICAL_NOTICE = `Romeo는 오늘의 상대 선정과 추천 이유 생성을 위해 Anthropic AI를 이용할 수 있습니다.
전송 정보는 공통 취미, 생활권, MBTI, 결혼 계획, 자녀 계획, 음주 여부, 흡연 여부이며,
이름, 연락처, 사진, 정확한 위치, 직업, 회사, 소득, 자산, 인증 자료 및 민감정보는 보내지 않습니다.
동의하지 않거나 철회해도 규칙 추천을 계속 이용할 수 있습니다.\n`;

export function aiConsentNotice(provider?: string) {
  if (provider === 'ANTHROPIC') {
    return {
      providerName: 'Anthropic PBC',
      version: ANTHROPIC_NOTICE_VERSION,
      canonicalNotice: ANTHROPIC_CANONICAL_NOTICE,
    };
  }
  return {
    providerName: 'OpenAI, L.L.C.',
    version: AI_CONSENT_NOTICE_VERSION,
    canonicalNotice: AI_CONSENT_CANONICAL_NOTICE,
  };
}

export type AiConsentStatus =
  | 'NOT_DECIDED'
  | 'GRANTED'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'RECONSENT_REQUIRED';

export interface AiConsentState {
  feature: 'RECOMMENDATION_SELECTION';
  provider: string;
  noticeVersion: string;
  status: AiConsentStatus;
  decidedAt: string | null;
  withdrawnAt: string | null;
  ruleRecommendationAvailable: boolean;
}

export type AiConsentDecision = 'GRANTED' | 'DECLINED';

const ENDPOINT = '/privacy/ai-consents/recommendation-selection';

export function createAiConsentIdempotencyKey(): string {
  return `ai-consent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function headers(idempotencyKey: string) {
  return {
    'Idempotency-Key': idempotencyKey,
    'X-Client-Surface': 'WEB',
  };
}

export function requiresAiConsentDecision(status: AiConsentStatus): boolean {
  return status === 'NOT_DECIDED' || status === 'RECONSENT_REQUIRED';
}

export function safeAiConsentReturnTo(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : '/home';
}

export const aiConsentApi = {
  async getState(): Promise<AiConsentState> {
    const response = await apiClient.get<AiConsentState>(ENDPOINT);
    return response.data;
  },

  async decide(decision: AiConsentDecision, noticeVersion: string, idempotencyKey: string): Promise<AiConsentState> {
    const response = await apiClient.put<AiConsentState>(
      ENDPOINT,
      { decision, noticeVersion },
      { headers: headers(idempotencyKey) },
    );
    return response.data;
  },

  async withdraw(idempotencyKey: string): Promise<AiConsentState> {
    const response = await apiClient.delete<AiConsentState>(ENDPOINT, { headers: headers(idempotencyKey) });
    return response.data;
  },
};
