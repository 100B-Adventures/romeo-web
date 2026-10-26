import apiClient from '../client';
import { matchingApi } from '../matching';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;

describe('OK-SENT-API 웹 전송 결과 탐색 계약', () => {
  beforeEach(() => jest.clearAllMocks());

  it('OK-SENT-API-WEB-01 소유권 검증 단건 API로 likeId 결과를 찾는다', async () => {
    mockGet.mockResolvedValue({ data: { nickname: '준호', status: 'PENDING' } });

    await expect(matchingApi.getSentLikeById(91)).resolves.toMatchObject({ nickname: '준호', status: 'PENDING' });
    expect(mockGet).toHaveBeenCalledWith('/matching/likes/sent/91');
  });

  it('OK-SENT-API-WEB-02 소유하지 않은 likeId 오류를 숨기지 않는다', async () => {
    const denied = new Error('not found');
    mockGet.mockRejectedValue(denied);
    await expect(matchingApi.getSentLikeById(91)).rejects.toBe(denied);
  });
});
