import apiClient from '../client';
import { AI_CONSENT_NOTICE_VERSION, aiConsentApi, aiConsentNotice, requiresAiConsentDecision, safeAiConsentReturnTo } from '../aiConsent';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

describe('AI-AC-WEB 제3자 AI 동의 계약', () => {
  beforeEach(() => jest.clearAllMocks());

  it('AI-AC-WEB-01 정상 경로: 고지 버전과 선택을 WEB 표면으로 저장한다', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { status: 'GRANTED' } });

    await aiConsentApi.decide('GRANTED', AI_CONSENT_NOTICE_VERSION, 'stable-key');

    expect(apiClient.put).toHaveBeenCalledWith(
      '/privacy/ai-consents/recommendation-selection',
      { decision: 'GRANTED', noticeVersion: AI_CONSENT_NOTICE_VERSION },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'stable-key',
          'X-Client-Surface': 'WEB',
        }),
      }),
    );
  });

  it('AI-AC-WEB-02 거절 조건: 미결정과 재동의 필요만 추천 전 선택을 요구한다', () => {
    expect(requiresAiConsentDecision('NOT_DECIDED')).toBe(true);
    expect(requiresAiConsentDecision('RECONSENT_REQUIRED')).toBe(true);
    expect(requiresAiConsentDecision('DECLINED')).toBe(false);
    expect(requiresAiConsentDecision('WITHDRAWN')).toBe(false);
    expect(requiresAiConsentDecision('GRANTED')).toBe(false);
  });

  it('AI-AC-WEB-03 거절 조건: 외부·프로토콜 상대 경로는 홈으로 닫는다', () => {
    expect(safeAiConsentReturnTo('/home')).toBe('/home');
    expect(safeAiConsentReturnTo('https://evil.example')).toBe('/home');
    expect(safeAiConsentReturnTo('//evil.example')).toBe('/home');
    expect(safeAiConsentReturnTo('/\\evil.example')).toBe('/home');
  });

  it('AI-AC-WEB-04 경계값: 서버가 알린 고지 버전과 같은 액션 키를 그대로 보낸다', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { status: 'DECLINED' } });

    await aiConsentApi.decide('DECLINED', 'server-notice-v2', 'same-action-key');

    expect(apiClient.put).toHaveBeenCalledWith(
      '/privacy/ai-consents/recommendation-selection',
      { decision: 'DECLINED', noticeVersion: 'server-notice-v2' },
      expect.objectContaining({ headers: expect.objectContaining({ 'Idempotency-Key': 'same-action-key' }) }),
    );
  });

  it('AI-AC-WEB-05 철회 경로: DELETE에 WEB 표면과 액션 키를 보낸다', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { status: 'WITHDRAWN' } });

    await aiConsentApi.withdraw('withdraw-key');

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/privacy/ai-consents/recommendation-selection',
      { headers: { 'Idempotency-Key': 'withdraw-key', 'X-Client-Surface': 'WEB' } },
    );
  });

  it('AI-AC-WEB-06 제공자 롤백: 서버 provider에 맞는 별도 고지 버전과 법인을 선택한다', () => {
    expect(aiConsentNotice('OPENAI')).toMatchObject({
      providerName: 'OpenAI, L.L.C.', version: 'ai-recommendation-v2-2026-10-07',
    });
    expect(aiConsentNotice('ANTHROPIC')).toMatchObject({
      providerName: 'Anthropic PBC', version: 'ai-recommendation-v1-2026-10-03',
    });
  });
});
