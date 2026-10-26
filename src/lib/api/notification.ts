import apiClient from './client';

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  referenceId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  fcmEnabled: boolean;
  kakaoEnabled: boolean;
  emailEnabled: boolean;
}

export const notificationApi = {
  // 알림 목록 조회
  getNotifications: async (page: number = 0, size: number = 20) => {
    const response = await apiClient.get<{
      content: Notification[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>('/notifications', {
      params: { page, size },
    });
    return response.data;
  },

  // 읽지 않은 알림 수 조회
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  // 알림 읽음 처리
  markAsRead: async (notificationId: number): Promise<void> => {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  // 전체 읽음 처리
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },

  // 알림 설정 조회
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await apiClient.get<NotificationPreference>('/notifications/preferences');
    return response.data;
  },

  // 알림 설정 업데이트
  updatePreferences: async (preferences: NotificationPreference): Promise<NotificationPreference> => {
    const response = await apiClient.put<NotificationPreference>('/notifications/preferences', preferences);
    return response.data;
  },
};

