import apiClient from './client';

// === 프로필 관련 타입 ===

/** 프로필 상세 응답 */
export interface ProfileDetailResponse {
  profileId: number;
  userId: number;
  nickname: string;
  birthYear?: number;
  age?: number;
  ageSource?: 'PASS' | 'PASS_DERIVED_YEAR' | 'SELF_DECLARED';
  agePrecision?: 'EXACT' | 'YEAR_ONLY';
  identityVerified: boolean;
  adultDeclarationRequired: boolean;
  gender: 'MALE' | 'FEMALE';
  location?: string;
  regionTags?: string[];
  height?: number;
  bodyType?: string;
  religion?: string;
  smoking?: string;
  drinking?: string;
  school?: string;
  occupation?: string;
  company?: string;
  education?: string;
  incomeRange?: string;
  bio?: string;
  personalities?: string[];
  hobbies?: string[];
  mbti?: string;
  marriagePlan?: string;
  childPlan?: string;
  essayLifestyle?: string;
  essayIdealType?: string;
  iHave?: string[];
  iWant?: string[];
  photoUrls?: string[];
  verified: boolean;
  verificationBadges?: string[];
  percentileRank?: number;
  matchScore?: number;
  profileCompleteness?: number;
  alreadyLiked?: boolean;
  receivedLike?: boolean;
  likeType?: 'OK' | 'SUPER_OK';
}

/** 프로필 수정 요청 */
export interface UpdateProfileRequest {
  nickname?: string;
  location?: string;
  height?: number;
  bodyType?: string;
  religion?: string;
  smoking?: string;
  drinking?: string;
  school?: string;
  occupation?: string;
  bio?: string;
  personalities?: string[];
  hobbies?: string[];
  iHave?: string[];
  iWant?: string[];
  photos?: string[];
}

/** 인증 상태 응답 */
export interface VerificationItemResponse {
  id: number;
  type: 'IDENTITY' | 'EDUCATION' | 'INCOME' | 'CAREER' | 'RESIDENCE';
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  documentUrl?: string;
  memo?: string;
  reviewMemo?: string;
  createdAt?: string;
  approvedAt?: string;
}

/** 선호도 설정 응답 (백엔드 UserPreference 기준) */
export interface PreferencesResponse {
  minAge: number;
  maxAge: number;
  preferredLocation: string;
  locationScope: 'LOCAL' | 'ALL';
  marriageTiming?: '1년 안' | '1-2년' | '2-3년' | '정해두지 않음 포함' | null;
}

/** 선호도 설정 요청 */
export interface UpdatePreferencesRequest {
  minAge?: number;
  maxAge?: number;
  preferredLocation?: string;
  locationScope?: 'LOCAL' | 'ALL';
  marriageTiming?: '1년 안' | '1-2년' | '2-3년' | '정해두지 않음 포함';
}

/** 매력지수 응답 */
export interface CharmStatsResponse {
  profileViews: number;
  receivedLikes: number;
  matchSuccessRate: number;
  percentileRank: number;
  weeklyViews: number[];
  weeklyLikes: number[];
  rankHistory: number[];
}

/** 커뮤니티 게시글 */
export interface CommunityPost {
  id: number;
  authorAnonymousName: string;
  authorGender?: 'MALE' | 'FEMALE';
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
}

/** 커뮤니티 댓글 */
export interface CommunityComment {
  id: number;
  postId: number;
  parentCommentId?: number | null;
  authorAnonymousName: string;
  authorGender?: 'MALE' | 'FEMALE';
  content: string;
  postAuthor: boolean;
  isMine?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  replies?: CommunityComment[];
}

// === API 함수 ===

export const profileApi = {
  /** 내 프로필 조회 */
  getMyProfile: async (): Promise<ProfileDetailResponse> => {
    const response = await apiClient.get('/profiles/me');
    return response.data;
  },

  declareAdult: async (birthYear: number): Promise<ProfileDetailResponse> => {
    const response = await apiClient.post('/profiles/me/adult-declaration', {
      birthYear,
      adultDeclaration: {
        confirmedNineteenOrOlder: true,
        version: 'adult-self-declaration-v1',
      },
    });
    return response.data;
  },

  /** 내 프로필 수정 */
  updateMyProfile: async (data: UpdateProfileRequest): Promise<ProfileDetailResponse> => {
    const response = await apiClient.put('/profiles/me', data);
    return response.data;
  },

  /** 상대 프로필 상세 조회 */
  getProfileById: async (profileId: number): Promise<ProfileDetailResponse> => {
    const response = await apiClient.get(`/profiles/${profileId}`);
    return response.data;
  },

  /** 내 인증 목록 조회 */
  getMyVerifications: async (): Promise<VerificationItemResponse[]> => {
    const response = await apiClient.get('/verifications/me');
    return response.data;
  },

  /** 인증 서류 제출 */
  submitVerification: async (
    type: string,
    documentUrl: string,
    memo?: string
  ): Promise<VerificationItemResponse> => {
    const response = await apiClient.post('/verifications', {
      type,
      documentUrl,
      memo,
    });
    return response.data;
  },

  /** 선호도 설정 조회 */
  getPreferences: async (): Promise<PreferencesResponse> => {
    const response = await apiClient.get('/recommendations/preferences');
    return response.data;
  },

  /** 선호도 설정 업데이트 */
  updatePreferences: async (data: UpdatePreferencesRequest): Promise<PreferencesResponse> => {
    const response = await apiClient.put('/recommendations/preferences', data);
    return response.data;
  },

  /** 매력지수 조회 */
  getCharmStats: async (): Promise<CharmStatsResponse> => {
    const response = await apiClient.get('/profiles/charm');
    return response.data;
  },
};

// 커뮤니티 API
export const communityApi = {
  /** 게시글 목록 조회 */
  getPosts: async (page: number = 0, size: number = 20) => {
    const response = await apiClient.get<{
      content: CommunityPost[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
      last: boolean;
    }>('/community/posts', {
      params: { page, size },
    });
    return response.data;
  },

  /** 게시글 상세 조회 */
  getPostById: async (postId: number): Promise<CommunityPost> => {
    const response = await apiClient.get(`/community/posts/${postId}`);
    return response.data;
  },

  /** 게시글 작성 */
  createPost: async (title: string, content: string): Promise<CommunityPost> => {
    const response = await apiClient.post('/community/posts', { title, content });
    return response.data;
  },

  /** 게시글 좋아요 */
  likePost: async (postId: number): Promise<void> => {
    await apiClient.post(`/community/posts/${postId}/like`);
  },

  /** 댓글 목록 조회 */
  getComments: async (postId: number, page: number = 0, size: number = 50) => {
    const response = await apiClient.get<{
      content: CommunityComment[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
      last: boolean;
    }>(`/community/posts/${postId}/comments`, {
      params: { page, size },
    });
    return response.data;
  },

  /** 댓글 작성 (대댓글: parentCommentId 전달) */
  createComment: async (postId: number, content: string, parentCommentId?: number): Promise<CommunityComment> => {
    const response = await apiClient.post(`/community/posts/${postId}/comments`, { content, parentCommentId });
    return response.data;
  },
};
