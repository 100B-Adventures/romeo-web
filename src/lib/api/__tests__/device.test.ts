import { deviceApi } from '../device';
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

const mockPost = apiClient.post as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

describe('deviceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('POST /device-tokens 를 호출하여 디바이스 토큰을 등록한다', async () => {
      const mockResponse = { message: '디바이스 토큰이 등록되었습니다' };
      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await deviceApi.registerToken({
        token: 'fMdG8s-test-token',
        platform: 'WEB',
      });

      expect(mockPost).toHaveBeenCalledWith('/device-tokens', {
        token: 'fMdG8s-test-token',
        platform: 'WEB',
      });
      expect(result).toEqual(mockResponse);
    });

    it('ANDROID 플랫폼 토큰을 등록한다', async () => {
      const mockResponse = { message: '디바이스 토큰이 등록되었습니다' };
      mockPost.mockResolvedValue({ data: mockResponse });

      await deviceApi.registerToken({
        token: 'android-fcm-token',
        platform: 'ANDROID',
      });

      expect(mockPost).toHaveBeenCalledWith('/device-tokens', {
        token: 'android-fcm-token',
        platform: 'ANDROID',
      });
    });

    it('IOS 플랫폼 토큰을 등록한다', async () => {
      const mockResponse = { message: '디바이스 토큰이 등록되었습니다' };
      mockPost.mockResolvedValue({ data: mockResponse });

      await deviceApi.registerToken({
        token: 'ios-apns-token',
        platform: 'IOS',
      });

      expect(mockPost).toHaveBeenCalledWith('/device-tokens', {
        token: 'ios-apns-token',
        platform: 'IOS',
      });
    });
  });

  describe('unregisterToken', () => {
    it('DELETE /device-tokens 를 호출하여 디바이스 토큰을 삭제한다', async () => {
      mockDelete.mockResolvedValue({ status: 204 });

      await deviceApi.unregisterToken('fMdG8s-test-token');

      expect(mockDelete).toHaveBeenCalledWith('/device-tokens', {
        params: { token: 'fMdG8s-test-token' },
      });
    });
  });
});
