// Sentry 클라이언트 초기화 — 브라우저 에러 모니터링
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 로컬·QA처럼 DSN이 없는 환경에서는 SDK 자체를 끈다.
  // debug만 켜 두면 정상 화면에서도 "Transport disabled"를 console.error로 남긴다.
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  // 성능 모니터링: 10% 트랜잭션 샘플링
  tracesSampleRate: 0.1,

  // 개발 환경에서는 디버그 활성화
  debug: process.env.NODE_ENV === "development" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  // 리플레이 세션은 비활성화 (필요 시 활성화)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
