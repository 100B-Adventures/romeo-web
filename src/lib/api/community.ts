// 커뮤니티 API — 회원 화면은 운영자 게시 읽기 전용이다(결정 8, FRD v16 §7.1).
// 앱(mobile/src/lib/api/community.ts)이 쓰는 경로와 같은 것을 쓴다. 웹만 다른 계약을
// 쓰면 한쪽만 고쳐지는 어긋남이 다시 생긴다.
import apiClient from './client';

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last?: boolean;
}

export const communityApi = {
  getPosts: async (page = 0, size = 20): Promise<PageResponse<CommunityPost>> => {
    const { data } = await apiClient.get<PageResponse<CommunityPost>>('/community/posts', {
      params: { page, size },
    });
    return data;
  },
  getPostById: async (postId: number): Promise<CommunityPost> => {
    const { data } = await apiClient.get<CommunityPost>(`/community/posts/${postId}`);
    return data;
  },
};
