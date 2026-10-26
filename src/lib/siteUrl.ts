const PROD_SITE_URL = 'https://romeoncupid.art';
const STAGE_SITE_URL = 'https://stage.romeoncupid.art';

/**
 * 배포 이미지 빌드 환경에 맞는 공개 웹 주소를 반환한다.
 * stage만 별도 도메인을 사용하고, 미설정 또는 알 수 없는 값은 운영 주소로 닫는다.
 */
export function getSiteUrl(buildEnvironment = process.env.BUILD_ENV): string {
  return buildEnvironment === 'stage' ? STAGE_SITE_URL : PROD_SITE_URL;
}
