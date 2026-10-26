import apiClient from './client';

export interface ProfileCardResponse {
  likeId?: number;
  profileId: number;
  userId?: number;
  nickname: string;
  age: number;
  birthYear?: number;
  ageSource?: 'PASS' | 'PASS_DERIVED_YEAR' | 'SELF_DECLARED';
  agePrecision?: 'EXACT' | 'YEAR_ONLY';
  identityVerified?: boolean;
  location?: string;
  occupation?: string;
  company?: string;
  education?: string;
  school?: string;
  incomeRange?: string;
  height?: number;
  bodyType?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  hobbies?: string[];
  bio?: string;
  photoUrls?: string[];
  verified: boolean;
  verificationBadges?: string[];
  alreadyLiked: boolean;
  receivedLike: boolean;
  likeType?: 'OK' | 'SUPER_OK';
  responseStatus?: 'ACCEPT' | 'REJECT' | 'EXPIRED';
  // 좋아요 응답 기한. 추천 카드엔 없음
  expiresAt?: string | null;
}

export interface SendLikeRequest {
  targetProfileId: number;
  likeType: 'OK' | 'SUPER_OK';
}

export interface LikeResponse {
  likeId: number;
  fromProfileId: number;
  toProfileId: number;
  likeType: string;
  message?: string;
  matched: boolean;
  matchingId?: number;
  createdAt?: string;
}

export interface SentLikeResultResponse {
  nickname: string;
  photoUrl?: string | null;
  likeType: 'OK' | 'SUPER_OK';
  responseStatus?: 'ACCEPT' | 'REJECT' | 'EXPIRED' | null;
  expiresAt: string | null;
  status: 'PENDING' | 'REJECTED' | 'EXPIRED' | 'MATCHED';
  matchingId?: number | null;
}

export interface MatchingResponse {
  matchingId: number;
  maleProfileId: number;
  femaleProfileId: number;
  partnerProfile: ProfileCardResponse;
  // 백엔드 MatchingStatus enum 과 일치
  status: 'PENDING' | 'PROCEED' | 'IN_PROGRESS' | 'HOLD' | 'CLOSED';
  contactRevealed: boolean;
  partnerContact?: string;
  matchedAt: string;
  updatedAt: string;
}

export interface UpdateMatchingStatusRequest {
  status: 'PROCEED' | 'HOLD';
}

// 추천 슬롯 관련 타입
export type RecommendationSlotStatus = 'PENDING' | 'RESPONDED' | 'EXPIRED';

export interface RecommendationSlotResponse {
  slotId: number | null;
  slot: string; // "08", "12", "18"
  slotLabel: string; // "오전 8시", "오후 12시", "오후 6시"
  status: RecommendationSlotStatus | null;
  profiles: ProfileCardResponse[] | null;
  profileCount: number;
  expiresAt: string | null;
  remainingSeconds: number | null;
  active: boolean;
  upcoming: boolean;
  // R21 Cupid 컨셉 전환: 매칭 이유 + 매칭 점수
  cupidReason?: string | null;
  matchScore?: number | null;
}

export type RecommendationEmptyReason =
  | 'MALE_REVIEW_PENDING'
  | 'MALE_VERIFICATION_REQUIRED'
  | 'SLOT_NOT_GENERATED'
  | 'FILTERED_OUT'
  | 'DECIDED_TODAY';

export interface TodayRecommendationResponse {
  currentSlot: string;
  nextSlot: string | null;
  nextSlotTime: string | null;
  hasActiveMatching: boolean;
  slots: RecommendationSlotResponse[];
  expiredCount: number;
  pendingCount: number;
  adultDeclarationRequired: boolean;
  emptyReason?: RecommendationEmptyReason | null;
}

export interface UserPreferenceResponse {
  minAge: number;
  maxAge: number;
  preferredLocation?: string;
  locationScope: 'LOCAL' | 'ALL';
  marriageTiming?: '1년 안' | '1-2년' | '2-3년' | '정해두지 않음 포함' | null;
}

export interface UpdatePreferenceRequest {
  minAge?: number;
  maxAge?: number;
  preferredLocation?: string;
  locationScope?: 'LOCAL' | 'ALL';
  marriageTiming?: '1년 안' | '1-2년' | '2-3년' | '정해두지 않음 포함';
}

export const matchingApi = {
  getTodayProfiles: async (page: number = 0, size: number = 20) => {
    const response = await apiClient.get<{
      content: ProfileCardResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>('/matching/profiles/today', {
      params: { page, size },
    });
    return response.data;
  },

  sendLike: async (data: SendLikeRequest): Promise<LikeResponse> => {
    const response = await apiClient.post('/matching/likes', data);
    return response.data;
  },

  getReceivedLikes: async (page: number = 0, size: number = 20) => {
    const response = await apiClient.get<{
      content: ProfileCardResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>('/matching/likes/received', {
      params: { page, size },
    });
    return response.data;
  },

  getHistoryProfiles: async (filter: string, page: number = 0, size: number = 20) => {
    const response = await apiClient.get<{
      content: ProfileCardResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>('/matching/history', {
      params: { filter, page, size },
    });
    return response.data;
  },

  getSentLikeById: async (likeId: number): Promise<SentLikeResultResponse> => {
    const response = await apiClient.get<SentLikeResultResponse>(`/matching/likes/sent/${likeId}`);
    return response.data;
  },

  getMyMatchings: async (page: number = 0, size: number = 20) => {
    const response = await apiClient.get<{
      content: MatchingResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>('/matching/matchings', {
      params: { page, size },
    });
    return response.data;
  },

  getMatching: async (matchingId: number): Promise<MatchingResponse> => {
    const response = await apiClient.get(`/matching/matchings/${matchingId}`);
    return response.data;
  },

  updateMatchingStatus: async (
    matchingId: number,
    data: UpdateMatchingStatusRequest
  ): Promise<MatchingResponse> => {
    const response = await apiClient.put(`/matching/matchings/${matchingId}/status`, data);
    return response.data;
  },

  revealContact: async (matchingId: number): Promise<MatchingResponse> => {
    const response = await apiClient.post('/matching/contact/reveal', { matchingId });
    return response.data;
  },
};

// 추천 API
export const recommendationApi = {
  /**
   * 오늘의 추천 전체 현황 조회 (3개 슬롯 상태 + 프로필 목록)
   */
  getTodayRecommendations: async (): Promise<TodayRecommendationResponse> => {
    const response = await apiClient.get('/recommendations/today');
    return response.data;
  },

  /**
   * 특정 추천 슬롯에 대한 응답 처리 (넘기기)
   */
  respondToSlot: async (slot: string): Promise<void> => {
    await apiClient.post(`/recommendations/slots/${slot}/respond`);
  },

  /**
   * 사용자 매칭 선호 설정 조회
   */
  getPreferences: async (): Promise<UserPreferenceResponse> => {
    const response = await apiClient.get('/recommendations/preferences');
    return response.data;
  },

  /**
   * 사용자 매칭 선호 설정 업데이트
   */
  updatePreferences: async (data: UpdatePreferenceRequest): Promise<UserPreferenceResponse> => {
    const response = await apiClient.put('/recommendations/preferences', data);
    return response.data;
  },
};
