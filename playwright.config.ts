import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // API 호출용 base URL (인증 fixture에서 사용)
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    // 2026-09-06: 아래 'ipad' 는 이름과 달리 viewport 만 바꾼 Chromium 이었다.
    // 관문은 Chromium·Firefox·WebKit·모바일 4종을 요구하는데 실제로는 한 엔진에서만 돌고 있었다.
    // 겹침 1px 같은 문제는 엔진마다 반올림이 달라 다르게 나타나고, iOS 사용자는 전부 WebKit 계열이다.
    // 그래서 실제 기기 프로파일로 바로잡고 나머지 엔진을 추가한다.
    {
      name: 'ipad',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14 Pro'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.CI
    ? undefined  // CI에서는 이미 배포된 서버 사용
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
      },
});
