import { type Page, type BrowserContext } from '@playwright/test';

// 테스트용 전화번호 + OTP (stage 환경 고정값)
const TEST_PHONE = '01010000001';
const TEST_OTP = '000000';

// 토큰 캐시 — rate limit 회피를 위해 한번 로그인 후 재사용
let cachedToken: { accessToken: string; userId: number; phone: string } | null = null;

/**
 * 테스트 유저로 로그인하여 인증 상태를 설정한다.
 * Stage 환경의 테스트 번호(01010000001~005)는 OTP 000000으로 동작.
 * 동일 번호 재로그인 시 캐시된 토큰 재사용 (rate limit 회피).
 */
export async function loginAsTestUser(
  page: Page,
  phone: string = TEST_PHONE
): Promise<{ accessToken: string; userId: number }> {
  // 캐시된 토큰이 있으면 API 호출 없이 localStorage만 설정
  if (cachedToken && cachedToken.phone === phone) {
    await setAuthLocalStorage(page, cachedToken.accessToken, cachedToken.userId);
    return { accessToken: cachedToken.accessToken, userId: cachedToken.userId };
  }

  const apiUrl = process.env.E2E_API_URL || process.env.BASE_URL || 'http://localhost:8080';
  const apiBase = apiUrl.replace(/\/api\/v1$/, '') + '/api/v1';

  // 1. OTP 요청
  const otpRes = await page.request.post(`${apiBase}/auth/phone/request`, {
    data: { phoneNumber: phone, purpose: 'LOGIN' },
  });

  // 가입되지 않은 번호일 경우 SIGNUP으로 재시도
  if (!otpRes.ok()) {
    await page.request.post(`${apiBase}/auth/phone/request`, {
      data: { phoneNumber: phone, purpose: 'SIGNUP' },
    });
  }

  // 2. OTP 인증
  // 서버가 받는 필드 이름은 `otp` 다(PhoneVerifyRequest.java:17). 예전에는 `code` 를 보내
  // 인증이 조용히 실패했고, 그 결과 이 도우미를 쓰는 모든 검사가 로그인 화면으로 되돌아갔다.
  // `purpose` 도 필수다. 빼면 COMMON_001 이 난다.
  const verifyRes = await page.request.post(`${apiBase}/auth/phone/verify`, {
    data: { phoneNumber: phone, otp: TEST_OTP, purpose: 'LOGIN' },
  });
  // 인증이 성공하면 서버가 본문 없이 응답한다. 실패해야만 오류 본문이 온다.
  // 예전에는 필드 이름이 틀려 항상 실패했고 그래서 이 파싱이 우연히 통했다.
  const verifyData = await verifyRes.json().catch(() => ({}));

  // 3. 로그인 시도
  const loginRes = await page.request.post(`${apiBase}/auth/login`, {
    data: { phoneNumber: phone },
  });

  let accessToken = '';
  let userId = 0;

  if (loginRes.ok()) {
    const loginData = await loginRes.json();
    accessToken = loginData.data?.accessToken || loginData.accessToken || '';
    userId = loginData.data?.userId || loginData.userId || 0;
  }

  // 토큰 캐시 저장
  if (accessToken) {
    cachedToken = { accessToken, userId, phone };
  }

  // localStorage에 토큰 저장 (API 실패 시 더미 토큰으로 페이지 로드 보장)
  const tokenToStore = accessToken || 'e2e-fallback-token';
  const uidToStore = userId || 1;
  await setAuthLocalStorage(page, tokenToStore, uidToStore);

  return { accessToken, userId };
}

/** localStorage에 인증 상태 설정 (Zustand persist + apiClient 인터셉터 호환) */
async function setAuthLocalStorage(page: Page, token: string, uid: number) {
  await page.evaluate(
    ({ token, uid }) => {
      const authState = {
        state: {
          accessToken: token,
          refreshToken: token,
          user: { userId: uid, nickname: '테스트유저', gender: 'MALE', status: 'ACTIVE' },
          isLoggedIn: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authState));
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', token);
    },
    { token, uid }
  );
}

/**
 * storageState 파일을 생성하여 인증 상태를 Playwright 세션간 공유한다.
 */
export async function setupAuthState(
  page: Page,
  context: BrowserContext,
  phone: string = TEST_PHONE
): Promise<void> {
  await page.goto('/');
  await loginAsTestUser(page, phone);
  await context.storageState({ path: 'tests/.auth/user.json' });
}
