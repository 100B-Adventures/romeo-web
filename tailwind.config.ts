import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        // v39.5 하단 고정대: 탭 버튼 52px + 기기 safe area. 액션 바와 같은 토큰을 쓴다.
        'bottom-tab-bar': '3.25rem',
        'bottom-tab-bar-safe': 'calc(3.25rem + env(safe-area-inset-bottom))',
      },
      colors: {
        // 라이트 모드 — 5성급 호텔 감성
        ivory: '#FAF7F2',
        card: '#FFFFFF',
        gold: '#B8860B',
        rosegold: '#DAA520',
        accent: '#A52A44',
        'accent-deep': '#6B1B2E',
        text: '#1A1A1A',
        subtext: '#6B6B6B',

        // 다크 모드 전용
        dark: {
          bg: '#0D0D0D',
          card: '#1A1A1A',
          gold: '#C9A96E',
          cream: '#F5F0E8',
          wine: '#8B2252',
          brown: '#2C1810',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          'Noto Sans KR',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
