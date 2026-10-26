import { adminApi } from '../admin';
import apiClient from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

describe('adminApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('GET /admin/stats 를 호출한다', async () => {
      const mockData = { totalUsers: 100, activeUsers: 80 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await adminApi.getStats();

      expect(mockGet).toHaveBeenCalledWith('/admin/stats');
      expect(result).toEqual(mockData);
    });
  });

  describe('getUsers', () => {
    it('GET /admin/users 를 호출한다', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await adminApi.getUsers(0, 20);

      expect(mockGet).toHaveBeenCalledWith('/admin/users', {
        params: { page: 0, size: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('searchUsers', () => {
    it('GET /admin/users/search 를 호출한다', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await adminApi.searchUsers('test', 0, 20);

      expect(mockGet).toHaveBeenCalledWith('/admin/users/search', {
        params: { keyword: 'test', page: 0, size: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('updateUserStatus', () => {
    it('PUT /admin/users/:id/status 를 호출한다', async () => {
      mockPut.mockResolvedValue({});

      await adminApi.updateUserStatus(1, 'SUSPENDED', '부적절한 행동');

      expect(mockPut).toHaveBeenCalledWith('/admin/users/1/status', {
        status: 'SUSPENDED',
        reason: '부적절한 행동',
      });
    });
  });

  describe('deleteUser', () => {
    it('DELETE /admin/users/:id 를 호출한다', async () => {
      mockDelete.mockResolvedValue({});

      await adminApi.deleteUser(1, '약관 위반');

      expect(mockDelete).toHaveBeenCalledWith('/admin/users/1', {
        params: { reason: '약관 위반' },
      });
    });
  });

  describe('getPendingVerifications', () => {
    it('GET /admin/verifications/pending 를 호출한다', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await adminApi.getPendingVerifications();

      expect(mockGet).toHaveBeenCalledWith('/admin/verifications/pending', {
        params: { page: 0, size: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('sendBulkLikes', () => {
    it('POST /admin/bulk-likes 를 호출한다', async () => {
      const mockResponse = {
        totalRequested: 3,
        successCount: 2,
        skippedCount: 1,
        matchedCount: 0,
      };
      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await adminApi.sendBulkLikes([1, 2, 3], 10, 'OK');

      expect(mockPost).toHaveBeenCalledWith('/admin/bulk-likes', {
        senderAdminUserId: 10,
        targetFemaleUserIds: [1, 2, 3],
        likeType: 'OK',
        idempotencyKey: expect.any(String),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFemaleUsers', () => {
    it('GET /admin/users/female 를 호출한다', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await adminApi.getFemaleUsers();

      expect(mockGet).toHaveBeenCalledWith('/admin/users/female', {
        params: { page: 0, size: 50 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('triggerRecommendations', () => {
    it('R21 오늘 한 명 계약에 맞춰 08 슬롯·1건으로 고정 호출한다', async () => {
      const mockData = { successCount: 2, skippedCount: 1 };
      mockPost.mockResolvedValue({ data: mockData });

      const result = await adminApi.triggerRecommendations();

      expect(mockPost).toHaveBeenCalledWith('/admin/recommendations/trigger', null, {
        params: { slot: '08', count: 1 },
      });
      expect(result).toEqual(mockData);
    });
  });
});
