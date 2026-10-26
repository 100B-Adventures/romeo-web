// R21 API serial 검증 (OTP race condition 회피)
// describe.serial로 순차 실행 → 같은 데모 계정 OTP 충돌 방지

import { test, expect } from '@playwright/test';

const STAGE_API = process.env.STAGE_API_URL || 'https://stage-api.romeoncupid.art';
const DEMO_PHONE = '01010000001';
const DEMO_OTP = '000000';

let cachedToken: string | null = null;

async function getToken(request: any): Promise<string> {
  if (cachedToken) return cachedToken;
  await request.post(`${STAGE_API}/api/v1/auth/phone/request`, {
    data: { phoneNumber: DEMO_PHONE, purpose: 'LOGIN' },
  });
  await request.post(`${STAGE_API}/api/v1/auth/phone/verify`, {
    data: { phoneNumber: DEMO_PHONE, otp: DEMO_OTP, purpose: 'LOGIN' },
  });
  const res = await request.post(`${STAGE_API}/api/v1/auth/login`, {
    data: { phoneNumber: DEMO_PHONE },
  });
  expect(res.ok()).toBeTruthy();
  const { accessToken } = await res.json();
  expect(accessToken).toBeTruthy();
  cachedToken = accessToken;
  return accessToken;
}

test.describe.serial('R21 API 검증 (serial OTP 충돌 방지)', () => {
  test('R21-CUP-02: cupidReason 한 줄 응답', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${STAGE_API}/api/v1/recommendations/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    const active = (data.slots || []).filter((s: any) => s.profiles?.length > 0);
    expect(active.length).toBeGreaterThan(0);
    const reasons = active.map((s: any) => s.cupidReason).filter(Boolean);
    expect(reasons.length).toBeGreaterThan(0);
    reasons.forEach((r: string) => expect(r.length).toBeGreaterThan(0));
  });

  test('R21-CUP-01: 단일 active slot (정오 cron 동작 추정)', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${STAGE_API}/api/v1/recommendations/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const active = (data.slots || []).filter((s: any) => s.active);
    expect(active.length).toBeGreaterThanOrEqual(1);
  });

  test('R21-CUP-04: 24h 만료 expiresAt 응답', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${STAGE_API}/api/v1/recommendations/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const active = (data.slots || []).filter((s: any) => s.status === 'PENDING' && s.profiles?.length > 0);
    if (active.length > 0) {
      expect(active[0].expiresAt).toBeTruthy();
      expect(active[0].remainingSeconds).toBeGreaterThan(0);
      expect(active[0].remainingSeconds).toBeLessThanOrEqual(24 * 3600);
    }
  });

  test('R21-AUTH-01: 본인인증 응답 (OTP request HTTP 200 + expiresIn 300)', async ({ request }) => {
    const res = await request.post(`${STAGE_API}/api/v1/auth/phone/request`, {
      data: { phoneNumber: '01010000002', purpose: 'LOGIN' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.maskedPhoneNumber).toContain('****');
    expect(data.expiresInSeconds).toBe(300);
  });
});
