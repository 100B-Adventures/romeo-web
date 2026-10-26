import {
  expect,
  type APIRequestContext,
  type APIResponse,
  test,
} from '@playwright/test';
import { randomInt } from 'node:crypto';

const STAGE_API = 'https://stage-api.romeoncupid.art/api/v1';

const requiredAgreements = [
  'PRIVACY_COLLECTION',
  'UNIQUE_IDENTIFIER',
  'CARRIER_IDENTITY_TERMS',
  'PROVIDER_DATA_SHARING',
] as const;

type JsonObject = Record<string, unknown>;

function disposablePhone(tail: string): string {
  return `010${randomInt(1000, 9999)}${tail}`;
}

function disposableNickname(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${randomInt(100, 999)}`.slice(0, 30);
}

async function readJson(response: APIResponse): Promise<JsonObject> {
  try {
    return await response.json() as JsonObject;
  } catch {
    return {};
  }
}

function redact(body: JsonObject): JsonObject {
  const redacted = { ...body };
  for (const key of ['accessToken', 'refreshToken', 'signupTicket']) {
    const value = redacted[key];
    if (typeof value === 'string') {
      redacted[key] = { present: true, length: value.length };
    }
  }
  return redacted;
}

async function stagePost(
  request: APIRequestContext,
  path: string,
  data: JsonObject,
  label: string,
): Promise<{ response: APIResponse; body: JsonObject }> {
  const response = await request.post(`${STAGE_API}${path}`, { data });
  const body = await readJson(response);
  console.log(`[stage-response] ${label} HTTP ${response.status()} ${JSON.stringify(redact(body))}`);
  return { response, body };
}

async function stageGet(
  request: APIRequestContext,
  path: string,
  label: string,
): Promise<{ response: APIResponse; body: JsonObject }> {
  const response = await request.get(`${STAGE_API}${path}`);
  const body = await readJson(response);
  console.log(`[stage-response] ${label} HTTP ${response.status()} ${JSON.stringify(redact(body))}`);
  return { response, body };
}

async function startIdentityVerification(
  request: APIRequestContext,
  phoneNumber: string,
): Promise<string> {
  const loginStart = await stagePost(
    request,
    '/auth/login/start',
    { phoneNumber },
    'login-start',
  );
  expect(loginStart.response.status()).toBe(200);
  expect(loginStart.body.accountState).toBe('NEW');
  expect(loginStart.body.nextStep).toBe('IDV');
  expect(loginStart.body).not.toHaveProperty('accessToken');
  expect(loginStart.body).not.toHaveProperty('refreshToken');

  const idvSession = loginStart.body.idvSession as JsonObject;
  const idvSessionId = idvSession.idvSessionId;
  expect(typeof idvSessionId).toBe('string');

  const start = await stagePost(
    request,
    `/auth/idv/${idvSessionId}/start`,
    { carrier: 'SKT', agreements: requiredAgreements },
    'idv-start',
  );
  expect(start.response.status()).toBe(202);
  expect(start.body.status).toBe('PENDING');

  return idvSessionId as string;
}

test.describe.serial('V10-WEB-IDV stage 실제 서버 보안 E2E', () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(60_000);

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'stage 상태 변경 E2E는 한 프로젝트에서 한 번만 실행한다');
  });

  test('TC-AUTH-ADULT-STAGE-001 본인확인 미완료 번호는 토큰 엔드포인트를 직접 호출해도 토큰이 없다', async ({ request }) => {
    const phoneNumber = disposablePhone('0201');

    const loginStart = await stagePost(
      request,
      '/auth/login/start',
      { phoneNumber },
      'adult-missing-login-start',
    );
    expect(loginStart.response.status()).toBe(200);
    expect(loginStart.body.accountState).toBe('NEW');
    expect(loginStart.body.nextStep).toBe('IDV');

    const directLogin = await stagePost(
      request,
      '/auth/login',
      { phoneNumber, verificationCode: '000000' },
      'adult-missing-direct-login',
    );
    expect(directLogin.response.status()).toBeGreaterThanOrEqual(400);
    expect(directLogin.body).not.toHaveProperty('accessToken');
    expect(directLogin.body).not.toHaveProperty('refreshToken');
  });

  test('TC-IDV-UNDERAGE-STAGE-001 미성년 결과와 재진입 차단이 stage DB 경계를 왕복한다', async ({ request }) => {
    const phoneNumber = disposablePhone('0119');
    const idvSessionId = await startIdentityVerification(request, phoneNumber);

    const status = await stageGet(request, `/auth/idv/${idvSessionId}`, 'idv-underage-status');
    expect(status.response.status()).toBe(200);
    expect(status.body.status).toBe('UNDERAGE');
    expect(status.body.adult).toBe(false);
    expect(status.body.signupTicket).toBeNull();
    expect((status.body.block as JsonObject).reason).toBe('UNDERAGE');

    const blocked = await stagePost(
      request,
      '/auth/login/start',
      { phoneNumber },
      'idv-underage-reentry',
    );
    expect(blocked.response.status()).toBe(200);
    expect(blocked.body.accountState).toBe('BLOCKED_UNDERAGE');
    expect(blocked.body.nextStep).toBe('BLOCKED');
    expect(blocked.body.idvSession).toBeNull();
    expect(blocked.body.smsChallenge).toBeNull();
    expect(blocked.body).not.toHaveProperty('accessToken');
    expect(blocked.body).not.toHaveProperty('refreshToken');
  });

  test('TC-IDV-TICKET-STAGE-001 가입 표는 첫 가입에서만 소비되고 두 번째 요청은 토큰이 없다', async ({ request }) => {
    const phoneNumber = disposablePhone('0202');
    const idvSessionId = await startIdentityVerification(request, phoneNumber);
    const status = await stageGet(request, `/auth/idv/${idvSessionId}`, 'idv-adult-status');
    expect(status.response.status()).toBe(200);
    expect(status.body.status).toBe('SUCCEEDED');
    expect(status.body.adult).toBe(true);
    expect(typeof status.body.signupTicket).toBe('string');

    const signupTicket = status.body.signupTicket as string;
    const firstSignup = await stagePost(
      request,
      '/auth/signup',
      {
        phoneNumber,
        signupTicket,
        gender: 'FEMALE',
        nickname: disposableNickname('qa-idv-a-'),
      },
      'signup-ticket-first-use',
    );
    expect(firstSignup.response.status()).toBe(200);
    expect(typeof firstSignup.body.accessToken).toBe('string');
    expect(typeof firstSignup.body.refreshToken).toBe('string');

    try {
      const secondSignup = await stagePost(
        request,
        '/auth/signup',
        {
          phoneNumber,
          signupTicket,
          gender: 'FEMALE',
          nickname: disposableNickname('qa-idv-b-'),
        },
        'signup-ticket-second-use',
      );
      expect(secondSignup.response.status()).toBeGreaterThanOrEqual(400);
      expect(secondSignup.body).not.toHaveProperty('accessToken');
      expect(secondSignup.body).not.toHaveProperty('refreshToken');
    } finally {
      const cleanup = await request.delete(`${STAGE_API}/auth/account`, {
        headers: { Authorization: `Bearer ${firstSignup.body.accessToken as string}` },
      });
      const cleanupBody = await readJson(cleanup);
      console.log(`[stage-response] cleanup-account HTTP ${cleanup.status()} ${JSON.stringify(redact(cleanupBody))}`);
      expect(cleanup.status()).toBe(200);
    }
  });
});
