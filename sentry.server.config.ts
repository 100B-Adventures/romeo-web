// Sentry 서버 초기화 — Next.js 서버사이드 에러 모니터링
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링: 10% 트랜잭션 샘플링
  tracesSampleRate: 0.1,

  // 개발 환경에서는 디버그 활성화
  debug: process.env.NODE_ENV === "development",
});
