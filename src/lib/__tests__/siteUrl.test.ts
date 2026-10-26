import { getSiteUrl } from '../siteUrl';

describe('WEB-METADATA-URL 배포 환경별 절대 URL 계약', () => {
  it('WEB-METADATA-URL-01 정상: stage 빌드는 stage 웹 도메인을 사용한다', () => {
    expect(getSiteUrl('stage')).toBe('https://stage.romeoncupid.art');
  });

  it('WEB-METADATA-URL-02 정상: prod 빌드는 운영 웹 도메인을 사용한다', () => {
    expect(getSiteUrl('prod')).toBe('https://romeoncupid.art');
  });

  it('WEB-METADATA-URL-03 거절: 미설정 또는 알 수 없는 환경은 localhost 대신 운영 도메인으로 닫는다', () => {
    expect(getSiteUrl(undefined)).toBe('https://romeoncupid.art');
    expect(getSiteUrl('preview')).toBe('https://romeoncupid.art');
  });
});
