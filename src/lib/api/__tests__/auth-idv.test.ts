import apiClient from '../client';
import { authApi, trustedIdentityHandoff } from '../auth';

jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('V10-WEB-IDV-API 본인확인 API 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS = 'verify.contract.test,verify.contract.test:8443';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS;
  });

  it('V10-WEB-IDV-API-01 정상: 세션 경로에 통신사와 필수 약관을 보낸다', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: 'PENDING' } });

    await authApi.startIdentityVerification('session-1', 'SKT', ['A', 'B', 'C', 'D']);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/idv/session-1/start', {
      carrier: 'SKT',
      agreements: ['A', 'B', 'C', 'D'],
    });
  });

  it('V10-WEB-IDV-API-02 경계: 상태 폴링은 사업자 시작 API를 다시 호출하지 않는다', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { status: 'PENDING' } });

    await authApi.getIdentityVerification('session-1');

    expect(apiClient.get).toHaveBeenCalledWith('/auth/idv/session-1');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('V10-WEB-IDV-API-03 거절 후 재시도: 같은 세션의 retry 경로만 호출한다', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        status: 'PENDING',
        attemptNo: 2,
        pollAfterMs: 2000,
        expiresAt: '2026-09-04T12:03:00+09:00',
      },
    });

    await authApi.retryIdentityVerification('session-1');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/idv/session-1/retry');
  });

  it('P0-WEB-IDV-HOST-01 정상: 계약된 HTTPS 호스트의 handoff만 보존한다', () => {
    expect(trustedIdentityHandoff('https://verify.contract.test/session/1')).toBe('https://verify.contract.test/session/1');
    expect(trustedIdentityHandoff('https://verify.contract.test:8443/session/2')).toBe('https://verify.contract.test:8443/session/2');
  });

  it('P0-WEB-IDV-HOST-02 거절: 허용목록 밖 호스트와 HTTP 및 사용자정보 URL을 제거한다', async () => {
    expect(trustedIdentityHandoff('https://verify.contract.test.attacker.example/session')).toBeUndefined();
    expect(trustedIdentityHandoff('http://verify.contract.test/session')).toBeUndefined();
    expect(trustedIdentityHandoff('https://verify.contract.test@attacker.example/session')).toBeUndefined();

    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { status: 'PENDING', pollAfterMs: 2000, expiresAt: '2026-09-04T12:00:00+09:00', handoff: 'https://attacker.example/idv' },
    });

    await expect(authApi.startIdentityVerification('session-1', 'SKT', ['A', 'B', 'C', 'D']))
      .resolves.toMatchObject({ handoff: undefined });
    await expect(authApi.retryIdentityVerification('session-1'))
      .resolves.toMatchObject({ handoff: undefined });
  });

  it('P0-WEB-IDV-HOST-03 거절: 허용목록이 비거나 쉼표와 공백뿐이면 모든 handoff를 제거한다', () => {
    process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS = '';
    expect(trustedIdentityHandoff('https://verify.contract.test/session/1')).toBeUndefined();

    process.env.NEXT_PUBLIC_IDV_ALLOWED_HOSTS = ' ,  , ';
    expect(trustedIdentityHandoff('https://verify.contract.test/session/2')).toBeUndefined();
  });
});
