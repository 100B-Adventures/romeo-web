import apiClient from './client';

// ===== Types =====

export interface FunnelResponse {
  periodDays: number;
  signupCompleted: number;
  interviewCompleted: number;
  reviewApproved: number;
  firstRecommendation: number;
  okSent: number;
  matchCompleted: number;
  cardsShown: number;
  cardsViewed: number;
  likesSent: number;
  superLikesSent: number;
  matched: number;
  contactsRevealed: number;
  couplesRegistered: number;
}

export interface UserDiagnosisResponse {
  userId: number;
  nickname?: string;
  gender?: string;
  status?: string;
  profileCompleteness?: number;
  verifiedBadges?: string[];
  recommendationExposures: number;
  cardsViewed: number;
  receivedLikes: number;
  sentLikes: number;
  matches: number;
  contactReveals: number;
  coupleRegistrations: number;
  reason: string;
  reasonDetail: string;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  maleUsers: number;
  femaleUsers: number;
  pendingVerifications: number;
  totalMatchings: number;
  activeMatchings: number;
  coupleRegistrations: number;
  todaySignups: number;
  todayMatchings: number;
  // 관리자 매칭 현황 Phase 1
  todayLikes?: number;
  todaySuperLikes?: number;
  pendingReports?: number;
  todayPaidCount?: number;
  todayRevenue?: number;
}

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type Gender = 'MALE' | 'FEMALE';
export type UserRole = 'USER' | 'ADMIN';
export type VerificationType = 'IDENTITY' | 'EDUCATION' | 'INCOME' | 'CAREER' | 'RESIDENCE';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface UserListResponse {
  userId: number;
  phoneNumber: string;
  nickname: string;
  gender: Gender;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  createdAt: string;
}

export interface VerificationResponse {
  id: number;
  userId?: number;
  userNickname?: string;
  userPhoneNumber?: string;
  type: VerificationType;
  status: VerificationStatus;
  documentUrl: string | null;
  memo: string | null;
  reviewMemo: string | null;
  reviewerId: number | null;
  approvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ===== API =====

export const adminApi = {
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getFunnel: async (days: number = 7): Promise<FunnelResponse> => {
    const response = await apiClient.get('/admin/stats/funnel', { params: { days } });
    return response.data;
  },

  getUserDiagnosis: async (userId: number): Promise<UserDiagnosisResponse> => {
    const response = await apiClient.get(`/admin/users/${userId}/diagnosis`);
    return response.data;
  },

  getUsers: async (page: number = 0, size: number = 20): Promise<PageResponse<UserListResponse>> => {
    const response = await apiClient.get('/admin/users', {
      params: { page, size },
    });
    return response.data;
  },

  searchUsers: async (keyword: string, page: number = 0, size: number = 20): Promise<PageResponse<UserListResponse>> => {
    const response = await apiClient.get('/admin/users/search', {
      params: { keyword, page, size },
    });
    return response.data;
  },

  updateUserStatus: async (userId: number, status: UserStatus, reason?: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/status`, { status, reason });
  },

  deleteUser: async (userId: number, reason?: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`, {
      params: reason ? { reason } : undefined,
    });
  },

  getPendingVerifications: async (page: number = 0, size: number = 20): Promise<PageResponse<VerificationResponse>> => {
    const response = await apiClient.get('/admin/verifications/pending', {
      params: { page, size },
    });
    return response.data;
  },

  // status별 인증 목록 (반려/승인 뱃지 노출용). status 미지정 = 전체
  getVerifications: async (
    status?: VerificationStatus,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<VerificationResponse>> => {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const response = await apiClient.get('/admin/verifications', { params });
    return response.data;
  },

  reviewVerification: async (
    verificationId: number,
    status: VerificationStatus,
    memo: string,
    adminNote?: string
  ): Promise<VerificationResponse> => {
    const response = await apiClient.post(`/admin/verifications/${verificationId}/review`, {
      status,
      memo,
      adminNote,
    });
    return response.data;
  },

  getFemaleUsers: async (
    page: number = 0,
    size: number = 50,
    filters?: { keyword?: string; recent?: boolean; activeOnly?: boolean; receivedOkZero?: boolean },
  ): Promise<PageResponse<UserListResponse>> => {
    const response = await apiClient.get('/admin/users/female', {
      params: { page, size, ...filters },
    });
    return response.data;
  },

  // 회장 결정 44(2026-08-27): 벌크 좋아요 발신 계정은 남성 관리자 계정 하나로 고정한다.
  // 로그인한 운영자 자신의 ID가 아니라, 서버가 지정한 이 계정만 발신자가 될 수 있다.
  getBulkLikeSender: async (): Promise<UserListResponse> => {
    const response = await apiClient.get('/admin/bulk-likes/sender');
    return response.data;
  },

  // 회장 결정 52(2026-08-27, 2026-08-28 재확정): 대량 좋아요 계정당 하루 100명 상한.
  // "관리자 페이지 좋아요는 여성 한 명당 횟수 제한이 없다"는 것과 다른 층위 — 이건
  // 실수로 대상 명단이 잘못 잡혀 하루에 수천 명이 나가는 사고를 막는 안전장치다.
  getBulkLikeQuota: async (): Promise<BulkLikeQuotaResponse> => {
    const response = await apiClient.get('/admin/bulk-likes/quota');
    return response.data;
  },

  // 회장 결정 36(2026-08-27): 남성 관리자 계정 한 개가 여러 여성 회원에게 좋아요를 보낸다.
  // idempotencyKey: 2026-08-27 코드리뷰 지적 5 — 네트워크 재시도·더블클릭으로 같은 요청이
  // 두 번 나가도 서버가 재발송하지 않으려면 매 "사용자 조작 1회"마다 같은 키가 실려야 한다.
  // 호출 시점(브라우저 탭 하나가 버튼을 한 번 누른 순간)에 키를 발급해 재시도 때 재사용한다.
  sendBulkLikes: async (
    targetFemaleUserIds: number[],
    senderAdminUserId: number,
    likeType: 'OK' | 'SUPER_OK',
    idempotencyKey?: string
  ): Promise<BulkLikeResponse> => {
    const key =
      idempotencyKey ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `bulk-like-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const response = await apiClient.post('/admin/bulk-likes', {
      senderAdminUserId,
      targetFemaleUserIds,
      likeType,
      idempotencyKey: key,
    });
    return response.data;
  },

  // 신고 관리
  getReports: async (status?: string, page = 0, size = 20) => {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (status) params.status = status;
    const { data } = await apiClient.get('/admin/reports', { params });
    return data;
  },

  processReport: async (
    reportId: number,
    requestedAction: 'DISMISS' | 'WARN' | 'SUSPEND' | 'APPROVED' | 'REJECTED',
    adminNote?: string,
  ) => {
    // 구 관리자 화면의 상태 기반 호출은 기존 의미를 보존한다. APPROVED는 이용 정지,
    // REJECTED는 기각으로 번역하고, 신 관리자 화면은 명시적인 동작을 직접 보낸다.
    const action = requestedAction === 'APPROVED'
      ? 'SUSPEND'
      : requestedAction === 'REJECTED'
        ? 'DISMISS'
        : requestedAction;
    const params: Record<string, string> = { action };
    if (adminNote) params.adminNote = adminNote;
    const { data } = await apiClient.post(`/admin/reports/${reportId}/process`, null, { params });
    return data;
  },

  // 하트 관리
  getHeartBalance: async (userId: number) => {
    const { data } = await apiClient.get(`/admin/hearts/balance/${userId}`);
    return data;
  },

  issueHearts: async (userId: number, amount: number, description?: string) => {
    const { data } = await apiClient.post('/admin/hearts/issue', null, {
      params: { userId, amount, description: description || '관리자 보너스 지급' },
    });
    return data;
  },

  getHeartGrantAudit: async (page = 0, size = 20) => {
    const { data } = await apiClient.get('/admin/hearts/grants', { params: { page, size } });
    return data;
  },

  // 하트 내역 조회
  getHeartHistory: async (userId: number, page = 0, size = 20) => {
    const { data } = await apiClient.get(`/admin/hearts/history/${userId}`, { params: { page, size } });
    return data;
  },

  // 커뮤니티 게시글 목록 조회 (관리자용 — 작성자 userId 포함)
  getCommunityPosts: async (page = 0, size = 20) => {
    const { data } = await apiClient.get('/admin/community/posts', { params: { page, size } });
    return data;
  },

  // 커뮤니티 게시글 상세 조회 (관리자용 — 작성자 실제 정보)
  getCommunityPostDetail: async (postId: number) => {
    const { data } = await apiClient.get(`/admin/community/posts/${postId}`);
    return data;
  },

  // 사용자 상세 조회
  getUserDetail: async (userId: number) => {
    const { data } = await apiClient.get(`/admin/users/${userId}`);
    return data;
  },

  // R21: 게시글 댓글 목록 조회 (관리자용)
  getCommunityComments: async (postId: number, page = 0, size = 50) => {
    const { data } = await apiClient.get(`/admin/community/posts/${postId}/comments`, { params: { page, size } });
    return data;
  },

  // R21: 관리자 게시글 삭제
  deleteCommunityPost: async (postId: number) => {
    const { data } = await apiClient.delete(`/admin/community/posts/${postId}`);
    return data;
  },

  // R21: 관리자 댓글 삭제
  deleteCommunityComment: async (commentId: number) => {
    const { data } = await apiClient.delete(`/admin/community/comments/${commentId}`);
    return data;
  },

  // 관리자 게시글 수정
  updateCommunityPost: async (postId: number, title: string, content: string) => {
    const { data } = await apiClient.put(`/admin/community/posts/${postId}`, { title, content });
    return data;
  },

  // 관리자 댓글 수정
  updateCommunityComment: async (commentId: number, content: string) => {
    const { data } = await apiClient.put(`/admin/community/comments/${commentId}`, { content });
    return data;
  },

  // 테스트 계정 추천 리셋
  resetTestAccountRecommendations: async () => {
    const response = await apiClient.post('/admin/recommendations/reset-test-accounts');
    return response.data;
  },

  // 회원 활동 로그
  getUserActivityLog: async (userId: number) => {
    const { data } = await apiClient.get(`/admin/users/${userId}/activity-log`);
    return data;
  },

  // 벌크 좋아요 이력
  getBulkLikeHistory: async (page = 0, size = 20) => {
    const { data } = await apiClient.get(`/admin/bulk-likes/history?page=${page}&size=${size}`);
    return data;
  },

  // ===== ADMIN 특별기능: 테스트 트리거 =====

  // R21 오늘의 한 분 수동 생성. 슬롯·장수는 서버 계약과 같은 08·1로 고정한다.
  triggerRecommendations: async () => {
    const { data } = await apiClient.post('/admin/recommendations/trigger', null, {
      params: { slot: '08', count: 1 },
    });
    return data;
  },

  // 테스트 좋아요 생성 (from→to). 받은OK = to가 테스트계정 / 보낸OK = from이 테스트계정. 상호면 매칭 자동
  createTestLike: async (fromUserId: number, toUserId: number, likeType: 'OK' | 'SUPER_OK' = 'OK') => {
    const { data } = await apiClient.post('/admin/test/like', null, {
      params: { fromUserId, toUserId, likeType },
    });
    return data;
  },

  // 테스트 매칭 생성 (a↔b 양방향 좋아요 보장 후 매칭)
  createTestMatch: async (userAId: number, userBId: number) => {
    const { data } = await apiClient.post('/admin/test/match', null, {
      params: { userAId, userBId },
    });
    return data;
  },
};

export interface BulkLikeResponse {
  totalRequested: number;
  successCount: number;
  skippedCount: number;
  matchedCount: number;
}

// 회장 결정 52(2026-08-27, 2026-08-28 재확정): 대량 좋아요 하루 100명 상한 사용량
export interface BulkLikeQuotaResponse {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
}
