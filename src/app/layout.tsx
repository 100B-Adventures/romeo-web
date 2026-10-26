import type { Metadata, Viewport } from 'next';
import { Noto_Serif_KR } from 'next/font/google';
import Providers from './providers';
import GoogleAnalytics from '@/components/common/GoogleAnalytics';
import ServiceWorkerRegister from '@/components/common/ServiceWorkerRegister';
import { getSiteUrl } from '@/lib/siteUrl';
import './globals.css';

const cupidNotoSerifKr = Noto_Serif_KR({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-cupid-noto-serif-kr',
});

// 메타데이터 설정
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Romeo & Cupid | 매일 정오, Cupid가 한 분만 추천',
  description: 'Cupid AI가 매일 정오 단 한 분을 큐레이션하는 Editorial 매거진 매칭. 인증 4종(학력·직장·자산·소득) 기반의 정중한 만남.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '운명의 큐피드',
  },
};

// 뷰포트 설정 (모바일 웹 최적화)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  /* 브라우저 크롬(주소창) 색상 meta 태그: Next.js Viewport.themeColor는 정적 문자열만 허용, CSS var() 불가 */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' }, // == --bg(light)/--cupid-idv-bg
    { media: '(prefers-color-scheme: dark)', color: '#0D0D0D' }, // == --bg(dark)
  ],
};

/**
 * 루트 레이아웃 — html/body 설정, 폰트, 프로바이더 래핑
 * 서버 컴포넌트로 동작하며, 클라이언트 로직은 Providers에 위임
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={cupidNotoSerifKr.variable} suppressHydrationWarning>
      <head>
        {/* Pretendard 웹폰트 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Noto Sans KR 폴백 */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <ServiceWorkerRegister />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
