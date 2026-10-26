import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiConsentPage from '../page';
import { aiConsentApi } from '@/lib/api/aiConsent';

const replace = jest.fn();
const back = jest.fn();
let query = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, back }),
  useSearchParams: () => query,
}));
jest.mock('@/lib/api/aiConsent', () => ({
  aiConsentNotice: (provider?: string) => provider === 'ANTHROPIC'
    ? { providerName: 'Anthropic PBC', version: 'ai-recommendation-v1-2026-10-03', canonicalNotice: 'Anthropic 기준 고지문' }
    : { providerName: 'OpenAI, L.L.C.', version: 'ai-recommendation-v2-2026-10-07', canonicalNotice: 'OpenAI 기준 고지문' },
  aiConsentApi: { getState: jest.fn(), decide: jest.fn(), withdraw: jest.fn() },
  createAiConsentIdempotencyKey: () => 'page-action-key',
  safeAiConsentReturnTo: (value: string | null) => value?.startsWith('/') && !value.startsWith('//') ? value : '/home',
}));

const consentState = (status: string) => ({
  feature: 'RECOMMENDATION_SELECTION',
  provider: 'OPENAI',
  noticeVersion: 'ai-recommendation-v2-2026-10-07',
  status,
  decidedAt: '2026-10-04T00:00:00Z',
  withdrawnAt: status === 'WITHDRAWN' ? '2026-10-04T01:00:00Z' : null,
  ruleRecommendationAvailable: true,
});

describe('제3자 AI 동의 전체 화면', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query = new URLSearchParams();
    (aiConsentApi.getState as jest.Mock).mockResolvedValue(consentState('NOT_DECIDED'));
  });

  it('AI-AC-WEB-06 정상 경로: 동의와 거절을 같은 전체 화면에서 제공하고 선택 뒤 홈으로 돌아간다', async () => {
    (aiConsentApi.decide as jest.Mock).mockResolvedValue(consentState('DECLINED'));
    render(<AiConsentPage />);

    expect(await screen.findByText('큐피드의 AI 추천을', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI 추천에 동의하고 계속' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '동의하지 않고 규칙 추천 이용' }));

    await waitFor(() => expect(aiConsentApi.decide).toHaveBeenCalledWith(
      'DECLINED',
      'ai-recommendation-v2-2026-10-07',
      'page-action-key',
    ));
    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('AI-AC-WEB-07 철회 경로: 설정에서 현재 상태를 보여주고 확인 뒤 DELETE를 호출한다', async () => {
    query = new URLSearchParams('mode=settings');
    (aiConsentApi.getState as jest.Mock).mockResolvedValue(consentState('GRANTED'));
    (aiConsentApi.withdraw as jest.Mock).mockResolvedValue(consentState('WITHDRAWN'));
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AiConsentPage />);

    expect(await screen.findByTestId('ai-consent-status-card')).toHaveTextContent('동의함');
    fireEvent.click(screen.getByRole('button', { name: 'AI 추천 동의 철회' }));
    await waitFor(() => expect(aiConsentApi.withdraw).toHaveBeenCalledWith('page-action-key'));
    expect(screen.getByTestId('ai-consent-status-card')).toHaveTextContent('철회함');
  });

  it('AI-AC-WEB-08 거절 조건: 상태 조회 실패 시 동의 결정을 노출하지 않고 재시도한다', async () => {
    (aiConsentApi.getState as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(consentState('NOT_DECIDED'));

    render(<AiConsentPage />);

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AI 추천에 동의하고 계속' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('button', { name: 'AI 추천에 동의하고 계속' })).toBeInTheDocument();
  });

  it('AI-AC-WEB-09 거절 조건: 앱이 모르는 고지 버전이면 선택 저장을 막는다', async () => {
    (aiConsentApi.getState as jest.Mock).mockResolvedValue({
      ...consentState('RECONSENT_REQUIRED'),
      noticeVersion: 'ai-recommendation-v2',
    });

    render(<AiConsentPage />);

    expect(await screen.findByTestId('ai-consent-update-required')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AI 추천에 동의하고 계속' })).not.toBeInTheDocument();
    expect(aiConsentApi.decide).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '규칙 추천 계속 이용' }));
    expect(replace).toHaveBeenCalledWith('/home?aiConsentFallback=rules');
  });

  it('AI-AC-WEB-10 재시도: 응답 유실 뒤 같은 멱등 키를 쓰고 성공 전에는 이동하지 않는다', async () => {
    (aiConsentApi.decide as jest.Mock)
      .mockRejectedValueOnce(new Error('response lost'))
      .mockResolvedValueOnce(consentState('DECLINED'));
    render(<AiConsentPage />);
    const decline = await screen.findByRole('button', { name: '동의하지 않고 규칙 추천 이용' });

    fireEvent.click(decline);
    expect(await screen.findByRole('alert')).toHaveTextContent('response lost');
    expect(replace).not.toHaveBeenCalled();
    fireEvent.click(decline);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/home'));
    expect((aiConsentApi.decide as jest.Mock).mock.calls).toEqual([
      ['DECLINED', 'ai-recommendation-v2-2026-10-07', 'page-action-key'],
      ['DECLINED', 'ai-recommendation-v2-2026-10-07', 'page-action-key'],
    ]);
  });
});
