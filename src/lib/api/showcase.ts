import apiClient from './client';

// 쇼케이스 프로필 응답 타입 (백엔드 ShowcaseProfileDto 매칭)
export interface ShowcaseProfile {
  id: number;
  nickname: string;
  ageRange: string;
  occupation: string;
  region: string;
  bio: string;
  appealImageUrl: string | null;
}

// ApiResponse 래퍼 타입
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const showcaseApi = {
  // 쇼케이스 프로필 목록 조회 (비로그인 허용)
  getProfiles: async (): Promise<ShowcaseProfile[]> => {
    const response = await apiClient.get<ApiResponse<ShowcaseProfile[]>>('/showcase/profiles');
    return response.data.data;
  },
};
