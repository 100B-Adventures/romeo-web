import apiClient from './client';
import { trustedIdentityHandoff } from '../identityVerification';

export { trustedIdentityHandoff } from '../identityVerification';

export interface SignupRequest {
  phoneNumber: string;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  // D2(2026-10-12): 출시 자기신고 경로는 출생연도를 저장하고, PASS 도입 뒤에는 provider 값이 우선한다.
  birthYear?: number;
  // v14 C20 · 결정 33: 통신사 본인확인 성공 세션이 발급한 1회용 가입 표.
  // 있으면 서버가 성인 확인을 이 표로 대신한다(모바일 SignupRequest와 계약 동일).
  signupTicket?: string;
  adultDeclaration?: AdultDeclaration;
}

export interface AdultDeclaration {
  confirmedNineteenOrOlder: true;
  version: 'adult-self-declaration-v1';
}

// 06a~06d 통신사 본인확인 (FRD v16 §14 · 결정 25·33·38·39). 모바일
// mobile/src/lib/api/auth.ts 와 계약 동일. 상태 이름·필드를 그대로 옮긴다.
export type IdentityCarrier = 'SKT' | 'KT' | 'LGU' | 'MVNO';
export type IdentityVerificationStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'UNDERAGE'
  | 'FAILED'
  | 'EXPIRED'
  | 'CONSUMED';

export interface IdentityStartResponse {
  status: 'PENDING';
  pollAfterMs: number;
  // 서버가 ISO 8601 +09:00 오프셋으로 내려준다. 기기 현지 시각으로 재해석하지 말고
  // new Date(expiresAt) 에 원문 그대로 넣는다.
  expiresAt: string;
  handoff?: string;
}

// 기획서 v4.8.0 AC-64a: 실패 사유를 일시·구조·미상으로 가른다.
export type IdentityFailureCategory = 'TEMPORARY' | 'STRUCTURAL' | 'UNKNOWN';

export interface IdentityBlockInfo {
  reason: string;
  adultAt: string | null;
  /** 문장은 서버가 만든다. 클라이언트가 날짜로 조립하면 null 분기에서 깨진다 */
  message: string;
}

export interface IdentityStatusResponse {
  status: IdentityVerificationStatus;
  adult: boolean | null;
  failureCode: string | null;
  failureCategory: IdentityFailureCategory | null;
  failureMessage: string | null;
  failureNextAction: string | null;
  retryCount: number;
  retryAllowed: boolean;
  signupTicket: string | null;
  carrier?: IdentityCarrier;
  block?: IdentityBlockInfo | null;
}

export interface IdentityRetryResponse {
  status: 'PENDING';
  attemptNo: number;
  /** 새 인증 시도의 폴링·만료 계약. 구버전 서버 응답과의 전환기에는 없을 수 있다. */
  pollAfterMs?: number;
  expiresAt?: string;
  handoff?: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  role: 'USER' | 'ADMIN' | 'OPERATOR';
  status: string;
  profilePhoto?: string;
  adultDeclarationRequired: boolean;
}

// FRD v16 §14.2: 전화번호 하나로 가입 경로인지 재로그인 경로인지 서버가 판정한다.
// 이 분기가 웹에는 없어서, 웹은 새로 오신 분에게도 옛 가입 문자 인증을 그대로 태웠다.
// 문자 인증 경로도 출생연도와 만 19세 이상 선언을 서버가 함께 검증한다.
export type AccountState = 'NEW' | 'EXISTING' | 'IDV_INCOMPLETE' | 'SUSPENDED' | 'BLOCKED_UNDERAGE';
export type LoginNextStep = 'IDV' | 'SMS_CODE' | 'BLOCKED';

export interface LoginStartResponse {
  accountState: AccountState;
  nextStep: LoginNextStep;
  idvSession: { idvSessionId: string; expiresAt: string; carriers: IdentityCarrier[] } | null;
  smsChallenge: { maskedPhoneNumber: string; expiresInSeconds: number; resendAvailableAfterSeconds: number } | null;
  block: { message?: string; adultAt?: string | null } | null;
  adultDeclarationRequired: boolean;
}

export const authApi = {
  /** 가입·재로그인 갈림길 판정. 웹도 문자를 보내기 전에 반드시 이걸 먼저 묻는다. */
  loginStart: async (phoneNumber: string): Promise<LoginStartResponse> => {
    const response = await apiClient.post('/auth/login/start', { phoneNumber });
    return response.data;
  },

  requestPhoneVerification: async (phoneNumber: string, purpose: 'SIGNUP' | 'LOGIN') => {
    const response = await apiClient.post('/auth/phone/request', {
      phoneNumber,
      purpose,
    });
    return response.data;
  },

  verifyPhone: async (phoneNumber: string, otp: string, purpose: 'SIGNUP' | 'LOGIN') => {
    const response = await apiClient.post('/auth/phone/verify', {
      phoneNumber,
      otp,
      purpose,
    });
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<AuthTokensResponse> => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  startIdentityVerification: async (
    idvSessionId: string,
    carrier: IdentityCarrier,
    agreements: string[],
  ): Promise<IdentityStartResponse> => {
    const response = await apiClient.post(`/auth/idv/${idvSessionId}/start`, {
      carrier,
      agreements,
    });
    return {
      ...response.data,
      handoff: trustedIdentityHandoff(response.data.handoff),
    };
  },

  getIdentityVerification: async (idvSessionId: string): Promise<IdentityStatusResponse> => {
    const response = await apiClient.get(`/auth/idv/${idvSessionId}`);
    return response.data;
  },

  retryIdentityVerification: async (idvSessionId: string): Promise<IdentityRetryResponse> => {
    const response = await apiClient.post(`/auth/idv/${idvSessionId}/retry`);
    return {
      ...response.data,
      handoff: trustedIdentityHandoff(response.data.handoff),
    };
  },

  login: async (
    phoneNumber: string,
    declaration?: { birthYear: number; adultDeclaration: AdultDeclaration },
  ): Promise<AuthTokensResponse> => {
    const response = await apiClient.post('/auth/login', {
      phoneNumber,
      ...declaration,
    });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', {
      refreshToken,
    });
  },
};
