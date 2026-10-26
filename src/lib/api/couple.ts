import apiClient from './client';

// 커플 등록 상태 타입
export type CoupleStatusType = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

// 커플 등록 요청
export interface CoupleRegisterRequest {
  matchingId: number;
  story?: string;
}

// 커플 등록 응답
export interface CoupleRegisterResponse {
  message: string;
  status: CoupleStatusType;
}

// 커플 상태 조회 응답
export interface CoupleStatusResponse {
  isRegistered: boolean;
  bothRegistered: boolean;
  status: string;
}

// 커플 취소 응답
export interface CoupleCancelResponse {
  message: string;
}

export const coupleApi = {
  // 커플 등록 신청
  registerCouple: async (
    matchingId: number,
    story?: string
  ): Promise<CoupleRegisterResponse> => {
    const response = await apiClient.post('/couples/register', {
      matchingId,
      story,
    });
    return response.data;
  },

  // 커플 등록 취소 (해제)
  cancelCouple: async (matchingId: number): Promise<CoupleCancelResponse> => {
    const response = await apiClient.delete('/couples/cancel', {
      params: { matchingId },
    });
    return response.data;
  },

  // 커플 등록 상태 조회
  getCoupleStatus: async (
    matchingId: number
  ): Promise<CoupleStatusResponse> => {
    const response = await apiClient.get('/couples/status', {
      params: { matchingId },
    });
    return response.data;
  },
};
