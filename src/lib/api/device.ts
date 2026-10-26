import apiClient from './client';

// 디바이스 토큰 플랫폼 타입
export type DeviceTokenPlatform = 'ANDROID' | 'IOS' | 'WEB';

// 디바이스 토큰 등록 요청 인터페이스
export interface DeviceTokenRequest {
  token: string;
  platform: DeviceTokenPlatform;
}

export const deviceApi = {
  // 디바이스 토큰 등록 (FCM 푸시 알림용)
  registerToken: async (data: DeviceTokenRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/device-tokens', data);
    return response.data;
  },

  // 디바이스 토큰 삭제 (로그아웃 시 등)
  unregisterToken: async (token: string): Promise<void> => {
    await apiClient.delete('/device-tokens', {
      params: { token },
    });
  },
};
