import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

// Sentry 에러 모니터링 래핑 — DSN 미설정 시 Sentry 비활성화
export default withSentryConfig(nextConfig, {
  // 소스맵 업로드 비활성화 (Sentry 프로젝트 설정 후 활성화)
  silent: true,
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
});
