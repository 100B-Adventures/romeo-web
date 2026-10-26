import apiClient from './client';

// 백엔드 ReportReason enum 과 일치
export type ReportReason = 'INAPPROPRIATE_CONTENT' | 'HARASSMENT' | 'FAKE_PROFILE' | 'SPAM' | 'OTHER';

export const safetyApi = {
  createReport: (data: { reportedUserId: number; reason: ReportReason; description?: string }) =>
    apiClient.post('/reports', data).then(r => r.data),
  getMyReports: (page = 0) =>
    apiClient.get(`/reports/mine?page=${page}&size=20`).then(r => r.data),
  blockUser: (userId: number) =>
    apiClient.post(`/blocks/${userId}`).then(r => r.data),
  unblockUser: (userId: number) =>
    apiClient.delete(`/blocks/${userId}`).then(r => r.data),
  getBlockedUsers: (page = 0) =>
    apiClient.get(`/blocks?page=${page}&size=20`).then(r => r.data),
};
