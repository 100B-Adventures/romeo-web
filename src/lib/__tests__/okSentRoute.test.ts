import { buildOkSentHref, remainingUntil } from '../okSentRoute';

describe('OK-SENT-ROUTE 웹 전송 결과 화면 이동 계약', () => {
  it('OK-SENT-ROUTE-WEB-01 정상 경로: API profileId와 종류만 남기고 개인정보는 URL에서 제외한다', () => {
    const href = buildOkSentHref({ likeId: 91 });
    const url = new URL(href, 'https://cupid.example');
    expect(url.pathname).toBe('/ok-sent');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      likeId: '91',
    });
  });

  it('OK-SENT-ROUTE-WEB-02 경계값: 이름이 비어도 성공한 전송을 실패로 바꾸지 않고 API 재조회에 맡긴다', () => {
    const href = buildOkSentHref({ likeId: 92 });
    const url = new URL(href, 'https://cupid.example');
    expect(Object.fromEntries(url.searchParams)).toEqual({ likeId: '92' });
  });

  it('OK-SENT-ROUTE-WEB-03 거절 조건: API와 현재 프로필 모두 유효한 식별자가 없으면 이동을 막는다', () => {
    expect(() => buildOkSentHref({ likeId: 0 })).toThrow('OK 전송 결과 식별자가 올바르지 않습니다.');
  });

  it('OK-SENT-ROUTE-WEB-04 경계값: 서버 만료시각을 지나면 새로고침해도 24시간이 부활하지 않는다', () => {
    expect(remainingUntil('2026-10-04T12:00:00+09:00', Date.parse('2026-10-04T12:01:00+09:00'))).toBe(0);
    expect(remainingUntil('2026-10-04T12:00:00+09:00', Date.parse('2026-10-04T11:30:00+09:00'))).toBe(30 * 60_000);
    expect(remainingUntil('2026-10-04T12:00:00', Date.parse('2026-10-04T11:30:00+09:00'))).toBe(30 * 60_000);
  });
});
