import { getErrorMessage } from './errorHandler';

describe('좋아요 오류 표시 계약', () => {
  it('TC-LIKE-CLIENT-WEB-001 거절: 409 MATCH_004를 서버 원문 대신 사용자 문구로 바꾼다', () => {
    const error = {
      response: {
        status: 409,
        data: { code: 'MATCH_004', message: '이미 좋아요를 보낸 프로필입니다' },
      },
    };

    expect(getErrorMessage(error)).toBe('이미 마음을 전했어요.');
  });
});
